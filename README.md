# ReServe — Sistema Inteligente de Reserva de Mesas

> **Projeto Integrador: Análise de Soluções Integradas para Organizações** > **Centro Universitário Senac — Campus Santo Amaro** > **Curso:** Tecnologia em Análise e Desenvolvimento de Sistemas (ADS)  
> **Professor Orientador:** Anderson Clayton Garcia Lopes  

---

## 📝 Sobre o Projeto

O **ReServe** é um Produto Mínimo Viável (MVP) desenvolvido com o objetivo de mitigar gargalos operacionais no setor gastronômico, como a ociosidade de mesas, imprevisibilidade de fluxo para os gestores e as filas de espera presenciais. A plataforma adota uma abordagem *Mobile-First* com interfaces responsivas dedicadas a duas frentes de valor:
* **B2C (Cliente Final):** Permite a busca otimizada por restaurantes (filtros por tags), escolha programada de datas, horários e seleção de mesas em tempo real, evitando o risco de *overbooking*.
* **B2B (Gestor do Restaurante):** Painel administrativo inteligente focado no controle do salão, monitoramento de status das mesas e aplicação automática de regras de negócio (como cancelamento automático após 15 minutos de atraso).

---

## 🚀 Demonstração e Links Oficiais

Para auditoria técnica e validação das funcionalidades integradas, utilize os endereços abaixo:

* **🌐 Plataforma Publicada (Deploy na Vercel):** [https://reserve-com.vercel.app/](https://reserve-com.vercel.app/)
* **🎬 Vídeo Demonstrativo (Apresentação do MVP):** [Assista no YouTube](https://www.youtube.com/watch?v=ChJ9qlOg17Q)
* **📁 Repositório do Código-Fonte:** [GitHub - Reserve.com](https://github.com/luisrca-tech/Reserve.com/tree/main)

---

## 🛠️ Stack Tecnológica

O ecossistema foi projetado utilizando ferramentas modernas que garantem tipagem estrita, performance e segurança em camadas:

* **Framework Principal:** [Next.js](https://nextjs.org/) & [React](https://react.dev/) (Arquitetura unificada de rotas e componentes)
* **Estilização e Componentes:** [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/) e [shadcn/ui](https://ui.shadcn.com/)
* **Banco de Dados & ORM:** [PostgreSQL](https://www.postgresql.org/) integrado ao [Drizzle ORM](https://orm.drizzle.team/) (Esquemas lógicos fortemente tipados divididos por domínio)
* **Autenticação e Segurança:** [Better Auth](https://www.better-auth.com/) com controle de acesso baseado em funções (`role-based route guards`)
* **Qualidade de Código e Testes:** [Vitest](https://vitest.dev/) (Testes unitários de regras de negócio) e [Biome](https://biomejs.dev/) (Linter e formatador de código)

---

## 👥 Integrantes do Grupo

* **Mario Alves da Silva**
* **Julio Boaventura Ladalardo**
* **Luis Felipe da Rocha Cruz Alves Oliveira**
* **Yuri Leite Barcelos**
* **Gustavo Pedroza Aciole Bonfim**
* **Raphael Vicente Calábria**

---

## 🗺️ Estrutura Lógica do Banco de Dados

O banco de dados relacional está estruturado textualmente com base em quatro entidades centrais:
1.  `Users`: Cadastro de clientes e administradores (`id`, `name`, `email`, `phone`, `role`, `created_at`).
2.  `Restaurants`: Informações comerciais, bio, tags de busca e URLs de imagens do estabelecimento.
3.  `Tables`: Mapeamento físico do salão por capacidade, número da mesa e controle de status em tempo real.
4.  `Reservations`: Elo central do sistema. Sincroniza o usuário, restaurante e mesa específica impedindo duplicidade de horários.

---
*Este projeto foi desenvolvido como parte dos requisitos de aprovação do módulo de Projeto Integrador do Centro Universitário Senac. Ano de Conclusão: 2026.*
