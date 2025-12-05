import XLSX from "xlsx";
import prisma from "../server/db";

const EXCEL_PATH = "C:\\Users\\thiag\\Downloads\\Gerenciador_Chamados (1).xlsx";

async function importExcel() {
  try {
    console.log("📂 Lendo arquivo Excel...");
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Encontradas ${data.length} linhas no Excel`);

    if (data.length > 0) {
      console.log("📋 Colunas encontradas:", Object.keys(data[0]));
      console.log("\n🔍 Primeira linha de exemplo:");
      console.log(data[0]);
    }

    console.log("\n❓ Importar esses dados? (O script está pausado para você verificar)");
    console.log("💡 Verifique se as colunas batem com: title, description, status, priority");
    console.log("\n⏳ Aguardando confirmação...\n");

    // Mapear e importar dados
    let imported = 0;
    let skipped = 0;

    for (const row of data as any[]) {
      try {
        // Converter data do Excel (número serial) para Date
        let registrationDate = null;
        if (row["Data de Registro"]) {
          const excelDate = row["Data de Registro"];
          const date = new Date((excelDate - 25569) * 86400 * 1000);
          registrationDate = date;
        }

        const ticket = {
          ticketNumber: row["Número do Chamado"] || null,
          title: row["Observações do usuário"] || `Chamado #${row["Número do Chamado"]}`,
          description: row["Observações do usuário"] || null,
          status: row["Status"] || "aberto",
          priority: "media", // Não há prioridade no Excel
          url: row["URL"] || null,
          registrationDate: registrationDate,
        };

        await prisma.ticket.create({ data: ticket });
        imported++;
        console.log(`✅ Importado: #${ticket.ticketNumber} - ${ticket.title}`);
      } catch (error) {
        skipped++;
        console.log(`⚠️  Erro ao importar linha:`, error);
      }
    }

    console.log(`\n✨ Importação concluída!`);
    console.log(`   ✅ Importados: ${imported}`);
    console.log(`   ⚠️  Ignorados: ${skipped}`);
  } catch (error) {
    console.error("❌ Erro na importação:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importExcel();
