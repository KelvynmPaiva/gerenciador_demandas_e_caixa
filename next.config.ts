import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "cacheComponents" (padrão do template) foi desligado de propósito: ele exige
  // <Suspense> em toda página que lê cookies/params. Este app é 100% privado e
  // dinâmico, então não traz ganho e só complica o código.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
