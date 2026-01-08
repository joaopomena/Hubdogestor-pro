export default async function handler(req, res) {
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'Variável GEMINI_API_KEY não configurada na Vercel.' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Apenas POST permitido' });
    }

    try {
        const { contents, system_instruction } = req.body;

        // Mudança crucial: Usando endpoint /v1/ e o modelo gemini-1.5-flash-latest
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction,
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800,
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Erro da API Google:", data.error);
            return res.status(data.error.code || 400).json({ error: data.error.message });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error("Erro interno na função:", error);
        return res.status(500).json({ error: 'Falha na comunicação com o servidor de IA.' });
    }
}
