import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // Percorsi relativi: il tool funziona sotto qualunque sottopercorso.
  base: "./",
  // `public/` è l'output della build, non una cartella di asset da copiare.
  publicDir: false,
  plugins: [tailwindcss()],
  build: {
    outDir: "public",
    emptyOutDir: true,
    // La CSP ammette solo `font-src 'self'`: niente asset inline come `data:`.
    assetsInlineLimit: 0,
  },
});
