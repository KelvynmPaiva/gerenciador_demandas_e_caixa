import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Testes rápidos, sem rede e sem banco: só a lógica pura de lib/.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});
