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

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do repositório para configurar opções do backend:

```
# Diretório absoluto para salvar uploads (opcional).
# Se não definido, usa apps/api/uploads dentro do projeto.
UPLOADS_DIR=C:\\cniep\\uploads
```

O script de desenvolvimento da API carrega automaticamente o arquivo `.env`.

#### Ambientes separados 

API (raiz do repositório):
- `.env.development` (usado por `pnpm dev:api`)
- `.env.staging` (usado por `pnpm --filter @cniep/api dev:staging`)
- `.env.production` (usado por `pnpm --filter @cniep/api start:prod`)

Web (Vite):
- `apps/web/.env.development` (usado por `pnpm --filter @cniep/web dev`)
- `apps/web/.env.staging` (usado por `pnpm --filter @cniep/web dev:staging`)
- `apps/web/.env.production` (usado por `pnpm --filter @cniep/web build`)

Chaves típicas no front:
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_ENV=desenvolvimento|homologacao|producao
```

Comandos úteis (raiz):
- `pnpm dev:all` → roda web (dev) + api (dev)
- `pnpm dev:staging` → roda web (staging) + api (staging)

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
- [Deploy Vercel - Monorepo](./docs/DEPLOY_VERCEL.md) 

## Tecnologias

- **Frontend**: React 19, Vite, TailwindCSS, Radix UI
- **Backend**: Node.js, TypeScript
- **Database**: PostgreSQL, Prisma
- **Monorepo**: pnpm workspaces
