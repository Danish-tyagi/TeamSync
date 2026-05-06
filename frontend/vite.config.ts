import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['date-fns', 'lucide-react'],
  },
  server: {
    port: 5173,
    allowedHosts: [
      'teamsync-production-491a.up.railway.app',
      'teamsync-frontend-production-7c77.up.railway.app'
    ],
  },
  preview: {
    allowedHosts: [
      'teamsync-frontend-production-7c77.up.railway.app'
    ],
  },
});
