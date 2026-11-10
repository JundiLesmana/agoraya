import postgres from "postgres";
import { z } from "zod";

const targetTenantId =
  process.env.CITIZEN_KYC_TENANT_ID?.trim() ||
  process.env.REPORTING_TENANT_ID?.trim();
const applyChanges = process.argv.includes("--apply");
const parsedTenantId = z.string().uuid().safeParse(targetTenantId);

if (!parsedTenantId.success) {
  throw new Error(
    "Set CITIZEN_KYC_TENANT_ID (or REPORTING_TENANT_ID) to the ASN reviewer tenant UUID.",
  );
}

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "Set DATABASE_URL_UNPOOLED or DATABASE_URL before running this script.",
  );
}

const sql = postgres(connectionString);

try {
  const [tenant] = await sql<{ id: string }[]>`
    SELECT id FROM tenants WHERE id = ${parsedTenantId.data} LIMIT 1
  `;
  if (!tenant) {
    throw new Error(
      "The configured KYC tenant does not exist in this database.",
    );
  }

  const [summary] = await sql<{ count: number }[]>`
    SELECT count(DISTINCT roster.id)::int AS count
    FROM kyc_roster AS roster
    INNER JOIN citizen_profiles AS profile ON profile.user_id = roster.user_id
    INNER JOIN users AS account ON account.id = roster.user_id
    WHERE roster.tenant_id <> ${tenant.id}
      AND profile.tenant_id = roster.tenant_id
      AND account.tenant_id = roster.tenant_id
  `;
  const rosterCount = summary?.count ?? 0;
  console.info(`Citizen KYC roster entries to reconcile: ${rosterCount}`);

  if (rosterCount === 0 || !applyChanges) {
    console.info(
      rosterCount === 0
        ? "No changes required."
        : "Dry run only. Re-run with --apply to move only these KYC roster and approval tenant IDs.",
    );
  } else {
    const [conflict] = await sql<{ id: string }[]>`
      SELECT legacy.id
      FROM kyc_roster AS legacy
      INNER JOIN citizen_profiles AS profile ON profile.user_id = legacy.user_id
      INNER JOIN users AS account ON account.id = legacy.user_id
      INNER JOIN kyc_roster AS current
        ON current.user_id = legacy.user_id
        AND current.tenant_id = ${tenant.id}
        AND current.id <> legacy.id
      WHERE legacy.tenant_id <> ${tenant.id}
        AND profile.tenant_id = legacy.tenant_id
        AND account.tenant_id = legacy.tenant_id
      LIMIT 1
    `;

    if (conflict) {
      throw new Error(
        "Reconciliation stopped: a citizen already has a KYC roster entry in the target tenant.",
      );
    }

    await sql.begin(async (transaction) => {
      await transaction`
        UPDATE kyc_approvals AS approval
        SET tenant_id = ${tenant.id}
        FROM kyc_roster AS roster
        INNER JOIN citizen_profiles AS profile ON profile.user_id = roster.user_id
        INNER JOIN users AS account ON account.id = roster.user_id
        WHERE approval.roster_id = roster.id
          AND roster.tenant_id <> ${tenant.id}
          AND profile.tenant_id = roster.tenant_id
          AND account.tenant_id = roster.tenant_id
      `;
      await transaction`
        UPDATE kyc_roster AS roster
        SET tenant_id = ${tenant.id}
        FROM citizen_profiles AS profile, users AS account
        WHERE profile.user_id = roster.user_id
          AND account.id = roster.user_id
          AND roster.tenant_id <> ${tenant.id}
          AND profile.tenant_id = roster.tenant_id
          AND account.tenant_id = roster.tenant_id
      `;
    });

    console.info(`Reconciled ${rosterCount} citizen KYC roster entries.`);
  }
} finally {
  await sql.end();
}