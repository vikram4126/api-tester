import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Log environment details for debugging
console.log('--- SYSTEM INFO ---');
console.log('Node Version:', process.version);
console.log('Platform:', process.platform);
console.log('HTTP_PROXY:', process.env.HTTP_PROXY || 'Not Set');
console.log('HTTPS_PROXY:', process.env.HTTPS_PROXY || 'Not Set');
console.log('-------------------\n');

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (req.url.startsWith('/proxy')) {
    const target = req.query.url;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} -> ${target}`);
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
    
    // Remove headers that might interfere with the target server
    delete headers.host;
    delete headers.connection;
    delete headers['content-length'];
    delete headers.origin;
    delete headers.referer;
    
    // Some APIs require specific headers or reject others
    const junkHeaders = ['via', 'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-port', 'x-amzn-trace-id', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform'];
    junkHeaders.forEach(h => delete headers[h]);

    const fetchOptions = {
      method: req.method,
      headers: headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
      // In Node.js environment, we might need to handle self-signed certs in corporate networks
      // but 'fetch' API in Node 18+ doesn't have an easy way to disable TLS validation without an agent.
    };

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();
    
    // Pass along the status code and content type
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    // Standard CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    res.status(response.status).send(data);
    
    if (response.status >= 400) {
      console.warn(`Target returned ${response.status}: ${response.statusText}`);
    }

  } catch (error) {
    console.error('!!! PROXY ERROR:', error.message);
    if (error.code) console.error('Error Code:', error.code);
    
    res.status(500).json({
      error: 'Proxy Connection Failed',
      message: error.message,
      code: error.code,
      details: 'This error usually happens when the computer cannot reach the target URL. If you are on an office network, your company firewall might be blocking Node.js from making external requests.',
      suggestion: 'Try setting the HTTP_PROXY environment variable if your office uses a proxy.'
    });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 API Proxy running locally on port ${PORT}`);
  console.log(`Individual tool mode: This proxy is independent of any other system.`);
});

