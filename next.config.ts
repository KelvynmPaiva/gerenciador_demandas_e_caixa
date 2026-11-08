import type { NextConfig } from "next";

// Headers de segurança aplicados a todas as rotas. CSP completa com nonce foi
// evitada de propósito (exige renderização dinâmica e pode quebrar scripts do
// Next); aqui só as diretivas que não afetam o funcionamento.
const headersSeguranca = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: headersSeguranca }];
  },
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
