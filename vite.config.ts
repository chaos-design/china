/// <reference types="vitest/config" />
import babel from "@rolldown/plugin-babel";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
    }),
    babel({
      plugins: ["./scripts/babel-plugin-jsx-source-location.cjs"],
    }),
  ],
  build: {
    chunkSizeWarningLimit: 6000,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    // Policy/timeline pages render data-dense DOM trees. The 5s Vitest default
    // leaves too little headroom on loaded CI runners, so the budget is widened.
    testTimeout: 20000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/*.test.{ts,tsx}",
        "src/**/index.ts",
        "src/pages/ancient/china/runtime.ts",
      ],
    },
  },
});
