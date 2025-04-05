import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['lucide-react'],
  },
  server: {
    headers: {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Service-Worker-Allowed': '/',
    },
    port: 3003,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      overlay: true,
    },
    watch: {
      usePolling: true,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          icons: ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
