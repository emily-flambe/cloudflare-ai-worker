import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Note: Using node environment instead of miniflare for now
    // TODO: Set up proper Cloudflare Workers testing environment
  },
});