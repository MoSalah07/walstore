import "server-only";

import Activity, { ActivityEntity } from "@/models/activity.model";

// Best effort: never block the real change on the audit write.
export async function logActivity(entry: {
  actor?: { id?: string; name?: string | null } | null;
  action: string;
  entity: ActivityEntity;
  entityId?: string;
  entityLabel?: string;
  diff?: string;
}) {
  try {
    await Activity.create({
      actor: entry.actor?.id,
      actorName: entry.actor?.name ?? "System",
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      entityLabel: entry.entityLabel,
      diff: entry.diff,
    });
  } catch (err) {
    console.error("logActivity", err);
  }
}
