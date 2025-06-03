import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path'; // <--- import 'path' as a namespace

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8001,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // <--- alias '@' to src/
    },
  },
});
