const http = require('http');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

const server = http.createServer(async (req, res) => {
    // ROTA DA API (Processa Chat e Análise de LP)
    if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                if (!API_KEY) throw new Error("Chave API ausente nas variaveis do Zeabur");
                const { contents } = JSON.parse(body);
                
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${API_KEY}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents, tools: [{ google_search: {} }] })
                });

                res.writeHead(200, { 'Content-Type': 'text/event-stream' });
                response.body.on('data', chunk => res.write(chunk));
                response.body.on('end', () => res.end());
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }

    // ROTA PARA CARREGAR O SITE (Lê o seu index.html)
    const indexPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(indexPath));
    } else {
        res.writeHead(404);
        res.end("Erro: index.html nao encontrado na raiz do projeto.");
    }
});

server.listen(PORT, () => console.log(`Servidor GestorHub ativo na porta ${PORT}`));
