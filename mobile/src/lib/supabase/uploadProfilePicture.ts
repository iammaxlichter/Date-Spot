import { supabase } from "../supabase";

export async function uploadProfilePicture(params: {
  userId: string;
  uri: string;          // image-picker uri
  mimeType?: string;    // e.g. "image/jpeg"
}) {
  const { userId, uri, mimeType } = params;

  // 1) Download the file into memory
  const res = await fetch(uri);
  const arrayBuffer = await res.arrayBuffer();

  // 2) Decide extension/content type
  const contentType = mimeType ?? res.headers.get("Content-Type") ?? "image/jpeg";
  const ext =
    contentType.includes("png") ? "png" :
    contentType.includes("webp") ? "webp" :
    "jpg";

  // 3) Upload path
  const path = `${userId}/${Date.now()}.${ext}`;

  // 4) Upload to Storage (NO blob)
  const { error: uploadError } = await supabase.storage
    .from("profile_pictures")
    .upload(path, arrayBuffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // 5) Get a public URL (or use signed URL if bucket is private)
  const { data } = supabase.storage
    .from("profile_pictures")
    .getPublicUrl(path);

  return { path, publicUrl: data.publicUrl };
}
