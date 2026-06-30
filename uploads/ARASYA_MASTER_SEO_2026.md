# ARASYA RENT CAR — MASTER SEO PLAN (2026)

**Companion to:** `ARASYA_REDESIGN_PROTOTYPE_PRD.md`
**Goal:** Skala bisnis 200%+ secara **full organik** lewat website + ekosistem search.
**Posisi dokumen:** Ini adalah *growth architecture*, bukan checklist on-page. Kalau ada konflik dengan PRD Section 2 (Scope Lock) atau Section 3 (Hard Constraints), **PRD menang** — kecuali di mana dokumen ini secara eksplisit me-refine asumsi supply (lihat §1).

---

## 0. THESIS (baca ini dulu, sisanya turunan)

> Pertumbuhan **bukan** datang dari "nge-rank-in website." Datang dari sebuah **sistem** yang compounding:
> 1. **Kuasai local pack di home-corridor** (Jabodetabek + Bandung) lewat GBP + review velocity.
> 2. **Tangkap intent antar-kota di mana korridor lo adalah ORIGIN** ("Jakarta → Jogja"), lewat route page yang datanya genuinely unik per halaman.
> 3. **Jadi jawaban yang dikutip** di AI Overviews / ChatGPT / Perplexity untuk intent "sewa mobil + supir".
> 4. **Konversi semua itu ke WhatsApp** (satu-satunya endpoint, sesuai PRD).
>
> 200% datang dari **review + corridor capture + AI visibility yang compounding** — *bukan* dari jumlah halaman. Volume halaman di 2026 = risiko, bukan leverage.

---

## 1. REALITY CHECK — empat hukum 2026 yang nge-bentuk seluruh plan

### 1.1 Supply reframe: geografi fulfillment > jumlah armada
Klien punya "channel se-Indonesia" (asumsi: **jaringan partner/vendor**, bukan armada sendiri di tiap kota). Itu **tidak** mengubah dua kenyataan:

- **Local pack terikat proximity.** Pin GBP ada di Bogor → lo tidak akan menang di 3-pack "rental mobil Surabaya" dari alamat Bogor. Proximity itu struktural, bukan on-page.
- **Trust moat lo = produk lo.** Seluruh positioning (PRD §1) dibangun atas *driver quality + reliability + anti-impersonation*. Kalau lo fulfill trip kota jauh lewat partner yang kualitas supir & mobilnya nggak lo kontrol, satu pengalaman buruk nempel di **nama Arasya** dan meracuni review lo — dan review adalah lever prominence #1. Lo bisa nge-rank "sewa alphard Surabaya", dapet inquiry, fulfill jelek lewat partner, dapet review 1 bintang → GBP lo turun di **home corridor** yang seharusnya lo kuasai.

**Aturan turunan (gantiin "unlimited route" jadi aman):**
> Bangun route page **hanya untuk trip yang ORIGIN-nya ada di korridor lo** (Bogor / Jakarta / Depok / Bekasi / Tangerang / Bandung). Trip *berangkat dari basis lo* = genuinely fulfillable + quality-controllable + datanya beneran (harga, durasi, toll real). Halaman "rental di kota X jauh" yang origin-nya bukan korridor lo = **skip**, atau perlakukan sebagai konten informasional murni, bukan landing page transaksional.

### 1.2 March 2026 update menghukum templated location pages
- Update Maret 2026 (core + spam, rollout selesai ~8 April) **menargetkan paling keras situs jasa lokal yang dibangun dari location page templated yang cuma tukar nama kota** tanpa nilai unik. (Sumber: Scorpion, Search Engine Journal, Amsive — April 2026.)
- Ambang aman programmatic 2026: tiap halaman **≥60% konten beda**, narik dari **3+ sumber data**, dan **menjawab query yang nggak dijawab halaman lain di situs lo**. (Sumber: industry consensus pasca-Maret 2026.)
- Mekanisme baru "weakest link": halaman terlemah **menyeret turun authority domain**, bukan cuma di-diskon. Artinya 10 route page tebal > 100 route page tipis.

### 1.3 Zero-click & AI Overviews mengubah definisi "konversi"
- 51%+ search berakhir tanpa klik. AI Overviews nurunin CTR 34.5%–61% (Ahrefs/Seer, 2026).
- ~22% orang sekarang nyari provider lewat AI tools (ChatGPT dll).
- **Implikasi keras:** sebagian konversi terjadi **tanpa pernah nyentuh website** — orang lihat GBP lo, rating, jam buka, lalu langsung call/WA. Maka **GBP + AI citation = channel konversi setara website**, dan north-star lo harus include off-site conversion, bukan cuma `whatsapp_click` di website.

### 1.4 Local pack didominasi 3 hal — dan lo cuma kontrol 2
Relevance (category), Proximity (fixed), Prominence (review/authority). Yang bisa lo gerakin: **category + review/authority**. Itu fokus utama, bukan jumlah halaman.

---

## 2. CHANNEL ARCHITECTURE — diurut ROI (kerjain dari atas)

| Tier | Channel | Kenapa | Lo kontrol? |
|---|---|---|---|
| **1** | **GBP + review engine + local pack** (home corridor) | ROI tertinggi, konversi langsung, zero-click friendly | ✅ Penuh |
| **2** | **Route page origin-korridor** (organic + AI Overviews) | Money pages yang aman dari penalty + genuinely fulfillable | ✅ |
| **3** | **AI search / GEO** (AI Overviews, ChatGPT, Perplexity, Gemini) | 22% provider discovery + zero-click capture | ⚠️ Sebagian |
| **4** | **Topical authority / panduan** (top-funnel) | Nyuapin money pages, bangun entity authority | ✅ |
| **5** | **Citations + local backlinks** (prominence) | Validasi entity, lebar-in radius prominence | ⚠️ Sebagian |

> **Anti-pola:** mayoritas operator over-invest di website pages, under-invest di GBP+review. Bobot effort lo harusnya kebalik: **Tier 1 dulu sampai compounding, baru sisanya.**

---

## 3. KEYWORD & INTENT MAP

Universe query untuk "sewa mobil + supir" di pasar lo, dikelompokin per intent + per tujuan halaman:

### 3.1 Brand / lokal (tangkap di GBP + Home + /kontak)
`arasya rent car` · `sewa mobil bogor` · `rental mobil bogor` · `sewa mobil dengan supir bogor` · `rental mobil + driver depok/bekasi/tangerang`

### 3.2 Vehicle intent (tangkap di /sewa/{vehicle})
`sewa alphard jakarta` · `sewa hiace bogor` · `sewa fortuner dengan supir` · `sewa innova reborn` · `rental elf 19 seat` · `sewa zenix hybrid`
→ unit premium/besar (Alphard, Hiace, Elf) = margin tinggi + diferensiasi kuat → prioritaskan.

### 3.3 Route / corridor intent — **ORIGIN HARUS DI KORRIDOR** (tangkap di /rute/*)
`sewa mobil jakarta ke bandung` · `carter mobil bogor ke jogja` · `sewa hiace jakarta ke pangandaran` · `sewa mobil depok ke semarang` · `sewa alphard jakarta airport (Soetta)`
→ Ini money pages paling aman: origin = basis lo → fulfillable + data real.

### 3.4 Service intent (tangkap di /layanan/{service})
`sewa mobil airport transfer soekarno hatta` · `sewa mobil wedding bogor` · `sewa mobil tour wisata` · `corporate car rental jakarta` · `sewa mobil premium chauffeur`

### 3.5 Informational top-funnel (tangkap di /panduan/*) → link turun ke /rute & /sewa
`estimasi biaya sewa mobil ke bandung` · `bedanya sewa lepas kunci vs dengan supir` · `tips sewa mobil mudik lebaran` · `sewa mobil all-in vs 12 jam, hemat mana`

### 3.6 ⚠️ JANGAN target (intent mismatch → inquiry sampah → reputasi)
- **`sewa mobil lepas kunci`** kalau Arasya **tidak** nyediain self-drive. Positioning lo chauffeur. Nge-rank ini = banjir inquiry yang nggak bisa lo layani → "sorry, nggak ada" → langgar PRD Constraint #5 (jangan generate inquiry yang berakhir unavailable). Konfirmasi ke klien dulu.
- Kota jauh yang origin-nya bukan korridor lo (lihat §1.1).

---

## 4. INFORMATION ARCHITECTURE — refine sitemap PRD biar aman 2026

Sitemap PRD §7.1 udah benar. Yang ditambahin: **aturan diferensiasi & origin-anchor.**

```
/                          Home
/sewa/{vehicle}            Vehicle intent      (per-armada, 5–7 unit prioritas dulu)
/rute/{origin}-{tujuan}    Money pages         (HANYA origin-korridor, 6–8 page dulu)
/layanan/{service}         Service intent      (4–6 service)
/panduan/{keyword}         Top-funnel          (link turun ke /rute & /sewa)
/tentang                   Entity + legal + trust
/kontak                    Verified channels + NAP canonical
```

### 4.1 Resep konten WAJIB per `/rute/*` (biar lewat ambang ≥60% unik)
Tiap route page **harus** punya, dengan data REAL (atau `{{TOKEN}}`, sesuai PRD Constraint #2):
1. H1 origin→tujuan + harga band **dua tier** (Dalam Kota 12-jam & All-in) dari Appendix A.1.
2. **Durasi tempuh real + estimasi toll** untuk korridor itu (operator knowledge — ini "information gain" yang Google reward pasca-Maret 2026).
3. **Rekomendasi armada spesifik** untuk rute itu (mis. Jakarta→Jogja jarak jauh → Hiace/Innova, bukan Avanza) + alasan.
4. **Logika penjemputan** (titik jemput umum, estimasi waktu berangkat ideal).
5. **FAQ rute-spesifik** (3–5 Q&A, beneran beda per rute) + **FAQPage schema**.
6. Verified-channel block + WA CTA pre-filled bawa param rute (PRD §9.2).
7. Internal link: naik ke `/panduan`, samping ke `/sewa` & `/layanan`.

> Test doorway (lakukan per halaman): *"Kalau user landing dari Google, apakah dia nemu jawaban lengkap DI halaman ini, atau halaman ini cuma gerbang tipis yang maksa dia klik ke tempat lain?"* Kalau gerbang → rewrite atau buang.

### 4.2 Page-count discipline (tetap finite, tetap supply-gated)
Mulai **kecil & tebal**: ~6–8 route (origin-korridor) + 5–7 vehicle + 4–6 service + 6–10 panduan. **Ekspansi hanya** setelah set awal nge-index sehat & nggak kena collateral. Jangan launch 100 page sekaligus — weakest-link mechanism (§1.2).

### 4.3 ⚠️ Migrasi dari WordPress/Elementor = titik paling rawan
Live site sekarang WP+Elementor; redesign = clean rebuild (PRD A.7). **Risiko terbesar yang sering di-skip:**
- **Redirect map 301** semua URL lama → URL baru. Salah/lupa = buang equity yang udah ada → traffic *turun* sebelum naik.
- Pertahankan URL yang udah punya ranking kalau bisa; kalau ganti, 301 wajib.
- Submit sitemap baru + GSC change-of-address kalau ganti struktur.
- Saran timing pasca-update: jangan lakuin perubahan besar pas algoritma lagi volatile; tapi karena ini rebuild terencana, eksekusi migrasi bersih + monitor 2–4 minggu.

---

## 5. GBP PLAYBOOK — ini lever tunggal tertinggi (kerjain minggu 1)

### 5.1 Category (faktor #1 ranking lokal — jangan asal)
- **Primary category:** pilih yang **paling sempit & akurat**. Kandidat: `Car rental agency` / `Chauffeur service` / `Van rental agency`. Karena positioning lo *chauffeur + premium*, pertimbangkan `Chauffeur service` sebagai primary kalau itu intent utama lo, atau `Car rental agency` kalau volume search-nya jauh lebih besar. **Audit:** search 10 query teratas lo di Maps incognito, catat primary category top-3 kompetitor, samain/lebih sempit.
- **Secondary:** tambahin yang relevan (`Van rental agency`, `Airport shuttle service`, `Tour operator`) — selama akurat.

### 5.2 Konfigurasi alamat
- Arasya punya HQ fisik (Selakopi Hijau, Bogor Barat). Kalau klien terima customer di sana → **storefront**, tampilkan pin. Kalau murni service-area → ikuti policy SAB (boleh hide address). **Jangan** pakai virtual office sebagai storefront (penyebab suspend #1).

### 5.3 Review engine (ini mesin compounding-nya)
- **Velocity & recency > volume.** Aliran review stabil tiap minggu ngalahin burst 50 lalu sepi. Ada momentum visibility di ~10 review pertama.
- **Review justification:** minta customer **sebut layanan + rute/kota + kata "supir/driver"** di review ("supir Arasya nganter Jakarta–Bandung, ramah, mobil bersih"). Teks ini jadi sinyal relevance kuat yang ngonek-in lo ke query itu.
- **Mekanik:** QR code link review di dalam mobil + template WA pasca-trip (langkah 7 booking flow PRD A.3 — saat pelunasan, momen kepuasan tertinggi).
- **Balas SEMUA review** (yang positif & negatif, profesional). Bisnis yang balas review dapat lebih banyak klik.
- **JANGAN** beli review / gate review / stuffing keyword di balasan (langgar policy + PRD Constraint #2 no-fake).

### 5.4 Photo & video (sinkron sama trust positioning + March 2026)
- **Foto real**: armada asli, supir asli (berseragam/rapi), area layanan. Pasca-Maret 2026, foto/video asli ngalahin stock — stock = sinyal "template/generic" ke Google & customer.
- **Video 60 detik**: walkthrough armada / intro owner. Bangun trust sebelum orang nelpon. Ini juga *langsung* nguatin moat trust PRD §1.
- Catatan: ini **tidak** langgar PRD Constraint #3 (no hotlink) — foto asli di-upload ke GBP & website, bukan hotlink dari situs lama.

### 5.5 GBP Posts (mingguan)
- Bukan direct ranking factor, tapi naikin CTR di panel + nyuapin AI summary + ngambil ruang yang harusnya buat kompetitor.
- Konten: penawaran (mis. promo all-in rute populer), armada baru, tips musim (mudik/long weekend).

### 5.6 NAP consistency = sekalian anti-impersonation
- Nama/Alamat/Telepon **identik** di GBP, website, dan semua citation. Pakai nomor WA kanonik (0821 2402 4281) + nama entity persis (PT. Ayomi Raya) — sama persis kayak Verified-Channel block PRD §8. Konsistensi ini *sekaligus* sinyal entity-trust ke Google **dan** proteksi impersonation. Dua burung, satu batu.
- **JANGAN** stuffing keyword di nama GBP ("Arasya Rent Car Sewa Mobil Murah Bogor Jakarta") → suspend. Pakai nama legal/brand saja.

### 5.7 Sync ke Bing Places
- ChatGPT narik banyak data lokal dari Bing. Sync GBP → Bing Places biar lo muncul di local discovery via AI.

---

## 6. GEO / AI SEARCH LAYER (Tier 3 — capture zero-click)

Tujuan: jadi **entity yang dikenali & jawaban yang dikutip** AI engines.

- **Structured data lengkap:** `LocalBusiness` + `Service` + `FAQPage` + `Offer` (dengan `priceRange`/harga band dua tier). JSON-LD yang rapi = bahan yang LLM ekstrak buat entity & atribut.
- **Tulis konten dalam format ekstraktif:** Q&A eksplisit (FAQ rute, FAQ pricing), fakta terstruktur (tabel harga, durasi, kapasitas). LLM ngutip yang gampang di-ekstrak.
- **Konsistensi entity di seluruh web:** nama/alamat/nomor sama persis di mana-mana → entity nggak ambigu → gampang dikutip.
- **Hadir di sumber yang dibaca AI:** directory & listicle lokal kredibel (lihat §7).
- **Monitor AI visibility:** cek manual tiap bulan — tanya ChatGPT/Perplexity/Gemini "sewa mobil dengan supir di Bogor/Jakarta ke Bandung" → apakah Arasya muncul/dikutip? Ini metrik authority baru 2026.

---

## 7. CITATIONS & LOCAL BACKLINKS (Tier 5 — prominence)

- **Kualitas > volume.** Sedikit citation akurat & otoritatif > submission massal. Konsistensi NAP yang utama.
- Target lokal: direktori bisnis ID kredibel, listing pariwisata/travel Bogor-Jabodetabek, partner venue (wedding/hotel/EO untuk service wedding & corporate).
- **Local backlinks** (berita lokal, community page, asosiasi) > backlink generic — bantu Google ngerti authority di area geografis lo.
- Backlink nge-arah ke **domain/website**, bukan ke panel GBP (PageRank jalan di website). Authority ngalir GBP ← website.

---

## 8. TECHNICAL SEO BASELINE (konfirmasi PRD §7.4 + tambahan)

Udah benar di PRD: SSG/ISR, CWV (LCP<2.5s, CLS<0.1, INP<200ms), schema, sitemap.xml, robots, canonical, internal-linking `panduan→rute→sewa/layanan`. Tambahan:

- **Mobile-first beneran** (PRD §4.2): mayoritas traffic + handoff WA di mobile. Render 380px dulu.
- **Schema buat AI** (§6): JSON-LD yang nge-encode entity, atribut, relasi — bukan cuma buat rich result, tapi buat di-parse LLM.
- **Single language** → nggak perlu hreflang. UI Bahasa Indonesia (PRD §11).
- **Redirect map migrasi** (§4.3) — paling kritikal, paling sering di-botch.

---

## 9. TOPICAL AUTHORITY / KONTEN (Tier 4)

Model cluster (bukan artikel random):
- **Pillar:** "Sewa mobil dengan supir di Jabodetabek & Bandung" (panduan komprehensif).
- **Cluster:** route guides → vehicle guides → service guides, semua link balik ke pillar & ke money pages.
- **Tiap panduan harus genuinely useful:** harga real, itinerary real, knowledge operator first-hand (information gain — yang Google reward pasca-Maret 2026). Bukan rangkuman generic.
- **Editorial review wajib.** Mass AI content tanpa human oversight = target penalty Maret 2026. Boleh AI-assisted, **tidak boleh** AI-mass-gen tanpa review.

---

## 10. MODEL PERTUMBUHAN 200% — math jujur + timeline

### 10.1 Dari mana 2–3x datang (kontribusi per channel)
- **~40–50%:** GBP + review velocity di home corridor (konversi langsung + zero-click). Lever tertinggi, tercepat compounding.
- **~25–35%:** route pages origin-korridor (intent transaksional tinggi, kompetisi lebih rendah dari "rental mobil [kota]" generic).
- **~10–20%:** AI visibility + zero-click capture.
- **~10%:** panduan top-funnel (nge-feed yang lain, efek lambat tapi compounding).

### 10.2 Timeline realistis (full organik, no paid)
| Fase | Bulan | Yang terjadi | Indikator |
|---|---|---|---|
| Foundation | 0–3 | Rebuild + migrasi bersih + GBP optimized + review engine nyala | GBP impressions naik, review velocity mulai |
| Compounding | 3–6 | Route/vehicle pages ke-index, review numpuk, local pack naik | Naik di local pack korridor, whatsapp_click naik |
| Authority | 6–12 | AI citation muncul, panduan ranking, brand search naik | **2x+ inquiry** tercapai realistis di sini |
| Scale | 12+ | Ekspansi route set (hati-hati), brand-search flywheel | **3x** kalau eksekusi konsisten |

> **Caveat jujur:** "full organik tanpa paid" = ramp lebih lambat. Brand search demand adalah flywheel — makin banyak orang nyari "arasya" by name, makin kuat prominence. Pertimbangkan apakah "organik" lo strict (no Google Ads sama sekali) atau boleh **Local Services Ads / GBP** sebagai akselerator awal sambil organik matang. LSA muncul di atas local pack untuk jasa, badge "Google Guaranteed" — ngebantu trust + lead di fase 0–6 saat organik belum compounding.

### 10.3 200%+ itu realistis HANYA kalau:
- ✅ GBP + review engine jalan konsisten (bukan setup-lalu-ditinggal — profil yang diem 30+ hari kehilangan momentum).
- ✅ Route pages tebal & origin-korridor (bukan spam kota).
- ✅ Fulfillment kualitasnya kekontrol → review tetap bagus → flywheel jalan.
- ❌ Kalau lo kejar volume halaman / kota jauh / fulfillment partner nggak kekontrol → bukan 200%, tapi penalty + review jelek.

---

## 11. MEASUREMENT (extend PRD §9 GA4)

PRD §9.3 udah cover event website. Tambahin **off-site & rank layer** (karena 51% zero-click):
- **GBP Insights:** calls, direction requests, WA/message clicks, photo views, search queries. ← konversi yang website nggak pernah lihat.
- **GSC:** impressions/clicks/position per page type, query.
- **Local rank tracking:** grid lokal untuk query korridor (mis. tool grid di Bogor/Jakarta).
- **Review velocity & rating trend** (leading indicator prominence).
- **Brand search volume** (flywheel indicator).
- **AI citation check** (manual bulanan, §6).
- **North-star sebenarnya:** total qualified inquiry = `whatsapp_click` (website, segmented per page type via PRD §9.2) **+** GBP-driven calls/WA. Jangan ukur cuma website.

---

## 12. 90-DAY EXECUTION SPRINT

**Hari 1–30 (Foundation & GBP):**
1. Audit + optimasi GBP: category (primary sempit-akurat), NAP kanonik, foto/video real, services, jam.
2. Nyalain review engine: QR in-car + template WA pasca-trip + protokol balas review.
3. Lock keyword/intent map (§3) + konfirmasi ke klien: lepas-kunci? serviceable corridor list?
4. Finalize IA + resep konten route page (§4.1). Siapin redirect map migrasi.

**Hari 31–60 (Build & Migrate):**
5. Launch rebuild: Home + 5–7 vehicle + 6–8 route (origin-korridor) + 4–6 service, semua dengan schema + verified-channel + WA CTA.
6. Eksekusi migrasi: 301 redirects, submit sitemap, GSC change-of-address. Monitor.
7. Sync Bing Places. Publish 4–6 panduan pillar+cluster pertama.

**Hari 61–90 (Compound & Measure):**
8. GBP posts mingguan. Push review velocity ke ~10+ lalu jaga aliran.
9. Citation lokal kualitas + outreach backlink lokal (partner venue/EO/hotel).
10. Set dashboard measurement (§11). Review apa yang ke-index sehat sebelum mutusin ekspansi route set.

---

## 13. DAFTAR "JANGAN" (langgar = penalty 2026 atau langgar PRD)

1. ❌ **Jangan** bikin location page tipis tukar-nama-kota → target penalty Maret 2026.
2. ❌ **Jangan** bangun route page yang origin-nya di luar korridor lo (nggak fulfillable, ngeracunin review).
3. ❌ **Jangan** launch ratusan halaman sekaligus (weakest-link nyeret authority domain).
4. ❌ **Jangan** stuffing keyword di nama GBP → suspend.
5. ❌ **Jangan** beli/gate/palsuin review atau stat (langgar policy + PRD Constraint #2).
6. ❌ **Jangan** target query lepas-kunci kalau nggak nyediain (langgar PRD Constraint #5).
7. ❌ **Jangan** mass-AI content tanpa editorial review.
8. ❌ **Jangan** stock photo → sinyal "template" ke Google + lemahin trust moat.
9. ❌ **Jangan** ukur sukses cuma dari website traffic — 51% konversi zero-click, ukur GBP juga.
10. ❌ **Jangan** anggap GBP setup-once → profil diem 30+ hari kehilangan momentum.

---

*End of Master SEO Plan. Dokumen ini governs strategi organik. Untuk konflik dengan PRD: PRD Section 2 & 3 menang, kecuali refine supply di §1 yang sudah disepakati di chat.*
