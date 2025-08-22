import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 120000, // 2 minutes
    testTimeout: 60000,  // 1 minute
    setupFiles: ['./src/__tests__/setup.ts'],
    environment: 'node',
    pool: 'threads', // Use threads instead of forks
    poolOptions: {
      threads: {
        singleThread: true, // Use a single thread for all tests
      },
    },
    sequence: {
      hooks: 'list', // Run hooks in sequence
    },
  },
});
