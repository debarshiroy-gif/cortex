import { prisma } from "@/lib/db";

export type AuditAction = "drafted" | "flagged" | "verified" | "signed_off";

interface RecordAuditEventArgs {
  requirementId: string;
  actor: string;
  action: AuditAction;
  note?: string;
}

export function recordAuditEvent({
  requirementId,
  actor,
  action,
  note,
}: RecordAuditEventArgs) {
  return prisma.auditTrail.create({
    data: {
      requirementId,
      actor: actor.trim() || "human",
      action,
      note: note ?? null,
    },
  });
}
