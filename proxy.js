import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Windows Office Network Fix: 
// Many offices use SSL inspection which breaks Node.js fetch.
// We can disable strict SSL if the user explicitly wants to (at their own risk).
if (process.env.IGNORE_SSL_ERRORS === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('⚠️  SSL Verification: DISABLED (Ignore SSL Errors mode)');
}

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
    
    let advice = 'Check your internet connection.';
    if (process.platform === 'win32' && !process.env.HTTP_PROXY) {
      advice = 'Your Windows system proxy is not visible to Node.js. Try running: set HTTP_PROXY=http://your-proxy-url:port && npm run dev';
    }

    res.status(500).json({
      error: 'Proxy Connection Failed',
      message: error.message,
      code: error.code,
      details: 'This error usually happens when the computer cannot reach the target URL.',
      advice: advice,
      hint: 'If you see "self signed certificate" error, try running with IGNORE_SSL_ERRORS=true'
    });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all for React Router (Works perfectly in Express 5)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 API Proxy running locally on port ${PORT}`);
  console.log(`Individual tool mode: This proxy is independent of any other system.`);
  
  if (process.platform === 'win32' && !process.env.HTTP_PROXY) {
    console.log('\n💡 TIP FOR WINDOWS OFFICE USERS:');
    console.log('If you get 500 errors, your office proxy might be blocking Node.js.');
    console.log('Try this command in Command Prompt:');
    console.log('set IGNORE_SSL_ERRORS=true && npm run dev');
  }
});

