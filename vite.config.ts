import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'MusicDist Artist Dashboard',
          short_name: 'Artist Panel',
          description: 'Manage your music distribution',
          theme_color: '#6366f1',
          background_color: '#1a1a2e',
          display: 'standalone',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    server: {
      port: 3001,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'https://nrzzqsnw-3000.inc1.devtunnels.ms',
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});

