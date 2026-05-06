import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// Logging middleware to help debug connectivity issues
app.use((req, res, next) => {
  if (req.url.startsWith('/proxy')) {
    console.log(`[${new Date().toISOString()}] Proxy Request: ${req.method} ${req.url}`);
  }
  next();
});

// A simple proxy route
app.use('/proxy', (req, res, next) => {
  let targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing targetUrl parameter (?url=https://api.example.com)' });
  }

  // Ensure the target URL has a protocol
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    // Check if it looks like a domain or localhost
    if (targetUrl.includes('.') || targetUrl.startsWith('localhost')) {
        targetUrl = 'https://' + targetUrl;
        console.log(`Auto-prefixed protocol: ${targetUrl}`);
    } else {
        return res.status(400).json({ error: 'Invalid target URL. Must start with http:// or https://' });
    }
  }

  try {
    const urlObj = new URL(targetUrl);
    
    const proxy = createProxyMiddleware({
      target: urlObj.origin,
      changeOrigin: true,
      pathRewrite: (path, req) => {
        // Return the full path including search params from the targetUrl
        return urlObj.pathname + urlObj.search;
      },
      onProxyRes: (proxyRes, req, res) => {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = '*';
        proxyRes.headers['Access-Control-Allow-Headers'] = '*';
      },
      onError: (err, req, res) => {
        console.error('Proxy Error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Proxy Error', 
          message: err.message,
          target: targetUrl 
        }));
      }
    });

    return proxy(req, res, next);
  } catch (e) {
    console.error('URL Parsing Error:', e.message);
    return res.status(400).json({ error: 'Invalid target URL format', details: e.message });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve index.html for any other request (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Listen on all interfaces (0.0.0.0) so it's accessible over the network
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    console.log(`API Proxy available at http://0.0.0.0:${PORT}/proxy`);
});

