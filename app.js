/* kredit-maliki: Template oleh Maliki Saputra (@malikisaputra) — https://malikisaputra.biz.id. Lisensi Nonkomersial Maliki Studio: wajib kredit, dilarang dijual (lihat LICENSE). */
2
/* Helpdesk Tiket IT — tiket IT support dengan prioritas, level eskalasi L1–L3, SLA, utas, dan notifikasi WhatsApp.
3
   HTML/CSS/JS murni, data di localStorage. Dibuat oleh Maliki Studio — malikisaputra.biz.id (Lisensi Nonkomersial Maliki Studio).
4
   Peta kode: lihat .claude/skills/ubah-helpdesk-tiket/SKILL.md */
5
(function () {
6
  'use strict';
7
  // ---- Data bersama lewat Supabase (isi dua baris ini; kosongkan bila tidak dipakai) ----
8
  var SUPABASE_URL = 'https://zvfgecbwxtssofoaltpg.supabase.co';   // contoh: 'https://abcdefgh.supabase.co'
9
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZmdlY2J3eHRzc29mb2FsdHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1ODc3OTEsImV4cCI6MjExMTE2Mzc5MX0.wvC6FWfKgZgbk0cSsSgmukLBp5SWg4mmmWeF6BPVoYA';   // kunci 'anon' / 'publishable' dari Supabase: Project Settings > API
10
  var KUNCI = 'helpdeskTiket.v1';
11
  var KUNCI_SESI = 'helpdeskTiket.sesi';
12
  var VERSI = 2;
13
  // OPSIONAL: URL webhook perantara (Google Apps Script / Cloudflare Worker) yang meneruskan ke gateway WA
14
  // (Fonnte / WhatsApp Cloud API). Kosong = hanya tombol wa.me. Panduan & contoh kode: README bagian "Kirim WA otomatis".
15
  // JANGAN taruh token gateway di sini — token disimpan di server perantara.
16
  var WEBHOOK_WA = '';
17
  // ---------- KONFIG GAMBAR (ganti logo & foto di sini) ----------
18
  // Timpa berkas di folder img/ atau ubah path/URL di bawah. Gagal dimuat = kembali ke ikon/inisial.
19
  var KONFIG = {
20
    logo: 'img/logo.svg',                    // logo di header & sidebar (persegi, mis. 256×256)
21
    avatar: {                                // foto agen/pelapor per nama persis (persegi, mis. 96×96)
22
      'Dimas Pratama': 'img/avatar-agen.svg'
23
    },
24
    avatarPelapor: ''                        // foto default semua pelapor, mis. 'img/avatar-pelapor.svg'; kosong = inisial
25
  };
26
  var NAMA_TEMA = (window.TEMA && window.TEMA.nama) || 'IT Support';
27

28
  function pasangLogo() {
29
    if (!KONFIG.logo) return;
30
    Array.prototype.forEach.call(document.querySelectorAll('.merek .logo'), function (el) {
31
      var asli = el.innerHTML, img = new Image();
32
      img.alt = ''; img.onload = function () { el.classList.add('ada-gambar'); el.innerHTML = ''; el.appendChild(img); };
33
      img.onerror = function () { el.innerHTML = asli; };
34
      img.src = KONFIG.logo;
35
    });
36
  }
37
  pasangLogo();
38

39
  // ---------- Utilitas ----------
40
  var $ = function (s, r) { return (r || document).querySelector(s); };
41
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
42
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
43
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
44
  function dua(n) { return (n < 10 ? '0' : '') + n; }
45
  function ikon(n) { return '<svg aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
46
  var HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
47
  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
48
  var kurangGerak = matchMedia('(prefers-reduced-motion: reduce)').matches;
49
  var JAM = 3600e3, MENIT = 60e3;
50
  function tglPendek(t) { var d = new Date(t); return d.getDate() + ' ' + BULAN[d.getMonth()] + ', ' + dua(d.getHours()) + '.' + dua(d.getMinutes()); }
51
  function tglPanjang(t) { var d = new Date(t); return HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear() + ' ' + dua(d.getHours()) + '.' + dua(d.getMinutes()); }
52
  function lalu(t) {
53
    var s = (Date.now() - new Date(t)) / 1000;
54
    if (s < 60) return 'baru saja'; if (s < 3600) return Math.floor(s / 60) + ' mnt lalu';
55
    if (s < 86400) return Math.floor(s / 3600) + ' jam lalu'; if (s < 172800) return 'kemarin';
56
    return Math.floor(s / 86400) + ' hari lalu';
57
  }
58
  function durasi(ms) {
59
    ms = Math.abs(ms); var m = Math.floor(ms / MENIT), j = Math.floor(m / 60), h = Math.floor(j / 24);
60
    if (h >= 1) return h + 'h ' + (j % 24) + 'j';
61
    if (j >= 1) return j + 'j ' + dua(m % 60) + 'm';
62
    var d = Math.floor(ms / 1000) % 60; return m + ':' + dua(d);
63
  }
64
  function avaHtml(n, kecil) {
65
    var src = KONFIG.avatar[n] || '';
66
    if (!src && KONFIG.avatarPelapor && !(typeof D !== 'undefined' && D && (D.teknisi || []).some(function (q) { return q.nama === n; }))) src = KONFIG.avatarPelapor;
67
    var ini = inisial(n);
68
    return '<span class="ava' + (kecil ? ' kecil' : '') + '" aria-hidden="true">' + (src ? '<img src="' + esc(src) + '" alt="" onerror="this.parentNode.textContent=\'' + esc(ini) + '\'">' : ini) + '</span>';
69
  }
70
  function inisial(n) { return String(n || '?').split(/\s+/).map(function (x) { return x[0]; }).join('').slice(0, 2).toUpperCase(); }
71

72
  // ---------- Konstanta ----------
73
  var PRIORITAS = [
74
    { k: 'rendah', n: 'Rendah', ket: 'Tidak menghambat kerja' },
75
    { k: 'sedang', n: 'Sedang', ket: 'Sebagian kerja terganggu' },
76
    { k: 'tinggi', n: 'Tinggi', ket: 'Kerja satu divisi terhenti' },
77
    { k: 'kritis', n: 'Kritis', ket: 'Operasional perusahaan lumpuh' }
78
  ];
79
  var STATUS = [
80
    { k: 'baru', n: 'Baru', warna: 'var(--utama-teks-di-kartu)' },
81
    { k: 'dikerjakan', n: 'Dikerjakan', warna: 'var(--p-sedang)' },
82
    { k: 'menunggu', n: 'Menunggu', warna: 'var(--p-tinggi)' },
83
    { k: 'selesai', n: 'Selesai', warna: 'var(--ok)' }
84
  ];
85
  var LEVEL = [
86
    { k: 'L1', n: 'Helpdesk', ket: 'Penanganan awal' },
87
    { k: 'L2', n: 'Teknisi senior', ket: 'Masalah teknis lanjut' },
88
    { k: 'L3', n: 'Spesialis', ket: 'Server, vendor, sistem inti' }
89
  ];
90
  function pri(k) { return PRIORITAS.filter(function (p) { return p.k === k; })[0] || PRIORITAS[1]; }
91
  function sts(k) { return STATUS.filter(function (s) { return s.k === k; })[0] || STATUS[0]; }
92

93
  // ---------- Data ----------
94
  // Skema: { versi, urut, hpAdmin, pin:{admin,teknisi}, sla:{rendah,sedang,tinggi,kritis} (menit),
95
  //   divisi:[..], kategori:[..], teknisi:[{id,nama,hp,level}], namaAdmin (nama koordinator IT),
96
  //   tiket:[{id,no,dibuat,judul,pelapor,hp,divisi,kategori,deskripsi,prioritas,level,status,teknisiId,tenggat,selesai,lampiran:[dataURL],
97
  //           utas:[{id,t,jenis:'pesan'|'peristiwa',oleh,peran,teks,ikon,lampiran}]}] }
98
  // Divisi bawaan (v2). DIVISI_LAMA dipakai migrasi: hanya diganti bila daftar pengguna masih persis bawaan lama.
99
  var DIVISI_BARU = ['KPR', 'CS', 'Kasir', 'Finance', 'Accounting', 'LEGAL', 'IT', 'Admin', 'Marketing'];
100
  var DIVISI_V2_AWAL = ['KPR', 'CS', 'Kasir', 'Finance', 'Accounting']; // daftar bawaan sebelum LEGAL ditambahkan
101
  var DIVISI_LAMA = ['Keuangan', 'HRD', 'Pemasaran', 'Gudang', 'Produksi', 'Front Office', 'Direksi'];
102
  // Pemetaan divisi lama -> baru, khusus untuk data contoh
103
  var PETA_DIVISI = { 'Keuangan': 'Finance', 'HRD': 'Accounting', 'Pemasaran': 'KPR', 'Gudang': 'Kasir', 'Produksi': 'KPR', 'Front Office': 'CS', 'Direksi': 'Accounting' };
104
  function dataKosong() {
105
    return {
106
      versi: VERSI, urut: 0, hpAdmin: '089623092342', namaAdmin: 'Masri', pin: { admin: '1234', teknisi: '1111' },
107
      sla: { rendah: 72 * 60, sedang: 24 * 60, tinggi: 8 * 60, kritis: 2 * 60 },
108
      divisi: DIVISI_BARU.slice(),
109
      kategori: ['Hardware', 'Software', 'Jaringan & Internet', 'Printer', 'Email & Akun', 'Akses ERP', 'CCTV & Telepon'],
110
      teknisi: [], tiket: []
111
    };
112
  }
113
  // Gambar lampiran contoh: SVG buatan sendiri (tangkapan layar pesan galat fiktif)
114
  function svgContoh(judul, warna) {
115
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#e8ecef"/><rect x="0" y="0" width="640" height="36" fill="#2b3640"/><circle cx="20" cy="18" r="6" fill="#ff6159"/><circle cx="40" cy="18" r="6" fill="#ffbd2e"/><circle cx="60" cy="18" r="6" fill="#28c941"/>' +
116
      '<rect x="150" y="110" width="340" height="180" rx="12" fill="#fff" stroke="#c9d1d8"/><circle cx="196" cy="160" r="20" fill="' + warna + '"/><path d="M196 150v12M196 168v1" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
117
      '<text x="230" y="156" font-family="Arial" font-size="17" font-weight="700" fill="#1d2329">' + judul + '</text><text x="230" y="178" font-family="Arial" font-size="13" fill="#5b6670">Kode galat 0x8007 — hubungi admin</text>' +
118
      '<rect x="380" y="240" width="90" height="32" rx="8" fill="#2b6cb0"/><text x="410" y="261" font-family="Arial" font-size="13" fill="#fff">OK</text></svg>';
119
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
120
  }
121
  function dataContoh() {
122
    var d = dataKosong(), kini = Date.now();
123
    d.hpAdmin = '089623092342';
124
    d.namaAdmin = 'Masri';
125
    d.teknisi = [
126
      { id: 't1', nama: 'Dimas Pratama', hp: '081234500111', level: 'L1' },
127
      { id: 't2', nama: 'Siti Nurhaliza', hp: '081234500122', level: 'L1' },
128
      { id: 't3', nama: 'Arif Hidayat', hp: '081234500133', level: 'L2' },
129
      { id: 't4', nama: 'Yoga Saputra', hp: '081234500144', level: 'L2' },
130
      { id: 't5', nama: 'Bambang Wijaya', hp: '081234500155', level: 'L3' }
131
    ];
132
    // [jam lalu dibuat, judul, pelapor, divisi, kategori, prioritas, level, status, teknisi, jam kerja sampai selesai, deskripsi]
133
    var c = [
134
      [1.2, 'Server ERP tidak bisa diakses semua cabang', 'Hendra Kusuma', 'Keuangan', 'Akses ERP', 'kritis', 'L3', 'dikerjakan', 't5', 0, 'Sejak jam 8 pagi login ERP muncul "Connection timed out". Semua cabang kena, transaksi kasir tertahan.'],
135
      [2.6, 'Internet kantor lantai 3 mati total', 'Maya Anggraini', 'Pemasaran', 'Jaringan & Internet', 'kritis', 'L2', 'baru', 't3', 0, 'Wi-Fi dan LAN di lantai 3 tidak ada koneksi. Meeting online dengan klien jam 10.'],
136
      [5.5, 'Printer gudang macet, label pengiriman tertunda', 'Joko Susilo', 'Gudang', 'Printer', 'tinggi', 'L1', 'dikerjakan', 't1', 0, 'Printer label Zebra berkedip merah, kertas tersangkut. Sudah coba matikan-nyalakan.'],
137
      [9, 'Email tidak bisa kirim lampiran besar', 'Rina Wulandari', 'HRD', 'Email & Akun', 'sedang', 'L1', 'menunggu', 't2', 0, 'Lampiran PDF 18 MB selalu gagal terkirim. Menunggu konfirmasi batas ukuran dari vendor email.'],
138
      [10.5, 'Laptop lambat setelah update Windows', 'Fajar Nugroho', 'Pemasaran', 'Software', 'tinggi', 'L2', 'dikerjakan', 't4', 0, 'Setelah update semalam laptop butuh 10 menit untuk menyala dan Excel sering not responding.'],
139
      [20, 'Minta akses folder bersama Laporan Pajak', 'Dewi Lestari', 'Keuangan', 'Akses ERP', 'rendah', 'L1', 'baru', '', 0, 'Mohon dibuatkan akses baca-tulis ke folder \\\\NAS\\Keuangan\\Pajak2026.'],
140
      [27, 'Telepon ekstensi resepsionis tidak berdering', 'Putri Ayu', 'Front Office', 'CCTV & Telepon', 'sedang', 'L1', 'baru', 't1', 0, 'Ekstensi 101 bisa menelepon keluar tapi panggilan masuk tidak berdering.'],
141
      [30, 'Monitor kedua berkedip', 'Agus Salim', 'Produksi', 'Hardware', 'rendah', 'L1', 'menunggu', 't2', 0, 'Monitor kedua berkedip setiap beberapa menit. Menunggu kabel HDMI pengganti.'],
142
      [34, 'CCTV area parkir offline', 'Slamet Riyadi', 'Direksi', 'CCTV & Telepon', 'tinggi', 'L2', 'selesai', 't3', 5, 'Empat kamera parkir tidak tampil di NVR sejak listrik padam.'],
143
      [50, 'Lupa kata sandi email', 'Nadia Putri', 'Pemasaran', 'Email & Akun', 'sedang', 'L1', 'selesai', 't1', 0.6, 'Akun terkunci setelah salah kata sandi 5 kali.'],
144
      [75, 'Install aplikasi desain untuk anak magang', 'Rizky Ramadhan', 'Pemasaran', 'Software', 'rendah', 'L1', 'selesai', 't2', 20, 'Dua laptop magang perlu aplikasi desain dan font perusahaan.'],
145
      [98, 'Wi-Fi tamu sering putus', 'Putri Ayu', 'Front Office', 'Jaringan & Internet', 'sedang', 'L2', 'selesai', 't4', 30, 'Tamu mengeluh Wi-Fi lobi putus-nyambung.'],
146
      [126, 'Mesin absensi tidak sinkron ke HRIS', 'Rina Wulandari', 'HRD', 'Akses ERP', 'tinggi', 'L3', 'selesai', 't5', 11, 'Data absensi 3 hari terakhir tidak masuk ke HRIS.'],
147
      [150, 'Keyboard kasir beberapa tombol mati', 'Joko Susilo', 'Gudang', 'Hardware', 'rendah', 'L1', 'selesai', 't1', 26, 'Tombol angka 4 dan 7 tidak berfungsi.'],
148
      [200, 'Jaringan server mati saat hujan deras', 'Hendra Kusuma', 'Keuangan', 'Jaringan & Internet', 'kritis', 'L3', 'selesai', 't5', 1.6, 'Switch utama mati, seluruh kantor tanpa jaringan.'],
149
      [244, 'Printer warna hasil bergaris', 'Maya Anggraini', 'Pemasaran', 'Printer', 'sedang', 'L1', 'selesai', 't2', 19, 'Cetakan brosur bergaris biru di tengah halaman.'],
150
      [290, 'Akun ERP karyawan baru', 'Dewi Lestari', 'Keuangan', 'Akses ERP', 'sedang', 'L1', 'selesai', 't1', 6, 'Mohon dibuatkan akun ERP untuk 2 staf baru.'],
151
      [320, 'UPS ruang server bunyi terus', 'Slamet Riyadi', 'Direksi', 'Hardware', 'tinggi', 'L2', 'selesai', 't3', 9.5, 'UPS berbunyi bip tiap 30 detik, indikator baterai merah.']
152
    ];
153
    c.forEach(function (x, i) {
154
      var dibuat = kini - x[0] * JAM, t = {
155
        id: 'k' + i, no: '', dibuat: new Date(dibuat).toISOString(), judul: x[1], pelapor: x[2], hp: '08571200' + dua(10 + i) + '0' + (i % 10), divisi: PETA_DIVISI[x[3]] || x[3], kategori: x[4],
156
        deskripsi: x[10], prioritas: x[5], level: x[6], status: x[7], teknisiId: x[8], tenggat: new Date(dibuat + d.sla[x[5]] * MENIT).toISOString(), selesai: null, lampiran: [], utas: []
157
      };
158
      if (i === 0) t.lampiran = [svgContoh('Connection timed out', '#d64545')];
159
      if (i === 2) t.lampiran = [svgContoh('Printer error: paper jam', '#e0a020')];
160
      var tek = d.teknisi.filter(function (q) { return q.id === t.teknisiId; })[0];
161
      var jejak = function (jamSetelah, jenis, oleh, peran, teks, ik) { t.utas.push({ id: uid(), t: new Date(dibuat + jamSetelah * JAM).toISOString(), jenis: jenis, oleh: oleh, peran: peran, teks: teks, ikon: ik }); };
162
      jejak(0, 'pesan', t.pelapor, 'Pelapor', t.deskripsi);
163
      if (tek) jejak(0.05, 'peristiwa', 'Sistem', '', 'Ditugaskan ke <b>' + esc(tek.nama) + '</b> (' + tek.level + ')', 'orang');
164
      if (t.status !== 'baru' && tek) {
165
        jejak(Math.min(0.3, x[0] * .2), 'peristiwa', tek.nama, '', 'Status jadi <b>Dikerjakan</b>', 'jam');
166
        jejak(Math.min(0.4, x[0] * .3), 'pesan', tek.nama, 'Teknisi ' + tek.level, i === 0 ? 'Sedang cek server database, CPU 100%. Kemungkinan proses backup macet. Saya restart layanan bertahap.' : 'Baik, sudah saya terima. Saya cek ke lokasi sekarang.');
167
      }
168
      if (i === 0) jejak(0.5, 'peristiwa', 'Arif Hidayat', '', 'Dieskalasi <b>L2 → L3</b>: butuh akses server inti', 'naik');
169
      if (i === 0) jejak(0.9, 'pesan', t.pelapor, 'Pelapor', 'Cabang Bekasi masih belum bisa login ya Pak, kasir antre.');
170
      if (t.status === 'menunggu') jejak(Math.min(2, x[0] * .6), 'peristiwa', tek ? tek.nama : 'Sistem', '', 'Status jadi <b>Menunggu</b>', 'jam');
171
      if (t.status === 'selesai') {
172
        t.selesai = new Date(dibuat + x[9] * JAM).toISOString();
173
        jejak(x[9] * .9, 'pesan', tek.nama, 'Teknisi ' + tek.level, 'Sudah normal kembali, mohon dicek ya.');
174
        jejak(x[9], 'peristiwa', tek.nama, '', 'Tiket ditandai <b>Selesai</b>', 'cek');
175
      }
176
      d.tiket.push(t);
177
    });
178
    d.tiket.sort(function (a, b) { return new Date(a.dibuat) - new Date(b.dibuat); });
179
    d.tiket.forEach(function (t) { d.urut++; t.no = 'TK-' + String(1040 + d.urut).padStart(4, '0'); });
180
    d.contoh = true;
181
    return d;
182
  }
183
  var D;
184
  function muat(awal) {
185
    if (awal) D = awal; else { try { D = JSON.parse(localStorage.getItem(KUNCI)); } catch (e) { D = null; } }
186
    if (!D || !Array.isArray(D.tiket)) D = dataKosong();
187
    // Migrasi: lengkapi field yang belum ada (jangan hapus data pengguna)
188
    var k = dataKosong();
189
    Object.keys(k).forEach(function (f) { if (D[f] === undefined) D[f] = k[f]; });
190
    Object.keys(k.sla).forEach(function (p) { if (!D.sla[p]) D.sla[p] = k.sla[p]; });
191
    // Migrasi v2: daftar divisi bawaan lama diganti yang baru (tiket lama tidak diubah)
192
    if (Array.isArray(D.divisi) && D.divisi.length === DIVISI_LAMA.length && D.divisi.every(function (x, i) { return x === DIVISI_LAMA[i]; })) D.divisi = DIVISI_BARU.slice();
193
    // Migrasi: divisi baru di DIVISI_BARU otomatis ditambahkan ke data yang sudah tersimpan (divisi yang sudah ada tidak diubah)
194
    if (Array.isArray(D.divisi)) DIVISI_BARU.forEach(function (x) { if (D.divisi.indexOf(x) < 0) D.divisi.push(x); });
195
    // Migrasi v2: buang sisa data contoh bawaan (tiket id k0..kN, teknisi t1..t5) dari penyimpanan lama; tiket buatan pengguna tidak disentuh
196
    if ((D.versi || 1) < 2 && D.contoh === true) {
197
      D.tiket = D.tiket.filter(function (t) { return !/^k\d+$/.test(t.id); });
198
      D.teknisi = D.teknisi.filter(function (q) { return !/^t[1-5]$/.test(q.id) || D.tiket.some(function (t) { return t.teknisiId === q.id; }); });
199
      if (D.hpAdmin === '081234500100') D.hpAdmin = '';
200
      if (!D.tiket.length) D.urut = 0;
201
      D.contoh = false;
202
    }
203
    // Migrasi v2: nomor koordinator IT (Masri) bila belum diisi
204
    if ((D.versi || 1) < 2 && !D.hpAdmin) D.hpAdmin = k.hpAdmin;
205
    D.tiket.forEach(function (t) { if (!t.utas) t.utas = []; if (!t.lampiran) t.lampiran = []; if (!t.level) t.level = 'L1'; });
206
    D.versi = VERSI;
207
    simpan();
208
  }
209
  function simpan() {
210
    try { localStorage.setItem(KUNCI, JSON.stringify(D)); }
211
    catch (e) { if (!SV.aktif) { toast('Gagal menyimpan: memori browser penuh. Hapus lampiran lama atau backup data.'); return false; } }
212
    if (SV.aktif) { SV.kotor = true; jadwalKirim(); }
213
    return true;
214
  }
215

216
  // ---------- Sinkronisasi ke server (data bersama untuk semua client) ----------
217
  // Bila server.js berjalan, data dibaca/ditulis ke server; localStorage hanya jadi cadangan lokal.
218
  // Bila tidak ada server (mis. file dibuka langsung atau hosting statis), aplikasi tetap jalan lokal seperti biasa.
219
  var SV = { gagal: false, aktif: false, rev: 0, awal: null, dasar: null, dasarStr: '', timer: null, sibuk: false, ulang: false, kotor: false, perluRender: false };
220
  function salin(x) { return JSON.parse(JSON.stringify(x)); }
221
  function samaJ(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
222
  function pakaiSupabase() { return !!(SUPABASE_URL && SUPABASE_KEY); }
223
  function sbFetch(metode, jalur, badan, tambahan) {
224
    var h = { apikey: SUPABASE_KEY };
225
    if (SUPABASE_KEY.indexOf('sb_') !== 0) h.Authorization = 'Bearer ' + SUPABASE_KEY;   // kunci gaya lama berupa JWT
226
    if (badan) h['Content-Type'] = 'application/json';
227
    if (tambahan) Object.keys(tambahan).forEach(function (k) { h[k] = tambahan[k]; });
228
    return fetch(SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/helpdesk' + jalur, { method: metode, headers: h, body: badan ? JSON.stringify(badan) : undefined, cache: 'no-store' })
229
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); });
230
  }
231
  // Satu antarmuka untuk dua jenis server: server.js (api/rev, api/data) atau Supabase. Hasil: { status, j }
232
  function apiSv(metode, url, badan) {
233
    if (!pakaiSupabase()) {
234
      return fetch(url, { method: metode, headers: badan ? { 'Content-Type': 'application/json' } : {}, body: badan ? JSON.stringify(badan) : undefined, cache: 'no-store', credentials: 'same-origin' })
235
        .then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); });
236
    }
237
    if (metode === 'GET') {
238
      var rev = url === 'api/rev';
239
      return sbFetch('GET', '?id=eq.1&select=' + (rev ? 'rev' : 'rev,data')).then(function (r) {
240
        if (r.status !== 200) return r;
241
        if (!r.j || !r.j.length) return { status: 404, j: r.j };
242
        return { status: 200, j: rev ? { rev: r.j[0].rev } : { rev: r.j[0].rev, data: r.j[0].data } };
243
      });
244
    }
245
    // Simpan hanya bila rev di database masih sama dengan yang kita kenal (UPDATE ... WHERE rev = n berjalan atomik)
246
    return sbFetch('PATCH', '?id=eq.1&rev=eq.' + badan.rev + '&select=rev', { data: badan.data }, { Prefer: 'return=representation' }).then(function (r) {
247
      if (r.status >= 200 && r.status < 300 && r.j && r.j.length) return { status: 200, j: { rev: r.j[0].rev } };
248
      if (r.status >= 200 && r.status < 300) return apiSv('GET', 'api/data').then(function (g) { return g.status === 200 ? { status: 409, j: g.j } : g; });
249
      return r;
250
    });
251
  }
252
  function statusSv(k) {
253
    if (!SV.aktif) return;
254
    var e = document.getElementById('svStatus');
255
    if (!e) {
256
      e = document.createElement('div'); e.id = 'svStatus';
257
      e.style.cssText = 'position:fixed;left:10px;bottom:8px;z-index:60;font:11px/1.2 system-ui,sans-serif;padding:4px 9px;border-radius:99px;color:#fff;pointer-events:none;opacity:.85';
258
      document.body.appendChild(e);
259
    }
260
    e.textContent = k === 'ok' ? '● Tersinkron' : k === 'kirim' ? '● Menyimpan…' : '● Offline — akan dikirim saat tersambung';
261
    e.style.background = k === 'ok' ? 'rgba(22,130,70,.9)' : k === 'kirim' ? 'rgba(90,90,90,.9)' : 'rgba(190,60,40,.92)';
262
  }
263
  // Gabung tiga arah: dasar = versi terakhir yang kita terima dari server, server = versi terbaru, lokal = perubahan kita.
264
  function gabungDaftar(dasar, server, lokal, gabungDua) {
265
    var B = {}, S = {}, L = {}, hasil = [], baru = [];
266
    (dasar || []).forEach(function (x) { B[x.id] = x; });
267
    (server || []).forEach(function (x) { S[x.id] = x; });
268
    (lokal || []).forEach(function (x) { L[x.id] = x; });
269
    (server || []).forEach(function (s) {
270
      var l = L[s.id], b = B[s.id];
271
      if (l) {
272
        if (b && samaJ(l, b)) hasil.push(s);              // hanya server yang berubah
273
        else if (b && samaJ(s, b)) hasil.push(l);         // hanya kita yang berubah
274
        else hasil.push(gabungDua(s, l));                 // dua-duanya berubah
275
      } else if (!(b && samaJ(s, b))) hasil.push(s);      // baru dari orang lain (atau kita hapus tapi server mengubahnya)
276
    });
277
    (lokal || []).forEach(function (l) {
278
      if (S[l.id]) return;
279
      var b = B[l.id];
280
      if (!b) { hasil.push(l); baru.push(l); }            // baru dibuat di sini
281
      else if (!samaJ(l, b)) hasil.push(l);               // dihapus di server, tapi kita ubah: pertahankan
282
    });
283
    return { daftar: hasil, baru: baru };
284
  }
285
  function gabungTiket(s, l) {
286
    var m = salin(l), ada = {}, lamp = {};
287
    function kunci(u) { return u.t + '|' + u.oleh + '|' + u.teks; }
288
    m.utas = m.utas || []; m.lampiran = m.lampiran || [];
289
    m.utas.forEach(function (u) { ada[kunci(u)] = 1; });
290
    (s.utas || []).forEach(function (u) { if (!ada[kunci(u)]) m.utas.push(u); });
291
    m.utas.sort(function (a, c) { return new Date(a.t) - new Date(c.t) || 0; });
292
    m.lampiran.forEach(function (x) { lamp[JSON.stringify(x)] = 1; });
293
    (s.lampiran || []).forEach(function (x) { if (!lamp[JSON.stringify(x)]) m.lampiran.push(x); });
294
    return m;
295
  }
296
  function gabung(dasar, server, lokal) {
297
    var b = dasar || {}, h = salin(server);
298
    var T = gabungDaftar(b.tiket, server.tiket, lokal.tiket, gabungTiket);
299
    var Q = gabungDaftar(b.teknisi, server.teknisi, lokal.teknisi, function (s, l) { return l; });
300
    h.tiket = T.daftar; h.teknisi = Q.daftar;
301
    if (dasar) Object.keys(lokal).forEach(function (k) {
302
      if (k === 'tiket' || k === 'teknisi' || k === 'urut') return;
303
      if (!samaJ(lokal[k], b[k])) h[k] = lokal[k];
304
    });
305
    h.urut = Math.max(server.urut || 0, lokal.urut || 0);
306
    // dua orang membuat tiket bersamaan: nomor kembar diberi nomor berikutnya
307
    var dipakai = {};
308
    h.tiket.forEach(function (t) { if (T.baru.indexOf(t) < 0) dipakai[t.no] = 1; });
309
    T.baru.forEach(function (t) {
310
      while (dipakai[t.no]) { h.urut++; t.no = 'TK-' + String(1040 + h.urut).padStart(4, '0'); }
311
      dipakai[t.no] = 1;
312
    });
313
    return h;
314
  }
315
  function jadwalKirim() { if (!SV.aktif) return; clearTimeout(SV.timer); SV.timer = setTimeout(function () { SV.timer = null; kirimSv(); }, 250); }
316
  function kirimSv() {
317
    if (!SV.aktif || !SV.kotor) return;
318
    if (SV.sibuk) { SV.ulang = true; return; }
319
    var str = JSON.stringify(D);
320
    if (str === SV.dasarStr) { SV.kotor = false; statusSv('ok'); return; }
321
    SV.sibuk = true; statusSv('kirim');
322
    apiSv('PUT', 'api/data', { rev: SV.rev, data: D }).then(function (r) {
323
      if (r.status === 200) { SV.rev = r.j.rev; SV.dasar = JSON.parse(str); SV.dasarStr = str; SV.kotor = false; statusSv('ok'); }
324
      else if (r.status === 409) {
325
        var g = gabung(SV.dasar, r.j.data, D);
326
        SV.rev = r.j.rev; SV.dasar = salin(r.j.data); SV.dasarStr = JSON.stringify(r.j.data);
327
        muat(g); SV.ulang = true; SV.perluRender = true; renderTertunda();
328
      } else throw new Error('status ' + r.status);
329
    }).catch(function () { statusSv('offline'); }).then(function () {
330
      SV.sibuk = false;
331
      if (SV.ulang) { SV.ulang = false; jadwalKirim(); }
332
    });
333
  }
334
  function renderTertunda() {
335
    if (!SV.perluRender) return;
336
    var a = document.activeElement;
337
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return; // jangan ganggu orang yang sedang mengetik
338
    SV.perluRender = false;
339
    try { segarkan(); if (laciId && tiket(laciId)) segarkanLaci(); } catch (e) {}
340
  }
341
  function cekServer() {
342
    if (!SV.aktif || SV.sibuk) return;
343
    renderTertunda();
344
    if (SV.timer) return;
345
    if (SV.kotor) return kirimSv();   // coba kirim ulang bila sebelumnya gagal
346
    apiSv('GET', 'api/rev').then(function (r) {
347
      if (r.status !== 200) throw new Error('rev');
348
      statusSv('ok');
349
      if (r.j.rev === SV.rev) return;
350
      return apiSv('GET', 'api/data').then(function (r2) {
351
        if (SV.sibuk || SV.timer || SV.kotor || r2.status !== 200 || !r2.j.data) return;
352
        SV.rev = r2.j.rev; SV.dasar = salin(r2.j.data); SV.dasarStr = JSON.stringify(r2.j.data);
353
        muat(salin(r2.j.data)); SV.perluRender = true; renderTertunda();
354
      });
355
    }).catch(function () { statusSv('offline'); });
356
  }
357
  function sinkronAwal(lanjut) {
358
    var selesai = false, tm = setTimeout(function () { if (pakaiSupabase() && !SV.aktif) SV.gagal = true; lan(); }, 5000);
359
    function lan() { if (!selesai) { selesai = true; clearTimeout(tm); lanjut(); } }
360
    if ((location.protocol === 'file:' && !pakaiSupabase()) || !window.fetch) return lan();
361
    apiSv('GET', 'api/data').then(function (r) {
362
      if (!selesai && r.status === 200 && r.j && typeof r.j.rev === 'number') {
363
        SV.aktif = true; SV.rev = r.j.rev;
364
        if (r.j.data && Array.isArray(r.j.data.tiket)) { SV.awal = r.j.data; SV.dasar = salin(r.j.data); SV.dasarStr = JSON.stringify(r.j.data); }
365
      } else if (pakaiSupabase()) SV.gagal = true;
366
      lan();
367
    }).catch(function () { if (pakaiSupabase()) SV.gagal = true; lan(); });
368
  }
369
  setInterval(cekServer, 4000);
370
  document.addEventListener('visibilitychange', function () { if (!document.hidden) cekServer(); });
371
  document.addEventListener('focusout', function () { setTimeout(renderTertunda, 50); });
372

373
  // ---------- Hitungan ----------
374
  function teknisi(id) { return D.teknisi.filter(function (t) { return t.id === id; })[0]; }
375
  function tiket(id) { return D.tiket.filter(function (t) { return t.id === id; })[0]; }
376
  function terbuka(t) { return t.status !== 'selesai'; }
377
  function lewatSla(t) { return terbuka(t) ? Date.now() > new Date(t.tenggat) : new Date(t.selesai) > new Date(t.tenggat); }
378
  function lamaSelesai(t) { return new Date(t.selesai) - new Date(t.dibuat); }
379
  function bebanTeknisi(id) { return D.tiket.filter(function (t) { return terbuka(t) && t.teknisiId === id; }).length; }
380
  function pilihOtomatis(level) {
381
    var calon = D.teknisi.filter(function (q) { return q.level === level; });
382
    if (!calon.length) calon = D.teknisi.slice();
383
    calon.sort(function (a, b) { return bebanTeknisi(a.id) - bebanTeknisi(b.id); });
384
    return calon[0] ? calon[0].id : '';
385
  }
386
  function infoSla(t) {
387
    if (!terbuka(t)) { var ok = !lewatSla(t); return { kelas: ok ? 'beres' : 'lewat', teks: (ok ? 'Tepat SLA · ' : 'Lewat SLA · ') + durasi(lamaSelesai(t)) }; }
388
    var sisa = new Date(t.tenggat) - Date.now(), total = D.sla[t.prioritas] * MENIT;
389
    if (sisa < 0) return { kelas: 'lewat', teks: 'Lewat ' + durasi(sisa), rasio: 0 };
390
    return { kelas: sisa / total < .25 ? 'mepet' : 'aman', teks: durasi(sisa) + ' lagi', rasio: sisa / total };
391
  }
392
  function slaHtml(t) { var s = infoSla(t); return '<span class="sla ' + s.kelas + '" data-sla="' + t.id + '">' + ikon(s.kelas === 'beres' ? 'cek' : 'jam') + '<span>' + s.teks + '</span></span>'; }
393
  function pilP(k) { return '<span class="pil pil-p p-' + k + '">' + pri(k).n + '</span>'; }
394
  function pilS(k) { return '<span class="pil pil-status st-' + k + '">' + sts(k).n + '</span>'; }
395
  function pilL(k) { return '<span class="pil pil-level" title="Level ' + k + '">' + k + '</span>'; }
396

397
  // ---------- Animasi angka ----------
398
  function hitungKe(el, nilai, fmt) {
399
    fmt = fmt || function (x) { return Math.round(x); };
400
    var awal = +(el.dataset.nilai || 0); el.dataset.nilai = nilai;
401
    if (kurangGerak || awal === nilai) { el.innerHTML = fmt(nilai); return; }
402
    var t0 = performance.now(), dur = 700;
403
    (function langkah(tm) {
404
      var p = Math.min(1, (tm - t0) / dur), e = 1 - Math.pow(1 - p, 3);
405
      el.innerHTML = fmt(awal + (nilai - awal) * e);
406
      if (p < 1) requestAnimationFrame(langkah);
407
    })(t0);
408
  }
409

410
  // ---------- Toast & dialog ----------
411
  var tmToast;
412
  function toast(pesan, aksi) {
413
    var t = $('#toast'); t.innerHTML = '<span>' + esc(pesan) + '</span>';
414
    if (aksi) { var b = document.createElement('button'); b.textContent = aksi.label; b.onclick = function () { aksi.fn(); t.classList.remove('tampil'); }; t.appendChild(b); }
415
    t.classList.add('tampil'); clearTimeout(tmToast); tmToast = setTimeout(function () { t.classList.remove('tampil'); }, aksi ? 6000 : 2800);
416
  }
417
  var dlg = $('#dialog');
418
  function dialog(o) {
419
    $('#dialogIsi').innerHTML = '<form method="dialog" class="dialog-isi" novalidate><h2>' + esc(o.judul) + '</h2>' + (o.isi || '') +
420
      '<div class="dialog-aksi">' + (o.aksi || []).map(function (a, i) { return '<button class="tombol ' + (a.kelas || 'garis') + '" value="' + i + '"' + (a.submit ? ' type="submit"' : ' type="button"') + '>' + a.label + '</button>'; }).join('') + '</div></form>';
421
    var f = $('#dialogIsi form');
422
    $$('.dialog-aksi button', f).forEach(function (b) {
423
      b.addEventListener('click', function (e) {
424
        e.preventDefault(); var a = o.aksi[+b.value];
425
        if (a.fn && a.fn(f) === false) return; dlg.close();
426
      });
427
    });
428
    f.addEventListener('submit', function (e) { e.preventDefault(); var i = o.aksi.findIndex(function (a) { return a.submit; }); if (i >= 0) $$('.dialog-aksi button', f)[i].click(); });
429
    if (o.siap) o.siap(f);
430
    dlg.showModal();
431
    var fokus = $('input, select, textarea', f) || $('.dialog-aksi .utama', f); if (fokus) fokus.focus();
432
  }
433
  function konfirmasi(judul, teks, label, fn, bahaya) {
434
    dialog({ judul: judul, isi: '<p class="redup">' + teks + '</p>', aksi: [{ label: 'Batal' }, { label: label, kelas: bahaya ? 'bahaya' : 'utama', fn: fn }] });
435
  }
436

437
  // ---------- WhatsApp ----------
438
  function nomorWa(hp) {
439
    var n = String(hp || '').replace(/\D/g, '');
440
    if (!n) return '';
441
    if (n[0] === '0') n = '62' + n.slice(1); else if (n[0] === '8') n = '62' + n;
442
    return n;
443
  }
444
  function linkWa(hp, teks) { var n = nomorWa(hp); return 'https://wa.me/' + n + '?text=' + encodeURIComponent(teks); }
445
  function pesanWa(jenis, t, ekstra) {
446
    var tek = teknisi(t.teknisiId), p = pri(t.prioritas).n.toUpperCase(), kaki = '\n\n— ' + NAMA_TEMA;
447
    if (jenis === 'dibuat') return '*[' + t.no + '] Tiket baru · ' + p + ' · ' + t.level + '*\n' + t.judul + '\n\nPelapor: ' + t.pelapor + ' (' + t.divisi + ')\nKategori: ' + t.kategori + '\nBatas SLA: ' + tglPanjang(t.tenggat) + '\n\n' + t.deskripsi.slice(0, 280) + '\n\nMohon segera ditangani.' + kaki;
448
    if (jenis === 'eskalasi') return '*[' + t.no + '] ESKALASI ke ' + t.level + ' · ' + p + '*\n' + t.judul + '\n\nPelapor: ' + t.pelapor + ' (' + t.divisi + ')\nAlasan: ' + (ekstra || '-') + '\nBatas SLA: ' + tglPanjang(t.tenggat) + ' (' + infoSla(t).teks + ')\n\nMohon diambil alih.' + kaki;
449
    if (jenis === 'diterima') return 'Halo ' + t.pelapor + ', tiket *' + t.no + '* (' + t.judul + ') sudah kami terima dengan prioritas ' + pri(t.prioritas).n + '.' + (tek ? ' Ditangani oleh ' + tek.nama + '.' : '') + ' Target selesai: ' + tglPanjang(t.tenggat) + '.' + kaki;
450
    if (jenis === 'selesai') return 'Halo ' + t.pelapor + ', tiket *' + t.no + '* (' + t.judul + ') sudah *SELESAI*' + (tek ? ' oleh ' + tek.nama : '') + '. Kalau masalah muncul lagi, balas pesan ini ya. Terima kasih!' + kaki;
451
    return 'Halo ' + t.pelapor + ', kabar tiket *' + t.no + '* (' + t.judul + '): status sekarang ' + sts(t.status).n + '.' + kaki;
452
  }
453
  function kirimWebhook(jenis, t, hp, teks) {
454
    if (!WEBHOOK_WA || !hp) return;
455
    try {
456
      fetch(WEBHOOK_WA, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
457
        body: JSON.stringify({ jenis: jenis, tiket: t.no, prioritas: t.prioritas, level: t.level, target: nomorWa(hp), pesan: teks }) });
458
    } catch (e) {}
459
  }
460
  function tombolWa(hp, teks, label, sub) {
461
    return '<a class="tombol wa" target="_blank" rel="noopener" href="' + esc(linkWa(hp, teks)) + '">' + ikon('wa') + '<span>' + esc(label) + '</span>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</a>';
462
  }
463
  function dialogWa(judul, teks, tujuan) {
464
    dialog({
465
      judul: judul,
466
      isi: '<p class="redup kecil">Ketuk untuk membuka WhatsApp dengan pesan yang sudah terisi. Tinggal tekan kirim.</p><div class="pratinjau-pesan">' + esc(teks) + '</div><div class="wa-daftar">' +
467
        tujuan.filter(function (x) { return x; }).map(function (x) { return tombolWa(x.hp, teks, x.nama, x.hp ? x.ket : 'pilih kontak'); }).join('') + '</div>',
468
      aksi: [{ label: 'Nanti saja' }]
469
    });
470
  }
471

472
  // ---------- Notifikasi browser ----------
473
  var sudahDiberitahu = {};
474
  function beritahu(judul, isi, id) {
475
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
476
    try { var n = new Notification(judul, { body: isi, icon: 'ikon.svg', tag: id }); n.onclick = function () { window.focus(); bukaTiket(id); }; } catch (e) {}
477
  }
478

479
  // ---------- Sesi & PIN ----------
480
  var sesi = null;
481
  function simpanSesi() { try { sessionStorage.setItem(KUNCI_SESI, JSON.stringify(sesi)); } catch (e) {} }
482
  function namaSaya() { if (!sesi) return ''; if (sesi.peran === 'teknisi') { var t = teknisi(sesi.teknisiId); return t ? t.nama : 'Teknisi'; } return sesi.peran === 'admin' ? 'Admin IT' : 'Tamu'; }
483
  function bolehkah(el) { var p = el.getAttribute('data-peran'); return !p || (sesi && p.split(' ').indexOf(sesi.peran) >= 0); }
484
  function terapkanPeran() {
485
    $$('[data-peran]').forEach(function (el) { el.hidden = !bolehkah(el); });
486
    $('#app').classList.toggle('tamu', sesi.peran === 'tamu');
487
    $('#namaSaya').textContent = namaSaya();
488
    $('#peranSaya').textContent = sesi.peran === 'teknisi' ? 'Teknisi ' + ((teknisi(sesi.teknisiId) || {}).level || '') : sesi.peran === 'admin' ? 'Admin' : 'Pelapor';
489
    $('#avaSaya').outerHTML = avaHtml(namaSaya()).replace('<span class="ava"', '<span class="ava" id="avaSaya"');
490
    $('#fSaya').parentNode.hidden = sesi.peran !== 'teknisi';
491
  }
492
  function tampilGerbang() {
493
    $('#app').hidden = true; $('#gerbang').hidden = false;
494
    $('#pilihTeknisi').innerHTML = D.teknisi.map(function (t) { return '<option value="' + t.id + '">' + esc(t.nama) + ' (' + t.level + ')</option>'; }).join('');
495
    gantiPeranGerbang(); setTimeout(function () { $('#inputPin').focus(); }, 50);
496
  }
497
  function gantiPeranGerbang() { $('#bidangSiapa').hidden = $('input[name=peran]:checked').value !== 'teknisi'; }
498
  $$('input[name=peran]').forEach(function (r) { r.addEventListener('change', gantiPeranGerbang); });
499
  $('#formPin').addEventListener('submit', function (e) {
500
    e.preventDefault();
501
    var peran = $('input[name=peran]:checked').value, pin = $('#inputPin').value.trim();
502
    if (pin !== D.pin[peran]) {
503
      $('#pinPesan').textContent = pin ? 'PIN salah. Coba lagi.' : 'Ketik PIN dulu.';
504
      var k = $('.gerbang-kartu'); k.classList.remove('goyang'); void k.offsetWidth; k.classList.add('goyang');
505
      $('#inputPin').select(); return;
506
    }
507
    if (peran === 'teknisi' && !D.teknisi.length) { $('#pinPesan').textContent = 'Belum ada teknisi. Minta admin menambahkan.'; return; }
508
    $('#pinPesan').textContent = ''; $('#inputPin').value = '';
509
    masuk({ peran: peran, teknisiId: peran === 'teknisi' ? $('#pilihTeknisi').value : '' });
510
  });
511
  $('#lapor-tamu').addEventListener('click', function () { masuk({ peran: 'tamu' }); });
512
  function masuk(s) {
513
    sesi = s; simpanSesi();
514
    $('#gerbang').hidden = true; $('#app').hidden = false;
515
    terapkanPeran();
516
    var awal = (location.hash || '').slice(1);
517
    buka(sesi.peran === 'tamu' ? 'buat' : (HALAMAN.indexOf(awal) >= 0 && halBoleh(awal) ? awal : 'dasbor'));
518
  }
519
  function keluar() { sesi = null; try { sessionStorage.removeItem(KUNCI_SESI); } catch (e) {} tutupLaci(true); tampilGerbang(); }
520
  $('#keluar').addEventListener('click', keluar); $('#keluarHp').addEventListener('click', keluar);
521

522
  // ---------- Navigasi ----------
523
  var HALAMAN = ['dasbor', 'tiket', 'buat', 'laporan', 'atur'];
524
  var halAktif = 'dasbor';
525
  function halBoleh(h) { var b = $('.menu .nav[data-hal="' + h + '"]'); return b && bolehkah(b) && (sesi.peran !== 'tamu' || h === 'buat'); }
526
  function buka(hal) {
527
    if (!halBoleh(hal)) hal = sesi.peran === 'tamu' ? 'buat' : 'dasbor';
528
    halAktif = hal;
529
    $$('.hal').forEach(function (s) { s.hidden = s.id !== 'hal-' + hal; });
530
    $$('.nav').forEach(function (b) { var a = b.dataset.hal === hal; b.classList.toggle('aktif', a); if (a) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
531
    if (hal === 'dasbor') renderDasbor(); else if (hal === 'tiket') renderTiket(); else if (hal === 'buat') renderBuat(); else if (hal === 'laporan') renderLaporan(); else renderAtur();
532
    try { history.replaceState(null, '', '#' + hal); } catch (e) {}
533
    window.scrollTo(0, 0);
534
  }
535
  $$('.nav').forEach(function (b) { b.addEventListener('click', function () { buka(b.dataset.hal); }); });
536
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-buka]'); if (b) buka(b.dataset.buka); });
537
  function segarkan() { renderHitung(); if (sesi && sesi.peran !== 'tamu') buka(halAktif); }
538
  function renderHitung() { var n = D.tiket.filter(terbuka).length; $('#hitungTerbuka').textContent = n || ''; }
539

540
  // ================= DASBOR =================
541
  function sapaan() { var j = new Date().getHours(); return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 18 ? 'Selamat sore' : 'Selamat malam'; }
542
  function renderDasbor() {
543
    var buka_ = D.tiket.filter(terbuka), telat = buka_.filter(lewatSla), kritis = buka_.filter(function (t) { return t.prioritas === 'kritis'; });
544
    var selesai = D.tiket.filter(function (t) { return !terbuka(t); });
545
    var rata = selesai.length ? selesai.reduce(function (s, t) { return s + lamaSelesai(t); }, 0) / selesai.length : 0;
546
    var patuh = selesai.length ? Math.round(selesai.filter(function (t) { return !lewatSla(t); }).length / selesai.length * 100) : 100;
547
    $('#sapa').textContent = sapaan() + ', ' + namaSaya().split(' ')[0];
548
    $('#sapaSub').textContent = buka_.length ? buka_.length + ' tiket terbuka, ' + kritis.length + ' kritis.' : 'Semua tiket beres. Mantap!';
549
    var stat = [
550
      { l: 'Tiket terbuka', ik: 'tiket', v: buka_.length, c: D.tiket.filter(function (t) { return t.status === 'baru'; }).length + ' baru belum dikerjakan', kls: 'utama-stat' },
551
      { l: 'Lewat SLA', ik: 'peringatan', v: telat.length, c: telat.length ? 'Perlu eskalasi atau dikejar' : 'Semua masih dalam target', kls: telat.length ? 'bahaya' : '' },
552
      { l: 'Rata-rata selesai', ik: 'jam', v: rata / JAM, c: selesai.length + ' tiket selesai', fmt: function (x) { return x >= 24 ? (x / 24).toFixed(1).replace('.', ',') + '<small>hari</small>' : x.toFixed(1).replace('.', ',') + '<small>jam</small>'; } },
553
      { l: 'Kepatuhan SLA', ik: 'cek', v: patuh, c: 'Tiket selesai tepat waktu', fmt: function (x) { return Math.round(x) + '<small>%</small>'; } }
554
    ];
555
    var wadah = $('#statistik');
556
    if (wadah.children.length !== 4) wadah.innerHTML = stat.map(function (s, i) { return '<div class="stat" style="--i:' + i + '"><span class="stat-label">' + ikon(s.ik) + s.l + '</span><span class="stat-angka"></span><span class="stat-catatan"></span></div>'; }).join('');
557
    stat.forEach(function (s, i) {
558
      var el = wadah.children[i]; el.className = 'stat ' + (s.kls || ''); el.style.setProperty('--i', i);
559
      hitungKe($('.stat-angka', el), s.v, s.fmt); $('.stat-catatan', el).textContent = s.c;
560
    });
561
    // Kartu sorotan: tiket terbuka prioritas tinggi/kritis atau lewat SLA
562
    var urgen = buka_.filter(function (t) { return t.prioritas === 'kritis' || t.prioritas === 'tinggi' || lewatSla(t); })
563
      .sort(function (a, b) { return (URUT_P[a.prioritas] - URUT_P[b.prioritas]) || (new Date(a.tenggat) - new Date(b.tenggat)); });
564
    $('#sorotan').innerHTML = urgen.length ? urgen.map(function (t, i) {
565
      var tek = teknisi(t.teknisiId);
566
      return '<button class="kartu-pri p-' + t.prioritas + '" data-tiket="' + t.id + '" style="--i:' + i + '"><span class="k-atas"><span class="mono">' + t.no + ' · ' + t.level + '</span><span>' + pri(t.prioritas).n + '</span></span>' +
567
        '<span class="k-judul">' + esc(t.judul) + '</span><span class="k-bawah"><span>' + esc(tek ? tek.nama : 'Belum ditugaskan') + '</span><span class="hitungan" data-sla="' + t.id + '" data-polos>' + infoSla(t).teks + '</span></span></button>';
568
    }).join('') : '<div class="kosong-sorotan">' + ikon('cek') + '<span><b>Tidak ada tiket mendesak.</b> Tiket Tinggi, Kritis, atau lewat SLA akan muncul di sini.</span></div>';
569
    // Grafik 14 hari
570
    var hari = [], maks = 1, kini = new Date(); kini.setHours(0, 0, 0, 0);
571
    for (var h = 13; h >= 0; h--) {
572
      var a = new Date(kini); a.setDate(a.getDate() - h); var b = new Date(a); b.setDate(b.getDate() + 1);
573
      var masuk = D.tiket.filter(function (t) { var x = new Date(t.dibuat); return x >= a && x < b; });
574
      var u = masuk.filter(function (t) { return t.prioritas === 'kritis' || t.prioritas === 'tinggi'; }).length;
575
      hari.push({ d: a, n: masuk.length, u: u }); maks = Math.max(maks, masuk.length);
576
    }
577
    var total = hari.reduce(function (s, x) { return s + x.n; }, 0);
578
    $('#grafikRingkas').innerHTML = '<span class="legenda"><span><i style="background:var(--utama)"></i>Rendah/Sedang</span><span><i style="background:var(--aksen)"></i>Tinggi/Kritis</span></span>';
579
    $('#grafikHarian').setAttribute('aria-label', total + ' tiket masuk dalam 14 hari terakhir');
580
    $('#grafikHarian').innerHTML = hari.map(function (x, i) {
581
      var tinggi = x.n / maks * 100;
582
      return '<div class="k" title="' + x.d.getDate() + ' ' + BULAN[x.d.getMonth()] + ': ' + x.n + ' tiket"><span class="bt" style="--i:' + i + ';height:' + Math.max(tinggi, 2) + '%">' +
583
        (x.n ? '<i class="a" style="flex:' + (x.n - x.u) + '"></i><i class="b" style="flex:' + x.u + '"></i>' : '<i class="a" style="flex:1;opacity:.25"></i>') + '</span><small>' + x.d.getDate() + '</small></div>';
584
    }).join('');
585
    // Beban teknisi
586
    var bmaks = Math.max(1, Math.max.apply(null, D.teknisi.map(function (q) { return bebanTeknisi(q.id); })));
587
    $('#beban').innerHTML = D.teknisi.length ? D.teknisi.map(function (q) {
588
      var n = bebanTeknisi(q.id);
589
      return '<li>' + avaHtml(q.nama, true) + '<div><b>' + esc(q.nama) + '</b><small>' + q.level + ' · ' + LEVEL.filter(function (l) { return l.k === q.level; })[0].n + '</small><div class="meter"><i style="width:' + (n / bmaks * 100) + '%"></i></div></div><span class="pil pil-level">' + n + ' tiket</span></li>';
590
    }).join('') : '<li class="redup">Belum ada teknisi. Tambahkan di menu Atur.</li>';
591
    // Aktivitas
592
    var ak = [];
593
    D.tiket.forEach(function (t) { t.utas.forEach(function (u) { ak.push({ t: t, u: u }); }); });
594
    ak.sort(function (a, b) { return new Date(b.u.t) - new Date(a.u.t); });
595
    $('#aktivitas').innerHTML = ak.slice(0, 7).map(function (x, i) {
596
      var teks = x.u.jenis === 'pesan' ? '<b class="nama-kecil">' + esc(x.u.oleh) + '</b> membalas: “' + esc(x.u.teks.slice(0, 70)) + (x.u.teks.length > 70 ? '…' : '') + '”' : x.u.teks;
597
      return '<li style="--i:' + i + '">' + avaHtml(x.u.oleh, true) + '<p><button data-tiket="' + x.t.id + '">' + x.t.no + '</button> ' + teks + '</p><time>' + lalu(x.u.t) + '</time></li>';
598
    }).join('') || '<li class="redup">Belum ada aktivitas.</li>';
599
  }
600
  document.addEventListener('click', function (e) {
601
    if (modePilih) return;
602
    var b = e.target.closest('[data-tiket]'); if (b && !b.closest('.laci')) bukaTiket(b.dataset.tiket);
603
  });
604

605
  // ================= TIKET (papan & daftar) =================
606
  var tampil = 'papan';
607
  try { tampil = localStorage.getItem(KUNCI + '.tampil') || 'papan'; } catch (e) {}
608
  $('#fPrioritas').insertAdjacentHTML('beforeend', PRIORITAS.map(function (p) { return '<option value="' + p.k + '">' + p.n + '</option>'; }).join(''));
609
  function isiSaringTeknisi() {
610
    var v = $('#fTeknisi').value;
611
    $('#fTeknisi').innerHTML = '<option value="">Semua teknisi</option><option value="-">Belum ditugaskan</option>' + D.teknisi.map(function (t) { return '<option value="' + t.id + '">' + esc(t.nama) + '</option>'; }).join('');
612
    $('#fTeknisi').value = v;
613
  }
614
  function tersaring() {
615
    var q = $('#cari').value.trim().toLowerCase(), p = $('#fPrioritas').value, tk = $('#fTeknisi').value, saya = $('#fSaya').checked && sesi.peran === 'teknisi';
616
    return D.tiket.filter(function (t) {
617
      if (p && t.prioritas !== p) return false;
618
      if (tk === '-' && t.teknisiId) return false;
619
      if (tk && tk !== '-' && t.teknisiId !== tk) return false;
620
      if (saya && t.teknisiId !== sesi.teknisiId) return false;
621
      if (q && (t.no + ' ' + t.judul + ' ' + t.pelapor + ' ' + t.divisi + ' ' + t.kategori).toLowerCase().indexOf(q) < 0) return false;
622
      return true;
623
    });
624
  }
625
  var URUT_P = { kritis: 0, tinggi: 1, sedang: 2, rendah: 3 };
626
  function renderTiket() {
627
    isiSaringTeknisi();
628
    $$('[data-tampil]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tampil === tampil); });
629
    var daftar = tersaring();
630
    $('#tiketSub').textContent = daftar.length + ' tiket ditampilkan · ' + daftar.filter(terbuka).length + ' terbuka';
631
    $('#papan').hidden = tampil !== 'papan'; $('#daftar').hidden = tampil !== 'daftar';
632
    if (tampil === 'papan') {
633
      $('#papan').innerHTML = STATUS.map(function (s) {
634
        var isi = daftar.filter(function (t) { return t.status === s.k; }).sort(function (a, b) {
635
          return s.k === 'selesai' ? new Date(b.selesai) - new Date(a.selesai) : (URUT_P[a.prioritas] - URUT_P[b.prioritas]) || (new Date(a.tenggat) - new Date(b.tenggat));
636
        });
637
        var tampilIsi = s.k === 'selesai' ? isi.slice(0, 8) : isi;
638
        return '<section class="kolom" data-status="' + s.k + '" aria-label="' + s.n + '"><div class="kolom-kepala" style="color:' + s.warna + '"><span class="titik"></span><span style="color:var(--teks)">' + s.n + '</span><span class="n">' + isi.length + '</span></div>' +
639
          (tampilIsi.length ? tampilIsi.map(kartuTiket).join('') : '<p class="kolom-kosong">Seret tiket ke sini</p>') +
640
          (isi.length > tampilIsi.length ? '<button class="tautan" data-tampil-ke="daftar">+' + (isi.length - tampilIsi.length) + ' lainnya di Daftar</button>' : '') + '</section>';
641
      }).join('');
642
    } else {
643
      daftar.sort(function (a, b) { return (terbuka(b) - terbuka(a)) || (URUT_P[a.prioritas] - URUT_P[b.prioritas]) || (new Date(b.dibuat) - new Date(a.dibuat)); });
644
      $('#daftar').innerHTML = daftar.length ? '<div class="tabel-bungkus"><table class="tabel"><thead><tr><th>Tiket</th><th>Prioritas</th><th class="sembunyi-hp">Level</th><th>Status</th><th class="sembunyi-hp">Teknisi</th><th>SLA</th></tr></thead><tbody>' +
645
        daftar.map(function (t, i) {
646
          var tek = teknisi(t.teknisiId);
647
          return '<tr class="klik" data-tiket="' + t.id + '" style="--i:' + Math.min(i, 20) + '"><td class="judul-sel"><button class="baris-buka" data-tiket="' + t.id + '">' + esc(t.judul) + '</button><small class="mono">' + t.no + '</small> <small>· ' + esc(t.pelapor) + ', ' + esc(t.divisi) + '</small></td>' +
648
            '<td>' + pilP(t.prioritas) + '</td><td class="sembunyi-hp">' + pilL(t.level) + '</td><td>' + pilS(t.status) + '</td><td class="sembunyi-hp">' + esc(tek ? tek.nama : '—') + '</td><td>' + slaHtml(t) + '</td></tr>';
649
        }).join('') + '</tbody></table></div>' : kosongHtml();
650
    }
651
  }
652
  function kosongHtml() { return '<div class="kosong">' + ikon('kosong') + '<b>Tidak ada tiket yang cocok</b><span>Ubah kata kunci atau saringan.</span></div>'; }
653
  function kartuTiket(t, i) {
654
    var tek = teknisi(t.teknisiId);
655
    return '<button class="kartu-tiket p-' + t.prioritas + '" draggable="true" data-tiket="' + t.id + '" style="--i:' + i + '"><span class="strip" aria-hidden="true"></span>' +
656
      '<span class="baris"><span class="no">' + t.no + '</span><span>' + pilP(t.prioritas) + ' ' + pilL(t.level) + '</span></span><b>' + esc(t.judul) + '</b>' +
657
      '<span class="meta">' + ikon('orang') + esc(t.pelapor) + ' · ' + esc(t.divisi) + (t.lampiran.length ? ' · ' + ikon('klip') + t.lampiran.length : '') + '</span>' +
658
      '<span class="baris"><span class="meta">' + (tek ? avaHtml(tek.nama, true) + esc(tek.nama.split(' ')[0]) : 'Belum ditugaskan') + '</span>' + slaHtml(t) + '</span></button>';
659
  }
660
  $$('[data-tampil]').forEach(function (b) { b.addEventListener('click', function () { tampil = b.dataset.tampil; try { localStorage.setItem(KUNCI + '.tampil', tampil); } catch (e) {} renderTiket(); }); });
661
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-tampil-ke]'); if (b) { tampil = b.dataset.tampilKe; renderTiket(); } });
662
  ['#cari', '#fPrioritas', '#fTeknisi', '#fSaya'].forEach(function (s) { $(s).addEventListener(s === '#cari' ? 'input' : 'change', renderTiket); });
663
  // Seret-lepas antar kolom (desktop)
664
  var diseret = null;
665
  $('#papan').addEventListener('dragstart', function (e) { var k = e.target.closest('.kartu-tiket'); if (!k) return; diseret = k.dataset.tiket; k.classList.add('diseret'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', diseret); } catch (x) {} });
666
  $('#papan').addEventListener('dragend', function () { $$('.diseret, .seret-atas').forEach(function (x) { x.classList.remove('diseret', 'seret-atas'); }); });
667
  $('#papan').addEventListener('dragover', function (e) { var k = e.target.closest('.kolom'); if (!k || !diseret) return; e.preventDefault(); $$('.kolom.seret-atas').forEach(function (x) { if (x !== k) x.classList.remove('seret-atas'); }); k.classList.add('seret-atas'); });
668
  $('#papan').addEventListener('drop', function (e) {
669
    var k = e.target.closest('.kolom'); if (!k || !diseret) return; e.preventDefault();
670
    var t = tiket(diseret); diseret = null; if (t && t.status !== k.dataset.status) ubahStatus(t, k.dataset.status);
671
  });
672

673
  // ---------- Aksi tiket ----------
674
  function catatPeristiwa(t, teks, ik) { t.utas.push({ id: uid(), t: new Date().toISOString(), jenis: 'peristiwa', oleh: namaSaya(), peran: '', teks: teks, ikon: ik }); }
675
  function ubahStatus(t, s, diam) {
676
    var lama = t.status; if (lama === s) return;
677
    t.status = s;
678
    if (s === 'selesai') t.selesai = new Date().toISOString(); else if (lama === 'selesai') { t.selesai = null; }
679
    catatPeristiwa(t, 'Status <b>' + sts(lama).n + '</b> → <b>' + sts(s).n + '</b>', s === 'selesai' ? 'cek' : 'jam');
680
    simpan(); segarkanLaci(); segarkan();
681
    if (diam) return;
682
    if (s === 'selesai') {
683
      toast(t.no + ' selesai dalam ' + durasi(lamaSelesai(t)), { label: 'Urungkan', fn: function () { t.utas.pop(); t.status = lama; t.selesai = null; simpan(); segarkanLaci(); segarkan(); } });
684
      kirimWebhook('selesai', t, t.hp, pesanWa('selesai', t));
685
      dialogWa('Kabari pelapor: tiket selesai', pesanWa('selesai', t), [{ nama: 'WA ke ' + t.pelapor, hp: t.hp, ket: t.hp }]);
686
    } else toast(t.no + ' → ' + sts(s).n);
687
  }
688
  function eskalasi(t) {
689
    var i = ['L1', 'L2', 'L3'].indexOf(t.level); if (i >= 2) return;
690
    var ke = ['L1', 'L2', 'L3'][i + 1];
691
    var opsi = D.teknisi.filter(function (q) { return q.level === ke; }), saran = pilihOtomatis(ke);
692
    dialog({
693
      judul: 'Eskalasi ' + t.no + ' ke ' + ke,
694
      isi: '<label class="bidang"><span>Alasan eskalasi *</span><textarea name="alasan" rows="3" placeholder="mis. Butuh akses server, di luar kewenangan L1">' + (lewatSla(t) ? 'Melewati batas SLA. ' : '') + '</textarea><em class="galat"></em></label>' +
695
        '<label class="bidang"><span>Teknisi ' + ke + '</span><select name="tek">' + (opsi.length ? opsi : D.teknisi).map(function (q) { return '<option value="' + q.id + '"' + (q.id === saran ? ' selected' : '') + '>' + esc(q.nama) + ' (' + q.level + ', ' + bebanTeknisi(q.id) + ' tiket)</option>'; }).join('') + '</select></label>',
696
      aksi: [{ label: 'Batal' }, {
697
        label: ikon('naik') + 'Eskalasi', kelas: 'utama', submit: true, fn: function (f) {
698
          var al = f.alasan.value.trim();
699
          if (!al) { f.alasan.closest('.bidang').classList.add('salah'); $('.galat', f).textContent = 'Tulis alasan singkat supaya teknisi berikutnya paham.'; f.alasan.focus(); return false; }
700
          var lama = t.level; t.level = ke; t.teknisiId = f.tek.value; if (t.status === 'menunggu' || t.status === 'baru') t.status = 'dikerjakan';
701
          var tek = teknisi(t.teknisiId);
702
          catatPeristiwa(t, 'Dieskalasi <b>' + lama + ' → ' + ke + '</b>' + (tek ? ', ditugaskan ke <b>' + esc(tek.nama) + '</b>' : '') + ': ' + esc(al), 'naik');
703
          simpan(); segarkanLaci(); segarkan();
704
          if (tek) kirimWebhook('eskalasi', t, tek.hp, pesanWa('eskalasi', t, al));
705
          setTimeout(function () { dialogWa('Kabari teknisi ' + ke, pesanWa('eskalasi', t, al), [tek ? { nama: 'WA ke ' + tek.nama, hp: tek.hp, ket: tek.level } : null, D.hpAdmin ? { nama: 'WA ke ' + D.namaAdmin + ' (koordinator IT)', hp: D.hpAdmin, ket: 'koordinator' } : null]); }, 60);
706
        }
707
      }]
708
    });
709
  }
710

711
  // ================= LACI DETAIL =================
712
  var laciId = null, fokusSebelum = null;
713
  function bukaTiket(id) {
714
    if (!sesi || sesi.peran === 'tamu') return;
715
    var t = tiket(id); if (!t) return;
716
    var sudahBuka = !!laciId; laciId = id;
717
    if (!sudahBuka) fokusSebelum = document.activeElement;
718
    $('#laci').hidden = false; $('#laciLatar').hidden = false;
719
    $('#laci').classList.remove('keluar'); $('#laciLatar').classList.remove('keluar');
720
    document.body.style.overflow = 'hidden';
721
    renderLaci(t);
722
    $('#laci .tutup').focus();
723
    var g = $('.utas-gulir'); if (g) g.scrollTop = g.scrollHeight;
724
  }
725
  function tutupLaci(langsung) {
726
    if (!laciId) return; laciId = null;
727
    var akhiri = function () { $('#laci').hidden = true; $('#laciLatar').hidden = true; document.body.style.overflow = ''; };
728
    if (langsung === true || kurangGerak) akhiri(); else { $('#laci').classList.add('keluar'); $('#laciLatar').classList.add('keluar'); setTimeout(akhiri, 260); }
729
    if (fokusSebelum && fokusSebelum.focus && document.contains(fokusSebelum)) fokusSebelum.focus();
730
  }
731
  function segarkanLaci() { if (laciId) { var g = $('.utas-gulir'), bawah = g && g.scrollHeight - g.scrollTop - g.clientHeight < 40; var draf = $('#balasTeks') ? $('#balasTeks').value : ''; renderLaci(tiket(laciId)); if ($('#balasTeks')) $('#balasTeks').value = draf; g = $('.utas-gulir'); if (g && bawah) g.scrollTop = g.scrollHeight; } }
732
  $('#laciLatar').addEventListener('click', function () { tutupLaci(); });
733
  document.addEventListener('keydown', function (e) {
734
    if (e.key === 'Escape' && laciId && !dlg.open && $('#lightbox').hidden) tutupLaci();
735
    if (e.key === 'Escape' && !$('#lightbox').hidden) tutupLightbox();
736
    if (e.key === 'Tab' && laciId && !dlg.open) {
737
      var f = $$('#laci a[href], #laci button:not([disabled]), #laci textarea, #laci select, #laci input').filter(function (x) { return x.offsetParent !== null; });
738
      if (!f.length) return; var a = f[0], z = f[f.length - 1];
739
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
740
    }
741
  });
742
  function renderLaci(t) {
743
    if (!t) { tutupLaci(true); return; }
744
    var tek = teknisi(t.teknisiId), s = infoSla(t), admin = sesi.peran === 'admin', iL = ['L1', 'L2', 'L3'].indexOf(t.level);
745
    var total = D.sla[t.prioritas] * MENIT, berjalan = (terbuka(t) ? Date.now() : new Date(t.selesai)) - new Date(t.dibuat);
746
    var utas = t.utas.map(function (u, i) {
747
      if (u.jenis === 'peristiwa') return '<div class="peristiwa"><span class="ik">' + ikon(u.ikon || 'jam') + '</span><span><b>' + esc(u.oleh) + '</b> · ' + u.teks + ' · <time>' + tglPendek(u.t) + '</time></span></div>';
748
      var gal = i === 0 && t.lampiran.length ? t.lampiran : (u.lampiran || []);
749
      var dariIt = u.peran && u.peran !== 'Pelapor';
750
      return '<div class="pesan' + (dariIt ? ' dari-it' : '') + '">' + avaHtml(u.oleh, true) + '<div class="gelembung"><div class="siapa-p"><b>' + esc(u.oleh) + '</b><small>' + esc(u.peran) + '</small><time>' + tglPendek(u.t) + '</time></div><p>' + esc(u.teks) + '</p>' +
751
        (gal.length ? '<div class="galeri">' + gal.map(function (g, j) { return '<button data-lihat="' + i + ':' + j + '" aria-label="Perbesar lampiran ' + (j + 1) + '"><img src="' + esc(g) + '" alt="Lampiran ' + (j + 1) + '"></button>'; }).join('') + '</div>' : '') + '</div></div>';
752
    }).join('');
753
    var opsiTek = '<option value="">Belum ditugaskan</option>' + D.teknisi.map(function (q) { return '<option value="' + q.id + '"' + (q.id === t.teknisiId ? ' selected' : '') + '>' + esc(q.nama) + ' (' + q.level + ')</option>'; }).join('');
754
    $('#laciIsi').innerHTML =
755
      '<header class="laci-kepala"><div class="t"><span class="mono redup kecil">' + t.no + ' · dibuat ' + tglPendek(t.dibuat) + '</span><h2 id="laciJudul">' + esc(t.judul) + '</h2><div class="pils">' + pilP(t.prioritas) + pilL(t.level) + pilS(t.status) + slaHtml(t) + '</div></div>' +
756
      '<button class="ikon-tombol tutup" aria-label="Tutup detail tiket">' + ikon('x') + '</button></header>' +
757
      '<section class="utas" aria-label="Percakapan"><div class="utas-gulir">' + utas + '</div>' +
758
      '<form class="balas" id="formBalas"><label for="balasTeks" class="sr">Tulis balasan</label><textarea id="balasTeks" placeholder="Tulis balasan atau catatan untuk pelapor…" rows="2"></textarea>' +
759
      '<div class="bar"><span class="redup kecil">Membalas sebagai <b>' + esc(namaSaya()) + '</b></span><span class="aksi-baris">' +
760
      '<a class="tombol garis kecil" target="_blank" rel="noopener" href="' + esc(linkWa(t.hp, pesanWa('kabar', t))) + '">' + ikon('wa') + 'Kabari pelapor</a>' +
761
      '<button class="tombol utama kecil" type="submit">' + ikon('kirim') + 'Kirim</button></span></div></form></section>' +
762
      '<aside class="properti" aria-label="Detail tiket">' +
763
      '<div class="grup"><h3>Batas SLA</h3><div class="sla-kotak ' + (s.kelas === 'lewat' ? 'lewat' : '') + '"><span class="besar" data-sla="' + t.id + '" data-polos>' + s.teks + '</span><div class="meter"><i style="width:' + Math.min(100, berjalan / total * 100) + '%;background:' + (s.kelas === 'lewat' ? 'var(--telat)' : s.kelas === 'mepet' ? 'var(--p-tinggi)' : 'var(--utama)') + '"></i></div><span class="redup kecil">Target ' + Math.round(total / JAM) + ' jam · ' + tglPanjang(t.tenggat) + '</span></div></div>' +
764
      '<div class="grup"><h3>Status</h3><label class="sr" for="pStatus">Status</label><select id="pStatus">' + STATUS.map(function (x) { return '<option value="' + x.k + '"' + (x.k === t.status ? ' selected' : '') + '>' + x.n + '</option>'; }).join('') + '</select>' +
765
      (terbuka(t) ? '<button class="tombol utama lebar" id="pSelesai">' + ikon('cek') + 'Tandai selesai</button>' : '') + '</div>' +
766
      '<div class="grup"><h3>Level eskalasi</h3><div class="tangga">' + ['L1', 'L2', 'L3'].map(function (l, i) { return '<span class="' + (i < iL ? 'lalu' : i === iL ? 'kini' : '') + '">' + l + '</span>'; }).join('') + '</div>' +
767
      (iL < 2 && terbuka(t) ? '<button class="tombol ' + (s.kelas === 'lewat' ? 'bahaya' : 'garis') + ' lebar" id="pEskalasi">' + ikon('naik') + (s.kelas === 'lewat' ? 'Lewat SLA — eskalasi ke ' : 'Eskalasi ke ') + ['L1', 'L2', 'L3'][iL + 1] + '</button>' : '') + '</div>' +
768
      '<div class="grup"><h3>Penugasan</h3><label class="sr" for="pTeknisi">Teknisi</label><select id="pTeknisi">' + opsiTek + '</select>' +
769
      '<label class="sr" for="pPrioritas">Prioritas</label><select id="pPrioritas"' + (admin ? '' : ' disabled') + '>' + PRIORITAS.map(function (p) { return '<option value="' + p.k + '"' + (p.k === t.prioritas ? ' selected' : '') + '>Prioritas ' + p.n + '</option>'; }).join('') + '</select></div>' +
770
      '<div class="grup"><h3>Pelapor</h3><dl><dt>Nama</dt><dd>' + esc(t.pelapor) + '</dd><dt>Divisi</dt><dd>' + esc(t.divisi) + '</dd><dt>Kategori</dt><dd>' + esc(t.kategori) + '</dd><dt>WhatsApp</dt><dd class="mono">' + esc(t.hp || '—') + '</dd></dl></div>' +
771
      '<div class="grup wa-grup"><h3>Notifikasi WhatsApp</h3>' +
772
      (tek ? tombolWa(tek.hp, pesanWa('dibuat', t), 'Ke teknisi ' + tek.nama.split(' ')[0]) : '') +
773
      tombolWa(t.hp, pesanWa(terbuka(t) ? 'diterima' : 'selesai', t), terbuka(t) ? 'Konfirmasi ke pelapor' : 'Info selesai ke pelapor') + '</div>' +
774
      (admin ? '<button class="tombol bahaya kecil" id="pHapus">' + ikon('hapus') + 'Hapus tiket</button>' : '') +
775
      '</aside>';
776
    $('#laci .tutup').onclick = function () { tutupLaci(); };
777
    $('#pStatus').onchange = function () { ubahStatus(t, this.value); };
778
    if ($('#pSelesai')) $('#pSelesai').onclick = function () { ubahStatus(t, 'selesai'); };
779
    if ($('#pEskalasi')) $('#pEskalasi').onclick = function () { eskalasi(t); };
780
    $('#pTeknisi').onchange = function () {
781
      t.teknisiId = this.value; var q = teknisi(t.teknisiId);
782
      catatPeristiwa(t, q ? 'Ditugaskan ke <b>' + esc(q.nama) + '</b> (' + q.level + ')' : 'Penugasan dilepas', 'orang'); simpan(); segarkanLaci(); segarkan();
783
      if (q) dialogWa('Kabari ' + q.nama, pesanWa('dibuat', t), [{ nama: 'WA ke ' + q.nama, hp: q.hp, ket: q.level }]);
784
    };
785
    $('#pPrioritas').onchange = function () {
786
      var lama = t.prioritas; t.prioritas = this.value; t.tenggat = new Date(new Date(t.dibuat).getTime() + D.sla[t.prioritas] * MENIT).toISOString();
787
      catatPeristiwa(t, 'Prioritas <b>' + pri(lama).n + '</b> → <b>' + pri(t.prioritas).n + '</b>, batas SLA dihitung ulang', 'peringatan'); simpan(); segarkanLaci(); segarkan();
788
    };
789
    if ($('#pHapus')) $('#pHapus').onclick = function () {
790
      konfirmasi('Hapus ' + t.no + '?', 'Tiket dan seluruh percakapannya akan dihapus.', 'Hapus', function () {
791
        var idx = D.tiket.indexOf(t); D.tiket.splice(idx, 1); simpan(); tutupLaci(); segarkan();
792
        toast(t.no + ' dihapus', { label: 'Urungkan', fn: function () { D.tiket.splice(idx, 0, t); simpan(); segarkan(); } });
793
      }, true);
794
    };
795
    $('#formBalas').onsubmit = function (e) {
796
      e.preventDefault(); var v = $('#balasTeks').value.trim(); if (!v) { $('#balasTeks').focus(); return; }
797
      t.utas.push({ id: uid(), t: new Date().toISOString(), jenis: 'pesan', oleh: namaSaya(), peran: sesi.peran === 'teknisi' ? 'Teknisi ' + ((teknisi(sesi.teknisiId) || {}).level || '') : 'Admin', teks: v });
798
      if (t.status === 'baru') { t.status = 'dikerjakan'; catatPeristiwa(t, 'Status jadi <b>Dikerjakan</b> (dibalas)', 'jam'); }
799
      simpan(); $('#balasTeks').value = ''; segarkanLaci(); segarkan(); var g = $('.utas-gulir'); g.scrollTop = g.scrollHeight;
800
    };
801
    $('#balasTeks').onkeydown = function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('#formBalas').requestSubmit(); };
802
    $$('[data-lihat]').forEach(function (b) { b.onclick = function () { var p = b.dataset.lihat.split(':'), u = t.utas[+p[0]]; var gal = +p[0] === 0 && t.lampiran.length ? t.lampiran : u.lampiran; lihatGambar(gal[+p[1]]); }; });
803
  }
804
  var fokusLb = null;
805
  function lihatGambar(src) { fokusLb = document.activeElement; $('#lightboxGambar').innerHTML = '<img alt="Lampiran tiket" src="' + esc(src) + '">'; $('#lightbox').hidden = false; $('#tutupLightbox').focus(); }
806
  function tutupLightbox() { $('#lightbox').hidden = true; $('#lightboxGambar').innerHTML = ''; if (fokusLb) fokusLb.focus(); }
807
  $('#tutupLightbox').onclick = tutupLightbox;
808
  $('#lightbox').addEventListener('click', function (e) { if (e.target.id === 'lightbox') tutupLightbox(); });
809

810
  // ================= BUAT TIKET =================
811
  var lampiranBaru = [], pPilih = 'sedang', lPilih = 'L1';
812
  var fT = $('#formTiket');
813
  $('#pilihPrioritas').innerHTML = PRIORITAS.map(function (p) { return '<label class="p-' + p.k + '"><input type="radio" name="prioritas" value="' + p.k + '"' + (p.k === pPilih ? ' checked' : '') + '><span><b>' + p.n + '</b><small>' + p.ket + '</small></span></label>'; }).join('');
814
  $('#pilihLevel').innerHTML = LEVEL.map(function (l) { return '<label><input type="radio" name="level" value="' + l.k + '"' + (l.k === lPilih ? ' checked' : '') + '><span><b>' + l.k + '</b><small>' + l.n + '</small></span></label>'; }).join('');
815
  function renderSlaInfo() {
816
    pPilih = fT.prioritas.value; lPilih = fT.level.value;
817
    var m = D.sla[pPilih], tgl = new Date(Date.now() + m * MENIT);
818
    $('#slaInfo').innerHTML = ikon('jam') + '<span>Target selesai <b>' + (m >= 1440 ? Math.round(m / 1440) + ' hari' : Math.round(m / 60) + ' jam') + '</b>, paling lambat <b>' + tglPanjang(tgl) + '</b>.' + (pPilih === 'kritis' ? ' Tim IT langsung dapat notifikasi.' : '') + '</span>';
819
  }
820
  fT.addEventListener('change', function (e) { if (e.target.name === 'prioritas' || e.target.name === 'level') renderSlaInfo(); if (e.target.closest('.bidang')) bersihkanGalat(e.target); });
821
  fT.addEventListener('input', function (e) { bersihkanGalat(e.target); });
822
  function bersihkanGalat(el) { var b = el.closest('.bidang'); if (b && b.classList.contains('salah')) { b.classList.remove('salah'); $('.galat', b).textContent = ''; } }
823
  function renderBuat() {
824
    fT.divisi.innerHTML = '<option value="">Pilih divisi</option>' + D.divisi.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
825
    fT.kategori.innerHTML = '<option value="">Pilih kategori</option>' + D.kategori.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
826
    fT.teknisi.innerHTML = '<option value="">Otomatis (teknisi level ini dengan tiket paling sedikit)</option>' + D.teknisi.map(function (q) { return '<option value="' + q.id + '">' + esc(q.nama) + ' (' + q.level + ')</option>'; }).join('');
827
    renderSlaInfo(); renderPratinjau();
828
  }
829
  function renderPratinjau() {
830
    $('#pratinjauLampiran').innerHTML = lampiranBaru.map(function (g, i) { return '<div class="thumb"><img src="' + g + '" alt="Lampiran ' + (i + 1) + '"><button type="button" data-hapus-lampiran="' + i + '" aria-label="Hapus lampiran ' + (i + 1) + '">' + ikon('x') + '</button></div>'; }).join('');
831
  }
832
  $('#pratinjauLampiran').addEventListener('click', function (e) { var b = e.target.closest('[data-hapus-lampiran]'); if (b) { lampiranBaru.splice(+b.dataset.hapusLampiran, 1); renderPratinjau(); } });
833
  function kecilkan(file) {
834
    return new Promise(function (ok, gagal) {
835
      if (!/^image\//.test(file.type)) return gagal(new Error('bukan gambar'));
836
      var r = new FileReader();
837
      r.onload = function () {
838
        var img = new Image();
839
        img.onload = function () {
840
          var s = Math.min(1, 1100 / Math.max(img.width, img.height)), c = document.createElement('canvas');
841
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
842
          var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
843
          ok(c.toDataURL('image/jpeg', .72));
844
        };
845
        img.onerror = gagal; img.src = r.result;
846
      };
847
      r.onerror = gagal; r.readAsDataURL(file);
848
    });
849
  }
850
  function tambahFile(files) {
851
    var arr = Array.prototype.slice.call(files || []).slice(0, Math.max(0, 4 - lampiranBaru.length));
852
    if (!arr.length) { if (files && files.length) toast('Maksimal 4 gambar per tiket'); return; }
853
    Promise.all(arr.map(function (f) { return kecilkan(f).catch(function () { return null; }); })).then(function (h) {
854
      var gagal = h.filter(function (x) { return !x; }).length;
855
      lampiranBaru = lampiranBaru.concat(h.filter(Boolean)); renderPratinjau();
856
      if (gagal) toast(gagal + ' berkas bukan gambar, dilewati');
857
    });
858
  }
859
  $('#fileLampiran').addEventListener('change', function () { tambahFile(this.files); this.value = ''; });
860
  var zona = $('#zonaUnggah');
861
  ['dragenter', 'dragover'].forEach(function (ev) { zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.add('seret-atas'); }); });
862
  ['dragleave', 'drop'].forEach(function (ev) { zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.remove('seret-atas'); }); });
863
  zona.addEventListener('drop', function (e) { tambahFile(e.dataTransfer.files); });
864
  fT.addEventListener('submit', function (e) {
865
    e.preventDefault();
866
    var salah = null;
867
    var cek = function (nama, pesan, syarat) { var el = fT[nama], b = el.closest('.bidang'); var gagal = !syarat(el.value.trim()); b.classList.toggle('salah', gagal); $('.galat', b).textContent = gagal ? pesan : ''; if (gagal && !salah) salah = el; };
868
    cek('pelapor', 'Isi nama pelapor.', function (v) { return v.length >= 2; });
869
    cek('hp', 'Nomor WA tidak valid (contoh 081234567890).', function (v) { return !v || /^(\+?62|0)?8\d{7,12}$/.test(v.replace(/[\s-]/g, '')); });
870
    cek('divisi', 'Pilih divisi.', function (v) { return !!v; });
871
    cek('judul', 'Tulis judul singkat masalahnya.', function (v) { return v.length >= 5; });
872
    cek('kategori', 'Pilih kategori.', function (v) { return !!v; });
873
    cek('deskripsi', 'Jelaskan masalahnya minimal 10 huruf.', function (v) { return v.length >= 10; });
874
    if (salah) { salah.focus(); toast('Lengkapi isian yang ditandai merah'); return; }
875
    var kini = Date.now(), p = fT.prioritas.value, l = fT.level.value;
876
    D.urut++;
877
    var t = {
878
      id: uid(), no: 'TK-' + String(1040 + D.urut).padStart(4, '0'), dibuat: new Date(kini).toISOString(), judul: fT.judul.value.trim(), pelapor: fT.pelapor.value.trim(), hp: fT.hp.value.trim(),
879
      divisi: fT.divisi.value, kategori: fT.kategori.value, deskripsi: fT.deskripsi.value.trim(), prioritas: p, level: l, status: 'baru',
880
      teknisiId: (sesi.peran !== 'tamu' && fT.teknisi.value) || pilihOtomatis(l), tenggat: new Date(kini + D.sla[p] * MENIT).toISOString(), selesai: null, lampiran: lampiranBaru.slice(), utas: []
881
    };
882
    t.utas.push({ id: uid(), t: t.dibuat, jenis: 'pesan', oleh: t.pelapor, peran: 'Pelapor', teks: t.deskripsi });
883
    var tek = teknisi(t.teknisiId);
884
    if (tek) t.utas.push({ id: uid(), t: t.dibuat, jenis: 'peristiwa', oleh: 'Sistem', peran: '', teks: 'Ditugaskan ke <b>' + esc(tek.nama) + '</b> (' + tek.level + ')', ikon: 'orang' });
885
    D.tiket.push(t);
886
    if (!simpan()) { D.tiket.pop(); D.urut--; t.lampiran = []; return; }
887
    fT.reset(); lampiranBaru = []; $('#toast').classList.remove('tampil'); renderPratinjau(); renderSlaInfo(); renderHitung();
888
    if (tek) kirimWebhook('dibuat', t, tek.hp, pesanWa('dibuat', t));
889
    if (D.hpAdmin) kirimWebhook('dibuat', t, D.hpAdmin, pesanWa('dibuat', t));
890
    if (p === 'kritis') { beritahu('Tiket KRITIS ' + t.no, t.judul + ' — ' + t.pelapor + ' (' + t.divisi + ')', t.id); sudahDiberitahu[t.id + 'k'] = 1; }
891
    dialog({
892
      judul: 'Tiket ' + t.no + ' terkirim',
893
      isi: '<p class="redup">Prioritas <b>' + pri(p).n + '</b>, level ' + l + (tek ? ', ditangani <b>' + esc(tek.nama) + '</b>' : '') + '. Target selesai ' + tglPanjang(t.tenggat) + '.</p>' +
894
        '<p class="kecil redup">Kirim notifikasi WhatsApp sekarang:</p><div class="wa-daftar">' +
895
        (tek ? tombolWa(tek.hp, pesanWa('dibuat', t), 'Ke teknisi ' + tek.nama, tek.level) : '') +
896
        (D.hpAdmin ? tombolWa(D.hpAdmin, pesanWa('dibuat', t), 'Ke ' + D.namaAdmin + ' (koordinator)', 'admin') : '') +
897
        (t.hp && sesi.peran !== 'tamu' ? tombolWa(t.hp, pesanWa('diterima', t), 'Konfirmasi ke ' + t.pelapor, 'pelapor') : '') + '</div>',
898
      aksi: sesi.peran === 'tamu' ? [{ label: 'Selesai', kelas: 'utama', fn: function () { keluar(); } }] : [{ label: 'Buat lagi' }, { label: 'Lihat tiket', kelas: 'utama', fn: function () { buka('tiket'); setTimeout(function () { bukaTiket(t.id); }, 50); } }]
899
    });
900
  });
901

902
  // ================= LAPORAN =================
903
  var periode = 30;
904
  $$('[data-periode]').forEach(function (b) { b.addEventListener('click', function () { periode = +b.dataset.periode; renderLaporan(); }); });
905
  function renderLaporan() {
906
    $$('[data-periode]').forEach(function (b) { b.setAttribute('aria-selected', +b.dataset.periode === periode); });
907
    var batas = periode ? Date.now() - periode * 86400e3 : 0;
908
    var L = D.tiket.filter(function (t) { return new Date(t.dibuat) >= batas; });
909
    var sel = L.filter(function (t) { return !terbuka(t); }), tepat = sel.filter(function (t) { return !lewatSla(t); });
910
    var rata = sel.length ? sel.reduce(function (s, t) { return s + lamaSelesai(t); }, 0) / sel.length : 0;
911
    $('#laporanSub').textContent = (periode ? periode + ' hari terakhir' : 'Seluruh data') + ' · ' + L.length + ' tiket';
912
    var st = [
913
      { l: 'Tiket masuk', ik: 'tiket', v: L.length, kls: 'utama-stat', c: L.filter(terbuka).length + ' masih terbuka' },
914
      { l: 'Selesai', ik: 'cek', v: sel.length, c: L.length ? Math.round(sel.length / L.length * 100) + '% dari tiket masuk' : '—' },
915
      { l: 'Kepatuhan SLA', ik: 'jam', v: sel.length ? tepat.length / sel.length * 100 : 0, c: tepat.length + ' tepat, ' + (sel.length - tepat.length) + ' lewat', fmt: function (x) { return Math.round(x) + '<small>%</small>'; } },
916
      { l: 'Rata-rata selesai', ik: 'laporan', v: rata / JAM, c: 'Dari tiket dibuat sampai selesai', fmt: function (x) { return x.toFixed(1).replace('.', ',') + '<small>jam</small>'; } }
917
    ];
918
    $('#statLaporan').innerHTML = st.map(function (s, i) { return '<div class="stat ' + (s.kls || '') + '" style="--i:' + i + '"><span class="stat-label">' + ikon(s.ik) + s.l + '</span><span class="stat-angka"></span><span class="stat-catatan">' + s.c + '</span></div>'; }).join('');
919
    st.forEach(function (s, i) { hitungKe($('.stat-angka', $('#statLaporan').children[i]), s.v, s.fmt); });
920
    var maksK = 1, perK = D.kategori.map(function (k) { var n = L.filter(function (t) { return t.kategori === k; }).length; maksK = Math.max(maksK, n); return { k: k, n: n }; }).sort(function (a, b) { return b.n - a.n; });
921
    $('#perKategori').innerHTML = perK.map(function (x, i) { return '<li style="--i:' + i + '"><span class="atas-b"><b>' + esc(x.k) + '</b><span>' + x.n + ' tiket</span></span><span class="meter"><i style="width:' + (x.n / maksK * 100) + '%"></i></span></li>'; }).join('');
922
    var maksP = Math.max(1, L.length);
923
    $('#perPrioritas').innerHTML = PRIORITAS.slice().reverse().map(function (p, i) {
924
      var a = L.filter(function (t) { return t.prioritas === p.k; }), s = a.filter(function (t) { return !terbuka(t); }), ok = s.filter(function (t) { return !lewatSla(t); }).length;
925
      return '<li class="p-' + p.k + '" style="--i:' + i + '"><span class="atas-b"><b>' + p.n + ' <span class="mono">· SLA ' + Math.round(D.sla[p.k] / 60) + ' jam</span></b><span>' + a.length + ' tiket · ' + (s.length ? Math.round(ok / s.length * 100) + '% tepat SLA' : 'belum ada selesai') + '</span></span><span class="meter"><i class="p" style="width:' + (a.length / maksP * 100) + '%"></i></span></li>';
926
    }).join('');
927
    $('#perTeknisi').innerHTML = '<thead><tr><th>Teknisi</th><th>Level</th><th class="angka">Ditangani</th><th class="angka">Selesai</th><th class="angka">Rata-rata</th><th class="angka">Tepat SLA</th></tr></thead><tbody>' +
928
      D.teknisi.map(function (q, i) {
929
        var a = L.filter(function (t) { return t.teknisiId === q.id; }), s = a.filter(function (t) { return !terbuka(t); }), ok = s.filter(function (t) { return !lewatSla(t); }).length;
930
        var r = s.length ? s.reduce(function (x, t) { return x + lamaSelesai(t); }, 0) / s.length : 0;
931
        return '<tr style="--i:' + i + '"><td><b>' + esc(q.nama) + '</b></td><td>' + pilL(q.level) + '</td><td class="angka">' + a.length + '</td><td class="angka">' + s.length + '</td><td class="angka">' + (s.length ? durasi(r) : '—') + '</td><td class="angka">' + (s.length ? Math.round(ok / s.length * 100) + '%' : '—') + '</td></tr>';
932
      }).join('') + '</tbody>';
933
  }
934
  function unduh(nama, isi, tipe) {
935
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([isi], { type: tipe })); a.download = nama;
936
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
937
  }
938
  function tglFile() { var d = new Date(); return d.getFullYear() + '-' + dua(d.getMonth() + 1) + '-' + dua(d.getDate()); }
939
  $('#eksporCsv').onclick = function () {
940
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
941
    var head = ['No', 'Dibuat', 'Judul', 'Pelapor', 'WhatsApp', 'Divisi', 'Kategori', 'Prioritas', 'Level', 'Status', 'Teknisi', 'Batas SLA', 'Selesai', 'Durasi (jam)', 'SLA'];
942
    var rows = D.tiket.map(function (t) {
943
      var tek = teknisi(t.teknisiId);
944
      return [t.no, tglPanjang(t.dibuat), t.judul, t.pelapor, t.hp, t.divisi, t.kategori, pri(t.prioritas).n, t.level, sts(t.status).n, tek ? tek.nama : '', tglPanjang(t.tenggat), t.selesai ? tglPanjang(t.selesai) : '', t.selesai ? (lamaSelesai(t) / JAM).toFixed(1) : '', lewatSla(t) ? 'Lewat' : (terbuka(t) ? 'Berjalan' : 'Tepat')].map(q).join(',');
945
    });
946
    unduh('tiket-helpdesk-' + tglFile() + '.csv', '﻿' + head.join(',') + '\n' + rows.join('\n'), 'text/csv;charset=utf-8');
947
    toast('CSV diunduh: ' + D.tiket.length + ' tiket');
948
  };
949
  $('#backupJson').onclick = function () { unduh('backup-helpdesk-' + tglFile() + '.json', JSON.stringify(D), 'application/json'); toast('Backup JSON diunduh'); };
950
  // ---- PDF: dibuat langsung di browser lalu diunduh (tanpa library tambahan) ----
951
  var PDF_LEBAR = {"r":[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,556,556,556,222,556,333,1000,556,556,333,1000,667,333,1000,556,611,556,556,222,222,333,333,350,556,1000,333,1000,500,333,944,556,500,667,556,333,556,556,556,556,260,556,333,737,370,556,584,556,737,333,400,584,556,556,333,556,537,278,333,556,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500],"b":[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,556,556,556,278,556,500,1000,556,556,333,1000,667,333,1000,556,611,556,556,278,278,500,500,350,556,1000,333,1000,556,333,944,556,500,667,556,333,556,556,556,556,280,556,333,737,370,556,584,556,737,333,400,584,556,556,333,611,556,278,333,556,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556]};
952
  function pdfLatin(s) {
953
    s = String(s == null ? '' : s);
954
    var peta = { '—': '\x97', '–': '\x96', '‘': '\x91', '’': '\x92', '“': '\x93', '”': '\x94', '•': '\x95', '…': '\x85', '€': '\x80', '→': '->', '←': '<-' }, o = '';
955
    for (var i = 0; i < s.length; i++) {
956
      var ch = s.charAt(i), c = s.charCodeAt(i);
957
      if ((c >= 32 && c <= 126) || (c >= 160 && c <= 255)) o += ch;
958
      else if (peta[ch]) o += peta[ch];
959
      else if (c < 32) o += ' ';
960
      else o += '?';
961
    }
962
    return o;
963
  }
964
  function pdfLebarTeks(s, f, sz) {
965
    var t = PDF_LEBAR[f], w = 0;
966
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i) - 32; w += (c >= 0 && t[c]) || 556; }
967
    return w * sz / 1000;
968
  }
969
  function pdfBungkus(s, f, sz, maks) {
970
    var hasil = [], baris = '';
971
    s.split(' ').forEach(function (k) {
972
      while (pdfLebarTeks(k, f, sz) > maks) {
973
        if (baris) { hasil.push(baris); baris = ''; }
974
        var i = 1; while (i < k.length && pdfLebarTeks(k.slice(0, i + 1), f, sz) <= maks) i++;
975
        hasil.push(k.slice(0, i)); k = k.slice(i);
976
      }
977
      var coba = baris ? baris + ' ' + k : k;
978
      if (baris && pdfLebarTeks(coba, f, sz) > maks) { hasil.push(baris); baris = k; } else baris = coba;
979
    });
980
    hasil.push(baris);
981
    return hasil;
982
  }
983
  function buatPdf(judul, mendatar) {
984
    var W = mendatar ? 842 : 595, H = mendatar ? 595 : 842, M = 28, hal = [], isi = null, y = 0, api = {};
985
    function baru() { isi = []; hal.push(isi); y = H - M; }
986
    function esk(s) { return s.replace(/[\\()]/g, '\\$&'); }
987
    function teks(x, yy, s, f, sz) { isi.push('BT /' + (f === 'b' ? 'F2' : 'F1') + ' ' + sz + ' Tf ' + x.toFixed(2) + ' ' + yy.toFixed(2) + ' Td (' + esk(s) + ') Tj ET'); }
988
    baru();
989
    api.ruang = function (h) { if (y - h < M + 16) baru(); };
990
    api.jarak = function (h) { y -= h; };
991
    api.paragraf = function (s, f, sz, geser) {
992
      var g = geser || 0, tl = sz * 1.35;
993
      pdfBungkus(pdfLatin(s), f, sz, W - 2 * M - g).forEach(function (l) { api.ruang(tl); y -= tl; teks(M + g, y + sz * .3, l, f, sz); });
994
    };
995
    api.tabel = function (kol, baris, sz) {
996
      var pad = 3, tl = sz * 1.3;
997
      function tarik(sel, f, abu, ulang) {
998
        var bg = sel.map(function (t, i) { return pdfBungkus(pdfLatin(t), f, sz, kol[i].w - 2 * pad); });
999
        var n = Math.max.apply(null, bg.map(function (b) { return b.length; })), tinggi = n * tl + 2 * pad;
1000
        if (y - tinggi < M + 16) { baru(); if (!ulang) tarik(kol.map(function (k) { return k.t; }), 'b', true, true); }
1001
        var x = M;
1002
        bg.forEach(function (lines, i) {
1003
          if (abu) isi.push('0.9 g ' + x.toFixed(2) + ' ' + (y - tinggi).toFixed(2) + ' ' + kol[i].w + ' ' + tinggi.toFixed(2) + ' re f 0 g');
1004
          isi.push('0.5 w 0.65 G ' + x.toFixed(2) + ' ' + (y - tinggi).toFixed(2) + ' ' + kol[i].w + ' ' + tinggi.toFixed(2) + ' re S 0 G');
1005
          lines.forEach(function (l, j) { teks(x + pad, y - pad - (j + 1) * tl + tl * .3, l, f, sz); });
1006
          x += kol[i].w;
1007
        });
1008
        y -= tinggi;
1009
      }
1010
      tarik(kol.map(function (k) { return k.t; }), 'b', true, false);
1011
      baris.forEach(function (b) { tarik(b, 'r', false, false); });
1012
    };
1013
    api.simpan = function (nama) {
1014
      var n = hal.length, objs = [], kids = [], i;
1015
      for (i = 0; i < n; i++) kids.push((5 + i * 2) + ' 0 R');
1016
      objs[1] = '<</Type/Catalog/Pages 2 0 R>>';
1017
      objs[2] = '<</Type/Pages/Kids[' + kids.join(' ') + ']/Count ' + n + '>>';
1018
      objs[3] = '<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>';
1019
      objs[4] = '<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>';
1020
      for (i = 0; i < n; i++) {
1021
        var ft = 'Halaman ' + (i + 1) + ' / ' + n;
1022
        isi = hal[i];
1023
        teks(M, 14, pdfLatin(judul), 'r', 7);
1024
        teks(W - M - pdfLebarTeks(ft, 'r', 7), 14, ft, 'r', 7);
1025
        var c = hal[i].join('\n');
1026
        objs[5 + i * 2] = '<</Type/Page/Parent 2 0 R/MediaBox[0 0 ' + W + ' ' + H + ']/Resources<</Font<</F1 3 0 R/F2 4 0 R>>>>/Contents ' + (6 + i * 2) + ' 0 R>>';
1027
        objs[6 + i * 2] = '<</Length ' + c.length + '>>\nstream\n' + c + '\nendstream';
1028
      }
1029
      objs.push('<</Title (' + esk(pdfLatin(judul)) + ')/Producer (Helpdesk Tiket)>>');
1030
      var out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', off = [];
1031
      for (i = 1; i < objs.length; i++) { off[i] = out.length; out += i + ' 0 obj\n' + objs[i] + '\nendobj\n'; }
1032
      var xr = out.length;
1033
      out += 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n';
1034
      for (i = 1; i < objs.length; i++) out += ('0000000000' + off[i]).slice(-10) + ' 00000 n \n';
1035
      out += 'trailer\n<</Size ' + objs.length + '/Root 1 0 R/Info ' + (objs.length - 1) + ' 0 R>>\nstartxref\n' + xr + '\n%%EOF';
1036
      var bytes = new Uint8Array(out.length);
1037
      for (i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
1038
      unduh(nama, bytes, 'application/pdf');
1039
    };
1040
    return api;
1041
  }
1042
  function tanpaTag(s) { return String(s == null ? '' : s).replace(/<[^>]*>/g, ''); }
1043
  function infoSla(t) { return lewatSla(t) ? 'Lewat' : (terbuka(t) ? 'Berjalan' : 'Tepat'); }
1044
  function tglPendek(t) { var d = new Date(t); return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear() + ' ' + dua(d.getHours()) + '.' + dua(d.getMinutes()); }
1045
  function eksporPdf() {
1046
    var p = buatPdf('Daftar Tiket Helpdesk', true);
1047
    p.paragraf('Daftar Tiket Helpdesk', 'b', 15);
1048
    p.paragraf('Dibuat ' + tglPanjang(new Date()) + ' | ' + D.tiket.length + ' tiket', 'r', 8.5);
1049
    p.jarak(8);
1050
    p.tabel([{ t: 'No', w: 44 }, { t: 'Dibuat', w: 68 }, { t: 'Judul', w: 130 }, { t: 'Pelapor', w: 66 }, { t: 'Divisi', w: 56 }, { t: 'Kategori', w: 62 }, { t: 'Prioritas', w: 44 }, { t: 'Level', w: 26 }, { t: 'Status', w: 50 }, { t: 'Teknisi', w: 64 }, { t: 'Batas SLA', w: 68 }, { t: 'Selesai', w: 68 }, { t: 'SLA', w: 40 }],
1051
      D.tiket.map(function (t) {
1052
        var tek = teknisi(t.teknisiId);
1053
        return [t.no, tglPendek(t.dibuat), t.judul, t.pelapor, t.divisi, t.kategori, pri(t.prioritas).n, t.level, sts(t.status).n, tek ? tek.nama : '', tglPendek(t.tenggat), t.selesai ? tglPendek(t.selesai) : '', infoSla(t)];
1054
      }), 7.5);
1055
    p.simpan('tiket-helpdesk-' + tglFile() + '.pdf');
1056
    toast('PDF diunduh: ' + D.tiket.length + ' tiket');
1057
  }
1058
  function backupPdf() {
1059
    var p = buatPdf('Backup Helpdesk Tiket', false);
1060
    p.paragraf('Backup Helpdesk Tiket', 'b', 15);
1061
    p.paragraf('Dibuat ' + tglPanjang(new Date()) + ' | ' + D.tiket.length + ' tiket | Arsip untuk dibaca. Untuk memulihkan data, gunakan backup JSON.', 'r', 8.5);
1062
    p.jarak(8);
1063
    p.paragraf('Teknisi', 'b', 11); p.jarak(3);
1064
    p.tabel([{ t: 'Nama', w: 300 }, { t: 'Level', w: 80 }], D.teknisi.map(function (q) { return [q.nama, q.level]; }), 8.5);
1065
    p.jarak(12);
1066
    p.paragraf('Tiket', 'b', 11); p.jarak(3);
1067
    D.tiket.forEach(function (t) {
1068
      var tek = teknisi(t.teknisiId);
1069
      p.ruang(80);
1070
      p.paragraf(t.no + ' - ' + t.judul, 'b', 9);
1071
      p.paragraf('Pelapor: ' + t.pelapor + ' (' + t.hp + ') | Divisi: ' + t.divisi + ' | Kategori: ' + t.kategori, 'r', 8, 8);
1072
      p.paragraf('Prioritas: ' + pri(t.prioritas).n + ' | Level: ' + t.level + ' | Status: ' + sts(t.status).n + ' | Teknisi: ' + (tek ? tek.nama : '-') + ' | SLA: ' + infoSla(t), 'r', 8, 8);
1073
      p.paragraf('Dibuat: ' + tglPanjang(t.dibuat) + ' | Batas SLA: ' + tglPanjang(t.tenggat) + (t.selesai ? ' | Selesai: ' + tglPanjang(t.selesai) : '') + (t.lampiran && t.lampiran.length ? ' | Lampiran: ' + t.lampiran.length : ''), 'r', 8, 8);
1074
      p.paragraf('Deskripsi: ' + (t.deskripsi || '-'), 'r', 8, 8);
1075
      (t.utas || []).forEach(function (u) { p.paragraf(tglPendek(u.t) + ' - ' + u.oleh + ': ' + tanpaTag(u.teks), 'r', 7.5, 18); });
1076
      p.jarak(8);
1077
    });
1078
    p.simpan('backup-helpdesk-' + tglFile() + '.pdf');
1079
    toast('Backup PDF diunduh: ' + D.tiket.length + ' tiket');
1080
  }
1081
  // tombol PDF disisipkan di samping tombol CSV dan JSON yang sudah ada
1082
  [['#eksporCsv', 'Ekspor PDF', 'eksporPdf', eksporPdf], ['#backupJson', 'Backup PDF', 'backupPdf', backupPdf]].forEach(function (c) {
1083
    var asal = $(c[0]); if (!asal || $('#' + c[2])) return;
1084
    var b = document.createElement('button'); b.type = 'button'; b.id = c[2]; b.className = asal.className; b.textContent = c[1]; b.onclick = c[3];
1085
    asal.parentNode.insertBefore(b, asal.nextSibling);
1086
  });
1087
  $('#pulihkan').onchange = function () {
1088
    var f = this.files[0]; this.value = ''; if (!f) return;
1089
    var r = new FileReader();
1090
    r.onload = function () {
1091
      var x; try { x = JSON.parse(r.result); } catch (e) { x = null; }
1092
      if (!x || !Array.isArray(x.tiket) || !Array.isArray(x.teknisi)) { toast('Berkas bukan backup Helpdesk Tiket yang valid'); return; }
1093
      konfirmasi('Pulihkan backup?', 'Data sekarang (' + D.tiket.length + ' tiket) diganti isi backup (' + x.tiket.length + ' tiket).', 'Pulihkan', function () { var lama = D; muat(x); if (!simpan()) D = lama; segarkan(); toast('Backup dipulihkan'); });
1094
    };
1095
    r.readAsText(f);
1096
  };
1097

1098
  // ================= ATUR =================
1099
  function renderAtur() {
1100
    $('#daftarTeknisi').innerHTML = D.teknisi.map(function (q) {
1101
      return '<li>' + avaHtml(q.nama) + '<div><b>' + esc(q.nama) + '</b><small>' + q.level + ' · ' + LEVEL.filter(function (l) { return l.k === q.level; })[0].n + ' · <span class="mono">' + esc(q.hp || 'tanpa WA') + '</span></small></div>' +
1102
        '<span class="aksi"><button class="ikon-tombol" data-ubah-tek="' + q.id + '" aria-label="Ubah ' + esc(q.nama) + '">' + ikon('atur') + '</button><button class="ikon-tombol" data-hapus-tek="' + q.id + '" aria-label="Hapus ' + esc(q.nama) + '">' + ikon('hapus') + '</button></span></li>';
1103
    }).join('') || '<li class="redup">Belum ada teknisi.</li>';
1104
    $('#slaAtur').innerHTML = PRIORITAS.map(function (p) { return '<label class="p-' + p.k + '"><span class="nama">' + pilP(p.k) + '<small>' + p.ket + '</small></span><span><input type="number" min="1" max="720" step="1" data-sla-p="' + p.k + '" value="' + Math.round(D.sla[p.k] / 60) + '" aria-label="SLA ' + p.n + ' dalam jam"></span></label>'; }).join('') + '<p class="kecil redup">Dalam jam. Tiket lama tidak berubah.</p>';
1105
    $('#hpAdmin').value = D.hpAdmin || '';
1106
    $('#pinAdmin').value = D.pin.admin; $('#pinTeknisi').value = D.pin.teknisi;
1107
    renderStatusNotif();
1108
  }
1109
  function renderStatusNotif() {
1110
    var el = $('#statusNotif'), b = $('#izinNotif');
1111
    if (!('Notification' in window)) { el.textContent = 'Browser ini tidak mendukung notifikasi.'; b.disabled = true; return; }
1112
    var p = Notification.permission;
1113
    el.textContent = p === 'granted' ? 'Aktif: muncul untuk tiket Kritis & lewat SLA.' : p === 'denied' ? 'Diblokir. Izinkan lewat ikon gembok di bilah alamat.' : 'Muncul untuk tiket Kritis dan tiket lewat SLA.';
1114
    b.disabled = p !== 'default'; b.lastChild.textContent = p === 'granted' ? 'Aktif' : 'Aktifkan';
1115
  }
1116
  $('#izinNotif').onclick = function () { Notification.requestPermission().then(function () { renderStatusNotif(); if (Notification.permission === 'granted') beritahu('Notifikasi aktif', 'Kamu akan diberi tahu saat ada tiket Kritis.', 'uji'); }); };
1117
  $('#slaAtur').addEventListener('change', function (e) {
1118
    var p = e.target.dataset.slaP; if (!p) return; var v = Math.min(720, Math.max(1, Math.round(+e.target.value || 0)));
1119
    e.target.value = v; D.sla[p] = v * 60; simpan(); toast('SLA ' + pri(p).n + ' jadi ' + v + ' jam');
1120
  });
1121
  $('#hpAdmin').onchange = function () { D.hpAdmin = this.value.trim(); simpan(); toast('Nomor koordinator disimpan'); };
1122
  $('#simpanPin').onclick = function () {
1123
    var a = $('#pinAdmin').value.trim(), t = $('#pinTeknisi').value.trim();
1124
    if (!/^\d{4,6}$/.test(a) || !/^\d{4,6}$/.test(t)) { toast('PIN harus 4–6 angka'); return; }
1125
    if (a === t) { toast('PIN admin dan teknisi harus berbeda'); return; }
1126
    D.pin = { admin: a, teknisi: t }; simpan(); toast('PIN disimpan');
1127
  };
1128
  function formTeknisi(q) {
1129
    q = q || {};
1130
    dialog({
1131
      judul: q.id ? 'Ubah teknisi' : 'Tambah teknisi',
1132
      isi: '<label class="bidang"><span>Nama *</span><input name="nama" value="' + esc(q.nama || '') + '" placeholder="mis. Rudi Hartono"><em class="galat"></em></label>' +
1133
        '<label class="bidang"><span>No. WhatsApp</span><input name="hp" inputmode="tel" value="' + esc(q.hp || '') + '" placeholder="0812xxxx"></label>' +
1134
        '<label class="bidang"><span>Level</span><select name="level">' + LEVEL.map(function (l) { return '<option value="' + l.k + '"' + (l.k === (q.level || 'L1') ? ' selected' : '') + '>' + l.k + ' · ' + l.n + '</option>'; }).join('') + '</select></label>',
1135
      aksi: [{ label: 'Batal' }, { label: 'Simpan', kelas: 'utama', submit: true, fn: function (f) {
1136
        var n = f.nama.value.trim(); if (n.length < 2) { f.nama.closest('.bidang').classList.add('salah'); $('.galat', f).textContent = 'Isi nama teknisi.'; f.nama.focus(); return false; }
1137
        if (q.id) { q.nama = n; q.hp = f.hp.value.trim(); q.level = f.level.value; } else D.teknisi.push({ id: uid(), nama: n, hp: f.hp.value.trim(), level: f.level.value });
1138
        simpan(); renderAtur(); toast('Teknisi disimpan');
1139
      } }]
1140
    });
1141
  }
1142
  $('#tambahTeknisi').onclick = function () { formTeknisi(); };
1143
  $('#daftarTeknisi').addEventListener('click', function (e) {
1144
    var u = e.target.closest('[data-ubah-tek]'), h = e.target.closest('[data-hapus-tek]');
1145
    if (u) formTeknisi(teknisi(u.dataset.ubahTek));
1146
    if (h) {
1147
      var q = teknisi(h.dataset.hapusTek), n = bebanTeknisi(q.id);
1148
      konfirmasi('Hapus ' + q.nama + '?', n ? n + ' tiket terbuka miliknya akan jadi "Belum ditugaskan".' : 'Riwayat tiket tetap tersimpan.', 'Hapus', function () {
1149
        D.tiket.forEach(function (t) { if (terbuka(t) && t.teknisiId === q.id) t.teknisiId = ''; });
1150
        D.teknisi = D.teknisi.filter(function (x) { return x !== q; }); simpan(); renderAtur(); toast(q.nama + ' dihapus');
1151
      }, true);
1152
    }
1153
  });
1154
  $('#muatContoh').onclick = function () { konfirmasi('Muat data contoh?', 'Semua tiket & teknisi sekarang diganti data contoh. Unduh backup dulu kalau perlu.', 'Muat contoh', function () { var pin = D.pin; D = dataContoh(); D.pin = pin; simpan(); renderAtur(); renderHitung(); toast('Data contoh dimuat'); }); };
1155
  $('#kosongkan').onclick = function () {
1156
    konfirmasi('Kosongkan semua tiket?', 'Teknisi, SLA, dan PIN tetap. Tiket (' + D.tiket.length + ') dihapus.', 'Kosongkan', function () {
1157
      var lama = D.tiket, urut = D.urut; D.tiket = []; D.contoh = false; simpan(); renderHitung();
1158
      toast('Tiket dikosongkan', { label: 'Urungkan', fn: function () { D.tiket = lama; D.urut = urut; simpan(); renderHitung(); } });
1159
    }, true);
1160
  };
1161

1162
  // ---------- Detak: hitung mundur SLA & notifikasi lewat SLA ----------
1163
  setInterval(function () {
1164
    if (!sesi || sesi.peran === 'tamu' || document.hidden) return;
1165
    $$('[data-sla]').forEach(function (el) {
1166
      var t = tiket(el.dataset.sla); if (!t || !terbuka(t)) return; var s = infoSla(t);
1167
      if (el.hasAttribute('data-polos')) { el.textContent = s.teks; return; }
1168
      el.className = 'sla ' + s.kelas; var sp = el.lastChild; if (sp) sp.textContent = s.teks;
1169
    });
1170
    D.tiket.forEach(function (t) {
1171
      if (terbuka(t) && lewatSla(t) && (t.prioritas === 'kritis' || t.prioritas === 'tinggi') && !sudahDiberitahu[t.id]) {
1172
        sudahDiberitahu[t.id] = 1;
1173
        if (new Date() - new Date(t.tenggat) < 5000) { beritahu(t.no + ' lewat SLA', t.judul + ' — pertimbangkan eskalasi ke level berikutnya.', t.id); toast(t.no + ' baru saja lewat SLA', { label: 'Buka', fn: function () { bukaTiket(t.id); } }); }
1174
      }
1175
    });
1176
  }, 1000);
1177

1178
  // ---------- Tema (customizer Maliki Studio, lihat tema.css & tema.js) ----------
1179
  var FONT_OK = ['Plus Jakarta Sans', 'Inter', 'Poppins', 'DM Sans', 'Space Grotesk', 'Nunito'];
1180
  function terapkanTema(t) {
1181
    var r = document.documentElement, st = r.style;
1182
    if (t.utama) st.setProperty('--tema-utama', t.utama);
1183
    if (t.aksen) st.setProperty('--tema-aksen', t.aksen);
1184
    if (t.radius != null) st.setProperty('--tema-radius', typeof t.radius === 'number' ? t.radius + 'px' : t.radius);
1185
    if (t.font) {
1186
      var f = String(t.font).split(',')[0].replace(/["']/g, '').trim();
1187
      st.setProperty('--tema-font', '"' + f + '", system-ui, sans-serif');
1188
      var l = $('#fontTema'); if (l && FONT_OK.indexOf(f) >= 0) l.href = 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + ':wght@400;500;600;700;800&display=swap';
1189
    }
1190
    if (t.mode) r.setAttribute('data-mode', t.mode === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'gelap' : 'terang') : t.mode);
1191
    if (t.bagian) terapkanBagian(t.bagian);
1192
    if (t.nama) { NAMA_TEMA = t.nama; $$('[data-tema-nama]').forEach(function (e) { e.textContent = t.nama; }); }
1193
    setTimeout(hitungTeksBagian, 0);
1194
  }
1195
  window.addEventListener('message', function (e) { if (e.data && e.data.tipe === 'tema') terapkanTema(e.data); });
1196

1197
  // ---------- Bagian (warna per bagian, sorot, tap-untuk-pilih) ----------
1198
  var NAMA_BAGIAN = { nav: 'Navigasi', latar: 'Latar', panel: 'Panel', utama: 'Warna utama', aksen: 'Aksen', teks: 'Teks' };
1199
  var VAR_BAGIAN = { latar: '--latar', panel: '--kartu', nav: '--nav', teks: '--teks' };
1200
  var PETA_TAMBAHAN = { aksen: '.hitung, .ava, .sla-info, .grafik .b, .legenda', teks: 'h1, h2, .stat-angka', utama: '.nav.aktif, .seg[aria-selected="true"], .tombol.utama, .stat.utama-stat', panel: '.stat, .kartu-tiket, .kolom' };
1201
  function tandaiBagian() {
1202
    Object.keys(PETA_TAMBAHAN).forEach(function (b) { $$(PETA_TAMBAHAN[b]).forEach(function (el) { if (!el.hasAttribute('data-bagian')) el.setAttribute('data-bagian', b); }); });
1203
  }
1204
  function warnaNyata(v) {
1205
    var p = document.createElement('i'); p.style.cssText = 'position:absolute;width:0;height:0;background:var(' + v + ')';
1206
    document.body.appendChild(p); var c = getComputedStyle(p).backgroundColor; p.remove();
1207
    var m = (c.match(/[\d.]+/g) || [255, 255, 255]).map(Number);
1208
    if (/^color\(srgb/.test(c)) m = m.map(function (x) { return x * 255; });
1209
    return m.slice(0, 3);
1210
  }
1211
  function teksUntuk(v) {
1212
    var l = warnaNyata(v).map(function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
1213
    return (0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]) > 0.4 ? '#14181d' : '#ffffff';
1214
  }
1215
  function hitungTeksBagian() {
1216
    var st = document.documentElement.style;
1217
    st.setProperty('--tema-nav-teks', teksUntuk('--nav'));
1218
    st.setProperty('--tema-utama-teks', teksUntuk('--utama'));
1219
  }
1220
  function terapkanBagian(bg) {
1221
    var st = document.documentElement.style;
1222
    Object.keys(VAR_BAGIAN).forEach(function (k) {
1223
      if (bg[k] === undefined) return;
1224
      if (bg[k]) { st.setProperty('--tema-' + k, bg[k]); st.setProperty(VAR_BAGIAN[k], bg[k]); }
1225
      else { st.removeProperty('--tema-' + k); st.removeProperty(VAR_BAGIAN[k]); }
1226
    });
1227
  }
1228
  var sorotAktif = null;
1229
  function sorot(b) {
1230
    sorotAktif = b;
1231
    $$('[data-sorot]').forEach(function (e) { e.removeAttribute('data-sorot'); });
1232
    $$('.label-sorot').forEach(function (e) { e.remove(); });
1233
    if (!b) return;
1234
    $$('[data-bagian="' + b + '"]').forEach(function (e) {
1235
      e.setAttribute('data-sorot', '');
1236
      var r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
1237
      var lb = document.createElement('span'); lb.className = 'label-sorot'; lb.textContent = NAMA_BAGIAN[b] || b;
1238
      lb.style.left = Math.max(2, r.left + 4) + 'px'; lb.style.top = Math.max(2, r.top + 4) + 'px';
1239
      document.body.appendChild(lb);
1240
    });
1241
  }
1242
  var modePilih = false, hoverEl = null;
1243
  function bagianDari(t) { return t && t.closest ? t.closest('[data-bagian]') : null; }
1244
  function setPilih(on) {
1245
    modePilih = !!on; document.documentElement.classList.toggle('mode-pilih', modePilih);
1246
    if (!modePilih && hoverEl) { hoverEl.removeAttribute('data-pilih-hover'); hoverEl = null; }
1247
  }
1248
  ['click', 'pointerdown', 'mousedown', 'touchstart', 'submit', 'keydown', 'dragstart', 'change'].forEach(function (tipe) {
1249
    window.addEventListener(tipe, function (e) {
1250
      if (!modePilih) return;
1251
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
1252
      if (tipe === 'click') { var el = bagianDari(e.target); if (el) parent.postMessage({ tipe: 'bagian-dipilih', bagian: el.getAttribute('data-bagian') }, '*'); }
1253
    }, { capture: true, passive: false });
1254
  });
1255
  document.addEventListener('mouseover', function (e) {
1256
    if (!modePilih) return; var el = bagianDari(e.target);
1257
    if (hoverEl && hoverEl !== el) hoverEl.removeAttribute('data-pilih-hover');
1258
    hoverEl = el; if (el) el.setAttribute('data-pilih-hover', '');
1259
  }, true);
1260
  window.addEventListener('message', function (e) {
1261
    var d = e.data; if (!d) return;
1262
    if (d.tipe === 'sorot') sorot(d.bagian || null);
1263
    else if (d.tipe === 'mode-pilih') setPilih(d.aktif);
1264
  });
1265
  new MutationObserver(function (ms) {
1266
    var mode = ms.some(function (m) { return m.type === 'attributes'; });
1267
    var dom = ms.some(function (m) { return m.type === 'childList' && Array.prototype.some.call(m.addedNodes, function (n) { return n.nodeType === 1 && n.className !== 'label-sorot'; }); });
1268
    if (dom) { tandaiBagian(); if (sorotAktif) sorot(sorotAktif); } if (mode) hitungTeksBagian();
1269
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-mode'] });
1270

1271
  // ---------- Mulai ----------
1272
  function mulai() {
1273
  muat(SV.awal);
1274
  $$('[data-tema-nama]').forEach(function (e) { e.textContent = NAMA_TEMA; });
1275
  tandaiBagian(); hitungTeksBagian(); renderHitung();
1276
  var simpanan = null; try { simpanan = JSON.parse(sessionStorage.getItem(KUNCI_SESI)); } catch (e) {}
1277
  var qs = new URLSearchParams(location.search);
1278
  // ?demo (atau dibuka di iframe pratinjau customizer) langsung masuk sebagai admin
1279
  if (qs.has('demo') || window.self !== window.top) simpanan = { peran: 'admin' };
1280
  if (simpanan && simpanan.peran) masuk(simpanan); else tampilGerbang();
1281
  if (SV.gagal) toast('Tidak bisa terhubung ke database. Data sementara hanya tersimpan di browser ini.');
1282
  if (qs.has('tiket')) { var tq = D.tiket.filter(function (t) { return t.no === qs.get('tiket'); })[0]; if (tq) bukaTiket(tq.id); }
1283
  }
1284
  sinkronAwal(mulai);
1285
})();
1286
