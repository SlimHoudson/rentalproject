import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    },
    // Reduce HMR overhead
    hmr: {
      overlay: false,
    },
  },

  // Pre-bundle key dependencies so they don't re-process on every dev start
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
    ],
  },

  build: {
    // Split vendor libraries into separate chunks for better browser caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
          }
        },
      },
    },
    // Warn only for chunks > 700kb (not the default 500kb)
    chunkSizeWarningLimit: 700,
  },
})

