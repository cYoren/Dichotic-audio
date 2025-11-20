import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'assets/**/*'], // Cache assets
      manifest: {
        name: 'Dichotic Audio Trainer',
        short_name: 'DichoticTrainer',
        description: 'Dichotic Listening & Auditory Processing Therapy Tool',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Ensure we cache external fonts or stock audio if possible, 
        // but large audio files might be better handled with runtime caching or excluded if too big.
        // For now, defaults are decent for code splitting.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}']
      }
    })
  ],
})
