import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite is the tool that runs the app locally and builds it for the web.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
