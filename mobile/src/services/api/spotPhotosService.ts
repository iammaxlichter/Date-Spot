// src/services/spotPhotosService.ts
import { supabase } from "../supabase/client";
import type { ExistingSpotPhoto, SpotPhotoItem } from "../../types/spotPhotos";

const BUCKET = "spot-photos";

type SpotPhotoRow = {
    id: string;
    path: string;
    position: number;
};

function isExisting(p: SpotPhotoItem): p is ExistingSpotPhoto {
    return (p as any)?.kind === "existing";
}

function isLocal(p: SpotPhotoItem): boolean {
    return (p as any)?.kind === "local" || !!(p as any)?.localUri || !!(p as any)?.uri;
}

function getLocalUri(p: SpotPhotoItem): string | null {
    return ((p as any)?.localUri ?? (p as any)?.uri ?? null) as string | null;
}

function extFromUri(uri: string): string {
    const lower = uri.toLowerCase();
    if (lower.includes(".png")) return "png";
    if (lower.includes(".heic")) return "heic";
    if (lower.includes(".webp")) return "webp";
    return "jpg";
}

async function uriToUint8Array(uri: string): Promise<Uint8Array> {
    const res = await fetch(uri);
    if (!res.ok) throw new Error(`Failed to read image uri. status=${res.status}`);
    const ab = await res.arrayBuffer();
    return new Uint8Array(ab);
}

function guessContentTypeFromExt(ext: string): string {
    switch (ext) {
        case "png":
            return "image/png";
        case "webp":
            return "image/webp";
        case "heic":
            return "image/heic";
        case "jpg":
        case "jpeg":
        default:
            return "image/jpeg";
    }
}


export async function fetchSpotPhotosWithSignedUrls(params: {
    spotId: string;
    expiresInSeconds?: number; // default 3600
}): Promise<ExistingSpotPhoto[]> {
    const { spotId, expiresInSeconds = 3600 } = params;

    const { data, error } = await supabase
        .from("spot_photos")
        .select("id, path, position, created_at")
        .eq("spot_id", spotId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });

    if (error) {
        console.error("[spotPhotos] DB error:", error);
        throw error;
    }

    const rows = (data ?? []) as Array<SpotPhotoRow & { created_at: string }>;

    const paths = rows.map((r) => r.path);

    if (paths.length === 0) {
        return [];
    }

    const { data: signedData, error: signedErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, expiresInSeconds);

    if (signedErr) {
        console.error("[spotPhotos] signed URL error:", signedErr);
        throw signedErr;
    }

    const signedUrlByPath = new Map<string, string>();
    for (const item of signedData ?? []) {
        if (item?.path && item?.signedUrl) {
            signedUrlByPath.set(item.path, item.signedUrl);
        } else {
            console.warn("[spotPhotos] missing signedUrl for item:", item);
        }
    }

    const result: ExistingSpotPhoto[] = rows.map((r) => ({
        kind: "existing",
        id: r.id,
        path: r.path,
        position: r.position,
        signedUrl: signedUrlByPath.get(r.path) ?? "",
    }));

    return result;
}

/**
 * Edit flow sync:
 * - delete removed existing photos (storage + DB)
 * - upload new local photos (storage + DB insert)
 * - update positions to match currentPhotos order
 */
export async function syncSpotPhotosOnEdit(params: {
    spotId: string;
    currentPhotos: SpotPhotoItem[];
    initialPhotos: SpotPhotoItem[];
}): Promise<void> {
    const { spotId, currentPhotos, initialPhotos } = params;
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    if (!userRes.user) throw new Error("Not authenticated");
    const userId = userRes.user.id;

    // --- Removed photos (existing in initial, not present in current) ---
    const initialExisting = initialPhotos.filter(isExisting);
    const currentExisting = currentPhotos.filter(isExisting);

    const currentExistingIds = new Set(currentExisting.map((p) => p.id));
    const removed = initialExisting.filter((p) => !currentExistingIds.has(p.id));

    if (removed.length > 0) {
        const removedPaths = removed.map((p) => p.path);

        const { error: storageErr } = await supabase.storage
            .from(BUCKET)
            .remove(removedPaths);

        if (storageErr) {
            console.error("[spotPhotos] storage remove error:", storageErr);
            throw storageErr;
        }

        const removedIds = removed.map((p) => p.id);

        const { error: dbDelErr } = await supabase
            .from("spot_photos")
            .delete()
            .in("id", removedIds);

        if (dbDelErr) {
            console.error("[spotPhotos] DB delete error:", dbDelErr);
            throw dbDelErr;
        }
    }

    // --- Upload new local photos (keep placeholders so we can preserve ordering) ---
    type Inserted = { id: string; path: string };
    const insertedByTempKey = new Map<string, Inserted>();

    // We generate a stable tempKey per local photo based on its uri + index
    const localItems = currentPhotos
        .map((p, idx) => ({ p, idx }))
        .filter(({ p }) => isLocal(p) && !isExisting(p));

    for (const { p, idx } of localItems) {
        const uri = getLocalUri(p);
        if (!uri) continue;

        const ext = extFromUri(uri);
        const filename = `${Date.now()}-${idx}.${ext}`;
        const storagePath = `${userId}/${spotId}/${filename}`;

        const bytes = await uriToUint8Array(uri);

        const { error: uploadErr } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, bytes, {
                upsert: false,
                contentType: guessContentTypeFromExt(ext),
            });



        if (uploadErr) {
            console.error("[spotPhotos] upload error:", uploadErr);
            throw uploadErr;
        }

        // Insert DB row (position set later; use 0 now)
        const { data: ins, error: insErr } = await supabase
            .from("spot_photos")
            .insert({
                spot_id: spotId,
                user_id: userId,
                path: storagePath,
                position: 0,
            })
            .select("id, path")
            .single();

        if (insErr) {
            console.error("[spotPhotos] insert DB row error:", insErr);
            throw insErr;
        }

        const tempKey = `${uri}__${idx}`;
        insertedByTempKey.set(tempKey, { id: ins.id, path: ins.path });
    }

    // --- Update positions for ALL remaining photos to match currentPhotos order ---
    // Build final ordered list of DB ids in the same order as currentPhotos
    const orderedDbItems: Array<{ id: string; position: number }> = [];

    let position = 0;
    for (let idx = 0; idx < currentPhotos.length; idx++) {
        const p = currentPhotos[idx];

        if (isExisting(p)) {
            orderedDbItems.push({ id: p.id, position });
            position++;
            continue;
        }

        if (isLocal(p)) {
            const uri = getLocalUri(p);
            if (!uri) continue;

            const tempKey = `${uri}__${idx}`;
            const inserted = insertedByTempKey.get(tempKey);

            // If we couldn't map it (shouldn't happen), skip
            if (!inserted) continue;

            orderedDbItems.push({ id: inserted.id, position });
            position++;
            continue;
        }
    }

    if (orderedDbItems.length > 0) {
        // Use UPDATE (not UPSERT) to avoid triggering insert-path RLS checks.
        // Run all position updates in parallel — was N sequential round-trips before.
        const results = await Promise.all(
            orderedDbItems.map((item) =>
                supabase
                    .from("spot_photos")
                    .update({ position: item.position })
                    .eq("id", item.id)
                    .eq("spot_id", spotId)
                    .eq("user_id", userId)
            )
        );
        for (const { error: posErr } of results) {
            if (posErr) {
                console.error("[spotPhotos] position update error:", posErr);
                throw posErr;
            }
        }
    }
}
