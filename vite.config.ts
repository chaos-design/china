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
      // These are regression guards, not goals: the build fails if coverage drops below
      // them. Statements/lines/functions sit comfortably above 90. Branches do not, because
      // most of the remainder are environment guards (`typeof window === "undefined"`) and
      // defensive fallbacks for data fields that are always populated in the current
      // datasets — reaching 90% would mean deleting globals or mocking the data files.
      thresholds: {
        branches: 80,
        functions: 90,
        lines: 94,
        statements: 93,
      },
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/*.test.{ts,tsx}",
        "src/**/index.ts",
        "src/pages/ancient/china/runtime.ts",
        // WebGL scene builder: needs a real WebGL context, which jsdom does not
        // provide. Pure layout/geometry lives in rank-tree-layout.ts and is tested.
        "src/pages/ancient/china-ranks/rank-tree-scene.ts",
        // 官制立体树场景同为 WebGL 命令式对象；布局在 office-tree-layout.ts（已测）。
        "src/pages/ancient/china-qing-officials/office-tree-scene.ts",
        // 孙子兵法沙盘的 Three.js 渲染器需要真实 WebGL；纯数据/机理场景已由数据测试覆盖。
        "src/pages/ancient/china-sunzi/sand-table-scene.ts",
      ],
    },
  },
});
