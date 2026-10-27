import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// The local API (`dotnet run` in backend/). Override with API_PROXY_TARGET if it runs elsewhere.
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:5297';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': apiProxyTarget,
    },
  },
  // `vite preview` serves the production build (used by E2E in CI) and reuses the /api proxy above.
  preview: {
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
