# ReServe — Projeto para LinkedIn

> Texto pronto para a aba **Projetos** do LinkedIn (≤ 2000 caracteres). Período sugerido: **Maio de 2026** (amplie para o período acadêmico completo do TCC, se quiser).

---

## Descrição (cole este bloco)

O **ReServe** é uma plataforma SaaS *mobile-first* de reservas inteligentes para restaurantes, desenvolvida como **TCC** do curso de Análise e Desenvolvimento de Sistemas do Centro Universitário Senac, em **equipe de 6 integrantes**.

Resolve dores reais do setor — mesas ociosas, fluxo imprevisível de clientes e filas presenciais — conectando dois públicos: o cliente que garante mesa sem esperar e o restaurante que ganha previsibilidade na ocupação. Atuei na construção *end-to-end* sobre uma arquitetura full-stack tipada de ponta a ponta (T3 Stack), com separação por domínios e testes nas regras críticas.

Destaques:

• Dois fronts em um produto — cliente (busca por tags, agendamento por data/horário e seleção de mesa em tempo real) e painel do restaurante (status das mesas, confirmação/cancelamento/conclusão e gestão de cardápio e capacidade).

• Regras de negócio em domínio próprio — camada isolada para disponibilidade, capacidade e ciclo de vida da reserva (máquina de estados), com cancelamento automático após 15 min de no-show. Tudo coberto por testes unitários.

• API tipada ponta a ponta — tRPC + TanStack Query entregam contratos com segurança de tipos em tempo de compilação entre backend e React.

• Auth e papéis — Better Auth com controle de acesso por perfil (RBAC) separando cliente e dono de restaurante.

• Persistência tipada — PostgreSQL + Drizzle ORM, schema por domínio e migrations tipadas.

• Formulários e upload — React Hook Form + Zod e UploadThing para galeria e cardápio.

Construído com TDD (Vitest), Biome e ambiente tipado com Zod. Publicado na Vercel.

**Stack:** TypeScript · Next.js 15 · React 19 · tRPC · TanStack Query · PostgreSQL · Drizzle ORM · Better Auth · Zod · Tailwind · shadcn/ui · UploadThing · Vitest · Biome · T3 Stack · SaaS · TDD

---

## Dicas

1. **Período:** `Mai 2026 – Mai 2026` (repo) ou o semestre completo do TCC.
2. **Links:** repo `github.com/luisrca-tech/Reserve.com` + demo `reserve-com.vercel.app`.
3. **Marque os 6 integrantes** como colaboradores — amplia o alcance.
4. **Adicione screenshots/vídeo** do fluxo de seleção de mesa.
