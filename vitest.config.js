import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'server/**/*.{test,spec}.js',
      'client/**/*.{test,spec}.{js,jsx}',
      'shared/**/*.{test,spec}.js',
    ],
  },
});

