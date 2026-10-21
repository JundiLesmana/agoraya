/**
 * Agoraya — Idempotent database seed.
 *
 * Run with: `pnpm script:seed` (runs `tsx scripts/seed.ts`).
 *
 * Seeds BPS snapshots and the demo scenario without resetting existing data.
 * Safe to run repeatedly.
 */

import { seedAll } from "../db/seed/index.js";

async function main(): Promise<void> {
  const result = await seedAll();
  console.log(`[script:seed] complete — ${JSON.stringify(result)}`);
}

main().catch((err: unknown) => {
  console.error("[script:seed] failed:", err);
  process.exit(1);
});
