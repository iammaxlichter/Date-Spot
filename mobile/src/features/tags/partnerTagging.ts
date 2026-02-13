import type { TaggedUser } from "../../services/api/spotTags";

export type PartnerAnswer = "yes" | "no" | null;

export function hasUserTag(users: TaggedUser[], userId: string | null | undefined) {
  if (!userId) return false;
  return users.some((u) => u.id === userId);
}

export function withPartnerTag(users: TaggedUser[], partner: TaggedUser | null): TaggedUser[] {
  if (!partner) return users;
  return hasUserTag(users, partner.id) ? users : [...users, partner];
}

export function withoutPartnerTag(users: TaggedUser[], partner: TaggedUser | null): TaggedUser[] {
  if (!partner) return users;
  return users.filter((u) => u.id !== partner.id);
}

export function inferPartnerAnswer(users: TaggedUser[], partner: TaggedUser | null): PartnerAnswer {
  if (!partner) return null;
  return hasUserTag(users, partner.id) ? "yes" : "no";
}
