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

// A simple proxy route
app.use('/proxy', (req, res, next) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing standard targetUrl parameter (?url=https://api.example.com)' });
  }

  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    ignorePath: true, // Don't append /proxy to the target
    // We rewrite the path to send to the target
    pathRewrite: (path, req) => '',
    onProxyRes: (proxyRes, req, res) => {
      // Add CORS headers so the React app can read the response
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = '*';
      proxyRes.headers['Access-Control-Allow-Headers'] = '*';
    },
    onError: (err, req, res) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });

  return proxy(req, res, next);
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve index.html for any other request (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`API Proxy available at http://localhost:${PORT}/proxy`);
});
