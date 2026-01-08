export default async function handler(req, res) {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'Chave não encontrada na Vercel.' });

    try {
        const { contents } = req.body;

        // Atualizado para o modelo que apareceu no seu diagnóstico
        // Você pode usar 'gemini-2.5-flash' ou 'gemini-flash-latest'
        const model = "gemini-2.5-flash"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: Array.isArray(contents) ? contents : [{ parts: [{ text: contents }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Erro de conexão no servidor.' });
    }
}
