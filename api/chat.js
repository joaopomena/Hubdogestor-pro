export const config = {
  runtime: 'edge', // Edge runtime evita o limite de 10s e é melhor para streaming
};

export default async function handler(req) {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) return new Response(JSON.stringify({ error: 'Chave não configurada.' }), { status: 500 });

  try {
    const { contents, system_instruction } = await req.json();
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        system_instruction,
        tools: [{ google_search: {} }]
      })
    });

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro no servidor Edge.' }), { status: 500 });
  }
}
