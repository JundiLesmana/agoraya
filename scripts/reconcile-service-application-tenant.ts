import postgres from "postgres";
import { z } from "zod";

const parsedTenantId = z.string().uuid().safeParse(
  process.env.REPORTING_TENANT_ID?.trim(),
);
const applyChanges = process.argv.includes("--apply");
const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!parsedTenantId.success) {
  throw new Error(
    "Set REPORTING_TENANT_ID to the active ASN receiving tenant UUID.",
  );
}
if (!connectionString) {
  throw new Error(
    "Set DATABASE_URL_UNPOOLED or DATABASE_URL before running this script.",
  );
}

const sql = postgres(connectionString);

try {
  const [tenant] = await sql<{ id: string }[]>`
    SELECT id FROM tenants
    WHERE id = ${parsedTenantId.data} AND status = 'active'
    LIMIT 1
  `;
  if (!tenant) {
    throw new Error(
      "The configured reporting tenant does not exist or is not active in this database.",
    );
  }

  const sources = await sql<{ tenant_id: string; count: number }[]>`
    SELECT tenant_id::text, count(*)::int AS count
    FROM service_applications
    WHERE tenant_id <> ${tenant.id}
    GROUP BY tenant_id
    ORDER BY tenant_id
  `;
  const applicationCount = sources.reduce((total, row) => total + row.count, 0);
  console.info(
    `Legacy service applications to move: ${applicationCount} across ${sources.length} source tenants.`,
  );
  for (const source of sources) {
    console.info(`  ${source.tenant_id}: ${source.count}`);
  }

  const [assigneeConflict] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM service_applications application
    INNER JOIN users assignee ON assignee.id = application.assignee_id
    WHERE application.tenant_id <> ${tenant.id}
      AND application.assignee_id IS NOT NULL
      AND assignee.tenant_id <> ${tenant.id}
  `;
  const assigneeConflictCount = assigneeConflict?.count ?? 0;
  if (assigneeConflictCount > 0) {
    const message =
      `${assigneeConflictCount} legacy applications are assigned to users ` +
      "outside the receiving tenant.";
    if (applyChanges) {
      throw new Error(
        `Reconciliation stopped: ${message} Reassign them before applying this migration.`,
      );
    }
    console.warn(`Reconciliation cannot be applied yet: ${message}`);
  }

  if (applicationCount === 0 || !applyChanges) {
    console.info(
      applicationCount === 0
        ? "No changes required."
        : "Dry run only. Re-run with --apply to move the service applications and their review activities to REPORTING_TENANT_ID.",
    );
  } else {
    let copiedActivityCount = 0;
    await sql.begin(async (transaction) => {
      const copiedActivities = await transaction<{ id: string }[]>`
        INSERT INTO review_activities (
          id, tenant_id, item_type, item_id, activity_type, status,
          message, actor_id, created_at
        )
        SELECT gen_random_uuid(), ${tenant.id}, activity.item_type,
          activity.item_id, activity.activity_type, activity.status,
          activity.message, activity.actor_id, activity.created_at
        FROM review_activities AS activity
        INNER JOIN service_applications AS application
          ON application.id = activity.item_id
         AND application.tenant_id = activity.tenant_id
        WHERE activity.item_type = 'service_application'
          AND application.tenant_id <> ${tenant.id}
        RETURNING id
      `;
      copiedActivityCount = copiedActivities.length;
      await transaction`
        UPDATE service_applications
        SET tenant_id = ${tenant.id}, updated_at = NOW()
        WHERE tenant_id <> ${tenant.id}
      `;
    });

    console.info(
      `Reconciled ${applicationCount} service applications and copied ${copiedActivityCount} review activities.`,
    );
  }
} finally {
  await sql.end();
}