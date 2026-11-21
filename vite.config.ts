import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite is the tool that runs the app locally and builds it for the web.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The Excel library (~940 KB) is its own file, loaded only when someone
    // clicks "Export to Excel", so its size doesn't slow the app down.
    chunkSizeWarningLimit: 1000,
  },
});
