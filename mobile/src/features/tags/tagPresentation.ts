import type { TaggedUser } from "../../services/api/spotTags";

export type TagPresentation =
  | { kind: "none" }
  | { kind: "partner_only"; partner: TaggedUser }
  | { kind: "partner_with_others"; partner: TaggedUser; otherCount: number }
  | { kind: "regular"; users: TaggedUser[] };

export function buildTagPresentation(taggedUsers: TaggedUser[], partnerId: string | null): TagPresentation {
  if (!taggedUsers.length) return { kind: "none" };
  if (!partnerId) return { kind: "regular", users: taggedUsers };

  const partner = taggedUsers.find((u) => u.id === partnerId);
  if (!partner) return { kind: "regular", users: taggedUsers };

  const otherCount = taggedUsers.length - 1;
  if (otherCount <= 0) return { kind: "partner_only", partner };
  return { kind: "partner_with_others", partner, otherCount };
}
