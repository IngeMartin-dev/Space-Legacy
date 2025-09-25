import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1000, // Aumentar límite de chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          socket: ['socket.io-client'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  server: {
    // Permitir conexiones desde localhost y localtunnel
    allowedHosts: ['localhost', '.loca.lt']
  }
});
