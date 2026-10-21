import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
      '@helpers': path.resolve(__dirname, './tests/helpers'),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts', 'tests/security/**/*.test.ts', 'tests/load/**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**', 'out/**', 'dist/**', 'coverage/**', 'test-results/**', 'playwright-report/**'],
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
