import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { companyDataPlugin } from './alfa/data-plugin.mjs';

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react(), companyDataPlugin()],
  build: {
    outDir: 'build',
    sourcemap: false,
    chunkSizeWarningLimit: 900
  }
});
