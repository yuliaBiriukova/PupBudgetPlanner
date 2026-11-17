import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

/** The page's background in light mode (theme.ts): the browser's bars and the installed app's splash. */
const PAGE_LIGHT = '#f5f6f7';

// The local API (`dotnet run` in backend/). Override with API_PROXY_TARGET if it runs elsewhere.
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:5297';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // The installable app (F-025, ADR 0034): the manifest and a service worker that keeps the app's own files, so the
    // app opens at once while the free server sleeps. API answers are never kept. A release waits for the person's
    // Reload (`registerType: 'prompt'`, src/app/pwa/updates.ts). No service worker in `vite` dev or Storybook.
    VitePWA({
      registerType: 'prompt',
      // Registered in main.tsx, never by the plugin's own script
      injectRegister: false,
      // The icons are in `globPatterns` already: no second precache entry for each
      includeManifestIcons: false,
      manifest: {
        id: '/',
        name: 'Pup Budget Planner',
        short_name: 'Pup Budget',
        description: 'Your family budget: expenses, income, transfers and reports.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: PAGE_LIGHT,
        background_color: PAGE_LIGHT,
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The app's own files; fonts only as woff2 (every browser the app supports reads it)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Pages open from the cache; /api (sign-in with Google, invite links, data) always goes to the server
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        // The budget reminder's push and its tap (F-033, public/push-sw.js)
        importScripts: ['/push-sw.js'],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Keeps the browser's Host, so the API builds links to the app, not to itself: Google's redirect URI is
      // http://localhost:5173/api/auth/google/callback (F-012). The shorthand `'/api': target` would rewrite it.
      '/api': { target: apiProxyTarget, changeOrigin: false },
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
    // Half the owner's 8 threads: as fast as the default 7 workers there (about 24 s), and the laptop stays usable
    // (I-014). `isolate: false` was 7 s faster but lets one file's state leak into the next.
    maxWorkers: 4,
  },
});
