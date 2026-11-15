# Changelog

Registro de funcionalidades e mudanças relevantes, da mais recente para a mais antiga.
Formato: data · o que foi feito · arquivos alterados. Atualizar a cada entrega (regra no `CLAUDE.md`).

## 2026-11-15
- **Documentação reorganizada**: `CLAUDE.md` reestruturado em Visão geral, Stack e comandos, Estrutura de pastas, Convenções, Banco de dados, Decisões importantes, Pendências conhecidas e regra permanente de documentação; criado este changelog.
  - Arquivos: `CLAUDE.md`, `docs/CHANGELOG.md`

## 2026-11-13
- **Testes unitários com Vitest** para `lib/` (datas, formato, links, pendências).
  - Arquivos: `lib/__tests__/datas.test.ts`, `lib/__tests__/formato.test.ts`, `lib/__tests__/links.test.ts`, `lib/__tests__/pendencias.test.ts`, `vitest.config.mts`, `package.json`, `package-lock.json`
- **Remoção de código sem uso** (client do Supabase no navegador e componente `separator`).
  - Arquivos: `lib/supabase/client.ts` (removido), `components/ui/separator.tsx` (removido)
- **Performance**: menos consultas repetidas e cascatas no servidor (`React.cache` para marcas e cliente Supabase).
  - Arquivos: `app/(app)/layout.tsx`, `app/(app)/page.tsx`, `app/(app)/marcas/page.tsx`, `app/(app)/marcas/[marcaId]/page.tsx`, `lib/marcas.ts`, `lib/ocorrencias.ts`, `lib/supabase/server.ts`
- **Refactor**: helpers duplicados das Server Actions centralizados em `lib/acoes.ts`.
  - Arquivos: `lib/acoes.ts`, `app/(app)/eventos/actions.ts`, `app/(app)/eventos/[eventoId]/actions.ts`, `app/(app)/eventos/[eventoId]/actions-demandas.ts`, `app/(app)/marcas/actions.ts`, `app/(app)/marcas/[marcaId]/actions.ts`
- **Docs**: criação do `CLAUDE.md` com arquitetura, padrões e comandos.
  - Arquivos: `CLAUDE.md`

## 2026-11-12
- **Skills do projeto** consolidadas em `.claude/skills` (find-skills, vercel-react-best-practices, systematic-debugging).
- Ajustes em imagens dos protótipos (`spec/`).

## 2026-11-08
- **Versão inicial**: marcas, notas recorrentes, eventos (orçamento e demandas), painel de pendências, login Supabase, schema `0001_inicial.sql`.
- **Alterações de segurança** (RLS/autenticação).
  - Arquivos principais: `supabase/migrations/0001_inicial.sql`, `proxy.ts`, `app/`
