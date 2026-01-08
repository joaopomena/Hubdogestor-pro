const http = require('http');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 8080;

// 1. MAPEIA TODAS AS CHAVES DISPONÍVEIS NAS VARIÁVEIS DO ZEABUR
const keys = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_API_KEY // Mantém a antiga como backup
].filter(k => k && k !== ""); // Filtra apenas as que existem

let currentKeyIndex = 0;

const server = http.createServer(async (req, res) => {
    if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                // 2. LÓGICA DE RODÍZIO: SELECIONA A PRÓXIMA CHAVE
                if (keys.length === 0) throw new Error("Nenhuma chave API configurada.");
                
                const API_KEY = keys[currentKeyIndex];
                console.log(`Usando a chave ${currentKeyIndex + 1} de ${keys.length}`);
                
                // Prepara o índice para a próxima rodada
                currentKeyIndex = (currentKeyIndex + 1) % keys.length;

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
                    return res.end("Limite de cota atingido. Tente novamente.");
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

    const indexPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(indexPath));
    } else {
        res.writeHead(404);
        res.end("Arquivo index.html nao encontrado.");
    }
});

server.listen(PORT, () => console.log(`Servidor de Rodízio ativo com ${keys.length} chaves.`));
