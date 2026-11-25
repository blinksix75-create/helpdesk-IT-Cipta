/*
  Server Helpdesk Tiket — tanpa library tambahan, cukup Node.js 16 ke atas.

  Jalankan:        node server.js
  Buka di browser: http://localhost:3000   (dari komputer lain: http://IP-SERVER:3000)

  Letakkan server.js di folder yang sama dengan index.html dan app.js
  (atau taruh file web di subfolder "public").
  Data disimpan di data/helpdesk.json, plus salinan harian data/backup-TANGGAL.json (14 hari terakhir).

  Pengaturan lewat environment variable (semuanya opsional):
    PORT=3000                    port server
    HOST=0.0.0.0                 0.0.0.0 = bisa diakses dari komputer lain; 127.0.0.1 = hanya komputer ini
    DATA_DIR=./data              folder penyimpanan data
    HELPDESK_USER / HELPDESK_PASS  bila diisi, seluruh situs meminta username & password (HTTP Basic Auth)
*/
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const AKAR = fs.existsSync(path.join(__dirname, 'public')) ? path.join(__dirname, 'public') : __dirname;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const FILE = path.join(DATA_DIR, 'helpdesk.json');
const USER = process.env.HELPDESK_USER || '';
const PASS = process.env.HELPDESK_PASS || '';
const BATAS_BODY = 100 * 1024 * 1024; // 100 MB (lampiran foto disimpan di dalam data)
const SIMPAN_BACKUP = 14;             // jumlah backup harian yang disimpan

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.map': 'application/json'
};

// ---------- Penyimpanan ----------
fs.mkdirSync(DATA_DIR, { recursive: true });
let simpanan = { rev: 0, data: null };
try {
  const x = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (x && typeof x.rev === 'number') simpanan = { rev: x.rev, data: x.data || null };
} catch (e) { if (e.code !== 'ENOENT') { console.error('Gagal membaca ' + FILE + ': ' + e.message); process.exit(1); } }

function tulis() {
  // backup harian dari versi sebelumnya (sekali per hari)
  if (fs.existsSync(FILE)) {
    const hari = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cad = path.join(DATA_DIR, 'backup-' + hari + '.json');
    if (!fs.existsSync(cad)) {
      fs.copyFileSync(FILE, cad);
      fs.readdirSync(DATA_DIR).filter(f => /^backup-\d{8}\.json$/.test(f)).sort().slice(0, -SIMPAN_BACKUP)
        .forEach(f => fs.unlinkSync(path.join(DATA_DIR, f)));
    }
  }
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(simpanan));
  fs.renameSync(tmp, FILE); // tulis atomik: file tidak pernah setengah jadi
}

// ---------- Utilitas ----------
function kirimJson(res, kode, obj) {
  const b = Buffer.from(JSON.stringify(obj));
  res.writeHead(kode, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': b.length, 'Cache-Control': 'no-store' });
  res.end(b);
}
function sama(a, b) {
  const x = crypto.createHash('sha256').update(a).digest(), y = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(x, y);
}
function izinkan(req, res) {
  if (!USER || !PASS) return true;
  const h = req.headers.authorization || '';
  if (h.startsWith('Basic ')) {
    const t = Buffer.from(h.slice(6), 'base64').toString('utf8'), i = t.indexOf(':');
    if (i >= 0 && sama(t.slice(0, i), USER) & sama(t.slice(i + 1), PASS)) return true;
  }
  res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Helpdesk Tiket", charset="UTF-8"', 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Perlu login');
  return false;
}
function bacaBody(req, res, lanjut) {
  const bagian = []; let total = 0, batal = false;
  req.on('data', c => {
    if (batal) return;
    total += c.length;
    if (total > BATAS_BODY) { batal = true; kirimJson(res, 413, { error: 'Data terlalu besar' }); req.destroy(); return; }
    bagian.push(c);
  });
  req.on('end', () => { if (!batal) lanjut(Buffer.concat(bagian).toString('utf8')); });
  req.on('error', () => {});
}

// ---------- API ----------
function api(req, res, url) {
  if (url.pathname === '/api/rev' && req.method === 'GET') return kirimJson(res, 200, { rev: simpanan.rev });
  if (url.pathname === '/api/data' && req.method === 'GET') return kirimJson(res, 200, { rev: simpanan.rev, data: simpanan.data });
  if (url.pathname === '/api/data' && req.method === 'PUT') {
    return bacaBody(req, res, txt => {
      let b; try { b = JSON.parse(txt); } catch (e) { b = null; }
      if (!b || typeof b.rev !== 'number' || !b.data || !Array.isArray(b.data.tiket) || !Array.isArray(b.data.teknisi))
        return kirimJson(res, 400, { error: 'Format data tidak valid' });
      // Semua di bawah ini berjalan sinkron, jadi dua penyimpanan tidak mungkin saling menimpa.
      if (b.rev !== simpanan.rev) return kirimJson(res, 409, { rev: simpanan.rev, data: simpanan.data });
      simpanan = { rev: simpanan.rev + 1, data: b.data };
      try { tulis(); } catch (e) { simpanan = { rev: b.rev, data: simpanan.data }; console.error('Gagal menulis data:', e.message); return kirimJson(res, 500, { error: 'Gagal menulis ke disk' }); }
      kirimJson(res, 200, { rev: simpanan.rev });
    });
  }
  kirimJson(res, 404, { error: 'Tidak ditemukan' });
}

// ---------- File statis ----------
const DILARANG = new Set(['server.js', 'package.json', 'package-lock.json', 'data', 'node_modules']);
function statis(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let rel; try { rel = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (rel.endsWith('/')) rel += 'index.html';
  const abs = path.normalize(path.join(AKAR, rel));
  const bagian = path.relative(AKAR, abs).split(path.sep);
  if (!abs.startsWith(AKAR) || bagian.some(p => p.startsWith('.') || DILARANG.has(p))) { res.writeHead(404); return res.end('Tidak ditemukan'); }
  fs.stat(abs, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Tidak ditemukan'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': 'no-cache' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(abs).pipe(res);
  });
}

http.createServer((req, res) => {
  if (!izinkan(req, res)) return;
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')) return api(req, res, url);
  statis(req, res, url);
}).listen(PORT, HOST, () => {
  console.log('Helpdesk Tiket berjalan.');
  console.log('  Folder web : ' + AKAR);
  console.log('  Data       : ' + FILE + ' (revisi ' + simpanan.rev + ')');
  console.log('  Login      : ' + (USER && PASS ? 'aktif (HTTP Basic Auth)' : 'TIDAK aktif — siapa pun yang bisa membuka alamat ini bisa mengubah data'));
  console.log('  Alamat     :');
  console.log('    http://localhost:' + PORT);
  Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal)
    .forEach(i => console.log('    http://' + i.address + ':' + PORT));
});
