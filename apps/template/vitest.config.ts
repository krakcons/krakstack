import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const env = loadEnv(process.env.NODE_ENV ?? "test", process.cwd(), "");

export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    env: {
      TEST_DATABASE_URL: process.env.TEST_DATABASE_URL ?? env.TEST_DATABASE_URL,
    },
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
