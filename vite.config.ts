import tsconfigPaths from "vite-tsconfig-paths";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    // publicDir: "static",
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"), // Map @/ to the src/ directory
        },
    },
    build: {
        target: 'esnext'
        // sourcemap: false, // Disable source maps
    },
    plugins: [wasm(), topLevelAwait(), tsconfigPaths()],
    optimizeDeps: {
      exclude: ["@babylonjs/havok", "@babylonjs/core"],
    },
});
