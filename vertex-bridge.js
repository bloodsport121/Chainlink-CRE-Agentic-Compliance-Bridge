import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { GoogleAuth } from 'google-auth-library';

// --- CONFIGURATION ---
const PORT = 3005; // Changed from 3001 to avoid conflict with Chainlink Skill Hub
const SERVICE_ACCOUNT_PATH = 'C:/users/jmgra/antigravityagents/antigravity-deepseek.json';
const PROJECT_ID = 'n8n-1st-creation';
const LOCATION = 'us-central1';
// Note: DeepSeek on Vertex restricted models uses this specific endpoint
const VERTEX_ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${LOCATION}/endpoints/openapi/chat/completions`;

// --- AUTHENTICATION ---
let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpiry - 60000) {
        return accessToken;
    }

    console.log('🔄 Refreshing Google Access Token...');

    try {
        const auth = new GoogleAuth({
            keyFile: SERVICE_ACCOUNT_PATH,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
        const client = await auth.getClient();
        const tokenResponse = await client.getAccessToken();
        accessToken = tokenResponse.token;
        // Most tokens last 1 hour
        tokenExpiry = Date.now() + 3600000;
        console.log('✅ Token refreshed.');
        return accessToken;
    } catch (err) {
        console.error('❌ Error getting access token:', err.message);
        throw err;
    }
}

// --- SERVER ---
const server = http.createServer(async (req, res) => {
    // Basic CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && (req.url === '/v1/chat/completions' || req.url === '/chat/completions')) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const token = await getAccessToken();
                const vertexReq = https.request(VERTEX_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }, (vertexRes) => {
                    res.writeHead(vertexRes.statusCode, vertexRes.headers);
                    vertexRes.pipe(res);
                });

                vertexReq.on('error', (err) => {
                    console.error('❌ Vertex Request Error:', err.message);
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: err.message }));
                });

                vertexReq.write(body);
                vertexReq.end();
            } catch (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Auth Failed: ' + err.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`\n🚀 DeepSeek-on-Vertex Bridge running at http://localhost:${PORT}`);
    console.log(`📍 Endpoint: /v1/chat/completions`);
    console.log(`🔑 Using Key: ${SERVICE_ACCOUNT_PATH}`);
    console.log(`\nReady for Antigravity connection!\n`);
});
