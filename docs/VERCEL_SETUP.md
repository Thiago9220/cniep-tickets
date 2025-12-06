# Setup do Vercel - Migração para Serverless

Este projeto foi migrado de SQLite + Express para PostgreSQL + Vercel Serverless Functions.

**IMPORTANTE**: Este projeto usa Prisma 7, que tem uma nova forma de configurar datasources através de `prisma.config.ts` e adaptadores de banco de dados.

## Passo a Passo para Deploy no Vercel

### 1. Criar Conta e Projeto no Vercel

1. Acesse https://vercel.com e crie uma conta (pode usar GitHub)
2. Conecte seu repositório GitHub ao Vercel
3. Importe o projeto

### 2. Adicionar Vercel Postgres

1. No dashboard do Vercel, vá para seu projeto
2. Clique na aba "Storage"
3. Clique em "Create Database"
4. Selecione "Postgres"
5. Escolha um nome para o banco (ex: `cniep-tickets-db`)
6. Clique em "Create"

### 3. Conectar Banco ao Projeto

1. Após criar o banco, você verá uma lista de variáveis de ambiente
2. O Vercel já adiciona automaticamente as variáveis necessárias:
   - `POSTGRES_PRISMA_URL` (para queries com pooling)
   - `POSTGRES_URL_NON_POOLING` (para migrações)
3. Essas variáveis já estarão disponíveis para o projeto automaticamente

### 4. Deploy Inicial

1. Faça push do código para o GitHub:
   ```bash
   git add .
   git commit -m "Migrate to Vercel serverless with Postgres"
   git push
   ```

2. O Vercel vai automaticamente:
   - Instalar as dependências
   - Gerar o Prisma Client
   - Buildar o frontend
   - Configurar as funções serverless

### 5. Executar Migrações do Banco

Após o primeiro deploy:

1. Instale a CLI do Vercel localmente:
   ```bash
   npm i -g vercel
   ```

2. Faça login:
   ```bash
   vercel login
   ```

3. Link o projeto local ao Vercel:
   ```bash
   vercel link
   ```

4. Baixe as variáveis de ambiente:
   ```bash
   vercel env pull .env
   ```

5. Execute as migrações:
   ```bash
   pnpm prisma db push
   ```

### 6. Endpoints da API

A API agora está disponível nos seguintes endpoints:

- `GET /api/hello` - Teste da API
- `GET /api/tickets` - Listar todos os tickets
- `POST /api/tickets` - Criar novo ticket
- `GET /api/tickets/[id]` - Buscar ticket por ID
- `PUT /api/tickets/[id]` - Atualizar ticket
- `DELETE /api/tickets/[id]` - Deletar ticket

### 7. Desenvolvimento Local

Para desenvolver localmente com o banco PostgreSQL do Vercel:

1. Certifique-se de ter o arquivo `.env` com as variáveis do Vercel
2. Execute:
   ```bash
   pnpm install
   pnpm prisma generate
   pnpm dev
   ```

## Mudanças Realizadas

### Arquivos Criados
- `api/_lib/prisma.ts` - Cliente Prisma otimizado para serverless com adapter pg
- `api/hello.ts` - Endpoint de teste
- `api/tickets/index.ts` - Endpoints GET e POST para tickets
- `api/tickets/[id].ts` - Endpoints GET, PUT e DELETE para ticket individual
- `prisma/prisma.config.ts` - Configuração do Prisma 7 com URLs de conexão
- `.env.example` - Template para variáveis de ambiente

### Arquivos Modificados
- `prisma/schema.prisma` - Mudou de SQLite para PostgreSQL (Prisma 7 format)
- `package.json` - Removeu dependências do Express e SQLite, adicionou @vercel/node, @prisma/adapter-pg e pg
- `vercel.json` - Simplificado para build automático

### Arquivos que podem ser removidos
- `server/` - Toda a pasta do Express (mantida para referência)
- `server/db.ts` - Substituído por `api/_lib/prisma.ts`
- `server/index.ts` - Substituído pelas funções serverless

## Vantagens da Nova Arquitetura

1. **Escalabilidade Automática**: Vercel escala automaticamente com o tráfego
2. **Banco Gerenciado**: PostgreSQL totalmente gerenciado pela Vercel
3. **Deploy Contínuo**: Cada push para GitHub gera um novo deploy
4. **Preview Deploys**: Cada PR gera um ambiente de preview
5. **Edge Network**: CDN global para melhor performance
6. **Zero Configuração**: Sem necessidade de configurar servidores

## Solução de Problemas

### Build falha no Vercel
- Verifique se as variáveis de ambiente estão configuradas
- Cheque os logs de build no dashboard do Vercel

### Erro ao conectar ao banco
- Confirme que o Postgres foi criado e conectado ao projeto
- Verifique se as variáveis `POSTGRES_PRISMA_URL` e `POSTGRES_URL_NON_POOLING` existem

### API retorna erro 500
- Verifique os logs de função no dashboard do Vercel
- Confirme que as migrações foram executadas corretamente
