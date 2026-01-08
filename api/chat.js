// Permite que a função rode por mais tempo se necessário
export const config = {
    maxDuration: 60, 
};

export default async function handler(req, res) {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'Chave não configurada.' });

    try {
        const { contents } = req.body;
        const model = "gemini-2.5-flash"; 
        // Endpoint de streaming (streamGenerateContent) essencial para não cortar a fala
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                tools: [{ google_search: {} }] // Garante que a IA consiga ler links
            })
        });

        // Configura a resposta como um fluxo de dados contínuo (SSE)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }
        res.end();
    } catch (error) {
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
}
