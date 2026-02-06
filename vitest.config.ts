import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Coverage configuration (v8)
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",
      // Focus thresholds on testable service layer code
      include: ["src/services/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "**/*.d.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/routeTree.gen.ts",
        "src/services/index.ts",
        "src/services/seed.ts",
        "src/services/notifications/**",
      ],
      // Target thresholds for quality gate
      thresholds: {
        lines: 60,
        functions: 55,
        branches: 45,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
