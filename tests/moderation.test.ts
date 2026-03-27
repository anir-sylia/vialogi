import test from "node:test";
import assert from "node:assert/strict";
import { canRemoveShipment, sanitizeRemovalReason } from "@/lib/moderation";
import { isPublicShipmentStatus } from "@/lib/shipments";

test("owner can remove own shipment", () => {
  const allowed = canRemoveShipment({
    actorId: "u1",
    actorRole: "client",
    ownerId: "u1",
  });
  assert.equal(allowed, true);
});

test("admin can remove any shipment", () => {
  const allowed = canRemoveShipment({
    actorId: "admin-1",
    actorRole: "admin",
    ownerId: "other-user",
  });
  assert.equal(allowed, true);
});

test("non-owner non-admin cannot remove shipment", () => {
  const allowed = canRemoveShipment({
    actorId: "u1",
    actorRole: "transporteur",
    ownerId: "u2",
  });
  assert.equal(allowed, false);
});

test("sanitizeRemovalReason trims and caps size", () => {
  const reason = sanitizeRemovalReason(` ${"a".repeat(520)} `);
  assert.equal(reason?.length, 500);
  assert.equal(reason, "a".repeat(500));
});

test("sanitizeRemovalReason returns null for empty input", () => {
  assert.equal(sanitizeRemovalReason("   "), null);
  assert.equal(sanitizeRemovalReason(undefined), null);
});

test("removed shipments are hidden from public status filter", () => {
  assert.equal(isPublicShipmentStatus("open"), true);
  assert.equal(isPublicShipmentStatus("assigned"), true);
  assert.equal(isPublicShipmentStatus("completed"), true);
  assert.equal(isPublicShipmentStatus("removed"), false);
});
