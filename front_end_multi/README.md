# Multi Experiências — front-end (Carro por Assinatura)

Site e painel administrativo em **React**, **TypeScript**, **Vite** e **Tailwind** (`front_end_multi/`).

## Desenvolvimento

Requisitos: Node.js 18+ e npm.

```bash
cd front_end_multi
npm install
npm run dev
```

O servidor de desenvolvimento usa a porta **8080**: [http://localhost:8080](http://localhost:8080).

## Build e preview

```bash
npm run build
npm run preview
```

## Variáveis de ambiente

Configure `.env` com as chaves do Supabase e demais variáveis exigidas pelo projeto (veja `.env.example` se existir na raiz do repositório).

## Testes

```bash
npm run test
```

Para E2E com Playwright (pasta `e2e/`, quando houver specs):

```bash
npx playwright test
```

## Documentação de integração

Integração com N8N e tabelas Supabase: `../API-DOCUMENTATION-N8N.md` (repositório Multi).
