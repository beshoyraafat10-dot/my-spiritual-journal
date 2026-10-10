import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// GitHub Pages serves the app as static files from /<repo>/, so that build is a
// client-only SPA under a base path. Other hosts get the normal SSR build.
const githubPages = process.env["GITHUB_PAGES"] === "true";

export default defineConfig({
  base: githubPages ? "/my-spiritual-journal/" : "/",
  server: { host: "::", port: 8080 },
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/query-core"],
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
      ...(githubPages && { spa: { enabled: true, prerender: { outputPath: "/index.html" } } }),
    }),
    // Nitro auto-detects the host (e.g. Vercel) at build time; locally it builds a Node server.
    nitro(),
    viteReact(),
  ],
});
