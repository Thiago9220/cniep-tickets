// Service para gerenciar relatórios semanais com sistema híbrido (localStorage + API)

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface WeeklyReportData {
  period: string;
  summary: {
    opened: number;
    closed: number;
    backlog: number;
    tma: number;
    tmaGoal: number;
    slaRisk: number;
  };
  dailyVolume: Array<{
    day: string;
    opened: number;
    closed: number;
  }>;
  backlogByUrgency: Array<{
    name: string;
    value: number;
  }>;
}

export interface WeeklyReportResponse {
  id: number;
  weekKey: string;
  period: string;
  data: WeeklyReportData;
  createdAt: string;
  updatedAt: string;
}

class WeeklyReportService {
  /**
   * Busca todos os relatórios semanais do banco
   */
  async fetchAllReports(): Promise<WeeklyReportResponse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/weekly`);
      if (!response.ok) {
        throw new Error('Erro ao buscar relatórios');
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar relatórios semanais:', error);
      return [];
    }
  }

  /**
   * Busca um relatório específico por weekKey
   */
  async fetchReportByWeek(weekKey: string): Promise<WeeklyReportResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/weekly/${weekKey}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Erro ao buscar relatório');
      }
      return await response.json();
    } catch (error) {
      console.error(`Erro ao buscar relatório da semana ${weekKey}:`, error);
      return null;
    }
  }

  /**
   * Salva ou atualiza um relatório semanal
   */
  async saveReport(
    weekKey: string,
    period: string,
    data: WeeklyReportData
  ): Promise<WeeklyReportResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/weekly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekKey,
          period,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar relatório');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao salvar relatório semanal:', error);
      return null;
    }
  }

  /**
   * Deleta um relatório semanal
   */
  async deleteReport(weekKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/weekly/${weekKey}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao deletar relatório semanal:', error);
      return false;
    }
  }

  /**
   * Sincroniza dados do localStorage com o banco de dados
   * Retorna os dados mesclados (prioriza banco, fallback para localStorage)
   */
  async syncWithDatabase(
    localStore: Record<string, WeeklyReportData>
  ): Promise<Record<string, WeeklyReportData>> {
    try {
      // Busca todos os relatórios do banco
      const dbReports = await this.fetchAllReports();

      // Converte para o formato do store
      const dbStore: Record<string, WeeklyReportData> = {};
      dbReports.forEach((report) => {
        dbStore[report.weekKey] = report.data;
      });

      // Mescla: prioriza dados do banco, mas mantém dados locais que não estão no banco
      const mergedStore = { ...localStore };

      // Sobrescreve com dados do banco (mais recentes)
      Object.keys(dbStore).forEach((weekKey) => {
        mergedStore[weekKey] = dbStore[weekKey];
      });

      // Identifica dados que estão apenas no localStorage (novos ou editados)
      const localOnlyWeeks = Object.keys(localStore).filter(
        (weekKey) => !dbStore[weekKey]
      );

      // Salva dados locais que não estão no banco
      for (const weekKey of localOnlyWeeks) {
        const data = localStore[weekKey];
        await this.saveReport(weekKey, data.period, data);
      }

      return mergedStore;
    } catch (error) {
      console.error('Erro ao sincronizar com banco de dados:', error);
      // Em caso de erro, retorna dados locais
      return localStore;
    }
  }

  /**
   * Salva relatório com estratégia híbrida (local + remoto)
   */
  async saveReportHybrid(
    weekKey: string,
    period: string,
    data: WeeklyReportData
  ): Promise<void> {
    // Salva no banco (background, não bloqueia UI)
    this.saveReport(weekKey, period, data).catch((error) => {
      console.error('Erro ao salvar no banco (background):', error);
    });
  }
}

export const weeklyReportService = new WeeklyReportService();
