# Dashboard Tickets CNIEP

Sistema de gerenciamento de tickets com dashboard e relatórios.

## Estrutura do Projeto (Monorepo)

```
cniep-tickets/
├── apps/
│   ├── web/          # Frontend React + Vite
│   └── api/          # Backend API
├── packages/
│   ├── database/     # Prisma schema e client
│   └── shared/       # Código compartilhado
├── docs/             # Documentação
└── dist/             # Build outputs
```

## Primeiros Passos

### Pré-requisitos
- Node.js 18+
- pnpm 8+

### Instalação

```bash
# Instalar dependências
pnpm install

# Gerar Prisma Client
pnpm db:generate

# Migrar database
pnpm db:migrate
```

### Desenvolvimento

```bash
# Rodar apenas o frontend
pnpm dev

# Rodar apenas o backend
pnpm dev:api

# Rodar tudo em paralelo
pnpm dev:all
```

### Build

```bash
# Build do frontend
pnpm build

# Build do backend
pnpm build:api
```

### Database

```bash
# Gerar Prisma Client
pnpm db:generate

# Push schema para database
pnpm db:push

# Criar migration
pnpm db:migrate

# Abrir Prisma Studio
pnpm db:studio
```

## Documentação

Documentação completa disponível em `/docs`:
- [Como Rodar](./docs/COMO_RODAR.md)
- [Sistema Híbrido](./docs/SISTEMA_HIBRIDO.md)
- [Setup Vercel](./docs/VERCEL_SETUP.md)

## Tecnologias

- **Frontend**: React 19, Vite, TailwindCSS, Radix UI
- **Backend**: Node.js, TypeScript
- **Database**: PostgreSQL, Prisma
- **Monorepo**: pnpm workspaces
