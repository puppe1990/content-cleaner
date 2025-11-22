import { GoogleGenAI } from "@google/genai";
import { CleanerResponse } from "../types";

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const cleanContentWithGemini = async (rawInput: string): Promise<CleanerResponse> => {
  if (!rawInput.trim()) {
    throw new Error("O input está vazio.");
  }

  try {
    const model = "gemini-2.5-flash";
    
    const prompt = `
      Você é um especialista em limpeza e extração de dados web (Web Scraping/Cleaning).
      
      Sua tarefa é analisar o seguinte bloco de código (que pode conter HTML, CSS, e JS misturados) e retornar APENAS o conteúdo principal (texto e imagens).
      
      Regras Rígidas:
      1. Remova todo CSS (tags <style>, atributos style inline, links de CSS).
      2. Remova todo JavaScript (tags <script>, atributos de evento como onclick).
      3. Remova elementos estruturais irrelevantes para o conteúdo: menus de navegação (<nav>), rodapés (<footer>), sidebars, anúncios, modais e formulários de contato.
      4. Mantenha a hierarquia semântica do texto principal usando APENAS tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>, <br>.
      5. Mantenha as imagens (<img>) mas remova todas as classes e IDs delas. Mantenha os atributos 'src' e 'alt'.
      6. Se houver URLs relativas em imagens, mantenha-as como estão.
      7. A saída deve ser APENAS o código HTML limpo, sem markdown (nada de \`\`\`html).
      8. Não inclua <html>, <head> ou <body>. Apenas o fragmento de conteúdo.

      Código para limpar:
      ${rawInput}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    const text = response.text;

    if (!text) {
      throw new Error("Não foi possível gerar uma resposta do modelo.");
    }

    // Clean up any accidental markdown code blocks if the model ignores instruction 7
    const cleanedText = text.replace(/^```html\n?/, '').replace(/\n?```$/, '');

    return {
      cleanedHtml: cleanedText
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Falha ao processar o conteúdo com Gemini.");
  }
};