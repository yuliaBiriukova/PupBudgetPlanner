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
  // Libraries in their own chunks: none passes the 500 kB warning, and they stay cached between releases
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
              priority: 3,
            },
            { name: 'mantine', test: /node_modules[\\/]@mantine[\\/]/, priority: 2 },
            { name: 'vendor', test: /node_modules[\\/]/, priority: 1 },
          ],
        },
      },
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
