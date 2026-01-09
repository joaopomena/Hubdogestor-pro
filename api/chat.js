const http = require('http');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 8080;

// 1. MAPEIA TODAS AS CHAVES DISPONÍVEIS
const keys = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_API_KEY
].filter(k => k && k !== "");

let currentKeyIndex = 0;

const server = http.createServer(async (req, res) => {
    if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            const parsedBody = JSON.parse(body);
            let response;
            let attempt = 0;
            const maxAttempts = keys.length;

            // LÓGICA DE TENTATIVA AUTOMÁTICA EM TODAS AS CHAVES
            while (attempt < maxAttempts) {
                const API_KEY = keys[currentKeyIndex];
                console.log(`Tentativa ${attempt + 1}: Usando chave ${currentKeyIndex + 1} de ${keys.length}`);

                try {
                    // Nota: Usando gemini-2.5-flash conforme sua preferência
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${API_KEY}`;

                    response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            contents: parsedBody.contents,
                            system_instruction: parsedBody.system_instruction,
                            tools: [{ google_search: {} }] 
                        })
                    });

                    if (response.ok) {
                        // CHAVE FUNCIONOU: Envia o stream e sai do loop
                        res.writeHead(200, { 'Content-Type': 'text/event-stream' });
                        response.body.on('data', chunk => res.write(chunk));
                        response.body.on('end', () => res.end());
                        return; 
                    } else {
                        // CHAVE FALHOU (Cota ou erro): Passa para a próxima
                        const errorData = await response.text();
                        console.warn(`Chave ${currentKeyIndex + 1} falhou. Tentando próxima...`);
                        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
                        attempt++;
                    }
                } catch (error) {
                    console.error("Erro na requisição:", error.message);
                    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
                    attempt++;
                }
            }

            // SE CHEGAR AQUI, TODAS AS CHAVES FALHARAM
            res.writeHead(500);
            res.end("Todas as chaves da API estao sem cota ou instaveis. Tente novamente em instantes.");
        });
        return;
    }

    // Servir o index.html
    const indexPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(indexPath));
    } else {
        res.writeHead(404);
        res.end("Arquivo index.html nao encontrado.");
    }
});

server.listen(PORT, () => console.log(`Servidor PRO ativo com ${keys.length} chaves e auto-retry.`));
