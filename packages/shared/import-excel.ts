import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

// Mapeamento de Status do Excel para o sistema
export function mapStatus(excelStatus: string): string {
  const statusMap: Record<string, string> = {
    Fechado: "fechado",
    Pendente: "pendente",
    Aberto: "aberto",
    "Em Andamento": "em_andamento",
  };
  return statusMap[excelStatus] || "aberto";
}

// Mapeamento de Criticidade/Prioridade do Excel para o sistema
export function mapPriority(excelPriority: string): string {
  const priorityMap: Record<string, string> = {
    Alta: "alta",
    Média: "media",
    Baixa: "baixa",
  };
  return priorityMap[excelPriority] || "media";
}

// Mapeamento de Tipo de Chamado do Excel para o sistema
export function mapType(excelType: string): string {
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
export function parseExcelDate(excelDate: any): Date | null {
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

export interface ImportStats {
  imported: number;
  updated: number;
  skipped: number;
  totalProcessed: number;
}

export async function processExcelBuffer(buffer: Buffer, prisma: PrismaClient): Promise<ImportStats> {
  console.log(`\n📂 Processando buffer Excel...`);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 Total de linhas encontradas no Excel (excluindo cabeçalho): ${data.length}`);

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const seenTicketNumbers = new Set<number>();

  for (const [index, row] of data.entries()) {
    const rowNum = index + 2; // +1 header, +1 zero-based index
    try {
      const rawTicketNumber = row["Número do Chamado"];
      
      if (rawTicketNumber === undefined || rawTicketNumber === null || rawTicketNumber === "") {
        skipped++;
        continue;
      }

      const ticketNumber = Number(rawTicketNumber);

      if (isNaN(ticketNumber) || ticketNumber === 0) { // Consider 0 also invalid for ticket numbers
        skipped++;
        continue;
      }

      if (seenTicketNumbers.has(ticketNumber)) {
        skipped++;
        console.warn(`⚠️  Linha ${rowNum}: Chamado #${ticketNumber} duplicado no arquivo. Ignorando.`);
        continue;
      }
      seenTicketNumbers.add(ticketNumber);

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

      const result = await prisma.ticket.upsert({
        where: { ticketNumber: ticketNumber },
        update: ticketData,
        create: ticketData,
      });

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        imported++;
      } else {
        updated++;
      }
    } catch (error: any) {
      skipped++;
      console.log(`⚠️  Erro ao importar linha ${rowNum}:`, error.message);
    }
  }

  console.log(`\n✨ Importação concluída!`);
  console.log(`   ✅ Criados: ${imported}`);
  console.log(`   🔄 Atualizados: ${updated}`);
  console.log(`   ⚠️  Ignorados: ${skipped}`);

  return {
    imported,
    updated,
    skipped,
    totalProcessed: data.length
  };
}

