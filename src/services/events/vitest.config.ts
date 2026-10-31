import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("../../", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: [
      "src/services/events/subscriptions.test.ts",
      "src/services/events/index.test.ts",
      "src/services/events/persistence.test.ts",
      "src/services/events/schema.test.ts",
    ],
    testTimeout: 30_000,
  },
});
