# Panduan Cepat — Versi Bahasa Indonesia (Bonus)

Versi Indonesia adalah bonus. Produk utama adalah versi English di
`01-WEBSITE-EN/`. Struktur file dan cara kerjanya identik dengan versi
English — hanya bahasa tampilan yang berbeda.

## Buka website

Klik dua kali `02-WEBSITE-ID/index.html`. Website akan langsung terbuka
di browser tanpa perlu server, Node.js, atau tools tambahan.

## Yang wajib diganti sebelum publikasi

1. **Nama brand.** Cari-dan-ganti `Perusahaan Rental Anda` (lihat juga
   dokumentasi English `CUSTOMIZATION.md` untuk daftar lengkap semua
   placeholder — polanya sama).
2. **Nama PT / entitas hukum.** Ganti `Your Company Ltd.`.
3. **Domain produksi.** Ganti `https://example.com/` di seluruh file.
4. **Nomor WhatsApp & telepon.** Ganti `+1 555 000 0000` dan digit
   `15550000000`, `15550000001`, `15550000002`.
5. **Email.** Ganti `hello@example.com`.
6. **Alamat kantor.** Ganti `123 Example Street` dan `Your City`.
7. **Koordinat geografis.** Ganti `0.0000, 0.0000` di JSON-LD.
8. **Profil sosial media.** Ganti `yourrentalcompany` di semua tempat.
9. **Jam operasional.** Ganti `openingHoursSpecification` di JSON-LD.
10. **Armada + harga.** Edit array `vehicles = [ ... ]` di
    `<script data-dc-script>` dalam `index.html`.
11. **Gambar social share.** Ganti `assets/og-image.svg` dengan PNG asli
    1200×630 dan update `og:image`/`twitter:image`.
12. **Rekening bank.** Placeholder `Bank Name · 000 000 0000` harus
    diganti dengan rekening resmi Anda.

## Yang tidak boleh dilakukan

- Jangan publish website dengan data placeholder seolah-olah data asli.
- Jangan menambahkan review atau rating palsu di JSON-LD.
- Jangan mengklaim "terbaik / nomor satu / bersertifikat" tanpa bukti.
- Jangan menggunakan nama brand demo untuk transaksi.

## Bahasa & lokal

- Locale: `id_ID`, bahasa: `id`.
- Mata uang: IDR (`Rp`).
- Format harga menggunakan `Number(n).toLocaleString('id-ID')` — sudah
  benar untuk pasar Indonesia.

## SEO & Structured Data

Panduan SEO lengkap ada di `SEO_SETUP.md` (bahasa English). Poin penting
untuk versi Indonesia:

- Setel canonical ke `https://your-domain.com/id/`.
- Setel `og:url` ke path `/id/`.
- Pastikan hreflang timbal-balik: `en`, `id`, dan `x-default`.
- FAQ di JSON-LD harus identik dengan pertanyaan/jawaban yang
  ditampilkan di halaman.

## Validasi

- Google Rich Results Test: <https://search.google.com/test/rich-results>
- Schema.org Validator: <https://validator.schema.org/>
- Google Search Console: submit `sitemap.xml`.

## Deploy

Website ini murni HTML statis. Bisa diupload ke GitHub Pages, Vercel,
Netlify, Cloudflare Pages, S3+CloudFront, atau server web sendiri.
