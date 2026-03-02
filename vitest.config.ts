/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      // use the V8 coverage provider (stable for this project)
      provider: 'istanbul',
      // include 'text-summary' so total statements/branches/functions/lines are printed
      reporter: ['text', 'text-summary', 'lcov', 'json'],
      reportsDirectory: 'coverage',
      thresholds: {
        // Thresholds for all files
        statements: 75,
        branches: 75,
        functions: 75,
      },
      // collect coverage for all source files matching these globs (even if not imported by tests)
      all: true,
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      // exclude UI (shadcn) components and various config files from coverage
      exclude: [
        // shadcn/ui generated components
        '**/src/components/ui/**',
        '**/src/**/ui/**',
        '**/components/ui/**',
        // typical config and build files
        'components.json',
        'vite.config.*',
        'vitest.config.*',
        'postcss.config.*',
        'tailwind.config.*',
        'eslint.config.*',
        // folders we don't want to include
        'node_modules/**',
        'dist/**',
        'build/**',
        'e2e/**',
        // test helpers and tests themselves
        'src/**/__tests__/**',
        'src/test/**',
      ],
      // thresholds are enforced by scripts/check-coverage.js
    },
  },
});
