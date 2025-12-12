export class ChatService {
  async generateCompletion(contents: any, generationConfig: any) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não configurada no servidor");
    }

    const fetchWithRetry = async (url: string, options: any, retries = 3, initialDelay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(url, options);
          
          // Se for sucesso ou erro que não deve ser retentado (ex: 400 Bad Request), retorna
          if (res.ok || (res.status !== 429 && res.status !== 503)) {
            return res;
          }

          // Se for o último retry, retorna a resposta de erro
          if (i === retries - 1) return res;

          // Backoff exponencial: 1s, 2s, 4s...
          const delay = initialDelay * Math.pow(2, i);
          console.warn(`Gemini API overloaded/busy (Status ${res.status}). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } catch (error) {
          // Erros de rede também podem ser retentados
          if (i === retries - 1) throw error;
          const delay = initialDelay * Math.pow(2, i);
          console.warn(`Network error calling Gemini. Retrying in ${delay}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      throw new Error("Max retries reached");
    };

    const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig
      }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(errorData.error?.message || `Erro na API do Gemini: ${response.status}`);
    }

    return await response.json();
  }
}

export const chatService = new ChatService();
