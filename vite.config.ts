import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Permitir conexiones desde localhost y localtunnel
    allowedHosts: ['localhost', '.loca.lt']
  }
});