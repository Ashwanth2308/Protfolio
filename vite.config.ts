import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// `base: "./"` emits relative asset URLs, so the same build works on
// GitHub Pages (username.github.io/repo/), Vercel, Netlify or a custom domain.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    // One ~200 kB (gzip) bundle: React 19, Motion and the in-browser AI demos.
    chunkSizeWarningLimit: 700,
  },
});
