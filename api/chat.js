// Configuração para permitir que a função rode por mais tempo na Vercel (se o seu plano permitir)
export const config = {
    maxDuration: 60, 
};

export default async function handler(req, res) {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'Chave não configurada no painel da Vercel.' });

    try {
        const { contents } = req.body;
        const modelName = "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: contents,
                // Ajustado para o formato oficial de busca em tempo real
                tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "unspecified" } } }] 
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Erro Google API:", data.error);
            return res.status(400).json({ error: data.error.message });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error("Erro Servidor:", error);
        return res.status(500).json({ error: 'A conexão expirou ou falhou. Tente novamente em instantes.' });
    }
}
