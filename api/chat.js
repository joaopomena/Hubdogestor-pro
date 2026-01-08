const http = require('http');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

const server = http.createServer(async (req, res) => {
    // 1. Rota para o Chat e Analisador (API)
    if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { contents, system_instruction } = JSON.parse(body);
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

                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });

                response.body.on('data', chunk => {
                    res.write(chunk);
                });

                response.body.on('end', () => {
                    res.end();
                });

            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Erro no servidor' }));
            }
        });
        return;
    }

    // 2. Rota para carregar o seu index.html original (Interface)
    let filePath = path.join(__dirname, '../index.html');
    if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, 'index.html'); // Tenta na pasta atual se falhar
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end("Erro: index.html nao encontrado na raiz do projeto.");
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
