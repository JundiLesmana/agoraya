import { seedAll } from "../db/seed/index.js";

async function main(): Promise<void> {
  const result = await seedAll();
  console.log(`[script:seed] complete — ${JSON.stringify(result)}`);
}

main().catch((err: unknown) => {
  console.error("[script:seed] failed:", err);
  process.exit(1);
});
