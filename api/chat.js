export const config = {
  runtime: 'edge', // Bypassa o limite de 10s das funções comuns
};

export default async function handler(req) {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) return new Response('Chave não configurada', { status: 500 });

  try {
    const { contents } = await req.json();
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        tools: [{ google_search: {} }] 
      })
    });

    // Repassa o stream do Google direto para o seu navegador
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (e) {
    return new Response('Erro no Edge', { status: 500 });
  }
}
