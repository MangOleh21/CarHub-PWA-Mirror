import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/carhub-192.svg', 'icons/carhub-512.svg'],
      manifest: {
        name: 'CarHub — Marketplace mobil bekas',
        short_name: 'CarHub',
        description: 'Marketplace mobil bekas terkurasi dan praktis.',
        lang: 'id-ID',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#faf9f6',
        theme_color: '#1e3e72',
        icons: [
          { src: '/icons/carhub-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/carhub-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2}'],
      },
    }),
  ],
})
