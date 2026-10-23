import path from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';

const _require = createRequire(import.meta.url);

function reactJsxPlugin() {
  const { transformSync } = _require('esbuild') as { transformSync: (code: string, options: Record<string, unknown>) => { code: string; map: unknown } };
  return {
    name: 'vitest-react-jsx',
    transform(code: string, id: string) {
      if (!id.match(/\.[jt]sx$/)) return null;
      const result = transformSync(code, {
        format: 'esm',
        loader: id.endsWith('.tsx') ? 'tsx' : 'jsx',
        jsx: 'automatic',
        target: 'es2022',
        sourcemap: true,
        sourcefile: id,
      });
      return { code: result.code, map: result.map };
    },
  } satisfies Plugin;
}

export default defineConfig({
  plugins: [reactJsxPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
      '@helpers': path.resolve(__dirname, './tests/helpers'),
    },
  },
  test: {
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/integration/**/*.test.ts',
      'tests/security/**/*.test.ts',
      'tests/security/**/*.test.tsx',
      'tests/load/**/*.test.ts',
    ],
    exclude: ['node_modules/**', '.next/**', 'out/**', 'dist/**', 'coverage/**', 'test-results/**', 'playwright-report/**'],
    setupFiles: ['tests/helpers/setup-react.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
