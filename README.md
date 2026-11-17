# CarHub PWA

Frontend React + Vite untuk marketplace mobil bekas CarHub. Data katalog, detail mobil, pengajuan, dan portal admin menggunakan REST API di backend; wishlist disimpan di LocalStorage perangkat.

## Menjalankan lokal

Backend berjalan di `http://localhost:5000` dan frontend Vite secara default memakai `http://localhost:5173`.

```sh
npm install
npm run dev
```

Default API base URL adalah `http://localhost:5000/api`. Untuk backend di lokasi lain, atur `VITE_API_BASE_URL` pada environment proses Vite. Nilainya harus menyertakan prefix `/api`; jangan menaruh `DATABASE_URL`, password admin, atau cookie sesi di variabel frontend.

Untuk permintaan lintas-origin, backend harus mengizinkan origin frontend melalui `FRONTEND_ORIGINS`. Browser mengirim cookie sesi admin melalui `credentials: include`; konfigurasi cookie dan `SameSite` harus sesuai dengan topologi domain saat deployment.

## Halaman

- `/` — katalog, pencarian, filter merk, dan pagination.
- `/cars/:id` — spesifikasi mobil serta tautan WhatsApp penjual.
- `/wishlist` — mobil favorit lokal.
- `/sell` — form pengajuan jual mobil.
- `/about` — profil pembuat dan panduan pemasangan.
- `/admin/login` dan `/admin` — portal admin dengan sesi cookie backend.

Profil tugas praktikum ada di `src/data/profile.js`. Foto bersifat opsional; jika belum diisi, aplikasi menampilkan inisial.

## Pemeriksaan

```sh
npm test
npm run lint
npm run build
```

Build mengaktifkan manifest dan service worker. Service worker menyimpan app shell; respons API tidak disimpan dalam cache offline.
