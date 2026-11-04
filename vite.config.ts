import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// `base: "./"` emits relative asset URLs, so the same build works on
// GitHub Pages (username.github.io/repo/), Vercel, Netlify or a custom domain.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    // React 19 + Motion in one ~160 kB (gzip) bundle is fine for a portfolio.
    chunkSizeWarningLimit: 600,
  },
});
