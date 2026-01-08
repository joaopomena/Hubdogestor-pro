export default async function handler(req, res) {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'Chave não configurada na Vercel.' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    try {
        const { contents } = req.body;

        // Modelo Gemini 2.5 Flash conforme sua lista de modelos disponíveis
        const modelName = "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: contents,
                // Grounding: Habilita a IA a navegar e ler o link que você enviar
                tools: [{ google_search: {} }] 
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Erro de conexão com o servidor de IA.' });
    }
}
