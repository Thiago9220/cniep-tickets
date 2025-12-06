# Sistema Híbrido - Relatórios Semanais

## Como Funciona

O sistema de relatórios semanais utiliza uma **arquitetura híbrida** que combina armazenamento local (localStorage) com banco de dados PostgreSQL (Vercel).

### Fluxo de Dados

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   localStorage  │ ←────→  │   DataContext    │ ←────→  │  PostgreSQL DB  │
│   (Cache Local) │         │  (Orquestrador)  │         │    (Vercel)     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Benefícios

### 1. **Performance**
- ✅ Resposta instantânea (dados vêm do cache local)
- ✅ Não depende de latência da rede para leitura
- ✅ Experiência offline (visualização de dados)

### 2. **Persistência**
- ✅ Dados salvos no banco PostgreSQL
- ✅ Sincronização entre dispositivos
- ✅ Histórico preservado permanentemente

### 3. **Confiabilidade**
- ✅ Funciona mesmo se API falhar
- ✅ Sincronização automática em background
- ✅ Fallback para dados locais

## Funcionamento Detalhado

### Inicialização (Ao Carregar a Página)

1. **Carrega dados do localStorage** (instantâneo)
2. **Busca dados do banco** (em background)
3. **Mescla os dados**:
   - Dados do banco sobrescrevem localStorage (mais recentes)
   - Dados locais novos são enviados ao banco
4. **Atualiza o estado**

### Edição de Dados

1. **Usuário edita relatório**
2. **Salva imediatamente no localStorage** (UI atualiza)
3. **Envia para o banco em background** (não bloqueia)

### Troca de Semana

1. **Usuário seleciona outra semana**
2. **Verifica se existe no cache local**
   - ✅ Existe: Exibe instantaneamente
   - ❌ Não existe: Busca do banco
3. **Atualiza a visualização**

### Sincronização Manual

- Botão de sincronização no header
- Força atualização do banco
- Útil para garantir consistência

## Estrutura de Dados

### localStorage
```javascript
{
  "weeklyDataStore": {
    "2025-W49": { /* dados da semana 49 */ },
    "2025-W48": { /* dados da semana 48 */ },
    // ...
  },
  "selectedWeek": "2025-W49"
}
```

### PostgreSQL (Vercel)
```sql
WeeklyReport {
  id: 1,
  weekKey: "2025-W49",
  period: "01/12/2025 até 07/12/2025",
  data: { /* JSON com todos os dados */ },
  createdAt: "2025-12-06T10:00:00Z",
  updatedAt: "2025-12-06T15:30:00Z"
}
```

## API Endpoints

### GET `/api/reports/weekly`
Lista todos os relatórios semanais do banco.

### GET `/api/reports/weekly/[weekKey]`
Busca relatório específico (ex: `2025-W49`).

### POST `/api/reports/weekly`
Cria ou atualiza relatório (upsert).

```json
{
  "weekKey": "2025-W49",
  "period": "01/12/2025 até 07/12/2025",
  "data": { /* dados do relatório */ }
}
```

### DELETE `/api/reports/weekly/[weekKey]`
Remove relatório específico.

## Componentes

### `weeklyReportService.ts`
- Camada de serviço para comunicação com API
- Funções: `fetchAllReports`, `saveReport`, `syncWithDatabase`

### `DataContext.tsx`
- Gerencia estado global dos relatórios
- Sincronização automática na inicialização
- Persistência em localStorage e banco

### `WeeklyReport.tsx`
- Interface de visualização
- Estados de loading e sincronização
- Botão de sync manual

## Estados de Loading

### `isLoading`
- Ativo durante inicialização
- Exibe spinner enquanto busca dados

### `isSyncing`
- Ativo durante sincronização manual
- Badge "Sincronizando" no header
- Botão de sync desabilitado

## Acessar Semanas Anteriores

1. **Dropdown de Semanas**
   - Lista todas as semanas disponíveis
   - Ordenadas da mais recente para a mais antiga

2. **Seleção Automática**
   - Sistema verifica cache local primeiro
   - Se não existir, busca do banco
   - Se não existir no banco, cria novo com dados padrão

3. **Histórico Ilimitado**
   - Todas as semanas salvas ficam disponíveis
   - Não há limite de armazenamento
   - Dados nunca são perdidos

## Configuração (Vercel)

### Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas no Vercel:

```env
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
```

### Build Command

```json
{
  "buildCommand": "prisma generate && pnpm build"
}
```

## Desenvolvimento Local

1. Configure o `.env` com suas credenciais do PostgreSQL:
```env
POSTGRES_PRISMA_URL="postgres://username:password@host:port/database?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://username:password@host:port/database"
```

2. Execute as migrações:
```bash
pnpm prisma migrate dev
```

3. Inicie o servidor:
```bash
pnpm dev
```

## Troubleshooting

### Dados não sincronizam
1. Verifique console do navegador (F12)
2. Verifique se API está respondendo (`/api/reports/weekly`)
3. Use botão de sincronização manual
4. Verifique variáveis de ambiente no Vercel

### Dados diferentes entre dispositivos
1. Clique no botão de sincronização manual
2. Aguarde badge "Sincronizando" desaparecer
3. Dados devem estar consistentes

### Performance lenta
- Sistema deve ser rápido (cache local)
- Se estiver lento, verifique tamanho do localStorage
- Considere limpar semanas muito antigas
