const http = require('http');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.GEMINI_API_KEY;

const server = http.createServer(async (req, res) => {
    // ROTA DA API
    if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                console.log("Recebida nova mensagem no chat...");
                
                if (!API_KEY || API_KEY === "") {
                    console.error("ERRO: GEMINI_API_KEY nao configurada no Zeabur!");
                    res.writeHead(500);
                    return res.end("Erro: Chave API nao configurada.");
                }

                const parsedBody = JSON.parse(body);
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${API_KEY}`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        contents: parsedBody.contents,
                        system_instruction: parsedBody.system_instruction,
                        tools: [{ google_search: {} }] 
                    })
                });

                if (!response.ok) {
                    const errorMsg = await response.text();
                    console.error("Erro na API do Google:", errorMsg);
                    res.writeHead(500);
                    return res.end("Erro na comunicacao com a IA.");
                }

                res.writeHead(200, { 'Content-Type': 'text/event-stream' });
                response.body.on('data', chunk => res.write(chunk));
                response.body.on('end', () => res.end());

            } catch (error) {
                console.error("Erro interno:", error.message);
                res.writeHead(500);
                res.end("Erro interno no servidor.");
            }
        });
        return;
    }

    // ROTA DO HTML
    const indexPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(indexPath));
    } else {
        res.writeHead(404);
        res.end("Arquivo index.html nao encontrado.");
    }
});

server.listen(PORT, () => console.log(`Servidor GestorHub ativo na porta ${PORT}`));
