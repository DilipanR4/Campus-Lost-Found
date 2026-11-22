const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'items.txt');
const USERS_FILE = path.join(DATA_DIR, 'users.txt');

const allowedCategories = ['Electronics', 'ID Card', 'Books', 'Keys', 'Bag', 'Clothing', 'Accessories', 'Other'];
const allowedTypes = ['lost', 'found'];
const allowedStatuses = ['active', 'returned'];
const sessions = new Map();

// Demo users are stored in a TXT file so the project is easy to understand.
// In a real production system, passwords must be hashed and sessions stored securely.
const defaultUsers = [
  { username: 'student1', password: 'student123', role: 'student', name: 'Student User' },
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Campus Administrator' }
];

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '', 'utf8');
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, defaultUsers.map((user) => JSON.stringify(user)).join('\n') + '\n', 'utf8');
  }
}

function readJsonLines(file) {
  ensureDataFiles();
  const text = fs.readFileSync(file, 'utf8').trim();
  if (!text) return [];
  return text.split('\n').filter(Boolean).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}

function readItems() { return readJsonLines(DATA_FILE); }
function readUsers() { return readJsonLines(USERS_FILE); }

function writeItems(items) {
  ensureDataFiles();
  const text = items.map((item) => JSON.stringify(item)).join('\n');
  fs.writeFileSync(DATA_FILE, text ? `${text}\n` : '', 'utf8');
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        reject(new Error('Request body is too large.'));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON data.')); }
    });
    req.on('error', reject);
  });
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : '';
}

function validateItem(input) {
  const item = {
    type: cleanText(input.type, 10).toLowerCase(),
    title: cleanText(input.title, 80),
    category: cleanText(input.category, 30),
    description: cleanText(input.description, 500),
    location: cleanText(input.location, 100),
    date: cleanText(input.date, 10),
    contact: cleanText(input.contact, 100)
  };

  const errors = [];
  if (!allowedTypes.includes(item.type)) errors.push('Choose Lost or Found.');
  if (item.title.length < 3) errors.push('Item name must contain at least 3 characters.');
  if (!allowedCategories.includes(item.category)) errors.push('Choose a valid category.');
  if (item.description.length < 10) errors.push('Description must contain at least 10 characters.');
  if (item.location.length < 2) errors.push('Location is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) errors.push('Enter a valid date.');
  if (Number.isNaN(Date.parse(`${item.date}T00:00:00`))) errors.push('Enter a real date.');
  if (item.contact.length < 5) errors.push('Contact information is required.');
  return { item, errors };
}

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie || '';
  header.split(';').forEach((part) => {
    const index = part.indexOf('=');
    if (index > -1) cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  });
  return cookies;
}

function getCurrentUser(req) {
  const token = parseCookies(req).session;
  return token ? sessions.get(token) : null;
}

function requireAuth(req, res) {
  const user = getCurrentUser(req);
  if (!user) {
    sendJson(res, 401, { message: 'Please log in first.' });
    return null;
  }
  return user;
}

function requireRole(req, res, roles) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (!roles.includes(user.role)) {
    sendJson(res, 403, { message: 'You do not have permission for this action.' });
    return null;
  }
  return user;
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    username: user.username,
    role: user.role,
    name: user.name
  });
  return token;
}

function handleApi(req, res, parsedUrl) {
  // Login is the only API route that does not require an existing session.
  if (req.method === 'POST' && parsedUrl.pathname === '/api/login') {
    return readRequestBody(req).then((body) => {
      const username = cleanText(body.username, 50);
      const password = typeof body.password === 'string' ? body.password : '';
      const user = readUsers().find((candidate) => candidate.username === username && candidate.password === password);
      if (!user) return sendJson(res, 401, { message: 'Invalid username or password.' });

      const token = createSession(user);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Set-Cookie': `session=${token}; HttpOnly; SameSite=Lax; Path=/`
      });
      return res.end(JSON.stringify({ message: 'Login successful.', user: { username: user.username, name: user.name, role: user.role } }));
    }).catch((error) => sendJson(res, 400, { message: error.message }));
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/logout') {
    const token = parseCookies(req).session;
    if (token) sessions.delete(token);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': 'session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
    });
    return res.end(JSON.stringify({ message: 'Logged out.' }));
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/me') {
    const user = getCurrentUser(req);
    if (!user) return sendJson(res, 401, { message: 'Not logged in.' });
    return sendJson(res, 200, { user });
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/items') {
    const user = requireAuth(req, res);
    if (!user) return;
    let items = readItems().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // Students can browse campus reports, but the API also tells the frontend which
    // reports belong to the logged-in user so only owners/admins get management controls.
    items = items.map((item) => ({ ...item, isOwner: item.ownerUsername === user.username }));
    return sendJson(res, 200, { items });
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/items') {
    const user = requireRole(req, res, ['student', 'admin']);
    if (!user) return;
    return readRequestBody(req).then((body) => {
      const { item, errors } = validateItem(body);
      if (errors.length) return sendJson(res, 400, { message: errors.join(' ') });

      const newItem = {
        id: crypto.randomUUID(),
        ...item,
        ownerUsername: user.username,
        ownerName: user.name,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      const items = readItems();
      items.push(newItem);
      writeItems(items);
      return sendJson(res, 201, { message: 'Item reported successfully.', item: newItem });
    }).catch((error) => sendJson(res, 400, { message: error.message }));
  }

  const statusMatch = parsedUrl.pathname.match(/^\/api\/items\/([^/]+)\/status$/);
  if (req.method === 'PUT' && statusMatch) {
    const user = requireAuth(req, res);
    if (!user) return;
    return readRequestBody(req).then((body) => {
      const status = cleanText(body.status, 20).toLowerCase();
      if (!allowedStatuses.includes(status)) return sendJson(res, 400, { message: 'Invalid status.' });

      const items = readItems();
      const index = items.findIndex((item) => item.id === statusMatch[1]);
      if (index === -1) return sendJson(res, 404, { message: 'Item not found.' });

      const item = items[index];
      if (user.role !== 'admin' && item.ownerUsername !== user.username) {
        return sendJson(res, 403, { message: 'Students can only update their own reports.' });
      }

      items[index].status = status;
      items[index].updatedAt = new Date().toISOString();
      writeItems(items);
      return sendJson(res, 200, {
        message: status === 'returned' ? 'Item marked as returned.' : 'Item reopened.',
        item: items[index]
      });
    }).catch((error) => sendJson(res, 400, { message: error.message }));
  }

  return false;
}

function serveStatic(req, res, parsedUrl) {
  let pathname = decodeURIComponent(parsedUrl.pathname);
  if (pathname === '/') pathname = '/index.html';

  const safePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(safePath, (error, stats) => {
    if (error || !stats.isFile()) {
      const fallback = path.join(PUBLIC_DIR, 'index.html');
      return fs.readFile(fallback, (fallbackError, content) => {
        if (fallbackError) {
          res.writeHead(500);
          return res.end('Server error');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(content);
      });
    }

    const ext = path.extname(safePath).toLowerCase();
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(safePath).pipe(res);
  });
}

ensureDataFiles();

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (parsedUrl.pathname.startsWith('/api/')) {
    Promise.resolve(handleApi(req, res, parsedUrl)).catch((error) => {
      console.error(error);
      if (!res.headersSent) sendJson(res, 500, { message: 'Unexpected server error.' });
    });
    return;
  }

  // Protect the main application page. Login page remains public.
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/index.html') {
    if (!getCurrentUser(req)) {
      res.writeHead(302, { Location: '/login.html' });
      return res.end();
    }
  }

  serveStatic(req, res, parsedUrl);
});

server.listen(PORT, () => {
  console.log(`Campus Lost & Found is running at http://localhost:${PORT}`);
  console.log('Demo student: student1 / student123');
  console.log('Demo admin:   admin / admin123');
});
