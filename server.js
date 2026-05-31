/**
 * ╔══════════════════════════════════════════════════════╗
 * ║   MAVI TRAVERTIN — PRODUCTION BACKEND               ║
 * ║   Node.js + Express                                 ║
 * ║                                                     ║
 * ║   Himoya:                                           ║
 * ║   ✅ Helmet (HTTP security headers)                 ║
 * ║   ✅ Rate limiting (brute-force)                    ║
 * ║   ✅ CORS (faqat o'z domeningiz)                    ║
 * ║   ✅ /db/ bloklangan                                ║
 * ║   ✅ XSS sanitize                                   ║
 * ║   ✅ Timing-safe login                              ║
 * ║   ✅ Token (8 soat)                                 ║
 * ║   ✅ Input validation                               ║
 * ║   ✅ Error logging                                  ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * O'rnatish:
 *   npm install
 *   node server.js
 *
 * Railway/Render/VPS uchun:
 *   Environment variables orqali sozlang (.env.example ga qarang)
 */

'use strict';

// .env faylni o'qish (mavjud bo'lsa)
try { require('dotenv').config(); } catch { /* dotenv yo'q bo'lsa o'tkazib yuborish */ }

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

/* ============================================================
   SOZLAMALAR
   ============================================================ */
const CFG = {
    adminUser: process.env.ADMIN_USER || 'admin',
    adminPass: process.env.ADMIN_PASS || 'mavi26',
    jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex'),
    tokenTTL: 8 * 60 * 60 * 1000, // 8 soat
    origins: (process.env.ALLOWED_ORIGINS || 'http://localhost:8080')
        .split(',').map(s => s.trim()),
};

// ⚠️ Agar JWT_SECRET env'dan kelmasa — har restart'da token o'chadi
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET .env da yo\'q — serverni qayta ishga tushirsa tokenlar o\'chadi!');
}

/* ============================================================
   HELMET — HTTP xavfsizlik headerlari
   ============================================================ */
try {
    const helmet = require('helmet');
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));
} catch {
    console.log('💡 Ixtiyoriy: npm install helmet');
}

/* ============================================================
   CORS
   ============================================================ */
app.use(cors({
    origin: (origin, cb) => {
        // Server-to-server yoki Postman uchun origin bo'lmasligi mumkin
        if (!origin) return cb(null, true);
        if (CFG.origins.includes(origin) || CFG.origins.includes('*')) {
            return cb(null, true);
        }
        cb(new Error(`CORS: ${origin} ruxsat yo'q`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));

/* ============================================================
   LOGGING
   ============================================================ */
function log(level, msg) {
    const icons = { INFO: '📋', WARN: '⚠️ ', ERROR: '❌', OK: '✅' };
    console.log(`[${new Date().toLocaleString('uz')}] ${icons[level] || ''} ${msg}`);
}

app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        log('INFO', `${req.method} ${req.path} — ${req.ip}`);
    }
    next();
});

/* ============================================================
   RATE LIMITER
   ============================================================ */
const _limits = new Map();

function rateLimit(max, windowMs, msg) {
    return (req, res, next) => {
        const key = (req.ip || 'unknown') + req.path;
        const now = Date.now();
        const r = _limits.get(key) || { n: 0, t: now };
        if (now - r.t > windowMs) {
            r.n = 0;
            r.t = now;
        }
        r.n++;
        _limits.set(key, r);
        if (r.n > max) {
            const sec = Math.ceil((windowMs - (now - r.t)) / 1000);
            log('WARN', `Rate limit: ${req.ip} → ${req.path}`);
            return res.status(429).json({
                error: msg || `Juda ko'p urinish. ${sec} soniya kuting.`
            });
        }
        next();
    };
}

// Eski yozuvlarni tozalash (har 10 daqiqada)
setInterval(() => {
    const now = Date.now();
    for (const [k, v] of _limits) {
        if (now - v.t > 15 * 60 * 1000) _limits.delete(k);
    }
}, 10 * 60 * 1000);

/* ============================================================
   /db/ BLOKLASH
   ============================================================ */
app.use('/db', (_req, res) => {
    res.status(403).json({ error: 'Forbidden' });
});

/* ============================================================
   STATIK FAYLLAR
   ============================================================ */
app.use(express.static(path.join(__dirname), {
    index: 'index.html',
    dotfiles: 'deny', // .env va boshqa nuqtali fayllar berilmaydi
    etag: true,
    maxAge: '1d',
}));

/* ============================================================
   DB HELPERS
   ============================================================ */
const DB = {
    dir: path.join(__dirname, 'db'),
    orders: path.join(__dirname, 'db', 'orders.json'),
    messages: path.join(__dirname, 'db', 'messages.json'),
};

function initDB() {
    if (!fs.existsSync(DB.dir)) fs.mkdirSync(DB.dir, { recursive: true });
    if (!fs.existsSync(DB.orders)) fs.writeFileSync(DB.orders, '[]', 'utf8');
    if (!fs.existsSync(DB.messages)) fs.writeFileSync(DB.messages, '[]', 'utf8');
}
initDB();

function readDB(file) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { log('ERROR', `readDB: ${e.message}`); return []; }
}

function writeDB(file, data) {
    // Atomik yozish — avval vaqtinchalik faylga, keyin almashtirish
    const tmp = file + '.tmp';
    try {
        fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
        fs.renameSync(tmp, file);
    } catch (e) {
        log('ERROR', `writeDB: ${e.message}`);
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
        throw e;
    }
}

function genId() {
    return Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
}

/* ============================================================
   TOKEN
   ============================================================ */
function signToken(user) {
    const payload = { u: user, exp: Date.now() + CFG.tokenTTL, jti: genId() };
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto
        .createHmac('sha256', CFG.jwtSecret)
        .update(data).digest('base64url');
    return `${data}.${sig}`;
}

function verifyToken(token) {
    try {
        const [data, sig] = (token || '').split('.');
        if (!data || !sig) return false;
        const expected = crypto
            .createHmac('sha256', CFG.jwtSecret)
            .update(data).digest('base64url');
        if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
        return Date.now() < payload.exp;
    } catch { return false; }
}

function authMiddleware(req, res, next) {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (verifyToken(token)) return next();
    return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
}

/* ============================================================
   SANITIZE
   ============================================================ */
function s(v, max = 500) {
    if (v == null) return '';
    return String(v)
        .replace(/[<>"'`]/g, c => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '`': '&#x60;' }[c]))
        .trim().slice(0, max);
}

/* ============================================================
   ─── API ROUTES ───
   ============================================================ */
const router = express.Router();

/* health */
router.get('/', (_req, res) => {
    res.json({ ok: true, name: 'Mavi Travertin API', v: '2.0' });
});

/* ── LOGIN ── */
router.post('/login',
    rateLimit(5, 15 * 60 * 1000, 'Juda ko\'p urinish. 15 daqiqa kuting.'),
    (req, res) => {
        const { username = '', password = '' } = req.body;

        // Har ikkisi ham bir xil uzunlikda bo'lmasa timingSafeEqual xato beradi
        const pad = (a, b) => {
            const la = Buffer.from(a),
                lb = Buffer.from(b);
            const len = Math.max(la.length, lb.length);
            return [
                Buffer.concat([la, Buffer.alloc(len - la.length)]),
                Buffer.concat([lb, Buffer.alloc(len - lb.length)]),
            ];
        };

        const [u1, u2] = pad(username, CFG.adminUser);
        const [p1, p2] = pad(password, CFG.adminPass);
        const uOk = crypto.timingSafeEqual(u1, u2);
        const pOk = crypto.timingSafeEqual(p1, p2);

        if (uOk && pOk) {
            log('OK', `Admin kirdi: ${req.ip}`);
            return res.json({ ok: true, token: signToken(username) });
        }
        log('WARN', `Noto'g'ri parol: ${req.ip}`);
        res.status(401).json({ ok: false, error: 'Login yoki parol noto\'g\'ri' });
    }
);

/* ── ORDERS ── */
router.get('/orders', authMiddleware, (_req, res) => {
    res.json(readDB(DB.orders));
});

router.post('/orders',
    rateLimit(20, 60 * 1000),
    (req, res) => {
        const b = req.body || {};
        if (!(b.name || '').trim() || !(b.phone || '').trim() || !(b.product_name || '').trim()) {
            return res.status(400).json({ error: 'Ism, telefon va mahsulot shart' });
        }
        const orders = readDB(DB.orders);
        const item = {
            id: genId(),
            _num: orders.length + 1,
            name: s(b.name),
            phone: s(b.phone, 30),
            product_id: Number(b.product_id) || null,
            product_name: s(b.product_name),
            product_price: s(b.product_price),
            qty: s(b.qty, 50),
            note: s(b.note, 1000),
            status: 'new',
            ip: req.ip,
            created_at: new Date().toISOString(),
        };
        orders.push(item);
        writeDB(DB.orders, orders);
        log('OK', `Buyurtma #${item._num}: ${item.name} — ${item.product_name}`);
        res.status(201).json({ ok: true, id: item.id, num: item._num });
    }
);

router.patch('/orders/:id/done', authMiddleware, (req, res) => {
    const rows = readDB(DB.orders);
    const i = rows.findIndex(o => o.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: 'Topilmadi' });
    rows[i].status = 'done';
    rows[i].done_at = new Date().toISOString();
    writeDB(DB.orders, rows);
    res.json({ ok: true });
});

router.delete('/orders/:id', authMiddleware, (req, res) => {
    const rows = readDB(DB.orders).filter(o => o.id !== req.params.id);
    writeDB(DB.orders, rows);
    res.json({ ok: true });
});

/* ── MESSAGES ── */
router.get('/messages', authMiddleware, (_req, res) => {
    res.json(readDB(DB.messages));
});

router.post('/messages',
    rateLimit(10, 60 * 1000),
    (req, res) => {
        const b = req.body || {};
        if (!(b.name || '').trim() || !(b.phone || '').trim() || !(b.message || '').trim()) {
            return res.status(400).json({ error: 'Ism, telefon va xabar shart' });
        }
        const msgs = readDB(DB.messages);
        const item = {
            id: genId(),
            _num: msgs.length + 1,
            name: s(b.name),
            phone: s(b.phone, 30),
            email: s(b.email, 120),
            message: s(b.message, 2000),
            read: false,
            ip: req.ip,
            created_at: new Date().toISOString(),
        };
        msgs.push(item);
        writeDB(DB.messages, msgs);
        log('OK', `Xabar #${item._num}: ${item.name} — ${item.phone}`);
        res.status(201).json({ ok: true, id: item.id, num: item._num });
    }
);

router.patch('/messages/:id/read', authMiddleware, (req, res) => {
    const rows = readDB(DB.messages);
    const i = rows.findIndex(m => m.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: 'Topilmadi' });
    rows[i].read = true;
    rows[i].read_at = new Date().toISOString();
    writeDB(DB.messages, rows);
    res.json({ ok: true });
});

router.delete('/messages/:id', authMiddleware, (req, res) => {
    const rows = readDB(DB.messages).filter(m => m.id !== req.params.id);
    writeDB(DB.messages, rows);
    res.json({ ok: true });
});

/* ── STATS (admin uchun) ── */
router.get('/stats', authMiddleware, (_req, res) => {
    const orders = readDB(DB.orders);
    const msgs = readDB(DB.messages);
    res.json({
        orders: {
            total: orders.length,
            new: orders.filter(o => o.status === 'new').length,
            done: orders.filter(o => o.status === 'done').length,
        },
        messages: {
            total: msgs.length,
            unread: msgs.filter(m => !m.read).length,
        },
    });
});

app.use('/api', router);

/* ============================================================
   SPA FALLBACK — barcha sahifalar uchun
   ============================================================ */
app.get('*', (req, res) => {
    // /api ga tegishli bo'lmagan 404 lar
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Topilmadi' });
    }
    // HTML sahifalar — mavjud bo'lsa yuborish, bo'lmasa index.html
    const file = path.join(__dirname, req.path);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        return res.sendFile(file);
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

/* ============================================================
   GLOBAL ERROR HANDLER
   ============================================================ */
app.use((err, _req, res, _next) => {
    log('ERROR', err.message);
    res.status(500).json({ error: 'Server xatosi' });
});

/* ============================================================
   START
   ============================================================ */
app.listen(PORT, () => {
    log('OK', `Server ishga tushdi → http://localhost:${PORT}`);
    log('OK', `Admin panel → http://localhost:${PORT}/admin`);
    log('INFO', `Himoya: Rate limit ✅  XSS ✅  /db/ blok ✅  Token ✅`);
});

module.exports = app;