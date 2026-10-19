# Rukun Santo Michael

Website React + TypeScript untuk profil, dokumentasi kegiatan, dan pengelolaan konten Rukun Santo Michael. Data organisasi yang belum disediakan ditandai sebagai draf; sepuluh gambar galeri awal adalah foto contoh Unsplash, bukan dokumentasi rukun.

## Struktur folder

```text
.
├── index.html
├── src/
│   ├── App.tsx
│   ├── components/Admin.tsx
│   ├── lib/data.ts
│   ├── lib/supabase.ts
│   ├── main.tsx
│   ├── styles.css
│   └── types.ts
├── supabase/schema.sql
├── .env.example
└── package.json
```

## Menjalankan di VS Code

Persyaratan: Node.js 20.19+ atau 22.12+ dan npm. Buka folder proyek di VS Code, lalu di terminal:

```powershell
npm.cmd install
Copy-Item .env.example .env.local
```

Website dapat dijalankan tanpa kredensial Supabase untuk melihat pratinjau desain dan sepuluh foto contoh. CRUD/admin tidak aktif sampai backend disiapkan.

## Menyiapkan database, autentikasi, dan penyimpanan

1. Buat proyek di [Supabase](https://supabase.com/) dan simpan URL proyek serta publishable key (atau anon key lama) dari **Project Settings → API**.
2. Buka **SQL Editor → New query**, salin seluruh `supabase/schema.sql`, lalu jalankan. Script membuat tabel, mengaktifkan RLS, kebijakan akses, dan bucket publik `site-media` dengan batas 5 MB dan MIME JPG/PNG/WebP.
3. Pada **Authentication → Providers → Email**, aktifkan email/password. Matikan pendaftaran publik bila pengaturan tersebut tersedia; akun pengurus dibuat satu per satu dari dashboard Supabase.
4. Pada **Authentication → Users → Add user**, buat akun administrator pertama menggunakan email pengurus dan kata sandi kuat. Verifikasi email melalui tautan konfirmasi jika konfirmasi email diaktifkan.
5. Atur claim admin dari **Authentication → Users → pilih pengguna → Raw app metadata** menjadi:

   ```json
   { "role": "admin" }
   ```

   `app_metadata` hanya dapat diubah oleh administrator proyek, berbeda dengan `user_metadata`. Keluar lalu masuk kembali di website agar token memuat claim terbaru. Jangan menyetel role ini pada `user_metadata`.
6. Isi `.env.local`:

   ```dotenv
   VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=SUPABASE_PUBLISHABLE_OR_ANON_KEY
   ```

   Key publik/anon memang digunakan di browser dan diamankan oleh RLS. **Jangan** masukkan `service_role` key atau kata sandi database ke file frontend, repository, atau platform hosting.
7. Jalankan:

   ```powershell
   npm.cmd run dev
   ```

   Buka alamat lokal yang ditampilkan Vite (biasanya `http://localhost:5173`). Halaman pengurus berada di `/admin`.

## Mengelola website

- **Logo:** masuk ke `/admin` → **Konten & tampilan** → pilih JPG, PNG, atau WebP. Atur ukuran logo dan animasi, kemudian tekan **Simpan Perubahan**. Ilustrasi Santo Michael bawaan adalah SVG buatan lokal; gambar baru disimpan di Supabase Storage.
- **Foto:** buka **Galeri foto** → **Tambah Foto**, pilih satu atau beberapa JPG/PNG/WebP hingga 5 MB per file, isi judul, caption, kategori, dan tanggal. Foto tersimpan di Storage dan metadata di database; perubahan dapat dilihat oleh pengunjung lain.
- **Kegiatan:** pilih **Kegiatan** → **Tambah Kegiatan**, lengkapi judul, tanggal, lokasi, deskripsi, kategori, sampul, dan dokumentasi opsional. Sampul/dokumentasi kegiatan juga tercatat sebagai foto galeri. Penghapusan meminta konfirmasi.
- **Deskripsi dan tampilan:** di **Konten & tampilan**, ubah identitas, sambutan, profil/sejarah, visi, misi, lokasi, informasi kontak, warna utama, tautan Facebook/Instagram, logo, dan pengaturan animasi. Tautan media sosial dikosongkan agar ikon disembunyikan. Teks `[DRAF]` harus diganti dengan informasi resmi.
- **Bagian halaman Tentang:** gunakan formulir **Bagian tambahan halaman Tentang** untuk menambah atau menghapus konten.
- Tautan Google Maps dibentuk dari lokasi/kata pencarian yang dapat diedit; website tidak mengarang alamat jalan, koordinat, nomor telepon, akun sosial, atau nama pengurus.

## Build dan deployment

Validasi produksi lokal:

```powershell
npm.cmd run build
npm.cmd run preview
```

Untuk publikasi, hubungkan repository ke Vercel, Netlify, atau layanan hosting statis lain. Atur perintah build `npm run build` dan folder hasil `dist`. Tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` pada environment variables hosting, lalu deploy ulang. Atur fallback SPA agar rute seperti `/tentang`, `/galeri`, dan `/admin` mengarah ke `index.html` (Vercel/Netlify biasanya menerapkannya otomatis untuk proyek Vite). Batasi redirect URL dan origin situs di **Supabase → Authentication → URL Configuration** sesuai domain lokal dan domain produksi.

Kebijakan SQL membolehkan pembacaan publik, tetapi mewajibkan `app_metadata.role = 'admin'` untuk penulisan tabel dan operasi Storage. Jangan menghapus atau melonggarkan kebijakan RLS. Siapkan backup database dan Storage sebelum pengelolaan produksi.
