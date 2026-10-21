import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('repository safety', () => {
  it('keeps secrets out of the example env file', () => {
    const envExample = readFileSync(path.resolve(process.cwd(), '.env.example'), 'utf8');
    expect(envExample).not.toContain('REPLACE_ME');
    expect(envExample).toContain('DATABASE_URL=');
    expect(envExample).toContain('BREVO_API_KEY=');
  });

  it('ignores local env files and build artifacts', () => {
    const gitignore = readFileSync(path.resolve(process.cwd(), '.gitignore'), 'utf8');
    expect(gitignore).toContain('.env.*');
    expect(gitignore).toContain('coverage/');
    expect(gitignore).toContain('playwright-report/');
  });
});
