/* kredit-maliki: Template oleh Maliki Saputra (@malikisaputra) — https://malikisaputra.biz.id. Lisensi Nonkomersial Maliki Studio: wajib kredit, dilarang dijual (lihat LICENSE). */
/* Helpdesk Tiket IT — tiket IT support dengan prioritas, level eskalasi L1–L3, SLA, utas, dan notifikasi WhatsApp.
   HTML/CSS/JS murni, data di localStorage. Dibuat oleh Maliki Studio — malikisaputra.biz.id (Lisensi Nonkomersial Maliki Studio).
   Peta kode: lihat .claude/skills/ubah-helpdesk-tiket/SKILL.md */
(function () {
  'use strict';
  // ---- Data bersama lewat Supabase (isi dua baris ini; kosongkan bila tidak dipakai) ----
  var SUPABASE_URL = 'https://zvfgecbwxtssofoaltpg.supabase.co';   // contoh: 'https://abcdefgh.supabase.co'
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZmdlY2J3eHRzc29mb2FsdHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1ODc3OTEsImV4cCI6MjExMTE2Mzc5MX0.wvC6FWfKgZgbk0cSsSgmukLBp5SWg4mmmWeF6BPVoYA';   // kunci 'anon' / 'publishable' dari Supabase: Project Settings > API
  var KUNCI = 'helpdeskTiket.v1';
  var KUNCI_SESI = 'helpdeskTiket.sesi';
  var VERSI = 2;
  // OPSIONAL: URL webhook perantara (Google Apps Script / Cloudflare Worker) yang meneruskan ke gateway WA
  // (Fonnte / WhatsApp Cloud API). Kosong = hanya tombol wa.me. Panduan & contoh kode: README bagian "Kirim WA otomatis".
  // JANGAN taruh token gateway di sini — token disimpan di server perantara.
  var WEBHOOK_WA = '';
  // ---------- KONFIG GAMBAR (ganti logo & foto di sini) ----------
  // Timpa berkas di folder img/ atau ubah path/URL di bawah. Gagal dimuat = kembali ke ikon/inisial.
  var KONFIG = {
    logo: 'img/logo.svg',                    // logo di header & sidebar (persegi, mis. 256×256)
    avatar: {                                // foto agen/pelapor per nama persis (persegi, mis. 96×96)
      'Dimas Pratama': 'img/avatar-agen.svg'
    },
    avatarPelapor: ''                        // foto default semua pelapor, mis. 'img/avatar-pelapor.svg'; kosong = inisial
  };
  var NAMA_TEMA = (window.TEMA && window.TEMA.nama) || 'IT Support';

  function pasangLogo() {
    if (!KONFIG.logo) return;
    Array.prototype.forEach.call(document.querySelectorAll('.merek .logo'), function (el) {
      var asli = el.innerHTML, img = new Image();
      img.alt = ''; img.onload = function () { el.classList.add('ada-gambar'); el.innerHTML = ''; el.appendChild(img); };
      img.onerror = function () { el.innerHTML = asli; };
      img.src = KONFIG.logo;
    });
  }
  pasangLogo();

  // ---------- Utilitas ----------
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function dua(n) { return (n < 10 ? '0' : '') + n; }
  function ikon(n) { return '<svg aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  var HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var kurangGerak = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var JAM = 3600e3, MENIT = 60e3;
  function tglPendek(t) { var d = new Date(t); return d.getDate() + ' ' + BULAN[d.getMonth()] + ', ' + dua(d.getHours()) + '.' + dua(d.getMinutes()); }
  function tglPanjang(t) { var d = new Date(t); return HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear() + ' ' + dua(d.getHours()) + '.' + dua(d.getMinutes()); }
  function lalu(t) {
    var s = (Date.now() - new Date(t)) / 1000;
    if (s < 60) return 'baru saja'; if (s < 3600) return Math.floor(s / 60) + ' mnt lalu';
    if (s < 86400) return Math.floor(s / 3600) + ' jam lalu'; if (s < 172800) return 'kemarin';
    return Math.floor(s / 86400) + ' hari lalu';
  }
  function durasi(ms) {
    ms = Math.abs(ms); var m = Math.floor(ms / MENIT), j = Math.floor(m / 60), h = Math.floor(j / 24);
    if (h >= 1) return h + 'h ' + (j % 24) + 'j';
    if (j >= 1) return j + 'j ' + dua(m % 60) + 'm';
    var d = Math.floor(ms / 1000) % 60; return m + ':' + dua(d);
  }
  function avaHtml(n, kecil) {
    var src = KONFIG.avatar[n] || '';
    if (!src && KONFIG.avatarPelapor && !(typeof D !== 'undefined' && D && (D.teknisi || []).some(function (q) { return q.nama === n; }))) src = KONFIG.avatarPelapor;
    var ini = inisial(n);
    return '<span class="ava' + (kecil ? ' kecil' : '') + '" aria-hidden="true">' + (src ? '<img src="' + esc(src) + '" alt="" onerror="this.parentNode.textContent=\'' + esc(ini) + '\'">' : ini) + '</span>';
  }
  function inisial(n) { return String(n || '?').split(/\s+/).map(function (x) { return x[0]; }).join('').slice(0, 2).toUpperCase(); }

  // ---------- Konstanta ----------
  var PRIORITAS = [
    { k: 'rendah', n: 'Rendah', ket: 'Tidak menghambat kerja' },
    { k: 'sedang', n: 'Sedang', ket: 'Sebagian kerja terganggu' },
    { k: 'tinggi', n: 'Tinggi', ket: 'Kerja satu divisi terhenti' },
    { k: 'kritis', n: 'Kritis', ket: 'Operasional perusahaan lumpuh' }
  ];
  var STATUS = [
    { k: 'baru', n: 'Baru', warna: 'var(--utama-teks-di-kartu)' },
    { k: 'dikerjakan', n: 'Dikerjakan', warna: 'var(--p-sedang)' },
    { k: 'menunggu', n: 'Menunggu', warna: 'var(--p-tinggi)' },
    { k: 'selesai', n: 'Selesai', warna: 'var(--ok)' }
  ];
  var LEVEL = [
    { k: 'L1', n: 'Helpdesk', ket: 'Penanganan awal' },
    { k: 'L2', n: 'Teknisi senior', ket: 'Masalah teknis lanjut' },
    { k: 'L3', n: 'Spesialis', ket: 'Server, vendor, sistem inti' }
  ];
  function pri(k) { return PRIORITAS.filter(function (p) { return p.k === k; })[0] || PRIORITAS[1]; }
  function sts(k) { return STATUS.filter(function (s) { return s.k === k; })[0] || STATUS[0]; }

  // ---------- Data ----------
  // Skema: { versi, urut, hpAdmin, pin:{admin,teknisi}, sla:{rendah,sedang,tinggi,kritis} (menit),
  //   divisi:[..], kategori:[..], teknisi:[{id,nama,hp,level}], namaAdmin (nama koordinator IT),
  //   tiket:[{id,no,dibuat,judul,pelapor,hp,divisi,kategori,deskripsi,prioritas,level,status,teknisiId,tenggat,selesai,lampiran:[dataURL],
  //           utas:[{id,t,jenis:'pesan'|'peristiwa',oleh,peran,teks,ikon,lampiran}]}] }
  // Divisi bawaan (v2). DIVISI_LAMA dipakai migrasi: hanya diganti bila daftar pengguna masih persis bawaan lama.
  var DIVISI_BARU = ['KPR', 'CS', 'Kasir', 'Finance', 'Accounting', 'LEGAL', 
                     'IT', 'Admin', 'Marketing'];
  var DIVISI_V2_AWAL = ['KPR', 'CS', 'Kasir', 'Finance', 'Accounting']; // daftar bawaan sebelum LEGAL ditambahkan
  var DIVISI_LAMA = ['Keuangan', 'HRD', 'Pemasaran', 'Gudang', 'Produksi', 'Front Office', 'Direksi'];
  // Pemetaan divisi lama -> baru, khusus untuk data contoh
  var PETA_DIVISI = { 'Keuangan': 'Finance', 'HRD': 'Accounting', 'Pemasaran': 'KPR', 'Gudang': 'Kasir', 'Produksi': 'KPR', 'Front Office': 'CS', 'Direksi': 'Accounting' };
  function dataKosong() {
    return {
      versi: VERSI, urut: 0, hpAdmin: '089623092342', namaAdmin: 'Masri', pin: { admin: '1234', teknisi: '1111' },
      sla: { rendah: 72 * 60, sedang: 24 * 60, tinggi: 8 * 60, kritis: 2 * 60 },
      divisi: DIVISI_BARU.slice(),
      kategori: ['Hardware', 'Software', 'Jaringan & Internet', 'Printer', 'Email & Akun', 'Akses ERP', 'CCTV & Telepon'],
      teknisi: [], tiket: []
    };
  }
  // Gambar lampiran contoh: SVG buatan sendiri (tangkapan layar pesan galat fiktif)
  function svgContoh(judul, warna) {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#e8ecef"/><rect x="0" y="0" width="640" height="36" fill="#2b3640"/><circle cx="20" cy="18" r="6" fill="#ff6159"/><circle cx="40" cy="18" r="6" fill="#ffbd2e"/><circle cx="60" cy="18" r="6" fill="#28c941"/>' +
      '<rect x="150" y="110" width="340" height="180" rx="12" fill="#fff" stroke="#c9d1d8"/><circle cx="196" cy="160" r="20" fill="' + warna + '"/><path d="M196 150v12M196 168v1" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
      '<text x="230" y="156" font-family="Arial" font-size="17" font-weight="700" fill="#1d2329">' + judul + '</text><text x="230" y="178" font-family="Arial" font-size="13" fill="#5b6670">Kode galat 0x8007 — hubungi admin</text>' +
      '<rect x="380" y="240" width="90" height="32" rx="8" fill="#2b6cb0"/><text x="410" y="261" font-family="Arial" font-size="13" fill="#fff">OK</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }
  function dataContoh() {
    var d = dataKosong(), kini = Date.now();
    d.hpAdmin = '089623092342';
    d.namaAdmin = 'Masri';
    d.teknisi = [
      { id: 't1', nama: 'Dimas Pratama', hp: '081234500111', level: 'L1' },
      { id: 't2', nama: 'Siti Nurhaliza', hp: '081234500122', level: 'L1' },
      { id: 't3', nama: 'Arif Hidayat', hp: '081234500133', level: 'L2' },
      { id: 't4', nama: 'Yoga Saputra', hp: '081234500144', level: 'L2' },
      { id: 't5', nama: 'Bambang Wijaya', hp: '081234500155', level: 'L3' }
    ];
    // [jam lalu dibuat, judul, pelapor, divisi, kategori, prioritas, level, status, teknisi, jam kerja sampai selesai, deskripsi]
    var c = [
      [1.2, 'Server ERP tidak bisa diakses semua cabang', 'Hendra Kusuma', 'Keuangan', 'Akses ERP', 'kritis', 'L3', 'dikerjakan', 't5', 0, 'Sejak jam 8 pagi login ERP muncul "Connection timed out". Semua cabang kena, transaksi kasir tertahan.'],
      [2.6, 'Internet kantor lantai 3 mati total', 'Maya Anggraini', 'Pemasaran', 'Jaringan & Internet', 'kritis', 'L2', 'baru', 't3', 0, 'Wi-Fi dan LAN di lantai 3 tidak ada koneksi. Meeting online dengan klien jam 10.'],
      [5.5, 'Printer gudang macet, label pengiriman tertunda', 'Joko Susilo', 'Gudang', 'Printer', 'tinggi', 'L1', 'dikerjakan', 't1', 0, 'Printer label Zebra berkedip merah, kertas tersangkut. Sudah coba matikan-nyalakan.'],
      [9, 'Email tidak bisa kirim lampiran besar', 'Rina Wulandari', 'HRD', 'Email & Akun', 'sedang', 'L1', 'menunggu', 't2', 0, 'Lampiran PDF 18 MB selalu gagal terkirim. Menunggu konfirmasi batas ukuran dari vendor email.'],
      [10.5, 'Laptop lambat setelah update Windows', 'Fajar Nugroho', 'Pemasaran', 'Software', 'tinggi', 'L2', 'dikerjakan', 't4', 0, 'Setelah update semalam laptop butuh 10 menit untuk menyala dan Excel sering not responding.'],
      [20, 'Minta akses folder bersama Laporan Pajak', 'Dewi Lestari', 'Keuangan', 'Akses ERP', 'rendah', 'L1', 'baru', '', 0, 'Mohon dibuatkan akses baca-tulis ke folder \\\\NAS\\Keuangan\\Pajak2026.'],
      [27, 'Telepon ekstensi resepsionis tidak berdering', 'Putri Ayu', 'Front Office', 'CCTV & Telepon', 'sedang', 'L1', 'baru', 't1', 0, 'Ekstensi 101 bisa menelepon keluar tapi panggilan masuk tidak berdering.'],
      [30, 'Monitor kedua berkedip', 'Agus Salim', 'Produksi', 'Hardware', 'rendah', 'L1', 'menunggu', 't2', 0, 'Monitor kedua berkedip setiap beberapa menit. Menunggu kabel HDMI pengganti.'],
      [34, 'CCTV area parkir offline', 'Slamet Riyadi', 'Direksi', 'CCTV & Telepon', 'tinggi', 'L2', 'selesai', 't3', 5, 'Empat kamera parkir tidak tampil di NVR sejak listrik padam.'],
      [50, 'Lupa kata sandi email', 'Nadia Putri', 'Pemasaran', 'Email & Akun', 'sedang', 'L1', 'selesai', 't1', 0.6, 'Akun terkunci setelah salah kata sandi 5 kali.'],
      [75, 'Install aplikasi desain untuk anak magang', 'Rizky Ramadhan', 'Pemasaran', 'Software', 'rendah', 'L1', 'selesai', 't2', 20, 'Dua laptop magang perlu aplikasi desain dan font perusahaan.'],
      [98, 'Wi-Fi tamu sering putus', 'Putri Ayu', 'Front Office', 'Jaringan & Internet', 'sedang', 'L2', 'selesai', 't4', 30, 'Tamu mengeluh Wi-Fi lobi putus-nyambung.'],
      [126, 'Mesin absensi tidak sinkron ke HRIS', 'Rina Wulandari', 'HRD', 'Akses ERP', 'tinggi', 'L3', 'selesai', 't5', 11, 'Data absensi 3 hari terakhir tidak masuk ke HRIS.'],
      [150, 'Keyboard kasir beberapa tombol mati', 'Joko Susilo', 'Gudang', 'Hardware', 'rendah', 'L1', 'selesai', 't1', 26, 'Tombol angka 4 dan 7 tidak berfungsi.'],
      [200, 'Jaringan server mati saat hujan deras', 'Hendra Kusuma', 'Keuangan', 'Jaringan & Internet', 'kritis', 'L3', 'selesai', 't5', 1.6, 'Switch utama mati, seluruh kantor tanpa jaringan.'],
      [244, 'Printer warna hasil bergaris', 'Maya Anggraini', 'Pemasaran', 'Printer', 'sedang', 'L1', 'selesai', 't2', 19, 'Cetakan brosur bergaris biru di tengah halaman.'],
      [290, 'Akun ERP karyawan baru', 'Dewi Lestari', 'Keuangan', 'Akses ERP', 'sedang', 'L1', 'selesai', 't1', 6, 'Mohon dibuatkan akun ERP untuk 2 staf baru.'],
      [320, 'UPS ruang server bunyi terus', 'Slamet Riyadi', 'Direksi', 'Hardware', 'tinggi', 'L2', 'selesai', 't3', 9.5, 'UPS berbunyi bip tiap 30 detik, indikator baterai merah.']
    ];
    c.forEach(function (x, i) {
      var dibuat = kini - x[0] * JAM, t = {
        id: 'k' + i, no: '', dibuat: new Date(dibuat).toISOString(), judul: x[1], pelapor: x[2], hp: '08571200' + dua(10 + i) + '0' + (i % 10), divisi: PETA_DIVISI[x[3]] || x[3], kategori: x[4],
        deskripsi: x[10], prioritas: x[5], level: x[6], status: x[7], teknisiId: x[8], tenggat: new Date(dibuat + d.sla[x[5]] * MENIT).toISOString(), selesai: null, lampiran: [], utas: []
      };
      if (i === 0) t.lampiran = [svgContoh('Connection timed out', '#d64545')];
      if (i === 2) t.lampiran = [svgContoh('Printer error: paper jam', '#e0a020')];
      var tek = d.teknisi.filter(function (q) { return q.id === t.teknisiId; })[0];
      var jejak = function (jamSetelah, jenis, oleh, peran, teks, ik) { t.utas.push({ id: uid(), t: new Date(dibuat + jamSetelah * JAM).toISOString(), jenis: jenis, oleh: oleh, peran: peran, teks: teks, ikon: ik }); };
      jejak(0, 'pesan', t.pelapor, 'Pelapor', t.deskripsi);
      if (tek) jejak(0.05, 'peristiwa', 'Sistem', '', 'Ditugaskan ke <b>' + esc(tek.nama) + '</b> (' + tek.level + ')', 'orang');
      if (t.status !== 'baru' && tek) {
        jejak(Math.min(0.3, x[0] * .2), 'peristiwa', tek.nama, '', 'Status jadi <b>Dikerjakan</b>', 'jam');
        jejak(Math.min(0.4, x[0] * .3), 'pesan', tek.nama, 'Teknisi ' + tek.level, i === 0 ? 'Sedang cek server database, CPU 100%. Kemungkinan proses backup macet. Saya restart layanan bertahap.' : 'Baik, sudah saya terima. Saya cek ke lokasi sekarang.');
      }
      if (i === 0) jejak(0.5, 'peristiwa', 'Arif Hidayat', '', 'Dieskalasi <b>L2 → L3</b>: butuh akses server inti', 'naik');
      if (i === 0) jejak(0.9, 'pesan', t.pelapor, 'Pelapor', 'Cabang Bekasi masih belum bisa login ya Pak, kasir antre.');
      if (t.status === 'menunggu') jejak(Math.min(2, x[0] * .6), 'peristiwa', tek ? tek.nama : 'Sistem', '', 'Status jadi <b>Menunggu</b>', 'jam');
      if (t.status === 'selesai') {
        t.selesai = new Date(dibuat + x[9] * JAM).toISOString();
        jejak(x[9] * .9, 'pesan', tek.nama, 'Teknisi ' + tek.level, 'Sudah normal kembali, mohon dicek ya.');
        jejak(x[9], 'peristiwa', tek.nama, '', 'Tiket ditandai <b>Selesai</b>', 'cek');
      }
      d.tiket.push(t);
    });
    d.tiket.sort(function (a, b) { return new Date(a.dibuat) - new Date(b.dibuat); });
    d.tiket.forEach(function (t) { d.urut++; t.no = 'TK-' + String(1040 + d.urut).padStart(4, '0'); });
    d.contoh = true;
    return d;
  }
  var D;
  function muat(awal) {
    if (awal) D = awal; else { try { D = JSON.parse(localStorage.getItem(KUNCI)); } catch (e) { D = null; } }
    if (!D || !Array.isArray(D.tiket)) D = dataKosong();
    // Migrasi: lengkapi field yang belum ada (jangan hapus data pengguna)
    var k = dataKosong();
    Object.keys(k).forEach(function (f) { if (D[f] === undefined) D[f] = k[f]; });
    Object.keys(k.sla).forEach(function (p) { if (!D.sla[p]) D.sla[p] = k.sla[p]; });
    // Migrasi v2: daftar divisi bawaan lama diganti yang baru (tiket lama tidak diubah)
    if (Array.isArray(D.divisi) && D.divisi.length === DIVISI_LAMA.length && D.divisi.every(function (x, i) { return x === DIVISI_LAMA[i]; })) D.divisi = DIVISI_BARU.slice();
    // Migrasi: tambahkan LEGAL bila daftar divisi masih persis bawaan sebelumnya (daftar yang sudah diubah pengguna tidak disentuh)
    if (Array.isArray(D.divisi) && D.divisi.length === DIVISI_V2_AWAL.length && D.divisi.every(function (x, i) { return x === DIVISI_V2_AWAL[i]; })) D.divisi.push('LEGAL');
    // Migrasi v2: buang sisa data contoh bawaan (tiket id k0..kN, teknisi t1..t5) dari penyimpanan lama; tiket buatan pengguna tidak disentuh
    if ((D.versi || 1) < 2 && D.contoh === true) {
      D.tiket = D.tiket.filter(function (t) { return !/^k\d+$/.test(t.id); });
      D.teknisi = D.teknisi.filter(function (q) { return !/^t[1-5]$/.test(q.id) || D.tiket.some(function (t) { return t.teknisiId === q.id; }); });
      if (D.hpAdmin === '081234500100') D.hpAdmin = '';
      if (!D.tiket.length) D.urut = 0;
      D.contoh = false;
    }
    // Migrasi v2: nomor koordinator IT (Masri) bila belum diisi
    if ((D.versi || 1) < 2 && !D.hpAdmin) D.hpAdmin = k.hpAdmin;
    D.tiket.forEach(function (t) { if (!t.utas) t.utas = []; if (!t.lampiran) t.lampiran = []; if (!t.level) t.level = 'L1'; });
    D.versi = VERSI;
    simpan();
  }
  function simpan() {
    try { localStorage.setItem(KUNCI, JSON.stringify(D)); }
    catch (e) { if (!SV.aktif) { toast('Gagal menyimpan: memori browser penuh. Hapus lampiran lama atau backup data.'); return false; } }
    if (SV.aktif) { SV.kotor = true; jadwalKirim(); }
    return true;
  }

  // ---------- Sinkronisasi ke server (data bersama untuk semua client) ----------
  // Bila server.js berjalan, data dibaca/ditulis ke server; localStorage hanya jadi cadangan lokal.
  // Bila tidak ada server (mis. file dibuka langsung atau hosting statis), aplikasi tetap jalan lokal seperti biasa.
  var SV = { gagal: false, aktif: false, rev: 0, awal: null, dasar: null, dasarStr: '', timer: null, sibuk: false, ulang: false, kotor: false, perluRender: false };
  function salin(x) { return JSON.parse(JSON.stringify(x)); }
  function samaJ(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function pakaiSupabase() { return !!(SUPABASE_URL && SUPABASE_KEY); }
  function sbFetch(metode, jalur, badan, tambahan) {
    var h = { apikey: SUPABASE_KEY };
    if (SUPABASE_KEY.indexOf('sb_') !== 0) h.Authorization = 'Bearer ' + SUPABASE_KEY;   // kunci gaya lama berupa JWT
    if (badan) h['Content-Type'] = 'application/json';
    if (tambahan) Object.keys(tambahan).forEach(function (k) { h[k] = tambahan[k]; });
    return fetch(SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/helpdesk' + jalur, { method: metode, headers: h, body: badan ? JSON.stringify(badan) : undefined, cache: 'no-store' })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); });
  }
  // Satu antarmuka untuk dua jenis server: server.js (api/rev, api/data) atau Supabase. Hasil: { status, j }
  function apiSv(metode, url, badan) {
    if (!pakaiSupabase()) {
      return fetch(url, { method: metode, headers: badan ? { 'Content-Type': 'application/json' } : {}, body: badan ? JSON.stringify(badan) : undefined, cache: 'no-store', credentials: 'same-origin' })
        .then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); });
    }
    if (metode === 'GET') {
      var rev = url === 'api/rev';
      return sbFetch('GET', '?id=eq.1&select=' + (rev ? 'rev' : 'rev,data')).then(function (r) {
        if (r.status !== 200) return r;
        if (!r.j || !r.j.length) return { status: 404, j: r.j };
        return { status: 200, j: rev ? { rev: r.j[0].rev } : { rev: r.j[0].rev, data: r.j[0].data } };
      });
    }
    // Simpan hanya bila rev di database masih sama dengan yang kita kenal (UPDATE ... WHERE rev = n berjalan atomik)
    return sbFetch('PATCH', '?id=eq.1&rev=eq.' + badan.rev + '&select=rev', { data: badan.data }, { Prefer: 'return=representation' }).then(function (r) {
      if (r.status >= 200 && r.status < 300 && r.j && r.j.length) return { status: 200, j: { rev: r.j[0].rev } };
      if (r.status >= 200 && r.status < 300) return apiSv('GET', 'api/data').then(function (g) { return g.status === 200 ? { status: 409, j: g.j } : g; });
      return r;
    });
  }
  function statusSv(k) {
    if (!SV.aktif) return;
    var e = document.getElementById('svStatus');
    if (!e) {
      e = document.createElement('div'); e.id = 'svStatus';
      e.style.cssText = 'position:fixed;left:10px;bottom:8px;z-index:60;font:11px/1.2 system-ui,sans-serif;padding:4px 9px;border-radius:99px;color:#fff;pointer-events:none;opacity:.85';
      document.body.appendChild(e);
    }
    e.textContent = k === 'ok' ? '● Tersinkron' : k === 'kirim' ? '● Menyimpan…' : '● Offline — akan dikirim saat tersambung';
    e.style.background = k === 'ok' ? 'rgba(22,130,70,.9)' : k === 'kirim' ? 'rgba(90,90,90,.9)' : 'rgba(190,60,40,.92)';
  }
  // Gabung tiga arah: dasar = versi terakhir yang kita terima dari server, server = versi terbaru, lokal = perubahan kita.
  function gabungDaftar(dasar, server, lokal, gabungDua) {
    var B = {}, S = {}, L = {}, hasil = [], baru = [];
    (dasar || []).forEach(function (x) { B[x.id] = x; });
    (server || []).forEach(function (x) { S[x.id] = x; });
    (lokal || []).forEach(function (x) { L[x.id] = x; });
    (server || []).forEach(function (s) {
      var l = L[s.id], b = B[s.id];
      if (l) {
        if (b && samaJ(l, b)) hasil.push(s);              // hanya server yang berubah
        else if (b && samaJ(s, b)) hasil.push(l);         // hanya kita yang berubah
        else hasil.push(gabungDua(s, l));                 // dua-duanya berubah
      } else if (!(b && samaJ(s, b))) hasil.push(s);      // baru dari orang lain (atau kita hapus tapi server mengubahnya)
    });
    (lokal || []).forEach(function (l) {
      if (S[l.id]) return;
      var b = B[l.id];
      if (!b) { hasil.push(l); baru.push(l); }            // baru dibuat di sini
      else if (!samaJ(l, b)) hasil.push(l);               // dihapus di server, tapi kita ubah: pertahankan
    });
    return { daftar: hasil, baru: baru };
  }
  function gabungTiket(s, l) {
    var m = salin(l), ada = {}, lamp = {};
    function kunci(u) { return u.t + '|' + u.oleh + '|' + u.teks; }
    m.utas = m.utas || []; m.lampiran = m.lampiran || [];
    m.utas.forEach(function (u) { ada[kunci(u)] = 1; });
    (s.utas || []).forEach(function (u) { if (!ada[kunci(u)]) m.utas.push(u); });
    m.utas.sort(function (a, c) { return new Date(a.t) - new Date(c.t) || 0; });
    m.lampiran.forEach(function (x) { lamp[JSON.stringify(x)] = 1; });
    (s.lampiran || []).forEach(function (x) { if (!lamp[JSON.stringify(x)]) m.lampiran.push(x); });
    return m;
  }
  function gabung(dasar, server, lokal) {
    var b = dasar || {}, h = salin(server);
    var T = gabungDaftar(b.tiket, server.tiket, lokal.tiket, gabungTiket);
    var Q = gabungDaftar(b.teknisi, server.teknisi, lokal.teknisi, function (s, l) { return l; });
    h.tiket = T.daftar; h.teknisi = Q.daftar;
    if (dasar) Object.keys(lokal).forEach(function (k) {
      if (k === 'tiket' || k === 'teknisi' || k === 'urut') return;
      if (!samaJ(lokal[k], b[k])) h[k] = lokal[k];
    });
    h.urut = Math.max(server.urut || 0, lokal.urut || 0);
    // dua orang membuat tiket bersamaan: nomor kembar diberi nomor berikutnya
    var dipakai = {};
    h.tiket.forEach(function (t) { if (T.baru.indexOf(t) < 0) dipakai[t.no] = 1; });
    T.baru.forEach(function (t) {
      while (dipakai[t.no]) { h.urut++; t.no = 'TK-' + String(1040 + h.urut).padStart(4, '0'); }
      dipakai[t.no] = 1;
    });
    return h;
  }
  function jadwalKirim() { if (!SV.aktif) return; clearTimeout(SV.timer); SV.timer = setTimeout(function () { SV.timer = null; kirimSv(); }, 250); }
  function kirimSv() {
    if (!SV.aktif || !SV.kotor) return;
    if (SV.sibuk) { SV.ulang = true; return; }
    var str = JSON.stringify(D);
    if (str === SV.dasarStr) { SV.kotor = false; statusSv('ok'); return; }
    SV.sibuk = true; statusSv('kirim');
    apiSv('PUT', 'api/data', { rev: SV.rev, data: D }).then(function (r) {
      if (r.status === 200) { SV.rev = r.j.rev; SV.dasar = JSON.parse(str); SV.dasarStr = str; SV.kotor = false; statusSv('ok'); }
      else if (r.status === 409) {
        var g = gabung(SV.dasar, r.j.data, D);
        SV.rev = r.j.rev; SV.dasar = salin(r.j.data); SV.dasarStr = JSON.stringify(r.j.data);
        muat(g); SV.ulang = true; SV.perluRender = true; renderTertunda();
      } else throw new Error('status ' + r.status);
    }).catch(function () { statusSv('offline'); }).then(function () {
      SV.sibuk = false;
      if (SV.ulang) { SV.ulang = false; jadwalKirim(); }
    });
  }
  function renderTertunda() {
    if (!SV.perluRender) return;
    var a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return; // jangan ganggu orang yang sedang mengetik
    SV.perluRender = false;
    try { segarkan(); if (laciId && tiket(laciId)) segarkanLaci(); } catch (e) {}
  }
  function cekServer() {
    if (!SV.aktif || SV.sibuk) return;
    renderTertunda();
    if (SV.timer) return;
    if (SV.kotor) return kirimSv();   // coba kirim ulang bila sebelumnya gagal
    apiSv('GET', 'api/rev').then(function (r) {
      if (r.status !== 200) throw new Error('rev');
      statusSv('ok');
      if (r.j.rev === SV.rev) return;
      return apiSv('GET', 'api/data').then(function (r2) {
        if (SV.sibuk || SV.timer || SV.kotor || r2.status !== 200 || !r2.j.data) return;
        SV.rev = r2.j.rev; SV.dasar = salin(r2.j.data); SV.dasarStr = JSON.stringify(r2.j.data);
        muat(salin(r2.j.data)); SV.perluRender = true; renderTertunda();
      });
    }).catch(function () { statusSv('offline'); });
  }
  function sinkronAwal(lanjut) {
    var selesai = false, tm = setTimeout(function () { if (pakaiSupabase() && !SV.aktif) SV.gagal = true; lan(); }, 5000);
    function lan() { if (!selesai) { selesai = true; clearTimeout(tm); lanjut(); } }
    if ((location.protocol === 'file:' && !pakaiSupabase()) || !window.fetch) return lan();
    apiSv('GET', 'api/data').then(function (r) {
      if (!selesai && r.status === 200 && r.j && typeof r.j.rev === 'number') {
        SV.aktif = true; SV.rev = r.j.rev;
        if (r.j.data && Array.isArray(r.j.data.tiket)) { SV.awal = r.j.data; SV.dasar = salin(r.j.data); SV.dasarStr = JSON.stringify(r.j.data); }
      } else if (pakaiSupabase()) SV.gagal = true;
      lan();
    }).catch(function () { if (pakaiSupabase()) SV.gagal = true; lan(); });
  }
  setInterval(cekServer, 4000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) cekServer(); });
  document.addEventListener('focusout', function () { setTimeout(renderTertunda, 50); });

  // ---------- Hitungan ----------
  function teknisi(id) { return D.teknisi.filter(function (t) { return t.id === id; })[0]; }
  function tiket(id) { return D.tiket.filter(function (t) { return t.id === id; })[0]; }
  function terbuka(t) { return t.status !== 'selesai'; }
  function lewatSla(t) { return terbuka(t) ? Date.now() > new Date(t.tenggat) : new Date(t.selesai) > new Date(t.tenggat); }
  function lamaSelesai(t) { return new Date(t.selesai) - new Date(t.dibuat); }
  function bebanTeknisi(id) { return D.tiket.filter(function (t) { return terbuka(t) && t.teknisiId === id; }).length; }
  function pilihOtomatis(level) {
    var calon = D.teknisi.filter(function (q) { return q.level === level; });
    if (!calon.length) calon = D.teknisi.slice();
    calon.sort(function (a, b) { return bebanTeknisi(a.id) - bebanTeknisi(b.id); });
    return calon[0] ? calon[0].id : '';
  }
  function infoSla(t) {
    if (!terbuka(t)) { var ok = !lewatSla(t); return { kelas: ok ? 'beres' : 'lewat', teks: (ok ? 'Tepat SLA · ' : 'Lewat SLA · ') + durasi(lamaSelesai(t)) }; }
    var sisa = new Date(t.tenggat) - Date.now(), total = D.sla[t.prioritas] * MENIT;
    if (sisa < 0) return { kelas: 'lewat', teks: 'Lewat ' + durasi(sisa), rasio: 0 };
    return { kelas: sisa / total < .25 ? 'mepet' : 'aman', teks: durasi(sisa) + ' lagi', rasio: sisa / total };
  }
  function slaHtml(t) { var s = infoSla(t); return '<span class="sla ' + s.kelas + '" data-sla="' + t.id + '">' + ikon(s.kelas === 'beres' ? 'cek' : 'jam') + '<span>' + s.teks + '</span></span>'; }
  function pilP(k) { return '<span class="pil pil-p p-' + k + '">' + pri(k).n + '</span>'; }
  function pilS(k) { return '<span class="pil pil-status st-' + k + '">' + sts(k).n + '</span>'; }
  function pilL(k) { return '<span class="pil pil-level" title="Level ' + k + '">' + k + '</span>'; }

  // ---------- Animasi angka ----------
  function hitungKe(el, nilai, fmt) {
    fmt = fmt || function (x) { return Math.round(x); };
    var awal = +(el.dataset.nilai || 0); el.dataset.nilai = nilai;
    if (kurangGerak || awal === nilai) { el.innerHTML = fmt(nilai); return; }
    var t0 = performance.now(), dur = 700;
    (function langkah(tm) {
      var p = Math.min(1, (tm - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.innerHTML = fmt(awal + (nilai - awal) * e);
      if (p < 1) requestAnimationFrame(langkah);
    })(t0);
  }

  // ---------- Toast & dialog ----------
  var tmToast;
  function toast(pesan, aksi) {
    var t = $('#toast'); t.innerHTML = '<span>' + esc(pesan) + '</span>';
    if (aksi) { var b = document.createElement('button'); b.textContent = aksi.label; b.onclick = function () { aksi.fn(); t.classList.remove('tampil'); }; t.appendChild(b); }
    t.classList.add('tampil'); clearTimeout(tmToast); tmToast = setTimeout(function () { t.classList.remove('tampil'); }, aksi ? 6000 : 2800);
  }
  var dlg = $('#dialog');
  function dialog(o) {
    $('#dialogIsi').innerHTML = '<form method="dialog" class="dialog-isi" novalidate><h2>' + esc(o.judul) + '</h2>' + (o.isi || '') +
      '<div class="dialog-aksi">' + (o.aksi || []).map(function (a, i) { return '<button class="tombol ' + (a.kelas || 'garis') + '" value="' + i + '"' + (a.submit ? ' type="submit"' : ' type="button"') + '>' + a.label + '</button>'; }).join('') + '</div></form>';
    var f = $('#dialogIsi form');
    $$('.dialog-aksi button', f).forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault(); var a = o.aksi[+b.value];
        if (a.fn && a.fn(f) === false) return; dlg.close();
      });
    });
    f.addEventListener('submit', function (e) { e.preventDefault(); var i = o.aksi.findIndex(function (a) { return a.submit; }); if (i >= 0) $$('.dialog-aksi button', f)[i].click(); });
    if (o.siap) o.siap(f);
    dlg.showModal();
    var fokus = $('input, select, textarea', f) || $('.dialog-aksi .utama', f); if (fokus) fokus.focus();
  }
  function konfirmasi(judul, teks, label, fn, bahaya) {
    dialog({ judul: judul, isi: '<p class="redup">' + teks + '</p>', aksi: [{ label: 'Batal' }, { label: label, kelas: bahaya ? 'bahaya' : 'utama', fn: fn }] });
  }

  // ---------- WhatsApp ----------
  function nomorWa(hp) {
    var n = String(hp || '').replace(/\D/g, '');
    if (!n) return '';
    if (n[0] === '0') n = '62' + n.slice(1); else if (n[0] === '8') n = '62' + n;
    return n;
  }
  function linkWa(hp, teks) { var n = nomorWa(hp); return 'https://wa.me/' + n + '?text=' + encodeURIComponent(teks); }
  function pesanWa(jenis, t, ekstra) {
    var tek = teknisi(t.teknisiId), p = pri(t.prioritas).n.toUpperCase(), kaki = '\n\n— ' + NAMA_TEMA;
    if (jenis === 'dibuat') return '*[' + t.no + '] Tiket baru · ' + p + ' · ' + t.level + '*\n' + t.judul + '\n\nPelapor: ' + t.pelapor + ' (' + t.divisi + ')\nKategori: ' + t.kategori + '\nBatas SLA: ' + tglPanjang(t.tenggat) + '\n\n' + t.deskripsi.slice(0, 280) + '\n\nMohon segera ditangani.' + kaki;
    if (jenis === 'eskalasi') return '*[' + t.no + '] ESKALASI ke ' + t.level + ' · ' + p + '*\n' + t.judul + '\n\nPelapor: ' + t.pelapor + ' (' + t.divisi + ')\nAlasan: ' + (ekstra || '-') + '\nBatas SLA: ' + tglPanjang(t.tenggat) + ' (' + infoSla(t).teks + ')\n\nMohon diambil alih.' + kaki;
    if (jenis === 'diterima') return 'Halo ' + t.pelapor + ', tiket *' + t.no + '* (' + t.judul + ') sudah kami terima dengan prioritas ' + pri(t.prioritas).n + '.' + (tek ? ' Ditangani oleh ' + tek.nama + '.' : '') + ' Target selesai: ' + tglPanjang(t.tenggat) + '.' + kaki;
    if (jenis === 'selesai') return 'Halo ' + t.pelapor + ', tiket *' + t.no + '* (' + t.judul + ') sudah *SELESAI*' + (tek ? ' oleh ' + tek.nama : '') + '. Kalau masalah muncul lagi, balas pesan ini ya. Terima kasih!' + kaki;
    return 'Halo ' + t.pelapor + ', kabar tiket *' + t.no + '* (' + t.judul + '): status sekarang ' + sts(t.status).n + '.' + kaki;
  }
  function kirimWebhook(jenis, t, hp, teks) {
    if (!WEBHOOK_WA || !hp) return;
    try {
      fetch(WEBHOOK_WA, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ jenis: jenis, tiket: t.no, prioritas: t.prioritas, level: t.level, target: nomorWa(hp), pesan: teks }) });
    } catch (e) {}
  }
  function tombolWa(hp, teks, label, sub) {
    return '<a class="tombol wa" target="_blank" rel="noopener" href="' + esc(linkWa(hp, teks)) + '">' + ikon('wa') + '<span>' + esc(label) + '</span>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</a>';
  }
  function dialogWa(judul, teks, tujuan) {
    dialog({
      judul: judul,
      isi: '<p class="redup kecil">Ketuk untuk membuka WhatsApp dengan pesan yang sudah terisi. Tinggal tekan kirim.</p><div class="pratinjau-pesan">' + esc(teks) + '</div><div class="wa-daftar">' +
        tujuan.filter(function (x) { return x; }).map(function (x) { return tombolWa(x.hp, teks, x.nama, x.hp ? x.ket : 'pilih kontak'); }).join('') + '</div>',
      aksi: [{ label: 'Nanti saja' }]
    });
  }

  // ---------- Notifikasi browser ----------
  var sudahDiberitahu = {};
  function beritahu(judul, isi, id) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try { var n = new Notification(judul, { body: isi, icon: 'ikon.svg', tag: id }); n.onclick = function () { window.focus(); bukaTiket(id); }; } catch (e) {}
  }

  // ---------- Sesi & PIN ----------
  var sesi = null;
  function simpanSesi() { try { sessionStorage.setItem(KUNCI_SESI, JSON.stringify(sesi)); } catch (e) {} }
  function namaSaya() { if (!sesi) return ''; if (sesi.peran === 'teknisi') { var t = teknisi(sesi.teknisiId); return t ? t.nama : 'Teknisi'; } return sesi.peran === 'admin' ? 'Admin IT' : 'Tamu'; }
  function bolehkah(el) { var p = el.getAttribute('data-peran'); return !p || (sesi && p.split(' ').indexOf(sesi.peran) >= 0); }
  function terapkanPeran() {
    $$('[data-peran]').forEach(function (el) { el.hidden = !bolehkah(el); });
    $('#app').classList.toggle('tamu', sesi.peran === 'tamu');
    $('#namaSaya').textContent = namaSaya();
    $('#peranSaya').textContent = sesi.peran === 'teknisi' ? 'Teknisi ' + ((teknisi(sesi.teknisiId) || {}).level || '') : sesi.peran === 'admin' ? 'Admin' : 'Pelapor';
    $('#avaSaya').outerHTML = avaHtml(namaSaya()).replace('<span class="ava"', '<span class="ava" id="avaSaya"');
    $('#fSaya').parentNode.hidden = sesi.peran !== 'teknisi';
  }
  function tampilGerbang() {
    $('#app').hidden = true; $('#gerbang').hidden = false;
    $('#pilihTeknisi').innerHTML = D.teknisi.map(function (t) { return '<option value="' + t.id + '">' + esc(t.nama) + ' (' + t.level + ')</option>'; }).join('');
    gantiPeranGerbang(); setTimeout(function () { $('#inputPin').focus(); }, 50);
  }
  function gantiPeranGerbang() { $('#bidangSiapa').hidden = $('input[name=peran]:checked').value !== 'teknisi'; }
  $$('input[name=peran]').forEach(function (r) { r.addEventListener('change', gantiPeranGerbang); });
  $('#formPin').addEventListener('submit', function (e) {
    e.preventDefault();
    var peran = $('input[name=peran]:checked').value, pin = $('#inputPin').value.trim();
    if (pin !== D.pin[peran]) {
      $('#pinPesan').textContent = pin ? 'PIN salah. Coba lagi.' : 'Ketik PIN dulu.';
      var k = $('.gerbang-kartu'); k.classList.remove('goyang'); void k.offsetWidth; k.classList.add('goyang');
      $('#inputPin').select(); return;
    }
    if (peran === 'teknisi' && !D.teknisi.length) { $('#pinPesan').textContent = 'Belum ada teknisi. Minta admin menambahkan.'; return; }
    $('#pinPesan').textContent = ''; $('#inputPin').value = '';
    masuk({ peran: peran, teknisiId: peran === 'teknisi' ? $('#pilihTeknisi').value : '' });
  });
  $('#lapor-tamu').addEventListener('click', function () { masuk({ peran: 'tamu' }); });
  function masuk(s) {
    sesi = s; simpanSesi();
    $('#gerbang').hidden = true; $('#app').hidden = false;
    terapkanPeran();
    var awal = (location.hash || '').slice(1);
    buka(sesi.peran === 'tamu' ? 'buat' : (HALAMAN.indexOf(awal) >= 0 && halBoleh(awal) ? awal : 'dasbor'));
  }
  function keluar() { sesi = null; try { sessionStorage.removeItem(KUNCI_SESI); } catch (e) {} tutupLaci(true); tampilGerbang(); }
  $('#keluar').addEventListener('click', keluar); $('#keluarHp').addEventListener('click', keluar);

  // ---------- Navigasi ----------
  var HALAMAN = ['dasbor', 'tiket', 'buat', 'laporan', 'atur'];
  var halAktif = 'dasbor';
  function halBoleh(h) { var b = $('.menu .nav[data-hal="' + h + '"]'); return b && bolehkah(b) && (sesi.peran !== 'tamu' || h === 'buat'); }
  function buka(hal) {
    if (!halBoleh(hal)) hal = sesi.peran === 'tamu' ? 'buat' : 'dasbor';
    halAktif = hal;
    $$('.hal').forEach(function (s) { s.hidden = s.id !== 'hal-' + hal; });
    $$('.nav').forEach(function (b) { var a = b.dataset.hal === hal; b.classList.toggle('aktif', a); if (a) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (hal === 'dasbor') renderDasbor(); else if (hal === 'tiket') renderTiket(); else if (hal === 'buat') renderBuat(); else if (hal === 'laporan') renderLaporan(); else renderAtur();
    try { history.replaceState(null, '', '#' + hal); } catch (e) {}
    window.scrollTo(0, 0);
  }
  $$('.nav').forEach(function (b) { b.addEventListener('click', function () { buka(b.dataset.hal); }); });
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-buka]'); if (b) buka(b.dataset.buka); });
  function segarkan() { renderHitung(); if (sesi && sesi.peran !== 'tamu') buka(halAktif); }
  function renderHitung() { var n = D.tiket.filter(terbuka).length; $('#hitungTerbuka').textContent = n || ''; }

  // ================= DASBOR =================
  function sapaan() { var j = new Date().getHours(); return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 18 ? 'Selamat sore' : 'Selamat malam'; }
  function renderDasbor() {
    var buka_ = D.tiket.filter(terbuka), telat = buka_.filter(lewatSla), kritis = buka_.filter(function (t) { return t.prioritas === 'kritis'; });
    var selesai = D.tiket.filter(function (t) { return !terbuka(t); });
    var rata = selesai.length ? selesai.reduce(function (s, t) { return s + lamaSelesai(t); }, 0) / selesai.length : 0;
    var patuh = selesai.length ? Math.round(selesai.filter(function (t) { return !lewatSla(t); }).length / selesai.length * 100) : 100;
    $('#sapa').textContent = sapaan() + ', ' + namaSaya().split(' ')[0];
    $('#sapaSub').textContent = buka_.length ? buka_.length + ' tiket terbuka, ' + kritis.length + ' kritis.' : 'Semua tiket beres. Mantap!';
    var stat = [
      { l: 'Tiket terbuka', ik: 'tiket', v: buka_.length, c: D.tiket.filter(function (t) { return t.status === 'baru'; }).length + ' baru belum dikerjakan', kls: 'utama-stat' },
      { l: 'Lewat SLA', ik: 'peringatan', v: telat.length, c: telat.length ? 'Perlu eskalasi atau dikejar' : 'Semua masih dalam target', kls: telat.length ? 'bahaya' : '' },
      { l: 'Rata-rata selesai', ik: 'jam', v: rata / JAM, c: selesai.length + ' tiket selesai', fmt: function (x) { return x >= 24 ? (x / 24).toFixed(1).replace('.', ',') + '<small>hari</small>' : x.toFixed(1).replace('.', ',') + '<small>jam</small>'; } },
      { l: 'Kepatuhan SLA', ik: 'cek', v: patuh, c: 'Tiket selesai tepat waktu', fmt: function (x) { return Math.round(x) + '<small>%</small>'; } }
    ];
    var wadah = $('#statistik');
    if (wadah.children.length !== 4) wadah.innerHTML = stat.map(function (s, i) { return '<div class="stat" style="--i:' + i + '"><span class="stat-label">' + ikon(s.ik) + s.l + '</span><span class="stat-angka"></span><span class="stat-catatan"></span></div>'; }).join('');
    stat.forEach(function (s, i) {
      var el = wadah.children[i]; el.className = 'stat ' + (s.kls || ''); el.style.setProperty('--i', i);
      hitungKe($('.stat-angka', el), s.v, s.fmt); $('.stat-catatan', el).textContent = s.c;
    });
    // Kartu sorotan: tiket terbuka prioritas tinggi/kritis atau lewat SLA
    var urgen = buka_.filter(function (t) { return t.prioritas === 'kritis' || t.prioritas === 'tinggi' || lewatSla(t); })
      .sort(function (a, b) { return (URUT_P[a.prioritas] - URUT_P[b.prioritas]) || (new Date(a.tenggat) - new Date(b.tenggat)); });
    $('#sorotan').innerHTML = urgen.length ? urgen.map(function (t, i) {
      var tek = teknisi(t.teknisiId);
      return '<button class="kartu-pri p-' + t.prioritas + '" data-tiket="' + t.id + '" style="--i:' + i + '"><span class="k-atas"><span class="mono">' + t.no + ' · ' + t.level + '</span><span>' + pri(t.prioritas).n + '</span></span>' +
        '<span class="k-judul">' + esc(t.judul) + '</span><span class="k-bawah"><span>' + esc(tek ? tek.nama : 'Belum ditugaskan') + '</span><span class="hitungan" data-sla="' + t.id + '" data-polos>' + infoSla(t).teks + '</span></span></button>';
    }).join('') : '<div class="kosong-sorotan">' + ikon('cek') + '<span><b>Tidak ada tiket mendesak.</b> Tiket Tinggi, Kritis, atau lewat SLA akan muncul di sini.</span></div>';
    // Grafik 14 hari
    var hari = [], maks = 1, kini = new Date(); kini.setHours(0, 0, 0, 0);
    for (var h = 13; h >= 0; h--) {
      var a = new Date(kini); a.setDate(a.getDate() - h); var b = new Date(a); b.setDate(b.getDate() + 1);
      var masuk = D.tiket.filter(function (t) { var x = new Date(t.dibuat); return x >= a && x < b; });
      var u = masuk.filter(function (t) { return t.prioritas === 'kritis' || t.prioritas === 'tinggi'; }).length;
      hari.push({ d: a, n: masuk.length, u: u }); maks = Math.max(maks, masuk.length);
    }
    var total = hari.reduce(function (s, x) { return s + x.n; }, 0);
    $('#grafikRingkas').innerHTML = '<span class="legenda"><span><i style="background:var(--utama)"></i>Rendah/Sedang</span><span><i style="background:var(--aksen)"></i>Tinggi/Kritis</span></span>';
    $('#grafikHarian').setAttribute('aria-label', total + ' tiket masuk dalam 14 hari terakhir');
    $('#grafikHarian').innerHTML = hari.map(function (x, i) {
      var tinggi = x.n / maks * 100;
      return '<div class="k" title="' + x.d.getDate() + ' ' + BULAN[x.d.getMonth()] + ': ' + x.n + ' tiket"><span class="bt" style="--i:' + i + ';height:' + Math.max(tinggi, 2) + '%">' +
        (x.n ? '<i class="a" style="flex:' + (x.n - x.u) + '"></i><i class="b" style="flex:' + x.u + '"></i>' : '<i class="a" style="flex:1;opacity:.25"></i>') + '</span><small>' + x.d.getDate() + '</small></div>';
    }).join('');
    // Beban teknisi
    var bmaks = Math.max(1, Math.max.apply(null, D.teknisi.map(function (q) { return bebanTeknisi(q.id); })));
    $('#beban').innerHTML = D.teknisi.length ? D.teknisi.map(function (q) {
      var n = bebanTeknisi(q.id);
      return '<li>' + avaHtml(q.nama, true) + '<div><b>' + esc(q.nama) + '</b><small>' + q.level + ' · ' + LEVEL.filter(function (l) { return l.k === q.level; })[0].n + '</small><div class="meter"><i style="width:' + (n / bmaks * 100) + '%"></i></div></div><span class="pil pil-level">' + n + ' tiket</span></li>';
    }).join('') : '<li class="redup">Belum ada teknisi. Tambahkan di menu Atur.</li>';
    // Aktivitas
    var ak = [];
    D.tiket.forEach(function (t) { t.utas.forEach(function (u) { ak.push({ t: t, u: u }); }); });
    ak.sort(function (a, b) { return new Date(b.u.t) - new Date(a.u.t); });
    $('#aktivitas').innerHTML = ak.slice(0, 7).map(function (x, i) {
      var teks = x.u.jenis === 'pesan' ? '<b class="nama-kecil">' + esc(x.u.oleh) + '</b> membalas: “' + esc(x.u.teks.slice(0, 70)) + (x.u.teks.length > 70 ? '…' : '') + '”' : x.u.teks;
      return '<li style="--i:' + i + '">' + avaHtml(x.u.oleh, true) + '<p><button data-tiket="' + x.t.id + '">' + x.t.no + '</button> ' + teks + '</p><time>' + lalu(x.u.t) + '</time></li>';
    }).join('') || '<li class="redup">Belum ada aktivitas.</li>';
  }
  document.addEventListener('click', function (e) {
    if (modePilih) return;
    var b = e.target.closest('[data-tiket]'); if (b && !b.closest('.laci')) bukaTiket(b.dataset.tiket);
  });

  // ================= TIKET (papan & daftar) =================
  var tampil = 'papan';
  try { tampil = localStorage.getItem(KUNCI + '.tampil') || 'papan'; } catch (e) {}
  $('#fPrioritas').insertAdjacentHTML('beforeend', PRIORITAS.map(function (p) { return '<option value="' + p.k + '">' + p.n + '</option>'; }).join(''));
  function isiSaringTeknisi() {
    var v = $('#fTeknisi').value;
    $('#fTeknisi').innerHTML = '<option value="">Semua teknisi</option><option value="-">Belum ditugaskan</option>' + D.teknisi.map(function (t) { return '<option value="' + t.id + '">' + esc(t.nama) + '</option>'; }).join('');
    $('#fTeknisi').value = v;
  }
  function tersaring() {
    var q = $('#cari').value.trim().toLowerCase(), p = $('#fPrioritas').value, tk = $('#fTeknisi').value, saya = $('#fSaya').checked && sesi.peran === 'teknisi';
    return D.tiket.filter(function (t) {
      if (p && t.prioritas !== p) return false;
      if (tk === '-' && t.teknisiId) return false;
      if (tk && tk !== '-' && t.teknisiId !== tk) return false;
      if (saya && t.teknisiId !== sesi.teknisiId) return false;
      if (q && (t.no + ' ' + t.judul + ' ' + t.pelapor + ' ' + t.divisi + ' ' + t.kategori).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  var URUT_P = { kritis: 0, tinggi: 1, sedang: 2, rendah: 3 };
  function renderTiket() {
    isiSaringTeknisi();
    $$('[data-tampil]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tampil === tampil); });
    var daftar = tersaring();
    $('#tiketSub').textContent = daftar.length + ' tiket ditampilkan · ' + daftar.filter(terbuka).length + ' terbuka';
    $('#papan').hidden = tampil !== 'papan'; $('#daftar').hidden = tampil !== 'daftar';
    if (tampil === 'papan') {
      $('#papan').innerHTML = STATUS.map(function (s) {
        var isi = daftar.filter(function (t) { return t.status === s.k; }).sort(function (a, b) {
          return s.k === 'selesai' ? new Date(b.selesai) - new Date(a.selesai) : (URUT_P[a.prioritas] - URUT_P[b.prioritas]) || (new Date(a.tenggat) - new Date(b.tenggat));
        });
        var tampilIsi = s.k === 'selesai' ? isi.slice(0, 8) : isi;
        return '<section class="kolom" data-status="' + s.k + '" aria-label="' + s.n + '"><div class="kolom-kepala" style="color:' + s.warna + '"><span class="titik"></span><span style="color:var(--teks)">' + s.n + '</span><span class="n">' + isi.length + '</span></div>' +
          (tampilIsi.length ? tampilIsi.map(kartuTiket).join('') : '<p class="kolom-kosong">Seret tiket ke sini</p>') +
          (isi.length > tampilIsi.length ? '<button class="tautan" data-tampil-ke="daftar">+' + (isi.length - tampilIsi.length) + ' lainnya di Daftar</button>' : '') + '</section>';
      }).join('');
    } else {
      daftar.sort(function (a, b) { return (terbuka(b) - terbuka(a)) || (URUT_P[a.prioritas] - URUT_P[b.prioritas]) || (new Date(b.dibuat) - new Date(a.dibuat)); });
      $('#daftar').innerHTML = daftar.length ? '<div class="tabel-bungkus"><table class="tabel"><thead><tr><th>Tiket</th><th>Prioritas</th><th class="sembunyi-hp">Level</th><th>Status</th><th class="sembunyi-hp">Teknisi</th><th>SLA</th></tr></thead><tbody>' +
        daftar.map(function (t, i) {
          var tek = teknisi(t.teknisiId);
          return '<tr class="klik" data-tiket="' + t.id + '" style="--i:' + Math.min(i, 20) + '"><td class="judul-sel"><button class="baris-buka" data-tiket="' + t.id + '">' + esc(t.judul) + '</button><small class="mono">' + t.no + '</small> <small>· ' + esc(t.pelapor) + ', ' + esc(t.divisi) + '</small></td>' +
            '<td>' + pilP(t.prioritas) + '</td><td class="sembunyi-hp">' + pilL(t.level) + '</td><td>' + pilS(t.status) + '</td><td class="sembunyi-hp">' + esc(tek ? tek.nama : '—') + '</td><td>' + slaHtml(t) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : kosongHtml();
    }
  }
  function kosongHtml() { return '<div class="kosong">' + ikon('kosong') + '<b>Tidak ada tiket yang cocok</b><span>Ubah kata kunci atau saringan.</span></div>'; }
  function kartuTiket(t, i) {
    var tek = teknisi(t.teknisiId);
    return '<button class="kartu-tiket p-' + t.prioritas + '" draggable="true" data-tiket="' + t.id + '" style="--i:' + i + '"><span class="strip" aria-hidden="true"></span>' +
      '<span class="baris"><span class="no">' + t.no + '</span><span>' + pilP(t.prioritas) + ' ' + pilL(t.level) + '</span></span><b>' + esc(t.judul) + '</b>' +
      '<span class="meta">' + ikon('orang') + esc(t.pelapor) + ' · ' + esc(t.divisi) + (t.lampiran.length ? ' · ' + ikon('klip') + t.lampiran.length : '') + '</span>' +
      '<span class="baris"><span class="meta">' + (tek ? avaHtml(tek.nama, true) + esc(tek.nama.split(' ')[0]) : 'Belum ditugaskan') + '</span>' + slaHtml(t) + '</span></button>';
  }
  $$('[data-tampil]').forEach(function (b) { b.addEventListener('click', function () { tampil = b.dataset.tampil; try { localStorage.setItem(KUNCI + '.tampil', tampil); } catch (e) {} renderTiket(); }); });
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-tampil-ke]'); if (b) { tampil = b.dataset.tampilKe; renderTiket(); } });
  ['#cari', '#fPrioritas', '#fTeknisi', '#fSaya'].forEach(function (s) { $(s).addEventListener(s === '#cari' ? 'input' : 'change', renderTiket); });
  // Seret-lepas antar kolom (desktop)
  var diseret = null;
  $('#papan').addEventListener('dragstart', function (e) { var k = e.target.closest('.kartu-tiket'); if (!k) return; diseret = k.dataset.tiket; k.classList.add('diseret'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', diseret); } catch (x) {} });
  $('#papan').addEventListener('dragend', function () { $$('.diseret, .seret-atas').forEach(function (x) { x.classList.remove('diseret', 'seret-atas'); }); });
  $('#papan').addEventListener('dragover', function (e) { var k = e.target.closest('.kolom'); if (!k || !diseret) return; e.preventDefault(); $$('.kolom.seret-atas').forEach(function (x) { if (x !== k) x.classList.remove('seret-atas'); }); k.classList.add('seret-atas'); });
  $('#papan').addEventListener('drop', function (e) {
    var k = e.target.closest('.kolom'); if (!k || !diseret) return; e.preventDefault();
    var t = tiket(diseret); diseret = null; if (t && t.status !== k.dataset.status) ubahStatus(t, k.dataset.status);
  });

  // ---------- Aksi tiket ----------
  function catatPeristiwa(t, teks, ik) { t.utas.push({ id: uid(), t: new Date().toISOString(), jenis: 'peristiwa', oleh: namaSaya(), peran: '', teks: teks, ikon: ik }); }
  function ubahStatus(t, s, diam) {
    var lama = t.status; if (lama === s) return;
    t.status = s;
    if (s === 'selesai') t.selesai = new Date().toISOString(); else if (lama === 'selesai') { t.selesai = null; }
    catatPeristiwa(t, 'Status <b>' + sts(lama).n + '</b> → <b>' + sts(s).n + '</b>', s === 'selesai' ? 'cek' : 'jam');
    simpan(); segarkanLaci(); segarkan();
    if (diam) return;
    if (s === 'selesai') {
      toast(t.no + ' selesai dalam ' + durasi(lamaSelesai(t)), { label: 'Urungkan', fn: function () { t.utas.pop(); t.status = lama; t.selesai = null; simpan(); segarkanLaci(); segarkan(); } });
      kirimWebhook('selesai', t, t.hp, pesanWa('selesai', t));
      dialogWa('Kabari pelapor: tiket selesai', pesanWa('selesai', t), [{ nama: 'WA ke ' + t.pelapor, hp: t.hp, ket: t.hp }]);
    } else toast(t.no + ' → ' + sts(s).n);
  }
  function eskalasi(t) {
    var i = ['L1', 'L2', 'L3'].indexOf(t.level); if (i >= 2) return;
    var ke = ['L1', 'L2', 'L3'][i + 1];
    var opsi = D.teknisi.filter(function (q) { return q.level === ke; }), saran = pilihOtomatis(ke);
    dialog({
      judul: 'Eskalasi ' + t.no + ' ke ' + ke,
      isi: '<label class="bidang"><span>Alasan eskalasi *</span><textarea name="alasan" rows="3" placeholder="mis. Butuh akses server, di luar kewenangan L1">' + (lewatSla(t) ? 'Melewati batas SLA. ' : '') + '</textarea><em class="galat"></em></label>' +
        '<label class="bidang"><span>Teknisi ' + ke + '</span><select name="tek">' + (opsi.length ? opsi : D.teknisi).map(function (q) { return '<option value="' + q.id + '"' + (q.id === saran ? ' selected' : '') + '>' + esc(q.nama) + ' (' + q.level + ', ' + bebanTeknisi(q.id) + ' tiket)</option>'; }).join('') + '</select></label>',
      aksi: [{ label: 'Batal' }, {
        label: ikon('naik') + 'Eskalasi', kelas: 'utama', submit: true, fn: function (f) {
          var al = f.alasan.value.trim();
          if (!al) { f.alasan.closest('.bidang').classList.add('salah'); $('.galat', f).textContent = 'Tulis alasan singkat supaya teknisi berikutnya paham.'; f.alasan.focus(); return false; }
          var lama = t.level; t.level = ke; t.teknisiId = f.tek.value; if (t.status === 'menunggu' || t.status === 'baru') t.status = 'dikerjakan';
          var tek = teknisi(t.teknisiId);
          catatPeristiwa(t, 'Dieskalasi <b>' + lama + ' → ' + ke + '</b>' + (tek ? ', ditugaskan ke <b>' + esc(tek.nama) + '</b>' : '') + ': ' + esc(al), 'naik');
          simpan(); segarkanLaci(); segarkan();
          if (tek) kirimWebhook('eskalasi', t, tek.hp, pesanWa('eskalasi', t, al));
          setTimeout(function () { dialogWa('Kabari teknisi ' + ke, pesanWa('eskalasi', t, al), [tek ? { nama: 'WA ke ' + tek.nama, hp: tek.hp, ket: tek.level } : null, D.hpAdmin ? { nama: 'WA ke ' + D.namaAdmin + ' (koordinator IT)', hp: D.hpAdmin, ket: 'koordinator' } : null]); }, 60);
        }
      }]
    });
  }

  // ================= LACI DETAIL =================
  var laciId = null, fokusSebelum = null;
  function bukaTiket(id) {
    if (!sesi || sesi.peran === 'tamu') return;
    var t = tiket(id); if (!t) return;
    var sudahBuka = !!laciId; laciId = id;
    if (!sudahBuka) fokusSebelum = document.activeElement;
    $('#laci').hidden = false; $('#laciLatar').hidden = false;
    $('#laci').classList.remove('keluar'); $('#laciLatar').classList.remove('keluar');
    document.body.style.overflow = 'hidden';
    renderLaci(t);
    $('#laci .tutup').focus();
    var g = $('.utas-gulir'); if (g) g.scrollTop = g.scrollHeight;
  }
  function tutupLaci(langsung) {
    if (!laciId) return; laciId = null;
    var akhiri = function () { $('#laci').hidden = true; $('#laciLatar').hidden = true; document.body.style.overflow = ''; };
    if (langsung === true || kurangGerak) akhiri(); else { $('#laci').classList.add('keluar'); $('#laciLatar').classList.add('keluar'); setTimeout(akhiri, 260); }
    if (fokusSebelum && fokusSebelum.focus && document.contains(fokusSebelum)) fokusSebelum.focus();
  }
  function segarkanLaci() { if (laciId) { var g = $('.utas-gulir'), bawah = g && g.scrollHeight - g.scrollTop - g.clientHeight < 40; var draf = $('#balasTeks') ? $('#balasTeks').value : ''; renderLaci(tiket(laciId)); if ($('#balasTeks')) $('#balasTeks').value = draf; g = $('.utas-gulir'); if (g && bawah) g.scrollTop = g.scrollHeight; } }
  $('#laciLatar').addEventListener('click', function () { tutupLaci(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && laciId && !dlg.open && $('#lightbox').hidden) tutupLaci();
    if (e.key === 'Escape' && !$('#lightbox').hidden) tutupLightbox();
    if (e.key === 'Tab' && laciId && !dlg.open) {
      var f = $$('#laci a[href], #laci button:not([disabled]), #laci textarea, #laci select, #laci input').filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return; var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  function renderLaci(t) {
    if (!t) { tutupLaci(true); return; }
    var tek = teknisi(t.teknisiId), s = infoSla(t), admin = sesi.peran === 'admin', iL = ['L1', 'L2', 'L3'].indexOf(t.level);
    var total = D.sla[t.prioritas] * MENIT, berjalan = (terbuka(t) ? Date.now() : new Date(t.selesai)) - new Date(t.dibuat);
    var utas = t.utas.map(function (u, i) {
      if (u.jenis === 'peristiwa') return '<div class="peristiwa"><span class="ik">' + ikon(u.ikon || 'jam') + '</span><span><b>' + esc(u.oleh) + '</b> · ' + u.teks + ' · <time>' + tglPendek(u.t) + '</time></span></div>';
      var gal = i === 0 && t.lampiran.length ? t.lampiran : (u.lampiran || []);
      var dariIt = u.peran && u.peran !== 'Pelapor';
      return '<div class="pesan' + (dariIt ? ' dari-it' : '') + '">' + avaHtml(u.oleh, true) + '<div class="gelembung"><div class="siapa-p"><b>' + esc(u.oleh) + '</b><small>' + esc(u.peran) + '</small><time>' + tglPendek(u.t) + '</time></div><p>' + esc(u.teks) + '</p>' +
        (gal.length ? '<div class="galeri">' + gal.map(function (g, j) { return '<button data-lihat="' + i + ':' + j + '" aria-label="Perbesar lampiran ' + (j + 1) + '"><img src="' + esc(g) + '" alt="Lampiran ' + (j + 1) + '"></button>'; }).join('') + '</div>' : '') + '</div></div>';
    }).join('');
    var opsiTek = '<option value="">Belum ditugaskan</option>' + D.teknisi.map(function (q) { return '<option value="' + q.id + '"' + (q.id === t.teknisiId ? ' selected' : '') + '>' + esc(q.nama) + ' (' + q.level + ')</option>'; }).join('');
    $('#laciIsi').innerHTML =
      '<header class="laci-kepala"><div class="t"><span class="mono redup kecil">' + t.no + ' · dibuat ' + tglPendek(t.dibuat) + '</span><h2 id="laciJudul">' + esc(t.judul) + '</h2><div class="pils">' + pilP(t.prioritas) + pilL(t.level) + pilS(t.status) + slaHtml(t) + '</div></div>' +
      '<button class="ikon-tombol tutup" aria-label="Tutup detail tiket">' + ikon('x') + '</button></header>' +
      '<section class="utas" aria-label="Percakapan"><div class="utas-gulir">' + utas + '</div>' +
      '<form class="balas" id="formBalas"><label for="balasTeks" class="sr">Tulis balasan</label><textarea id="balasTeks" placeholder="Tulis balasan atau catatan untuk pelapor…" rows="2"></textarea>' +
      '<div class="bar"><span class="redup kecil">Membalas sebagai <b>' + esc(namaSaya()) + '</b></span><span class="aksi-baris">' +
      '<a class="tombol garis kecil" target="_blank" rel="noopener" href="' + esc(linkWa(t.hp, pesanWa('kabar', t))) + '">' + ikon('wa') + 'Kabari pelapor</a>' +
      '<button class="tombol utama kecil" type="submit">' + ikon('kirim') + 'Kirim</button></span></div></form></section>' +
      '<aside class="properti" aria-label="Detail tiket">' +
      '<div class="grup"><h3>Batas SLA</h3><div class="sla-kotak ' + (s.kelas === 'lewat' ? 'lewat' : '') + '"><span class="besar" data-sla="' + t.id + '" data-polos>' + s.teks + '</span><div class="meter"><i style="width:' + Math.min(100, berjalan / total * 100) + '%;background:' + (s.kelas === 'lewat' ? 'var(--telat)' : s.kelas === 'mepet' ? 'var(--p-tinggi)' : 'var(--utama)') + '"></i></div><span class="redup kecil">Target ' + Math.round(total / JAM) + ' jam · ' + tglPanjang(t.tenggat) + '</span></div></div>' +
      '<div class="grup"><h3>Status</h3><label class="sr" for="pStatus">Status</label><select id="pStatus">' + STATUS.map(function (x) { return '<option value="' + x.k + '"' + (x.k === t.status ? ' selected' : '') + '>' + x.n + '</option>'; }).join('') + '</select>' +
      (terbuka(t) ? '<button class="tombol utama lebar" id="pSelesai">' + ikon('cek') + 'Tandai selesai</button>' : '') + '</div>' +
      '<div class="grup"><h3>Level eskalasi</h3><div class="tangga">' + ['L1', 'L2', 'L3'].map(function (l, i) { return '<span class="' + (i < iL ? 'lalu' : i === iL ? 'kini' : '') + '">' + l + '</span>'; }).join('') + '</div>' +
      (iL < 2 && terbuka(t) ? '<button class="tombol ' + (s.kelas === 'lewat' ? 'bahaya' : 'garis') + ' lebar" id="pEskalasi">' + ikon('naik') + (s.kelas === 'lewat' ? 'Lewat SLA — eskalasi ke ' : 'Eskalasi ke ') + ['L1', 'L2', 'L3'][iL + 1] + '</button>' : '') + '</div>' +
      '<div class="grup"><h3>Penugasan</h3><label class="sr" for="pTeknisi">Teknisi</label><select id="pTeknisi">' + opsiTek + '</select>' +
      '<label class="sr" for="pPrioritas">Prioritas</label><select id="pPrioritas"' + (admin ? '' : ' disabled') + '>' + PRIORITAS.map(function (p) { return '<option value="' + p.k + '"' + (p.k === t.prioritas ? ' selected' : '') + '>Prioritas ' + p.n + '</option>'; }).join('') + '</select></div>' +
      '<div class="grup"><h3>Pelapor</h3><dl><dt>Nama</dt><dd>' + esc(t.pelapor) + '</dd><dt>Divisi</dt><dd>' + esc(t.divisi) + '</dd><dt>Kategori</dt><dd>' + esc(t.kategori) + '</dd><dt>WhatsApp</dt><dd class="mono">' + esc(t.hp || '—') + '</dd></dl></div>' +
      '<div class="grup wa-grup"><h3>Notifikasi WhatsApp</h3>' +
      (tek ? tombolWa(tek.hp, pesanWa('dibuat', t), 'Ke teknisi ' + tek.nama.split(' ')[0]) : '') +
      tombolWa(t.hp, pesanWa(terbuka(t) ? 'diterima' : 'selesai', t), terbuka(t) ? 'Konfirmasi ke pelapor' : 'Info selesai ke pelapor') + '</div>' +
      (admin ? '<button class="tombol bahaya kecil" id="pHapus">' + ikon('hapus') + 'Hapus tiket</button>' : '') +
      '</aside>';
    $('#laci .tutup').onclick = function () { tutupLaci(); };
    $('#pStatus').onchange = function () { ubahStatus(t, this.value); };
    if ($('#pSelesai')) $('#pSelesai').onclick = function () { ubahStatus(t, 'selesai'); };
    if ($('#pEskalasi')) $('#pEskalasi').onclick = function () { eskalasi(t); };
    $('#pTeknisi').onchange = function () {
      t.teknisiId = this.value; var q = teknisi(t.teknisiId);
      catatPeristiwa(t, q ? 'Ditugaskan ke <b>' + esc(q.nama) + '</b> (' + q.level + ')' : 'Penugasan dilepas', 'orang'); simpan(); segarkanLaci(); segarkan();
      if (q) dialogWa('Kabari ' + q.nama, pesanWa('dibuat', t), [{ nama: 'WA ke ' + q.nama, hp: q.hp, ket: q.level }]);
    };
    $('#pPrioritas').onchange = function () {
      var lama = t.prioritas; t.prioritas = this.value; t.tenggat = new Date(new Date(t.dibuat).getTime() + D.sla[t.prioritas] * MENIT).toISOString();
      catatPeristiwa(t, 'Prioritas <b>' + pri(lama).n + '</b> → <b>' + pri(t.prioritas).n + '</b>, batas SLA dihitung ulang', 'peringatan'); simpan(); segarkanLaci(); segarkan();
    };
    if ($('#pHapus')) $('#pHapus').onclick = function () {
      konfirmasi('Hapus ' + t.no + '?', 'Tiket dan seluruh percakapannya akan dihapus.', 'Hapus', function () {
        var idx = D.tiket.indexOf(t); D.tiket.splice(idx, 1); simpan(); tutupLaci(); segarkan();
        toast(t.no + ' dihapus', { label: 'Urungkan', fn: function () { D.tiket.splice(idx, 0, t); simpan(); segarkan(); } });
      }, true);
    };
    $('#formBalas').onsubmit = function (e) {
      e.preventDefault(); var v = $('#balasTeks').value.trim(); if (!v) { $('#balasTeks').focus(); return; }
      t.utas.push({ id: uid(), t: new Date().toISOString(), jenis: 'pesan', oleh: namaSaya(), peran: sesi.peran === 'teknisi' ? 'Teknisi ' + ((teknisi(sesi.teknisiId) || {}).level || '') : 'Admin', teks: v });
      if (t.status === 'baru') { t.status = 'dikerjakan'; catatPeristiwa(t, 'Status jadi <b>Dikerjakan</b> (dibalas)', 'jam'); }
      simpan(); $('#balasTeks').value = ''; segarkanLaci(); segarkan(); var g = $('.utas-gulir'); g.scrollTop = g.scrollHeight;
    };
    $('#balasTeks').onkeydown = function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('#formBalas').requestSubmit(); };
    $$('[data-lihat]').forEach(function (b) { b.onclick = function () { var p = b.dataset.lihat.split(':'), u = t.utas[+p[0]]; var gal = +p[0] === 0 && t.lampiran.length ? t.lampiran : u.lampiran; lihatGambar(gal[+p[1]]); }; });
  }
  var fokusLb = null;
  function lihatGambar(src) { fokusLb = document.activeElement; $('#lightboxGambar').innerHTML = '<img alt="Lampiran tiket" src="' + esc(src) + '">'; $('#lightbox').hidden = false; $('#tutupLightbox').focus(); }
  function tutupLightbox() { $('#lightbox').hidden = true; $('#lightboxGambar').innerHTML = ''; if (fokusLb) fokusLb.focus(); }
  $('#tutupLightbox').onclick = tutupLightbox;
  $('#lightbox').addEventListener('click', function (e) { if (e.target.id === 'lightbox') tutupLightbox(); });

  // ================= BUAT TIKET =================
  var lampiranBaru = [], pPilih = 'sedang', lPilih = 'L1';
  var fT = $('#formTiket');
  $('#pilihPrioritas').innerHTML = PRIORITAS.map(function (p) { return '<label class="p-' + p.k + '"><input type="radio" name="prioritas" value="' + p.k + '"' + (p.k === pPilih ? ' checked' : '') + '><span><b>' + p.n + '</b><small>' + p.ket + '</small></span></label>'; }).join('');
  $('#pilihLevel').innerHTML = LEVEL.map(function (l) { return '<label><input type="radio" name="level" value="' + l.k + '"' + (l.k === lPilih ? ' checked' : '') + '><span><b>' + l.k + '</b><small>' + l.n + '</small></span></label>'; }).join('');
  function renderSlaInfo() {
    pPilih = fT.prioritas.value; lPilih = fT.level.value;
    var m = D.sla[pPilih], tgl = new Date(Date.now() + m * MENIT);
    $('#slaInfo').innerHTML = ikon('jam') + '<span>Target selesai <b>' + (m >= 1440 ? Math.round(m / 1440) + ' hari' : Math.round(m / 60) + ' jam') + '</b>, paling lambat <b>' + tglPanjang(tgl) + '</b>.' + (pPilih === 'kritis' ? ' Tim IT langsung dapat notifikasi.' : '') + '</span>';
  }
  fT.addEventListener('change', function (e) { if (e.target.name === 'prioritas' || e.target.name === 'level') renderSlaInfo(); if (e.target.closest('.bidang')) bersihkanGalat(e.target); });
  fT.addEventListener('input', function (e) { bersihkanGalat(e.target); });
  function bersihkanGalat(el) { var b = el.closest('.bidang'); if (b && b.classList.contains('salah')) { b.classList.remove('salah'); $('.galat', b).textContent = ''; } }
  function renderBuat() {
    fT.divisi.innerHTML = '<option value="">Pilih divisi</option>' + D.divisi.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
    fT.kategori.innerHTML = '<option value="">Pilih kategori</option>' + D.kategori.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
    fT.teknisi.innerHTML = '<option value="">Otomatis (teknisi level ini dengan tiket paling sedikit)</option>' + D.teknisi.map(function (q) { return '<option value="' + q.id + '">' + esc(q.nama) + ' (' + q.level + ')</option>'; }).join('');
    renderSlaInfo(); renderPratinjau();
  }
  function renderPratinjau() {
    $('#pratinjauLampiran').innerHTML = lampiranBaru.map(function (g, i) { return '<div class="thumb"><img src="' + g + '" alt="Lampiran ' + (i + 1) + '"><button type="button" data-hapus-lampiran="' + i + '" aria-label="Hapus lampiran ' + (i + 1) + '">' + ikon('x') + '</button></div>'; }).join('');
  }
  $('#pratinjauLampiran').addEventListener('click', function (e) { var b = e.target.closest('[data-hapus-lampiran]'); if (b) { lampiranBaru.splice(+b.dataset.hapusLampiran, 1); renderPratinjau(); } });
  function kecilkan(file) {
    return new Promise(function (ok, gagal) {
      if (!/^image\//.test(file.type)) return gagal(new Error('bukan gambar'));
      var r = new FileReader();
      r.onload = function () {
        var img = new Image();
        img.onload = function () {
          var s = Math.min(1, 1100 / Math.max(img.width, img.height)), c = document.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
          ok(c.toDataURL('image/jpeg', .72));
        };
        img.onerror = gagal; img.src = r.result;
      };
      r.onerror = gagal; r.readAsDataURL(file);
    });
  }
  function tambahFile(files) {
    var arr = Array.prototype.slice.call(files || []).slice(0, Math.max(0, 4 - lampiranBaru.length));
    if (!arr.length) { if (files && files.length) toast('Maksimal 4 gambar per tiket'); return; }
    Promise.all(arr.map(function (f) { return kecilkan(f).catch(function () { return null; }); })).then(function (h) {
      var gagal = h.filter(function (x) { return !x; }).length;
      lampiranBaru = lampiranBaru.concat(h.filter(Boolean)); renderPratinjau();
      if (gagal) toast(gagal + ' berkas bukan gambar, dilewati');
    });
  }
  $('#fileLampiran').addEventListener('change', function () { tambahFile(this.files); this.value = ''; });
  var zona = $('#zonaUnggah');
  ['dragenter', 'dragover'].forEach(function (ev) { zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.add('seret-atas'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.remove('seret-atas'); }); });
  zona.addEventListener('drop', function (e) { tambahFile(e.dataTransfer.files); });
  fT.addEventListener('submit', function (e) {
    e.preventDefault();
    var salah = null;
    var cek = function (nama, pesan, syarat) { var el = fT[nama], b = el.closest('.bidang'); var gagal = !syarat(el.value.trim()); b.classList.toggle('salah', gagal); $('.galat', b).textContent = gagal ? pesan : ''; if (gagal && !salah) salah = el; };
    cek('pelapor', 'Isi nama pelapor.', function (v) { return v.length >= 2; });
    cek('hp', 'Nomor WA tidak valid (contoh 081234567890).', function (v) { return !v || /^(\+?62|0)?8\d{7,12}$/.test(v.replace(/[\s-]/g, '')); });
    cek('divisi', 'Pilih divisi.', function (v) { return !!v; });
    cek('judul', 'Tulis judul singkat masalahnya.', function (v) { return v.length >= 5; });
    cek('kategori', 'Pilih kategori.', function (v) { return !!v; });
    cek('deskripsi', 'Jelaskan masalahnya minimal 10 huruf.', function (v) { return v.length >= 10; });
    if (salah) { salah.focus(); toast('Lengkapi isian yang ditandai merah'); return; }
    var kini = Date.now(), p = fT.prioritas.value, l = fT.level.value;
    D.urut++;
    var t = {
      id: uid(), no: 'TK-' + String(1040 + D.urut).padStart(4, '0'), dibuat: new Date(kini).toISOString(), judul: fT.judul.value.trim(), pelapor: fT.pelapor.value.trim(), hp: fT.hp.value.trim(),
      divisi: fT.divisi.value, kategori: fT.kategori.value, deskripsi: fT.deskripsi.value.trim(), prioritas: p, level: l, status: 'baru',
      teknisiId: (sesi.peran !== 'tamu' && fT.teknisi.value) || pilihOtomatis(l), tenggat: new Date(kini + D.sla[p] * MENIT).toISOString(), selesai: null, lampiran: lampiranBaru.slice(), utas: []
    };
    t.utas.push({ id: uid(), t: t.dibuat, jenis: 'pesan', oleh: t.pelapor, peran: 'Pelapor', teks: t.deskripsi });
    var tek = teknisi(t.teknisiId);
    if (tek) t.utas.push({ id: uid(), t: t.dibuat, jenis: 'peristiwa', oleh: 'Sistem', peran: '', teks: 'Ditugaskan ke <b>' + esc(tek.nama) + '</b> (' + tek.level + ')', ikon: 'orang' });
    D.tiket.push(t);
    if (!simpan()) { D.tiket.pop(); D.urut--; t.lampiran = []; return; }
    fT.reset(); lampiranBaru = []; $('#toast').classList.remove('tampil'); renderPratinjau(); renderSlaInfo(); renderHitung();
    if (tek) kirimWebhook('dibuat', t, tek.hp, pesanWa('dibuat', t));
    if (D.hpAdmin) kirimWebhook('dibuat', t, D.hpAdmin, pesanWa('dibuat', t));
    if (p === 'kritis') { beritahu('Tiket KRITIS ' + t.no, t.judul + ' — ' + t.pelapor + ' (' + t.divisi + ')', t.id); sudahDiberitahu[t.id + 'k'] = 1; }
    dialog({
      judul: 'Tiket ' + t.no + ' terkirim',
      isi: '<p class="redup">Prioritas <b>' + pri(p).n + '</b>, level ' + l + (tek ? ', ditangani <b>' + esc(tek.nama) + '</b>' : '') + '. Target selesai ' + tglPanjang(t.tenggat) + '.</p>' +
        '<p class="kecil redup">Kirim notifikasi WhatsApp sekarang:</p><div class="wa-daftar">' +
        (tek ? tombolWa(tek.hp, pesanWa('dibuat', t), 'Ke teknisi ' + tek.nama, tek.level) : '') +
        (D.hpAdmin ? tombolWa(D.hpAdmin, pesanWa('dibuat', t), 'Ke ' + D.namaAdmin + ' (koordinator)', 'admin') : '') +
        (t.hp && sesi.peran !== 'tamu' ? tombolWa(t.hp, pesanWa('diterima', t), 'Konfirmasi ke ' + t.pelapor, 'pelapor') : '') + '</div>',
      aksi: sesi.peran === 'tamu' ? [{ label: 'Selesai', kelas: 'utama', fn: function () { keluar(); } }] : [{ label: 'Buat lagi' }, { label: 'Lihat tiket', kelas: 'utama', fn: function () { buka('tiket'); setTimeout(function () { bukaTiket(t.id); }, 50); } }]
    });
  });

  // ================= LAPORAN =================
  var periode = 30;
  $$('[data-periode]').forEach(function (b) { b.addEventListener('click', function () { periode = +b.dataset.periode; renderLaporan(); }); });
  function renderLaporan() {
    $$('[data-periode]').forEach(function (b) { b.setAttribute('aria-selected', +b.dataset.periode === periode); });
    var batas = periode ? Date.now() - periode * 86400e3 : 0;
    var L = D.tiket.filter(function (t) { return new Date(t.dibuat) >= batas; });
    var sel = L.filter(function (t) { return !terbuka(t); }), tepat = sel.filter(function (t) { return !lewatSla(t); });
    var rata = sel.length ? sel.reduce(function (s, t) { return s + lamaSelesai(t); }, 0) / sel.length : 0;
    $('#laporanSub').textContent = (periode ? periode + ' hari terakhir' : 'Seluruh data') + ' · ' + L.length + ' tiket';
    var st = [
      { l: 'Tiket masuk', ik: 'tiket', v: L.length, kls: 'utama-stat', c: L.filter(terbuka).length + ' masih terbuka' },
      { l: 'Selesai', ik: 'cek', v: sel.length, c: L.length ? Math.round(sel.length / L.length * 100) + '% dari tiket masuk' : '—' },
      { l: 'Kepatuhan SLA', ik: 'jam', v: sel.length ? tepat.length / sel.length * 100 : 0, c: tepat.length + ' tepat, ' + (sel.length - tepat.length) + ' lewat', fmt: function (x) { return Math.round(x) + '<small>%</small>'; } },
      { l: 'Rata-rata selesai', ik: 'laporan', v: rata / JAM, c: 'Dari tiket dibuat sampai selesai', fmt: function (x) { return x.toFixed(1).replace('.', ',') + '<small>jam</small>'; } }
    ];
    $('#statLaporan').innerHTML = st.map(function (s, i) { return '<div class="stat ' + (s.kls || '') + '" style="--i:' + i + '"><span class="stat-label">' + ikon(s.ik) + s.l + '</span><span class="stat-angka"></span><span class="stat-catatan">' + s.c + '</span></div>'; }).join('');
    st.forEach(function (s, i) { hitungKe($('.stat-angka', $('#statLaporan').children[i]), s.v, s.fmt); });
    var maksK = 1, perK = D.kategori.map(function (k) { var n = L.filter(function (t) { return t.kategori === k; }).length; maksK = Math.max(maksK, n); return { k: k, n: n }; }).sort(function (a, b) { return b.n - a.n; });
    $('#perKategori').innerHTML = perK.map(function (x, i) { return '<li style="--i:' + i + '"><span class="atas-b"><b>' + esc(x.k) + '</b><span>' + x.n + ' tiket</span></span><span class="meter"><i style="width:' + (x.n / maksK * 100) + '%"></i></span></li>'; }).join('');
    var maksP = Math.max(1, L.length);
    $('#perPrioritas').innerHTML = PRIORITAS.slice().reverse().map(function (p, i) {
      var a = L.filter(function (t) { return t.prioritas === p.k; }), s = a.filter(function (t) { return !terbuka(t); }), ok = s.filter(function (t) { return !lewatSla(t); }).length;
      return '<li class="p-' + p.k + '" style="--i:' + i + '"><span class="atas-b"><b>' + p.n + ' <span class="mono">· SLA ' + Math.round(D.sla[p.k] / 60) + ' jam</span></b><span>' + a.length + ' tiket · ' + (s.length ? Math.round(ok / s.length * 100) + '% tepat SLA' : 'belum ada selesai') + '</span></span><span class="meter"><i class="p" style="width:' + (a.length / maksP * 100) + '%"></i></span></li>';
    }).join('');
    $('#perTeknisi').innerHTML = '<thead><tr><th>Teknisi</th><th>Level</th><th class="angka">Ditangani</th><th class="angka">Selesai</th><th class="angka">Rata-rata</th><th class="angka">Tepat SLA</th></tr></thead><tbody>' +
      D.teknisi.map(function (q, i) {
        var a = L.filter(function (t) { return t.teknisiId === q.id; }), s = a.filter(function (t) { return !terbuka(t); }), ok = s.filter(function (t) { return !lewatSla(t); }).length;
        var r = s.length ? s.reduce(function (x, t) { return x + lamaSelesai(t); }, 0) / s.length : 0;
        return '<tr style="--i:' + i + '"><td><b>' + esc(q.nama) + '</b></td><td>' + pilL(q.level) + '</td><td class="angka">' + a.length + '</td><td class="angka">' + s.length + '</td><td class="angka">' + (s.length ? durasi(r) : '—') + '</td><td class="angka">' + (s.length ? Math.round(ok / s.length * 100) + '%' : '—') + '</td></tr>';
      }).join('') + '</tbody>';
  }
  function unduh(nama, isi, tipe) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([isi], { type: tipe })); a.download = nama;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function tglFile() { var d = new Date(); return d.getFullYear() + '-' + dua(d.getMonth() + 1) + '-' + dua(d.getDate()); }
  $('#eksporCsv').onclick = function () {
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var head = ['No', 'Dibuat', 'Judul', 'Pelapor', 'WhatsApp', 'Divisi', 'Kategori', 'Prioritas', 'Level', 'Status', 'Teknisi', 'Batas SLA', 'Selesai', 'Durasi (jam)', 'SLA'];
    var rows = D.tiket.map(function (t) {
      var tek = teknisi(t.teknisiId);
      return [t.no, tglPanjang(t.dibuat), t.judul, t.pelapor, t.hp, t.divisi, t.kategori, pri(t.prioritas).n, t.level, sts(t.status).n, tek ? tek.nama : '', tglPanjang(t.tenggat), t.selesai ? tglPanjang(t.selesai) : '', t.selesai ? (lamaSelesai(t) / JAM).toFixed(1) : '', lewatSla(t) ? 'Lewat' : (terbuka(t) ? 'Berjalan' : 'Tepat')].map(q).join(',');
    });
    unduh('tiket-helpdesk-' + tglFile() + '.csv', '﻿' + head.join(',') + '\n' + rows.join('\n'), 'text/csv;charset=utf-8');
    toast('CSV diunduh: ' + D.tiket.length + ' tiket');
  };
  $('#backupJson').onclick = function () { unduh('backup-helpdesk-' + tglFile() + '.json', JSON.stringify(D), 'application/json'); toast('Backup JSON diunduh'); };
  // ---- PDF: dibuat langsung di browser lalu diunduh (tanpa library tambahan) ----
  var PDF_LEBAR = {"r":[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,556,556,556,222,556,333,1000,556,556,333,1000,667,333,1000,556,611,556,556,222,222,333,333,350,556,1000,333,1000,500,333,944,556,500,667,556,333,556,556,556,556,260,556,333,737,370,556,584,556,737,333,400,584,556,556,333,556,537,278,333,556,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500],"b":[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,556,556,556,278,556,500,1000,556,556,333,1000,667,333,1000,556,611,556,556,278,278,500,500,350,556,1000,333,1000,556,333,944,556,500,667,556,333,556,556,556,556,280,556,333,737,370,556,584,556,737,333,400,584,556,556,333,611,556,278,333,556,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556]};
  function pdfLatin(s) {
    s = String(s == null ? '' : s);
    var peta = { '—': '\x97', '–': '\x96', '‘': '\x91', '’': '\x92', '“': '\x93', '”': '\x94', '•': '\x95', '…': '\x85', '€': '\x80', '→': '->', '←': '<-' }, o = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i), c = s.charCodeAt(i);
      if ((c >= 32 && c <= 126) || (c >= 160 && c <= 255)) o += ch;
      else if (peta[ch]) o += peta[ch];
      else if (c < 32) o += ' ';
      else o += '?';
    }
    return o;
  }
  function pdfLebarTeks(s, f, sz) {
    var t = PDF_LEBAR[f], w = 0;
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i) - 32; w += (c >= 0 && t[c]) || 556; }
    return w * sz / 1000;
  }
  function pdfBungkus(s, f, sz, maks) {
    var hasil = [], baris = '';
    s.split(' ').forEach(function (k) {
      while (pdfLebarTeks(k, f, sz) > maks) {
        if (baris) { hasil.push(baris); baris = ''; }
        var i = 1; while (i < k.length && pdfLebarTeks(k.slice(0, i + 1), f, sz) <= maks) i++;
        hasil.push(k.slice(0, i)); k = k.slice(i);
      }
      var coba = baris ? baris + ' ' + k : k;
      if (baris && pdfLebarTeks(coba, f, sz) > maks) { hasil.push(baris); baris = k; } else baris = coba;
    });
    hasil.push(baris);
    return hasil;
  }
  function buatPdf(judul, mendatar) {
    var W = mendatar ? 842 : 595, H = mendatar ? 595 : 842, M = 28, hal = [], isi = null, y = 0, api = {};
    function baru() { isi = []; hal.push(isi); y = H - M; }
    function esk(s) { return s.replace(/[\\()]/g, '\\$&'); }
    function teks(x, yy, s, f, sz) { isi.push('BT /' + (f === 'b' ? 'F2' : 'F1') + ' ' + sz + ' Tf ' + x.toFixed(2) + ' ' + yy.toFixed(2) + ' Td (' + esk(s) + ') Tj ET'); }
    baru();
    api.ruang = function (h) { if (y - h < M + 16) baru(); };
    api.jarak = function (h) { y -= h; };
    api.paragraf = function (s, f, sz, geser) {
      var g = geser || 0, tl = sz * 1.35;
      pdfBungkus(pdfLatin(s), f, sz, W - 2 * M - g).forEach(function (l) { api.ruang(tl); y -= tl; teks(M + g, y + sz * .3, l, f, sz); });
    };
    api.tabel = function (kol, baris, sz) {
      var pad = 3, tl = sz * 1.3;
      function tarik(sel, f, abu, ulang) {
        var bg = sel.map(function (t, i) { return pdfBungkus(pdfLatin(t), f, sz, kol[i].w - 2 * pad); });
        var n = Math.max.apply(null, bg.map(function (b) { return b.length; })), tinggi = n * tl + 2 * pad;
        if (y - tinggi < M + 16) { baru(); if (!ulang) tarik(kol.map(function (k) { return k.t; }), 'b', true, true); }
        var x = M;
        bg.forEach(function (lines, i) {
          if (abu) isi.push('0.9 g ' + x.toFixed(2) + ' ' + (y - tinggi).toFixed(2) + ' ' + kol[i].w + ' ' + tinggi.toFixed(2) + ' re f 0 g');
          isi.push('0.5 w 0.65 G ' + x.toFixed(2) + ' ' + (y - tinggi).toFixed(2) + ' ' + kol[i].w + ' ' + tinggi.toFixed(2) + ' re S 0 G');
          lines.forEach(function (l, j) { teks(x + pad, y - pad - (j + 1) * tl + tl * .3, l, f, sz); });
          x += kol[i].w;
        });
        y -= tinggi;
      }
      tarik(kol.map(function (k) { return k.t; }), 'b', true, false);
      baris.forEach(function (b) { tarik(b, 'r', false, false); });
    };
    api.simpan = function (nama) {
      var n = hal.length, objs = [], kids = [], i;
      for (i = 0; i < n; i++) kids.push((5 + i * 2) + ' 0 R');
      objs[1] = '<</Type/Catalog/Pages 2 0 R>>';
      objs[2] = '<</Type/Pages/Kids[' + kids.join(' ') + ']/Count ' + n + '>>';
      objs[3] = '<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>';
      objs[4] = '<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>';
      for (i = 0; i < n; i++) {
        var ft = 'Halaman ' + (i + 1) + ' / ' + n;
        isi = hal[i];
        teks(M, 14, pdfLatin(judul), 'r', 7);
        teks(W - M - pdfLebarTeks(ft, 'r', 7), 14, ft, 'r', 7);
        var c = hal[i].join('\n');
        objs[5 + i * 2] = '<</Type/Page/Parent 2 0 R/MediaBox[0 0 ' + W + ' ' + H + ']/Resources<</Font<</F1 3 0 R/F2 4 0 R>>>>/Contents ' + (6 + i * 2) + ' 0 R>>';
        objs[6 + i * 2] = '<</Length ' + c.length + '>>\nstream\n' + c + '\nendstream';
      }
      objs.push('<</Title (' + esk(pdfLatin(judul)) + ')/Producer (Helpdesk Tiket)>>');
      var out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', off = [];
      for (i = 1; i < objs.length; i++) { off[i] = out.length; out += i + ' 0 obj\n' + objs[i] + '\nendobj\n'; }
      var xr = out.length;
      out += 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n';
      for (i = 1; i < objs.length; i++) out += ('0000000000' + off[i]).slice(-10) + ' 00000 n \n';
      out += 'trailer\n<</Size ' + objs.length + '/Root 1 0 R/Info ' + (objs.length - 1) + ' 0 R>>\nstartxref\n' + xr + '\n%%EOF';
      var bytes = new Uint8Array(out.length);
      for (i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
      unduh(nama, bytes, 'application/pdf');
    };
    return api;
  }
  function tanpaTag(s) { return String(s == null ? '' : s).replace(/<[^>]*>/g, ''); }
  function infoSla(t) { return lewatSla(t) ? 'Lewat' : (terbuka(t) ? 'Berjalan' : 'Tepat'); }
  function tglPendek(t) { var d = new Date(t); return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear() + ' ' + dua(d.getHours()) + '.' + dua(d.getMinutes()); }
  function eksporPdf() {
    var p = buatPdf('Daftar Tiket Helpdesk', true);
    p.paragraf('Daftar Tiket Helpdesk', 'b', 15);
    p.paragraf('Dibuat ' + tglPanjang(new Date()) + ' | ' + D.tiket.length + ' tiket', 'r', 8.5);
    p.jarak(8);
    p.tabel([{ t: 'No', w: 44 }, { t: 'Dibuat', w: 68 }, { t: 'Judul', w: 130 }, { t: 'Pelapor', w: 66 }, { t: 'Divisi', w: 56 }, { t: 'Kategori', w: 62 }, { t: 'Prioritas', w: 44 }, { t: 'Level', w: 26 }, { t: 'Status', w: 50 }, { t: 'Teknisi', w: 64 }, { t: 'Batas SLA', w: 68 }, { t: 'Selesai', w: 68 }, { t: 'SLA', w: 40 }],
      D.tiket.map(function (t) {
        var tek = teknisi(t.teknisiId);
        return [t.no, tglPendek(t.dibuat), t.judul, t.pelapor, t.divisi, t.kategori, pri(t.prioritas).n, t.level, sts(t.status).n, tek ? tek.nama : '', tglPendek(t.tenggat), t.selesai ? tglPendek(t.selesai) : '', infoSla(t)];
      }), 7.5);
    p.simpan('tiket-helpdesk-' + tglFile() + '.pdf');
    toast('PDF diunduh: ' + D.tiket.length + ' tiket');
  }
  function backupPdf() {
    var p = buatPdf('Backup Helpdesk Tiket', false);
    p.paragraf('Backup Helpdesk Tiket', 'b', 15);
    p.paragraf('Dibuat ' + tglPanjang(new Date()) + ' | ' + D.tiket.length + ' tiket | Arsip untuk dibaca. Untuk memulihkan data, gunakan backup JSON.', 'r', 8.5);
    p.jarak(8);
    p.paragraf('Teknisi', 'b', 11); p.jarak(3);
    p.tabel([{ t: 'Nama', w: 300 }, { t: 'Level', w: 80 }], D.teknisi.map(function (q) { return [q.nama, q.level]; }), 8.5);
    p.jarak(12);
    p.paragraf('Tiket', 'b', 11); p.jarak(3);
    D.tiket.forEach(function (t) {
      var tek = teknisi(t.teknisiId);
      p.ruang(80);
      p.paragraf(t.no + ' - ' + t.judul, 'b', 9);
      p.paragraf('Pelapor: ' + t.pelapor + ' (' + t.hp + ') | Divisi: ' + t.divisi + ' | Kategori: ' + t.kategori, 'r', 8, 8);
      p.paragraf('Prioritas: ' + pri(t.prioritas).n + ' | Level: ' + t.level + ' | Status: ' + sts(t.status).n + ' | Teknisi: ' + (tek ? tek.nama : '-') + ' | SLA: ' + infoSla(t), 'r', 8, 8);
      p.paragraf('Dibuat: ' + tglPanjang(t.dibuat) + ' | Batas SLA: ' + tglPanjang(t.tenggat) + (t.selesai ? ' | Selesai: ' + tglPanjang(t.selesai) : '') + (t.lampiran && t.lampiran.length ? ' | Lampiran: ' + t.lampiran.length : ''), 'r', 8, 8);
      p.paragraf('Deskripsi: ' + (t.deskripsi || '-'), 'r', 8, 8);
      (t.utas || []).forEach(function (u) { p.paragraf(tglPendek(u.t) + ' - ' + u.oleh + ': ' + tanpaTag(u.teks), 'r', 7.5, 18); });
      p.jarak(8);
    });
    p.simpan('backup-helpdesk-' + tglFile() + '.pdf');
    toast('Backup PDF diunduh: ' + D.tiket.length + ' tiket');
  }
  // tombol PDF disisipkan di samping tombol CSV dan JSON yang sudah ada
  [['#eksporCsv', 'Ekspor PDF', 'eksporPdf', eksporPdf], ['#backupJson', 'Backup PDF', 'backupPdf', backupPdf]].forEach(function (c) {
    var asal = $(c[0]); if (!asal || $('#' + c[2])) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = c[2]; b.className = asal.className; b.textContent = c[1]; b.onclick = c[3];
    asal.parentNode.insertBefore(b, asal.nextSibling);
  });
  $('#pulihkan').onchange = function () {
    var f = this.files[0]; this.value = ''; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      var x; try { x = JSON.parse(r.result); } catch (e) { x = null; }
      if (!x || !Array.isArray(x.tiket) || !Array.isArray(x.teknisi)) { toast('Berkas bukan backup Helpdesk Tiket yang valid'); return; }
      konfirmasi('Pulihkan backup?', 'Data sekarang (' + D.tiket.length + ' tiket) diganti isi backup (' + x.tiket.length + ' tiket).', 'Pulihkan', function () { var lama = D; muat(x); if (!simpan()) D = lama; segarkan(); toast('Backup dipulihkan'); });
    };
    r.readAsText(f);
  };

  // ================= ATUR =================
  function renderAtur() {
    $('#daftarTeknisi').innerHTML = D.teknisi.map(function (q) {
      return '<li>' + avaHtml(q.nama) + '<div><b>' + esc(q.nama) + '</b><small>' + q.level + ' · ' + LEVEL.filter(function (l) { return l.k === q.level; })[0].n + ' · <span class="mono">' + esc(q.hp || 'tanpa WA') + '</span></small></div>' +
        '<span class="aksi"><button class="ikon-tombol" data-ubah-tek="' + q.id + '" aria-label="Ubah ' + esc(q.nama) + '">' + ikon('atur') + '</button><button class="ikon-tombol" data-hapus-tek="' + q.id + '" aria-label="Hapus ' + esc(q.nama) + '">' + ikon('hapus') + '</button></span></li>';
    }).join('') || '<li class="redup">Belum ada teknisi.</li>';
    $('#slaAtur').innerHTML = PRIORITAS.map(function (p) { return '<label class="p-' + p.k + '"><span class="nama">' + pilP(p.k) + '<small>' + p.ket + '</small></span><span><input type="number" min="1" max="720" step="1" data-sla-p="' + p.k + '" value="' + Math.round(D.sla[p.k] / 60) + '" aria-label="SLA ' + p.n + ' dalam jam"></span></label>'; }).join('') + '<p class="kecil redup">Dalam jam. Tiket lama tidak berubah.</p>';
    $('#hpAdmin').value = D.hpAdmin || '';
    $('#pinAdmin').value = D.pin.admin; $('#pinTeknisi').value = D.pin.teknisi;
    renderStatusNotif();
  }
  function renderStatusNotif() {
    var el = $('#statusNotif'), b = $('#izinNotif');
    if (!('Notification' in window)) { el.textContent = 'Browser ini tidak mendukung notifikasi.'; b.disabled = true; return; }
    var p = Notification.permission;
    el.textContent = p === 'granted' ? 'Aktif: muncul untuk tiket Kritis & lewat SLA.' : p === 'denied' ? 'Diblokir. Izinkan lewat ikon gembok di bilah alamat.' : 'Muncul untuk tiket Kritis dan tiket lewat SLA.';
    b.disabled = p !== 'default'; b.lastChild.textContent = p === 'granted' ? 'Aktif' : 'Aktifkan';
  }
  $('#izinNotif').onclick = function () { Notification.requestPermission().then(function () { renderStatusNotif(); if (Notification.permission === 'granted') beritahu('Notifikasi aktif', 'Kamu akan diberi tahu saat ada tiket Kritis.', 'uji'); }); };
  $('#slaAtur').addEventListener('change', function (e) {
    var p = e.target.dataset.slaP; if (!p) return; var v = Math.min(720, Math.max(1, Math.round(+e.target.value || 0)));
    e.target.value = v; D.sla[p] = v * 60; simpan(); toast('SLA ' + pri(p).n + ' jadi ' + v + ' jam');
  });
  $('#hpAdmin').onchange = function () { D.hpAdmin = this.value.trim(); simpan(); toast('Nomor koordinator disimpan'); };
  $('#simpanPin').onclick = function () {
    var a = $('#pinAdmin').value.trim(), t = $('#pinTeknisi').value.trim();
    if (!/^\d{4,6}$/.test(a) || !/^\d{4,6}$/.test(t)) { toast('PIN harus 4–6 angka'); return; }
    if (a === t) { toast('PIN admin dan teknisi harus berbeda'); return; }
    D.pin = { admin: a, teknisi: t }; simpan(); toast('PIN disimpan');
  };
  function formTeknisi(q) {
    q = q || {};
    dialog({
      judul: q.id ? 'Ubah teknisi' : 'Tambah teknisi',
      isi: '<label class="bidang"><span>Nama *</span><input name="nama" value="' + esc(q.nama || '') + '" placeholder="mis. Rudi Hartono"><em class="galat"></em></label>' +
        '<label class="bidang"><span>No. WhatsApp</span><input name="hp" inputmode="tel" value="' + esc(q.hp || '') + '" placeholder="0812xxxx"></label>' +
        '<label class="bidang"><span>Level</span><select name="level">' + LEVEL.map(function (l) { return '<option value="' + l.k + '"' + (l.k === (q.level || 'L1') ? ' selected' : '') + '>' + l.k + ' · ' + l.n + '</option>'; }).join('') + '</select></label>',
      aksi: [{ label: 'Batal' }, { label: 'Simpan', kelas: 'utama', submit: true, fn: function (f) {
        var n = f.nama.value.trim(); if (n.length < 2) { f.nama.closest('.bidang').classList.add('salah'); $('.galat', f).textContent = 'Isi nama teknisi.'; f.nama.focus(); return false; }
        if (q.id) { q.nama = n; q.hp = f.hp.value.trim(); q.level = f.level.value; } else D.teknisi.push({ id: uid(), nama: n, hp: f.hp.value.trim(), level: f.level.value });
        simpan(); renderAtur(); toast('Teknisi disimpan');
      } }]
    });
  }
  $('#tambahTeknisi').onclick = function () { formTeknisi(); };
  $('#daftarTeknisi').addEventListener('click', function (e) {
    var u = e.target.closest('[data-ubah-tek]'), h = e.target.closest('[data-hapus-tek]');
    if (u) formTeknisi(teknisi(u.dataset.ubahTek));
    if (h) {
      var q = teknisi(h.dataset.hapusTek), n = bebanTeknisi(q.id);
      konfirmasi('Hapus ' + q.nama + '?', n ? n + ' tiket terbuka miliknya akan jadi "Belum ditugaskan".' : 'Riwayat tiket tetap tersimpan.', 'Hapus', function () {
        D.tiket.forEach(function (t) { if (terbuka(t) && t.teknisiId === q.id) t.teknisiId = ''; });
        D.teknisi = D.teknisi.filter(function (x) { return x !== q; }); simpan(); renderAtur(); toast(q.nama + ' dihapus');
      }, true);
    }
  });
  $('#muatContoh').onclick = function () { konfirmasi('Muat data contoh?', 'Semua tiket & teknisi sekarang diganti data contoh. Unduh backup dulu kalau perlu.', 'Muat contoh', function () { var pin = D.pin; D = dataContoh(); D.pin = pin; simpan(); renderAtur(); renderHitung(); toast('Data contoh dimuat'); }); };
  $('#kosongkan').onclick = function () {
    konfirmasi('Kosongkan semua tiket?', 'Teknisi, SLA, dan PIN tetap. Tiket (' + D.tiket.length + ') dihapus.', 'Kosongkan', function () {
      var lama = D.tiket, urut = D.urut; D.tiket = []; D.contoh = false; simpan(); renderHitung();
      toast('Tiket dikosongkan', { label: 'Urungkan', fn: function () { D.tiket = lama; D.urut = urut; simpan(); renderHitung(); } });
    }, true);
  };

  // ---------- Detak: hitung mundur SLA & notifikasi lewat SLA ----------
  setInterval(function () {
    if (!sesi || sesi.peran === 'tamu' || document.hidden) return;
    $$('[data-sla]').forEach(function (el) {
      var t = tiket(el.dataset.sla); if (!t || !terbuka(t)) return; var s = infoSla(t);
      if (el.hasAttribute('data-polos')) { el.textContent = s.teks; return; }
      el.className = 'sla ' + s.kelas; var sp = el.lastChild; if (sp) sp.textContent = s.teks;
    });
    D.tiket.forEach(function (t) {
      if (terbuka(t) && lewatSla(t) && (t.prioritas === 'kritis' || t.prioritas === 'tinggi') && !sudahDiberitahu[t.id]) {
        sudahDiberitahu[t.id] = 1;
        if (new Date() - new Date(t.tenggat) < 5000) { beritahu(t.no + ' lewat SLA', t.judul + ' — pertimbangkan eskalasi ke level berikutnya.', t.id); toast(t.no + ' baru saja lewat SLA', { label: 'Buka', fn: function () { bukaTiket(t.id); } }); }
      }
    });
  }, 1000);

  // ---------- Tema (customizer Maliki Studio, lihat tema.css & tema.js) ----------
  var FONT_OK = ['Plus Jakarta Sans', 'Inter', 'Poppins', 'DM Sans', 'Space Grotesk', 'Nunito'];
  function terapkanTema(t) {
    var r = document.documentElement, st = r.style;
    if (t.utama) st.setProperty('--tema-utama', t.utama);
    if (t.aksen) st.setProperty('--tema-aksen', t.aksen);
    if (t.radius != null) st.setProperty('--tema-radius', typeof t.radius === 'number' ? t.radius + 'px' : t.radius);
    if (t.font) {
      var f = String(t.font).split(',')[0].replace(/["']/g, '').trim();
      st.setProperty('--tema-font', '"' + f + '", system-ui, sans-serif');
      var l = $('#fontTema'); if (l && FONT_OK.indexOf(f) >= 0) l.href = 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + ':wght@400;500;600;700;800&display=swap';
    }
    if (t.mode) r.setAttribute('data-mode', t.mode === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'gelap' : 'terang') : t.mode);
    if (t.bagian) terapkanBagian(t.bagian);
    if (t.nama) { NAMA_TEMA = t.nama; $$('[data-tema-nama]').forEach(function (e) { e.textContent = t.nama; }); }
    setTimeout(hitungTeksBagian, 0);
  }
  window.addEventListener('message', function (e) { if (e.data && e.data.tipe === 'tema') terapkanTema(e.data); });

  // ---------- Bagian (warna per bagian, sorot, tap-untuk-pilih) ----------
  var NAMA_BAGIAN = { nav: 'Navigasi', latar: 'Latar', panel: 'Panel', utama: 'Warna utama', aksen: 'Aksen', teks: 'Teks' };
  var VAR_BAGIAN = { latar: '--latar', panel: '--kartu', nav: '--nav', teks: '--teks' };
  var PETA_TAMBAHAN = { aksen: '.hitung, .ava, .sla-info, .grafik .b, .legenda', teks: 'h1, h2, .stat-angka', utama: '.nav.aktif, .seg[aria-selected="true"], .tombol.utama, .stat.utama-stat', panel: '.stat, .kartu-tiket, .kolom' };
  function tandaiBagian() {
    Object.keys(PETA_TAMBAHAN).forEach(function (b) { $$(PETA_TAMBAHAN[b]).forEach(function (el) { if (!el.hasAttribute('data-bagian')) el.setAttribute('data-bagian', b); }); });
  }
  function warnaNyata(v) {
    var p = document.createElement('i'); p.style.cssText = 'position:absolute;width:0;height:0;background:var(' + v + ')';
    document.body.appendChild(p); var c = getComputedStyle(p).backgroundColor; p.remove();
    var m = (c.match(/[\d.]+/g) || [255, 255, 255]).map(Number);
    if (/^color\(srgb/.test(c)) m = m.map(function (x) { return x * 255; });
    return m.slice(0, 3);
  }
  function teksUntuk(v) {
    var l = warnaNyata(v).map(function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    return (0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]) > 0.4 ? '#14181d' : '#ffffff';
  }
  function hitungTeksBagian() {
    var st = document.documentElement.style;
    st.setProperty('--tema-nav-teks', teksUntuk('--nav'));
    st.setProperty('--tema-utama-teks', teksUntuk('--utama'));
  }
  function terapkanBagian(bg) {
    var st = document.documentElement.style;
    Object.keys(VAR_BAGIAN).forEach(function (k) {
      if (bg[k] === undefined) return;
      if (bg[k]) { st.setProperty('--tema-' + k, bg[k]); st.setProperty(VAR_BAGIAN[k], bg[k]); }
      else { st.removeProperty('--tema-' + k); st.removeProperty(VAR_BAGIAN[k]); }
    });
  }
  var sorotAktif = null;
  function sorot(b) {
    sorotAktif = b;
    $$('[data-sorot]').forEach(function (e) { e.removeAttribute('data-sorot'); });
    $$('.label-sorot').forEach(function (e) { e.remove(); });
    if (!b) return;
    $$('[data-bagian="' + b + '"]').forEach(function (e) {
      e.setAttribute('data-sorot', '');
      var r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
      var lb = document.createElement('span'); lb.className = 'label-sorot'; lb.textContent = NAMA_BAGIAN[b] || b;
      lb.style.left = Math.max(2, r.left + 4) + 'px'; lb.style.top = Math.max(2, r.top + 4) + 'px';
      document.body.appendChild(lb);
    });
  }
  var modePilih = false, hoverEl = null;
  function bagianDari(t) { return t && t.closest ? t.closest('[data-bagian]') : null; }
  function setPilih(on) {
    modePilih = !!on; document.documentElement.classList.toggle('mode-pilih', modePilih);
    if (!modePilih && hoverEl) { hoverEl.removeAttribute('data-pilih-hover'); hoverEl = null; }
  }
  ['click', 'pointerdown', 'mousedown', 'touchstart', 'submit', 'keydown', 'dragstart', 'change'].forEach(function (tipe) {
    window.addEventListener(tipe, function (e) {
      if (!modePilih) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      if (tipe === 'click') { var el = bagianDari(e.target); if (el) parent.postMessage({ tipe: 'bagian-dipilih', bagian: el.getAttribute('data-bagian') }, '*'); }
    }, { capture: true, passive: false });
  });
  document.addEventListener('mouseover', function (e) {
    if (!modePilih) return; var el = bagianDari(e.target);
    if (hoverEl && hoverEl !== el) hoverEl.removeAttribute('data-pilih-hover');
    hoverEl = el; if (el) el.setAttribute('data-pilih-hover', '');
  }, true);
  window.addEventListener('message', function (e) {
    var d = e.data; if (!d) return;
    if (d.tipe === 'sorot') sorot(d.bagian || null);
    else if (d.tipe === 'mode-pilih') setPilih(d.aktif);
  });
  new MutationObserver(function (ms) {
    var mode = ms.some(function (m) { return m.type === 'attributes'; });
    var dom = ms.some(function (m) { return m.type === 'childList' && Array.prototype.some.call(m.addedNodes, function (n) { return n.nodeType === 1 && n.className !== 'label-sorot'; }); });
    if (dom) { tandaiBagian(); if (sorotAktif) sorot(sorotAktif); } if (mode) hitungTeksBagian();
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-mode'] });

  // ---------- Mulai ----------
  function mulai() {
  muat(SV.awal);
  $$('[data-tema-nama]').forEach(function (e) { e.textContent = NAMA_TEMA; });
  tandaiBagian(); hitungTeksBagian(); renderHitung();
  var simpanan = null; try { simpanan = JSON.parse(sessionStorage.getItem(KUNCI_SESI)); } catch (e) {}
  var qs = new URLSearchParams(location.search);
  // ?demo (atau dibuka di iframe pratinjau customizer) langsung masuk sebagai admin
  if (qs.has('demo') || window.self !== window.top) simpanan = { peran: 'admin' };
  if (simpanan && simpanan.peran) masuk(simpanan); else tampilGerbang();
  if (SV.gagal) toast('Tidak bisa terhubung ke database. Data sementara hanya tersimpan di browser ini.');
  if (qs.has('tiket')) { var tq = D.tiket.filter(function (t) { return t.no === qs.get('tiket'); })[0]; if (tq) bukaTiket(tq.id); }
  }
  sinkronAwal(mulai);
})();
