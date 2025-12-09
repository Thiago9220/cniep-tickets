import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente do .env na raiz do projeto
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Configurar conexão com PostgreSQL
const connectionString =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Nenhuma connection string do PostgreSQL encontrada!");
  console.error("   Configure POSTGRES_URL no arquivo .env");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Caminho do Excel - ajuste conforme necessário
const EXCEL_PATH = process.argv[2] || "dist/assets/Gerenciador_Chamados (2).xlsx";

// Mapeamento de Status do Excel para o sistema
function mapStatus(excelStatus: string): string {
  const statusMap: Record<string, string> = {
    Fechado: "fechado",
    Pendente: "pendente",
    Aberto: "aberto",
    "Em Andamento": "em_andamento",
  };
  return statusMap[excelStatus] || "aberto";
}

// Mapeamento de Criticidade/Prioridade do Excel para o sistema
function mapPriority(excelPriority: string): string {
  const priorityMap: Record<string, string> = {
    Alta: "alta",
    Média: "media",
    Baixa: "baixa",
  };
  return priorityMap[excelPriority] || "media";
}

// Mapeamento de Tipo de Chamado do Excel para o sistema
function mapType(excelType: string): string {
  const typeMap: Record<string, string> = {
    Orientação: "orientacao",
    "Correção Técnica": "correcao_tecnica",
    "Erro Temporário": "erro_temporario",
    "Dúvida Negocial": "duvida_negocial",
    Melhorias: "melhorias",
  };
  return typeMap[excelType] || "outros";
}

// Converter data do Excel para Date
function parseExcelDate(excelDate: any): Date | null {
  if (!excelDate) return null;

  // Se for número serial do Excel
  if (typeof excelDate === "number") {
    return new Date((excelDate - 25569) * 86400 * 1000);
  }

  // Se for string no formato MM/DD/YY
  if (typeof excelDate === "string") {
    const parts = excelDate.split("/");
    if (parts.length === 3) {
      const month = parseInt(parts[0]) - 1;
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]) + 2000; // Assume 20XX
      return new Date(year, month, day);
    }
  }

  return null;
}

interface ExcelRow {
  "Número do Chamado"?: number;
  URL?: string;
  "Status de Criticidade"?: string;
  Status?: string;
  "Tipo de Chamado"?: string;
  "Observações do usuário"?: string;
  "Data de Registro"?: any;
}

async function importExcel() {
  try {
    console.log(`\n📂 Lendo arquivo Excel: ${EXCEL_PATH}`);
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

    // Filtrar linhas vazias
    const validData = data.filter((row) => row["Número do Chamado"]);

    console.log(`📊 Encontradas ${validData.length} linhas válidas no Excel`);

    if (validData.length > 0) {
      console.log("📋 Colunas encontradas:", Object.keys(validData[0]));
      console.log("\n🔍 Primeira linha de exemplo:");
      console.log(validData[0]);
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of validData) {
      try {
        const ticketNumber = row["Número do Chamado"];
        if (!ticketNumber) {
          skipped++;
          continue;
        }

        const ticketData = {
          ticketNumber: ticketNumber,
          title: row["Observações do usuário"] || `Chamado #${ticketNumber}`,
          description: row["Observações do usuário"] || null,
          status: mapStatus(row["Status"] || ""),
          priority: mapPriority(row["Status de Criticidade"] || ""),
          type: mapType(row["Tipo de Chamado"] || ""),
          url: row["URL"] || null,
          registrationDate: parseExcelDate(row["Data de Registro"]),
        };

        // Usar upsert para atualizar se já existir ou criar se não existir
        const result = await prisma.ticket.upsert({
          where: { ticketNumber: ticketNumber },
          update: ticketData,
          create: ticketData,
        });

        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
          imported++;
          console.log(`✅ Criado: #${ticketNumber} - ${ticketData.title.substring(0, 50)}...`);
        } else {
          updated++;
          console.log(`🔄 Atualizado: #${ticketNumber}`);
        }
      } catch (error: any) {
        skipped++;
        console.log(`⚠️  Erro ao importar linha:`, error.message);
      }
    }

    console.log(`\n✨ Importação concluída!`);
    console.log(`   ✅ Criados: ${imported}`);
    console.log(`   🔄 Atualizados: ${updated}`);
    console.log(`   ⚠️  Ignorados: ${skipped}`);

    // Mostrar estatísticas
    const stats = await getStats();
    console.log(`\n📈 Estatísticas do banco:`);
    console.log(`   Total de tickets: ${stats.total}`);
    console.log(`   Por status:`, stats.byStatus);
    console.log(`   Por tipo:`, stats.byType);
    console.log(`   Por prioridade:`, stats.byPriority);
  } catch (error) {
    console.error("❌ Erro na importação:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function getStats() {
  const total = await prisma.ticket.count();

  const byStatus = await prisma.ticket.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const byType = await prisma.ticket.groupBy({
    by: ["type"],
    _count: { type: true },
  });

  const byPriority = await prisma.ticket.groupBy({
    by: ["priority"],
    _count: { priority: true },
  });

  return {
    total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.status])),
    byType: Object.fromEntries(byType.map((t) => [t.type, t._count.type])),
    byPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p._count.priority])),
  };
}

// Exportar funções para uso via API
export { importExcel, getStats, mapStatus, mapPriority, mapType, parseExcelDate };

// Executar automaticamente quando o script é chamado diretamente
importExcel();
