# CarHub: Pre-Owned Car Marketplace PWA

CarHub adalah aplikasi web progresif berbasis React untuk menjelajahi iklan mobil bekas pilihan. Aplikasi ini menggunakan REST API CarHub untuk menampilkan iklan, menerima pengajuan penjual, dan menyediakan fitur admin. Daftar favorit disimpan di browser pengguna.

Dibuat oleh Galileo Athari Muhammad (21120124130099) untuk Tugas Akhir Praktikum Pemrograman Perangkat Bergerak 2026.

## Deskripsi dan fitur

CarHub membantu calon pembeli menjelajahi mobil bekas dan menghubungi penjual secara langsung, sekaligus menyediakan alur pengajuan listing yang ditinjau admin. Fitur publik dapat digunakan tanpa membuat akun.

- **Katalog mobil:** cari berdasarkan merk atau model, filter merk, dan jelajahi daftar berhalaman.
- **Detail mobil:** lihat foto, harga, spesifikasi, lokasi, dan deskripsi; hubungi penjual melalui WhatsApp dengan pesan yang sudah disiapkan.
- **Wishlist:** simpan mobil favorit di browser dan buka kembali detailnya kapan saja.
- **Pengajuan penjualan:** kirim informasi kendaraan untuk ditinjau admin. Foto dapat dipilih dari perangkat atau menggunakan URL HTTPS; listing yang disetujui akan ditampilkan di katalog.
- **Portal admin:** kelola listing mobil, tinjau pengajuan, serta kelola akun admin sesuai peran. Dapat diakses [di sini](https://carhub-id-pwa-mirror.vercel.app/admin). Untuk keperluan demo, login menggunakan akun berikut:
    ```
    User: rootadmin@carhub.co.id  
    Password: AdminCarhub123!
    ```
- **PWA dan tema:** instal CarHub di perangkat, gunakan tampilan tema sistem/terang/gelap, dan akses app shell yang tersimpan oleh service worker. Data API tetap memerlukan koneksi ke backend.

## Teknologi yang digunakan

| Bagian | Teknologi |
|---|---|
| Frontend | React 19 dan Vite 8 |
| Tampilan dan ikon | CSS responsif dan Lucide React |
| Komunikasi API | Axios |
| PWA | `vite-plugin-pwa` (manifest dan service worker) |
| Backend | Node.js 22+ dan Express 5 |
| Database | Neon PostgreSQL melalui `pg` |
| Penyimpanan foto | Cloudinary (upload langsung bertanda tangan dari browser) |
| Sesi admin | Cookie `HttpOnly` yang dikelola backend |

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
| `/` | Menjelajahi, mencari, memfilter, dan melihat halaman iklan mobil aktif |
| `/cars/:id` | Melihat detail mobil dan menghubungi penjual melalui WhatsApp |
| `/wishlist` | Melihat mobil favorit yang tersimpan di browser ini |
| `/sell` | Mengirim pengajuan mobil untuk ditinjau. Formulir menjelaskan bahwa nomor WhatsApp penjual akan dipublikasikan jika iklan disetujui |
| `/about` | Melihat profil pembuat dan panduan pemasangan aplikasi |
| `/admin/login`, `/admin` | Masuk ke portal admin dengan autentikasi cookie, lalu mengelola iklan dan pengajuan |

Profil pembuat terdapat di `src/data/profile.js`. Foto bersifat opsional; inisial akan ditampilkan jika foto belum diatur.

## Struktur proyek

| Path | Kegunaan |
|---|---|
| `src/pages/` | Halaman publik dan layar admin |
| `src/components/` | Navigasi bersama, kartu mobil, dan komponen umpan balik |
| `src/services/api.js` | Klien REST, penanganan error permintaan, dan validasi respons |
| `src/hooks/useWishlist.js` | State daftar favorit yang tersimpan di perangkat |
| `src/lib/format.js` | Pemformatan mata uang, jarak tempuh, dan WhatsApp |
| `vite.config.js` | Konfigurasi Vite, manifest PWA, dan service worker |

Sesi admin menggunakan cookie `HttpOnly` dari backend; frontend tidak menyimpan token admin di LocalStorage. Data favorit disimpan secara lokal di browser, dengan cadangan sementara di memori jika penyimpanan browser tidak tersedia.

## Perintah

Jalankan perintah berikut dari direktori `frontend/`:

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Menjalankan server pengembangan |
| `npm test` | Menjalankan pengujian frontend |
| `npm run lint` | Menjalankan ESLint |
| `npm run build` | Membuat build produksi/PWA di `dist/` |
| `npm run preview` | Meninjau build produksi, biasanya di `http://localhost:4173` |

Service worker menyimpan app shell, bukan respons API. Penggunaan service worker di produksi memerlukan HTTPS; pengembangan lokal melalui `localhost` didukung.

## Pemecahan masalah

| Gejala | Yang perlu diperiksa |
|---|---|
| `Resource not found` | Atur `VITE_API_BASE_URL` ke `http://localhost:5000/api`. API tidak menyediakan halaman di `/`; semua route API menggunakan awalan `/api`. |
| Browser melaporkan error CORS | Buka frontend pada origin yang diizinkan backend, biasanya `http://localhost:5173`. Atur `FRONTEND_ORIGINS` untuk nama host atau port lain. |
| Katalog tidak dapat terhubung | Pastikan backend berjalan, lalu periksa `http://localhost:5000/api/health`. |
| Gambar mobil tidak tersedia | URL gambar harus dapat diakses publik melalui HTTPS. Gambar pengganti akan ditampilkan jika URL tidak dapat diakses. |
