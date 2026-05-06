import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (req.url.startsWith('/proxy')) {
    console.log(`\n--- [${new Date().toLocaleTimeString()}] Proxying ${req.method} to ${req.query.url} ---`);
  }
  next();
});

app.all('/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const headers = { ...req.headers };
    
    // Remove problematic headers
    delete headers.host;
    delete headers.connection;
    delete headers['content-length'];
    
    // Remove headers often injected by corporate proxies that can break targets
    const junkHeaders = ['via', 'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-port', 'x-amzn-trace-id'];
    junkHeaders.forEach(h => delete headers[h]);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const data = await response.text();
    
    // Ensure CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    res.status(response.status).send(data);
    console.log(`Success: ${response.status} ${response.statusText}`);

  } catch (error) {
    console.error('!!! PROXY FETCH FAILED:', error.code, error.message);
    res.status(500).json({
      error: 'Proxy Connection Failed',
      message: error.message,
      code: error.code,
      hint: 'If you are on an office laptop, Node.js might be blocked by the corporate firewall/proxy.'
    });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Api Ninja Pro Server: http://0.0.0.0:${PORT}`);
});

