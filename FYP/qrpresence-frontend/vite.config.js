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
     build: {
    chunkSizeWarningLimit: 1000 // Set to a higher limit (in kB)
  }
});
