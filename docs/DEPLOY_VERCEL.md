# Deploy no Vercel - Estrutura Monorepo

## Mudanças na Estrutura

O projeto foi reorganizado em uma estrutura de monorepo. As principais mudanças são:

### Estrutura Anterior vs Nova

**Antes:**
```
├── client/          # Frontend
├── server/          # Backend
├── api/             # API routes
├── prisma/          # Database
└── shared/          # Código compartilhado
```

**Agora:**
```
├── apps/
│   ├── web/         # Frontend (era client/)
│   └── api/         # Backend (server/ + api/)
├── packages/
│   ├── database/    # Prisma (era prisma/)
│   └── shared/      # Código compartilhado
└── docs/            # Documentação
```

## Configuração do Vercel

### 1. Variáveis de Ambiente

Configure as seguintes variáveis no Vercel Dashboard:

```env
# Database (obrigatório para runtime)
POSTGRES_PRISMA_URL=postgresql://...

# Opcional durante build - Prisma usa { optional: true }
# Isso permite que o build funcione sem banco conectado
```

### 2. Build Settings

No Vercel Dashboard ou `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "prisma generate --schema=./packages/database/schema.prisma && pnpm build",
  "installCommand": "pnpm install",
  "outputDirectory": "dist/web"
}
```

### 3. Comandos Principais

```bash
# Gerar Prisma Client
prisma generate --schema=./packages/database/schema.prisma

# Build do projeto
pnpm build

# Build completo (Vercel usa isso)
prisma generate --schema=./packages/database/schema.prisma && pnpm build
```

## Resolução de Problemas

### Erro: "Failed to load config file prisma.config.ts"

**Causa:** O `prisma.config.ts` estava corrompido ou com caminhos errados.

**Solução:** O arquivo foi corrigido para apontar para a nova estrutura:
```typescript
export default defineConfig({
  schema: "packages/database/schema.prisma",
  migrations: {
    path: "packages/database/migrations",
  },
  datasource: {
    url: env("POSTGRES_PRISMA_URL", { optional: true }),
  },
});
```

### Erro: "Cannot find module @cniep/database"

**Causa:** Workspaces do pnpm não configurados.

**Solução:** Certifique-se que existe `pnpm-workspace.yaml` na raiz:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Build funciona local mas falha no Vercel

**Possíveis causas:**
1. Vercel não está usando pnpm - adicione `"packageManager": "pnpm@10.4.1"` no package.json
2. Variáveis de ambiente faltando - adicione `POSTGRES_PRISMA_URL`
3. Cache do Vercel - limpe o cache e faça redeploy

## Diferenças de Deploy

### Antes da Reorganização
- Schema Prisma em `./prisma/schema.prisma`
- Build output em `./dist`
- Comando: `prisma generate && pnpm build`

### Depois da Reorganização
- Schema Prisma em `./packages/database/schema.prisma`
- Build output em `./dist/web`
- Comando: `prisma generate --schema=./packages/database/schema.prisma && pnpm build`

## Checklist de Deploy

- [ ] `pnpm-workspace.yaml` existe na raiz
- [ ] `vercel.json` configurado com caminhos corretos
- [ ] `POSTGRES_PRISMA_URL` configurado no Vercel (pode ser vazio para build)
- [ ] `prisma.config.ts` aponta para `packages/database/schema.prisma`
- [ ] Build local funciona: `pnpm db:generate && pnpm build`
- [ ] Output directory em `dist/web`

## Scripts Úteis

```bash
# Desenvolvimento local
pnpm dev              # Frontend apenas
pnpm dev:all          # Frontend + Backend

# Database
pnpm db:generate      # Gerar Prisma Client
pnpm db:push          # Push schema sem migration
pnpm db:migrate       # Criar migration
pnpm db:studio        # Abrir Prisma Studio

# Build
pnpm build            # Build do frontend
pnpm build:api        # Build do backend

# Teste do build do Vercel localmente
prisma generate --schema=./packages/database/schema.prisma && pnpm build
```
