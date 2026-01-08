export default async function handler(req, res) {
    const API_KEY = process.env.GEMINI_API_KEY;

    // Log para você ver no painel da Vercel se a chave foi lida
    if (!API_KEY) {
        console.error("ERRO: A variável GEMINI_API_KEY não foi encontrada nas configurações da Vercel.");
        return res.status(500).json({ error: 'Chave API não configurada na Vercel.' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { contents, system_instruction } = req.body;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ system_instruction, contents })
        });

        const data = await response.json();

        // Se o Google retornar erro, repassamos para o seu log
        if (data.error) {
            console.error("Erro do Google Gemini:", data.error);
            return res.status(400).json({ error: data.error.message });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error("Erro na Função:", error);
        return res.status(500).json({ error: 'Falha interna na conexão.' });
    }
}
