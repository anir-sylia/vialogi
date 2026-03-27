export type AppRole = "client" | "transporteur" | "admin";

export function canRemoveShipment({
  actorId,
  actorRole,
  ownerId,
}: {
  actorId: string;
  actorRole: AppRole;
  ownerId: string | null;
}): boolean {
  if (actorRole === "admin") return true;
  if (!ownerId) return false;
  return actorId === ownerId;
}

export function sanitizeRemovalReason(reason: unknown): string | null {
  if (typeof reason !== "string") return null;
  const trimmed = reason.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, 500);
}
