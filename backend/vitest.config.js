import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: './tests/globalSetup.js',
    setupFiles: ['./tests/envSetup.js'],
    fileParallelism: false,
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/controllers/**', 'src/middleware/**']
    }
  }
});
