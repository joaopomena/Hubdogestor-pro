export default async function handler(req, res) {
    // 1. Verifica se a chave existe (Evita crash imediato)
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
        return res.status(500).json({ error: 'Chave GEMINI_API_KEY não configurada na Vercel.' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { contents } = req.body;
        
        // Usando o modelo que você confirmou ter acesso
        const modelName = "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: contents,
                // Habilita a busca para o analisador de LP
                tools: [{ google_search: {} }] 
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error("Erro no servidor:", error);
        return res.status(500).json({ error: 'Falha interna no servidor da API.' });
    }
}
