# CarHub: Pre-Owned Car Marketplace PWA

CarHub adalah aplikasi web progresif (PWA) berbasis React untuk menjelajahi iklan mobil bekas pilihan, mengajukan penjualan kendaraan, mengelola profil dan listing pribadi, serta mengelola operasional melalui portal admin. Aplikasi ini berkomunikasi dengan REST API CarHub dan menyimpan daftar favorit secara lokal di browser.

Dibuat oleh Galileo Athari Muhammad (21120124130099) untuk Tugas Akhir Praktikum Pemrograman Perangkat Bergerak 2026.

## Deskripsi dan fitur

CarHub membantu calon pembeli menjelajahi mobil bekas dan menghubungi penjual secara langsung melalui WhatsApp, sekaligus menyediakan alur pengajuan listing oleh pengguna terdaftar yang ditinjau oleh admin. Fitur penjelajahan katalog dan wishlist dapat digunakan tanpa login.

- **Beranda & katalog mobil:** jelajahi daftar mobil berhalaman dengan pencarian merk/model, filter merk, tipe bodi (multi-pilih), warna, bahan bakar, transmisi, rentang harga & tahun, serta pengurutan (terbaru, harga, tahun). Dilengkapi mode pratinjau katalog offline jika backend tidak dapat dihubungi.
- **Detail mobil:** lihat galeri multi-foto, harga, spesifikasi lengkap (termasuk warna, tipe bodi, dan bahan bakar), lokasi, dan deskripsi; bagikan tautan detail mobil dan hubungi penjual langsung via WhatsApp dengan pesan yang sudah disiapkan.
- **Wishlist:** simpan mobil favorit di browser (LocalStorage dengan cadangan memori) dan buka kembali detailnya kapan saja.
- **Akun terpadu & profil:** registrasi (dengan konfirmasi password) dan login untuk semua peran (`user`, `admin`, `owner`) menggunakan satu sesi cookie `HttpOnly` (`carhub_user_session`). Top bar menampilkan indikator akun aktif dan lencana peran (`Admin`/`Owner`). Halaman **Profil** (`/profile`) terpisah dari **Tentang** (`/about`), menyediakan kartu profil, edit profil (termasuk ganti kata sandi baru + konfirmasi), serta tombol **Akses Admin Portal** bagi admin/owner.
- **Jual mobil & Mobil Saya:** pengguna yang login dapat mengajukan penjualan kendaraan di `/sell` (maksimal 10 foto via upload perangkat ke Cloudinary atau URL HTTPS) dan memantau status iklan tayang, menunggu tinjauan, maupun ditolak pada halaman mandiri **Mobil Saya** (`/my-listings`). Jika akun yang login berperan sebagai `admin` atau `owner`, halaman `/sell` otomatis diarahkan ke form tambah mobil di portal admin (`/admin/cars/new`).
- **Portal admin:** kelola katalog mobil (tambah, ubah, arsip, pulihkan, hapus permanen), moderasi pengajuan penjualan (termasuk riwayat reviewer berformat `Nama Lengkap (email)`), kelola akun pengguna publik (CRUD), serta kelola akun admin (CRUD penuh khusus `owner` dengan proteksi akun owner). Dapat diakses [di sini](https://carhub-id-pwa-mirror.vercel.app/admin). Untuk keperluan demo, login menggunakan akun berikut:
    ```
    User: rootadmin@carhub.co.id  
    Password: AdminCarhub123!
    ```
- **PWA dan tema:** instal CarHub di perangkat, pilih tema sistem/terang/gelap, dan akses app shell yang tersimpan oleh service worker.

## Teknologi yang digunakan

| Bagian | Teknologi |
|---|---|
| Frontend | React 19 dan Vite 8 |
| Tampilan dan ikon | Tailwind CSS 4, CSS responsif, dan Lucide React |
| Komunikasi API | Axios (dengan `withCredentials: true` untuk cookie sesi) |
| PWA | `vite-plugin-pwa` (manifest dan service worker) |
| Backend | Node.js 22+ dan Express 5 |
| Database | Neon PostgreSQL melalui `pg` |
| Penyimpanan foto | Cloudinary (upload langsung bertanda tangan dari browser) |
| Sesi autentikasi | Cookie `HttpOnly` terpadu (`carhub_user_session`) yang dikelola backend |

## Mulai cepat

Jalankan backend dan frontend di terminal terpisah. Untuk penyiapan backend pertama kali, konfigurasi database, dan migrasi, ikuti [README backend](https://github.com/MangOleh21/CarHub-API-Mirror/blob/main/README.md).

**Terminal 1: backend**

```sh
cd backend
npm run dev
```

**Terminal 2: frontend**

```sh
cd frontend
npm install
npm run dev
```

Buka **http://localhost:5173**. Backend seharusnya tersedia di **http://localhost:5000**.

## Konfigurasi API

Secara default, frontend menggunakan `http://localhost:5000/api`. Untuk menggantinya, atur `VITE_API_BASE_URL` di environment frontend:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Pastikan nilai tersebut diakhiri dengan `/api`. Tanpa akhiran ini, frontend akan meminta alamat seperti `/cars/2`, bukan `/api/cars/2`, sehingga server mengembalikan `Resource not found`. Mulai ulang Vite setelah mengubah variabel environment.

Variabel dengan awalan `VITE_` disertakan dalam kode yang dikirim ke browser. Jangan menyimpan kredensial database, kata sandi admin, atau cookie sesi di dalamnya.

### CORS dan alamat lokal

Origin frontend yang diizinkan backend secara default adalah `http://localhost:5173`. Origin browser harus sama persis, termasuk nama host dan port:

- Gunakan `http://localhost:5173` untuk pengembangan biasa.
- `http://127.0.0.1:5173` merupakan origin yang berbeda dari `http://localhost:5173`.
- Secara default, `npm run preview` menggunakan port `4173`, yang tidak termasuk dalam daftar origin yang diizinkan. Untuk menguji preview dengan API, tambahkan origin yang tepat ke konfigurasi `FRONTEND_ORIGINS` pada backend, lalu mulai ulang backend.

Untuk penyiapan API dan detail endpoint, lihat [dokumentasi REST API](https://github.com/MangOleh21/CarHub-API-Mirror/blob/main/docs/API_DOCUMENTATION.md).

## Halaman

| Route | Fungsi |
|---|---|
| `/` | Halaman beranda (*landing page*) dengan sorotan katalog dan navigasi cepat |
| `/catalog` | Menjelajahi, mencari, memfilter, mengurutkan, dan melihat daftar berhalaman iklan mobil aktif (termasuk mode pratinjau offline) |
| `/cars/:id` | Melihat detail mobil, galeri foto, tombol bagikan tautan, dan tombol hubungi penjual via WhatsApp |
| `/wishlist` | Melihat mobil favorit yang tersimpan di browser ini |
| `/sell` | Mengirim pengajuan jual mobil (wajib login; akun `admin`/`owner` otomatis diarahkan ke `/admin/cars/new`) |
| `/login`, `/register` | Masuk atau mendaftar akun CarHub (registrasi dilengkapi konfirmasi password) |
| `/profile` | Kartu profil akun aktif, indikator peran, tombol akses portal admin (khusus admin/owner), edit profil & ganti password, serta tautan ke halaman Tentang |
| `/my-listings` | Halaman mandiri **Mobil Saya** untuk memantau iklan tayang dan pengajuan milik akun aktif |
| `/about` | Profil pembuat aplikasi dan panduan pemasangan PWA |
| `/admin/login`, `/admin` | Masuk dan mengelola portal admin (tab Katalog & arsip mobil, Pengajuan, Kelola pengguna, serta Kelola admin khusus owner) |
| `/admin/cars/new`, `/admin/cars/:id/edit` | Formulir tambah dan ubah data mobil katalog oleh admin |

Profil pembuat terdapat di `src/data/profile.js`. Foto bersifat opsional; inisial akan ditampilkan jika foto belum diatur.

## Struktur proyek

| Path | Kegunaan |
|---|---|
| `src/pages/` | Halaman publik, akun pengguna, dan layar portal admin (`src/pages/admin/`) |
| `src/components/` | Navigasi bersama, kartu mobil, galeri & unggah foto, paginasi, toggle tema, dan komponen umpan balik |
| `src/contexts/` | Context dan provider untuk autentikasi (`AuthProvider`) dan tema (`ThemeProvider`) |
| `src/services/api.js` | Klien REST Axios, penanganan error permintaan, dan validasi respons |
| `src/services/offline-cars.js` | Katalog sampel dan filter lokal untuk mode pratinjau offline |
| `src/hooks/` | Custom hook seperti `useWishlist.js` dan `useImageFileSelection.js` |
| `src/lib/` | Utilitas pemformatan mata uang/WhatsApp, opsi kendaraan, validasi upload, paginasi, berbagi tautan, dan pesan autentikasi |
| `src/data/profile.js` | Data profil pembuat untuk halaman Tentang |
| `vite.config.js` | Konfigurasi Vite, Tailwind CSS, manifest PWA, dan service worker |

Sesi pengguna maupun admin menggunakan satu cookie `HttpOnly` (`carhub_user_session`) dari backend; frontend tidak menyimpan token sesi di LocalStorage. Data favorit disimpan secara lokal di browser, dengan cadangan sementara di memori jika penyimpanan browser tidak tersedia.

## Perintah

Jalankan perintah berikut dari direktori `frontend/`:

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Menjalankan server pengembangan |
| `npm test` | Menjalankan pengujian unit frontend (`node --test`) |
| `npm run lint` | Menjalankan ESLint |
| `npm run build` | Membuat build produksi/PWA di `dist/` |
| `npm run preview` | Meninjau build produksi, biasanya di `http://localhost:4173` |

Service worker menyimpan app shell, bukan respons API. Penggunaan service worker di produksi memerlukan HTTPS; pengembangan lokal melalui `localhost` didukung.

## Pemecahan masalah

| Gejala | Yang perlu diperiksa |
|---|---|
| `Resource not found` | Atur `VITE_API_BASE_URL` ke `http://localhost:5000/api`. API tidak menyediakan halaman di `/`; semua route API menggunakan awalan `/api`. |
| Browser melaporkan error CORS atau `403` pada login/tulis | Buka frontend pada origin yang diizinkan backend, biasanya `http://localhost:5173`. Atur `FRONTEND_ORIGINS` untuk nama host atau port lain. |
| Katalog tidak dapat terhubung | Pastikan backend berjalan, lalu periksa `http://localhost:5000/api/health`. Saat offline, Anda dapat membuka mode pratinjau katalog offline. |
| Gambar mobil tidak tersedia | URL gambar harus dapat diakses publik melalui HTTPS. Gambar pengganti akan ditampilkan jika URL tidak dapat diakses. |
