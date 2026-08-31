-- Seed data untuk tabel knowledge_base_articles
-- Anda dapat mengeksekusi script ini di SQL Editor Supabase Anda

INSERT INTO knowledge_base_articles (title, description, category, content, views, helpful_score)
VALUES 
(
  'Cara Reset Password Email Perusahaan (Office 365)',
  'Panduan langkah demi langkah untuk mereset password akun email perusahaan Anda secara mandiri melalui portal Office 365.',
  'Accounts & Access',
  '# Panduan Reset Password Office 365

Jika Anda lupa password email perusahaan atau akun Office 365 Anda, Anda dapat melakukan reset mandiri dengan langkah-langkah berikut:

1. Buka browser dan akses halaman portal login Microsoft di [https://login.microsoftonline.com](https://login.microsoftonline.com)
2. Masukkan alamat email perusahaan Anda secara lengkap (contoh: nama@perusahaan.co.id) lalu klik **Next**.
3. Pada halaman pengisian password, klik tautan **"Forgot my password"**.
4. Ikuti instruksi verifikasi keamanan (biasanya Microsoft akan mengirimkan kode ke nomor handphone atau email pemulihan Anda).
5. Masukkan kode verifikasi yang Anda terima.
6. Buat password baru Anda. **Syarat password baru:**
   - Minimal 8 karakter.
   - Mengandung kombinasi huruf besar, huruf kecil, angka, dan simbol.
   - Tidak sama dengan 3 password Anda sebelumnya.
7. Simpan password baru Anda dan coba login kembali.

Jika Anda tidak memiliki akses ke nomor HP pemulihan, silakan buat tiket ke IT Support dengan kategori **Accounts & Access**.',
  12450,
  98
),
(
  'Cara Menghubungkan Laptop ke Jaringan VPN Perusahaan',
  'Instruksi untuk menghubungkan perangkat Anda ke VPN perusahaan agar dapat mengakses server internal dari luar kantor.',
  'Network',
  '# Panduan Koneksi VPN Perusahaan

Untuk mengakses sistem internal perusahaan (seperti sistem ERP, file server lokal) saat Anda sedang WFH atau dinas luar kota, Anda wajib terhubung ke VPN perusahaan.

### Prasyarat:
Pastikan aplikasi **FortiClient VPN** atau **Cisco AnyConnect** sudah terinstal di laptop Anda. Jika belum, hubungi IT Support.

### Langkah-langkah:
1. Buka aplikasi VPN client di laptop Anda (cari di menu Start).
2. Masukkan alamat server VPN perusahaan: `vpn.perusahaan.co.id`.
3. Masukkan **Username** (nama depan.nama belakang) dan **Password** Windows/Email Anda.
4. Klik **Connect**.
5. Jika diminta memasukkan kode OTP (MFA), buka aplikasi Microsoft Authenticator di HP Anda dan setujui permintaan login.
6. Tunggu hingga status berubah menjadi **Connected**.

*Catatan: Pastikan koneksi internet di tempat Anda stabil (minimal 10 Mbps) agar koneksi ke server tidak terputus.*',
  8730,
  95
),
(
  'Solusi: Microsoft Outlook Tidak Sinkron Email Baru',
  'Langkah-langkah perbaikan mandiri jika aplikasi Microsoft Outlook di laptop tidak mengunduh atau menampilkan email terbaru.',
  'Microsoft 365',
  '# Mengatasi Microsoft Outlook Tidak Sinkron

Terkadang aplikasi Microsoft Outlook di desktop mengalami "nyangkut" sehingga tidak dapat menarik email baru. Berikut adalah cara mengatasinya:

### Solusi 1: Cek Koneksi dan Status Outlook
1. Pastikan laptop Anda terhubung ke internet.
2. Lihat bagian kanan bawah jendela Outlook. Jika ada tulisan **"Working Offline"** atau **"Disconnected"**, klik tab **Send / Receive** di menu atas.
3. Klik tombol **Work Offline** untuk menonaktifkannya. Outlook akan mencoba terhubung kembali (status akan berubah menjadi "Connected to: Microsoft Exchange").

### Solusi 2: Update Folder Manual
1. Buka tab **Send / Receive**.
2. Klik tombol **Update Folder** atau **Send/Receive All Folders**.
3. Tunggu hingga proses sinkronisasi selesai di pojok kanan bawah.

### Solusi 3: Restart Outlook dalam Safe Mode
1. Tutup aplikasi Outlook.
2. Tekan tombol `Windows + R` di keyboard Anda.
3. Ketik `outlook.exe /safe` lalu tekan Enter.
4. Jika Outlook berjalan normal di Safe Mode, kemungkinan ada Add-ins (ekstensi) yang bermasalah.

Jika ketiga cara di atas tidak berhasil, Anda perlu memperbaiki profil Outlook. Silakan buat tiket IT Support untuk bantuan remote.',
  6120,
  92
),
(
  'Cara Berbagi File Secara Aman Menggunakan OneDrive',
  'Panduan mengatur izin akses (permissions) saat membagikan dokumen internal perusahaan kepada rekan kerja atau klien via OneDrive.',
  'Microsoft 365',
  '# Panduan Berbagi File via OneDrive

Gunakan OneDrive untuk membagikan file besar alih-alih mengirimkannya melalui lampiran email. Ini lebih aman dan menghemat kuota penyimpanan email.

### Langkah-langkah Berbagi:
1. Buka File Explorer Anda dan masuk ke folder **OneDrive - Perusahaan**.
2. Klik kanan pada file atau folder yang ingin Anda bagikan.
3. Pilih opsi **Share** (ikon awan biru).
4. Pada jendela pembagian, Anda wajib mengatur izin akses:
   - **Specific people**: Hanya orang yang Anda undang yang bisa membuka file. (Sangat disarankan untuk dokumen rahasia)
   - **People in [Nama Perusahaan]**: Siapapun di dalam perusahaan yang memiliki link ini bisa membuka.
5. Jangan lupa centang **"Allow editing"** jika Anda ingin mereka bisa mengedit, atau hilangkan centang jika hanya boleh membaca (View only).
6. Masukkan alamat email penerima, lalu klik **Send** atau klik **Copy Link** untuk membagikannya via Microsoft Teams atau WhatsApp.

**Peringatan Keamanan:** Dilarang keras membagikan dokumen rahasia perusahaan menggunakan link publik (Anyone with the link) tanpa izin khusus!',
  5340,
  90
),
(
  'Mengatasi Layar Biru (Blue Screen of Death / BSOD) di Windows',
  'Informasi awal tentang apa yang harus dilakukan jika laptop perusahaan Anda tiba-tiba mengalami layar biru dan restart sendiri.',
  'Hardware',
  '# Panduan Menghadapi Layar Biru (BSOD)

Layar biru (Blue Screen) menandakan sistem Windows mengalami kerusakan kritis sehingga sistem dipaksa untuk *restart* guna mencegah kerusakan komponen keras.

### Apa yang harus dilakukan saat terjadi BSOD?
1. **Jangan Panik**. Biarkan sistem mengumpulkan informasi (biasanya ada persentase 0% hingga 100%).
2. **Catat Error Code**. Perhatikan bagian bawah layar, akan ada tulisan kode eror dalam huruf kapital, contoh: `CRITICAL_PROCESS_DIED` atau `PAGE_FAULT_IN_NONPAGED_AREA`. Fotolah layar tersebut menggunakan HP Anda.
3. Biarkan laptop restart dengan sendirinya.
4. Jika laptop berhasil masuk ke Windows lagi, pastikan Anda langsung mem-backup file pekerjaan yang belum disave ke OneDrive.

### Pencegahan Lanjutan:
- **Update Windows**: Pastikan Windows dan driver laptop Anda up-to-date.
- **Jangan matikan paksa**: Hindari mematikan laptop dengan menahan tombol power kecuali benar-benar hang.

Jika BSOD terjadi lebih dari 2 kali dalam seminggu, perangkat keras (RAM atau Storage) laptop Anda mungkin bermasalah. Segera laporkan ke IT Support dengan melampirkan foto layar biru tersebut agar laptop Anda segera ditarik untuk perbaikan perangkat keras.',
  4200,
  88
),
(
  'Menghubungkan Laptop ke Printer Jaringan Kantor',
  'Langkah-langkah untuk menambahkan printer kantor ke laptop Anda melalui jaringan Wi-Fi/LAN perusahaan.',
  'Hardware',
  '# Panduan Install Printer Jaringan

Untuk mencetak dokumen, Anda bisa menghubungkan laptop ke printer yang ada di lantai/divisi Anda. 

1. Pastikan laptop Anda terhubung ke jaringan Wi-Fi kantor (bukan koneksi Tethering/Hotspot HP).
2. Buka menu **Start**, ketik **Printers & scanners** lalu buka pengaturan tersebut.
3. Klik tombol **Add device** (atau "Add a printer or scanner").
4. Windows akan mencari printer yang tersedia di jaringan. 
5. Jika printer Anda muncul (contoh: `Printer-Lantai-3-HRD`), klik printer tersebut lalu pilih **Add device**.
6. Tunggu hingga proses instalasi driver selesai. Status akan berubah menjadi *Ready*.

Jika printer tidak terdeteksi:
1. Scroll ke bawah, klik **"The printer that I want isn''t listed"**.
2. Pilih **"Add a printer using an IP address or hostname"**.
3. Masukkan IP Address printer (tanyakan nomor IP ini ke admin lantai atau IT Support).
4. Klik Next dan ikuti instruksi hingga selesai.',
  3890,
  94
),
(
  'Praktik Terbaik Keamanan Siber Dasar (Phishing Awareness)',
  'Panduan penting untuk mengenali dan menghindari email penipuan (phishing) yang menargetkan karyawan perusahaan.',
  'Security',
  '# Waspada Email Phishing!

Phishing adalah teknik penipuan di mana peretas menyamar sebagai pihak terpercaya untuk mencuri password, data rahasia, atau menginfeksi laptop dengan virus (ransomware).

### Cara Mengenali Email Phishing:
1. **Cek Alamat Pengirim Asli**. Jangan hanya melihat nama pengirim. Klik nama tersebut dan pastikan alamat emailnya berakhiran domain resmi (`@perusahaan.co.id`).
2. **Perhatikan Bahasa dan Ejaan**. Email penipuan sering kali memiliki tata bahasa yang buruk, terlihat seperti terjemahan mesin, atau menggunakan bahasa yang mendesak (contoh: "Akun Anda akan ditutup dalam 24 jam!").
3. **Jangan Asal Klik Link**. Arahkan *mouse* (hover) Anda ke atas tautan/link yang ada di email **tanpa mengkliknya**. Lihat alamat asli yang muncul di pojok kiri bawah browser. Jika alamatnya aneh atau tidak sesuai, jangan diklik.
4. **Waspadai Lampiran Tak Terduga**. Jangan pernah membuka lampiran (terutama berformat `.zip`, `.exe`, atau `.iso`) dari orang yang tidak Anda kenal.

### Apa yang harus dilakukan jika menerima email mencurigakan?
1. JANGAN mengklik apapun di dalam email tersebut.
2. JANGAN membalas email tersebut.
3. Teruskan (Forward) email tersebut ke `it.security@perusahaan.co.id` untuk dianalisis oleh tim IT.
4. Hapus email tersebut dari kotak masuk Anda.

Bila Anda terlanjur mengklik link atau mendownload lampirannya, **SEGERA** matikan koneksi internet (cabut kabel LAN / matikan Wi-Fi) dan telepon IT Support saat itu juga!',
  7850,
  97
),
(
  'Cara Membersihkan Cache Browser (Chrome/Edge)',
  'Solusi cepat jika aplikasi web perusahaan tidak berfungsi dengan normal, lambat, atau menampilkan data lama.',
  'Software',
  '# Cara Membersihkan Cache & Cookies

Terkadang sistem ERP atau aplikasi web perusahaan (seperti portal HR atau e-Faktur) menampilkan error atau data lama. Membersihkan *cache* browser seringkali menjadi solusi termudah.

### Google Chrome:
1. Buka Chrome.
2. Tekan tombol `Ctrl + Shift + Delete` di keyboard Anda secara bersamaan.
3. Jendela "Clear browsing data" akan muncul.
4. Pada bagian **Time range**, pilih **All time**.
5. Centang opsi **"Cookies and other site data"** dan **"Cached images and files"**. (Anda bisa menghilangkan centang "Browsing history" jika tidak ingin menghapus riwayat).
6. Klik tombol **Clear data**.
7. Tutup seluruh jendela Chrome, lalu buka kembali.

### Microsoft Edge:
1. Buka Edge.
2. Tekan tombol `Ctrl + Shift + Delete`.
3. Pada **Time range**, pilih **All time**.
4. Centang **"Cookies and other site data"** dan **"Cached images and files"**.
5. Klik **Clear now**.
6. Restart browser Edge Anda.

Coba buka kembali sistem perusahaan. Jika masih error, segera buat tiket IT.',
  5100,
  91
);
