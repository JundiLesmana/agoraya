import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

describe('foundation scripts', () => {
  it('exposes the repository bootstrap scripts required by the contract', () => {
    expect(packageJson.scripts.dev).toContain('next dev');
    expect(packageJson.scripts.seed).toContain('tsx scripts/seed.ts');
    expect(packageJson.scripts['reset-demo']).toContain('tsx scripts/reset-demo.ts');
    expect(packageJson.scripts['verify-audit']).toContain('tsx scripts/verify-audit.ts');
    expect(packageJson.scripts['export-snapshot']).toContain('tsx scripts/export-snapshot.ts');
  });
});
