import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Repo A (CoreNovaLaunchWebsite): Vite + React static build → Cloudflare Pages.
//
// Data flow (deployment-contract.md §2.3 / §5.1, website-design.md §5.1):
//   scripts/fetch-verified.mjs (prebuild / predev)
//     → data/{verified/**,stats.json,{app}/releases.json}   raw build-time snapshot
//     → public/screenshots/<key path>                        mirrored screenshots
//     → src/data/generated.json                              the same payload inlined as a module
//   src/data/generated.ts + src/data/useAppData.ts read that module, so SSR (prerender)
//   and client hydration consume identical data. There is no runtime fetch anywhere.
//
// publicDir stays the default `public/`, which is where the mirrored screenshots land
// (public/screenshots/ghost/v6.61.0/home.png → /screenshots/ghost/v6.61.0/home.png).
export default defineConfig({
  plugins: [react()],
  publicDir: "public",
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: "dist",
  },
});
