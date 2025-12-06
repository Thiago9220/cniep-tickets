# Configuração do Vercel - Guia Passo a Passo

## 1. Variáveis de Ambiente Obrigatórias

No **Vercel Dashboard** → **Settings** → **Environment Variables**, adicione:

### Para Produção, Preview e Development:

```
POSTGRES_PRISMA_URL
```
Valor: O URL do Vercel Postgres com pooling
Exemplo: `postgres://default:xxx@xxx-pooler.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true`

```
POSTGRES_URL_NON_POOLING
```
Valor: O URL do Vercel Postgres sem pooling (para migrations)
Exemplo: `postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb`

### Como obter esses valores:

1. No Vercel Dashboard, vá em **Storage**
2. Clique no seu banco **Postgres**
3. Na aba **Settings** ou **Quickstart**, copie:
   - `POSTGRES_PRISMA_URL` (pooled connection)
   - `POSTGRES_URL_NON_POOLING` (direct connection)

## 2. Configuração do Build

Verifique se o `vercel.json` tem:

```json
{
  "version": 2,
  "buildCommand": "prisma generate && pnpm build"
}
```

## 3. Aplicar Migrações

Após o deploy, você precisa aplicar as migrações manualmente **uma vez**:

### Opção A: Via Vercel CLI

```bash
# Instale a CLI do Vercel
npm i -g vercel

# Faça login
vercel login

# Link o projeto
vercel link

# Execute a migração
vercel env pull .env.local
pnpm prisma migrate deploy
```

### Opção B: Via SQL direto no Vercel

1. Vá em **Storage** → Seu **Postgres Database**
2. Clique em **Query** ou **Data**
3. Execute o SQL da migração manualmente:

```sql
-- Copie e cole o conteúdo de:
-- prisma/migrations/20251206000000_add_report_models/migration.sql
```

## 4. Verificar se está funcionando

Após deploy e migração:

1. Acesse sua aplicação no Vercel
2. Vá para a página de **Relatório Semanal**
3. Edite alguns dados
4. Verifique se sincroniza (badge "Sincronizando" aparece)
5. Limpe o localStorage e recarregue - dados devem vir do banco

## 5. Troubleshooting

### Erro: "Missing required environment variable"

**Solução:**
- Verifique se adicionou `POSTGRES_PRISMA_URL` nas variáveis de ambiente
- Certifique-se de marcar para: Production, Preview, Development
- Faça um novo deploy após adicionar

### Erro: "Database does not exist"

**Solução:**
- Execute `pnpm prisma migrate deploy` manualmente
- Ou aplique o SQL da migração direto no banco

### Erro: "relation does not exist"

**Solução:**
- As tabelas não foram criadas
- Execute as migrações (veja passo 3)

### API retorna 500

**Solução:**
- Verifique logs no Vercel Dashboard → Functions → Logs
- Provavelmente falta migração ou variável de ambiente

## 6. Monitoramento

### Ver logs das APIs:

1. Vercel Dashboard → **Functions**
2. Clique em qualquer função (ex: `/api/reports/weekly`)
3. Veja logs em tempo real

### Ver dados no banco:

1. Vercel Dashboard → **Storage** → Seu **Postgres**
2. Clique em **Data** ou **Query**
3. Execute queries para verificar:

```sql
-- Ver relatórios salvos
SELECT * FROM "WeeklyReport" ORDER BY "weekKey" DESC;

-- Contar relatórios
SELECT COUNT(*) FROM "WeeklyReport";
```

## 7. Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no Vercel
  - [ ] `POSTGRES_PRISMA_URL`
  - [ ] `POSTGRES_URL_NON_POOLING`
- [ ] Build command correto em `vercel.json`
- [ ] Código commitado e pushed para Git
- [ ] Deploy automático executado
- [ ] Migrações aplicadas no banco
- [ ] Teste funcional da aplicação
- [ ] Sistema híbrido funcionando (localStorage + DB)

## 8. Comandos Úteis

```bash
# Ver status do Prisma
pnpm prisma db push --skip-generate

# Gerar client localmente
pnpm prisma generate

# Ver schema atual
pnpm prisma db pull

# Reset database (cuidado!)
pnpm prisma migrate reset
```
