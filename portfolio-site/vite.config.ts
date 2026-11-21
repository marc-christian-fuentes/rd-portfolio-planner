import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The portfolio site: a separate small app, deployed as its own Vercel project.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
