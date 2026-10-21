const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = url.pathname;

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    let handlerPath = pathname.replace(/\.php$/, '').replace(/^\/api\//, '');
    let file = path.join(__dirname, 'api', `${handlerPath}.js`);
    if (!fs.existsSync(file)) {
      file = path.join(__dirname, 'api', `${handlerPath}.php.js`);
    }

    if (fs.existsSync(file)) {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          if (body) {
            try { req.body = JSON.parse(body); } catch (e) { req.body = body; }
          }
          res.status = (code) => { res.statusCode = code; return res; };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };
          delete require.cache[require.resolve(file)];
          const apiHandler = require(file);
          await apiHandler(req, res);
        } catch (err) {
          console.error(err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  // Static file serving
  if (pathname === '/') pathname = '/index.html';
  let filePath = path.join(__dirname, pathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
}

const server = http.createServer(handler);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚕 Soft Ride server running at http://localhost:${PORT}`);
    console.log(`Managed by Juli Kumari | Contact: +91 9142491242`);
  });
}

module.exports = handler;
module.exports.server = server;
