import { existsSync } from "node:fs";
import { z } from "zod";
import { createDatabase, type Row } from "../src/lib/db/client.js";
import {
  getStatisticsWorkspace,
  saveStatisticsInput,
} from "../src/modules/statistics-input/service.js";
import { getLocalDatabaseTarget } from "./local-database-target.js";

const ENV_FILE = ".env.local";
const LocalSeedEnvSchema = z.object({
  DATABASE_URL_UNPOOLED: z.string().url(),
});

type LocalStatisticsOperator = Row & {
  userId: string;
  tenantId: string;
  hasAdminRole: boolean;
  hasStatisticsRole: boolean;
};

function getLocalDatabaseUrl(): string {
  if (!existsSync(ENV_FILE)) {
    throw new Error(
      `${ENV_FILE} tidak ditemukan. Seed statistik hanya berjalan pada database lokal.`,
    );
  }

  process.loadEnvFile(ENV_FILE);
  const parsed = LocalSeedEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      "DATABASE_URL_UNPOOLED tidak valid atau tidak tersedia di .env.local.",
    );
  }

  getLocalDatabaseTarget(parsed.data.DATABASE_URL_UNPOOLED);
  return parsed.data.DATABASE_URL_UNPOOLED;
}

async function main(): Promise<void> {
  const database = createDatabase(getLocalDatabaseUrl());
  try {
    const operators = await database.query<LocalStatisticsOperator>(
      `SELECT user_record.id::text AS "userId",
         user_record.tenant_id::text AS "tenantId",
         bool_or(role_record.key = 'admin') AS "hasAdminRole",
         bool_or(role_record.key IN ('asn', 'staff', 'superadmin'))
           AS "hasStatisticsRole"
       FROM users user_record
       INNER JOIN user_roles user_role
         ON user_role.user_id = user_record.id
         AND user_role.revoked_at IS NULL
       INNER JOIN roles role_record
         ON role_record.id = user_role.role_id
         AND role_record.tenant_id = user_record.tenant_id
       WHERE user_record.user_status = 'active'
         AND role_record.key IN ('admin', 'asn', 'staff', 'superadmin')
       GROUP BY user_record.id, user_record.tenant_id
       ORDER BY user_record.tenant_id, user_record.id`,
    );
    if (!operators.length) {
      throw new Error(
        "Tidak ada akun superadmin lokal aktif. Jalankan seed akun lokal terlebih dahulu.",
      );
    }

    await database.transaction(async (transaction) => {
      for (const operator of operators) {
        if (operator.hasAdminRole && !operator.hasStatisticsRole) {
          await transaction.query(
            `INSERT INTO roles (id, tenant_id, name, key)
             VALUES (gen_random_uuid(), $1, 'ASN Operator', 'asn')
             ON CONFLICT (tenant_id, key) DO NOTHING`,
            [operator.tenantId],
          );
          await transaction.query(
            `INSERT INTO user_roles (user_id, role_id)
             SELECT $1, id
             FROM roles
             WHERE tenant_id = $2 AND key = 'asn'
             ON CONFLICT (user_id, role_id)
             DO UPDATE SET revoked_at = NULL, expires_at = NULL`,
            [operator.userId, operator.tenantId],
          );
        }
        await transaction.query(
          "SELECT set_config('app.tenant_id', $1, true)",
          [operator.tenantId],
        );
        await transaction.query("SELECT set_config('app.user_id', $1, true)", [
          operator.userId,
        ]);
        await transaction.query(
          `INSERT INTO module_access (tenant_id, user_id, module_key)
           VALUES ($1, $2, 'insight')
           ON CONFLICT (user_id, module_key) WHERE revoked_at IS NULL
           DO NOTHING`,
          [operator.tenantId, operator.userId],
        );
        await transaction.query(
          `INSERT INTO statistic_operator_assignments (
             tenant_id, user_id, agency_id, region_id, region_name, sector_id
           )
           VALUES ($1, $2, 'bps-jawa-barat', 'jawa-barat', 'Jawa Barat', 'economy')
           ON CONFLICT (user_id, tenant_id, agency_id, region_id, sector_id)
           DO NOTHING`,
          [operator.tenantId, operator.userId],
        );
      }
    });

    let seededEntries = 0;
    for (const operator of operators) {
      const session = {
        userId: operator.userId,
        tenantId: operator.tenantId,
        role: "asn",
        roles: ["asn"],
      };
      const existing = await getStatisticsWorkspace(
        session,
        {
          referenceYear: new Date().getFullYear(),
          regionId: "jawa-barat",
          sectorId: "economy",
          indicatorId: "tpt",
        },
        database,
      );
      if (existing.entry?.id) continue;

      await saveStatisticsInput(
        session,
        {
          referenceYear: new Date().getFullYear(),
          regionId: "jawa-barat",
          sectorId: "economy",
          indicatorId: "tpt",
          periodType: "quarterly",
          status: "draft",
          sourceName: "Data contoh lokal (bukan data BPS)",
          methodology:
            "Nilai sintetis untuk pengujian tampilan lokal; bukan statistik resmi.",
          values: [
            { periodValue: "Q1", value: 5.4, explanation: "" },
            { periodValue: "Q2", value: 5.3, explanation: "" },
            { periodValue: "Q3", value: 5.2, explanation: "" },
            { periodValue: "Q4", value: 5.25, explanation: "" },
          ],
        },
        [],
        database,
      );
      seededEntries += 1;
    }

    console.log(
      `[seed:local-statistics] complete — ${operators.length} operator access(es), ${seededEntries} sample draft(s).`,
    );
  } finally {
    await database.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    "[seed:local-statistics] failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});
