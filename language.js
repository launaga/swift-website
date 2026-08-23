(function () {
  const translations = new Map(Object.entries({
    'Beranda':'Home','Armada':'Fleet','Travel':'Travel','Tentang Kami':'About Us','Kontak':'Contact','Blog':'Blog','Booking':'Book Now',
    'Booking via WhatsApp':'Book via WhatsApp','Lihat Armada':'View Fleet','Pesan Sekarang':'Book Now','Pesan kendaraan':'Book Vehicle',
    'Sewa Mobil + Driver · Terpercaya':'Trusted Car Rental + Driver','Perjalanan rapi,':'Seamless journeys,','supir profesional.':'professional drivers.',
    'Armada Kami · 14 Unit':'Our Fleet · 16 Vehicles','Pilih kendaraan, lihat tarif':'Choose a vehicle and view rates','Dalam Kota':'City Use',
    'Semua':'All','Dalam Kota 12-jam':'12-hour City Use','All-in / hari':'All-in / day','Hubungi':'Contact Us',
    'penumpang · Durasi 12 jam':'passengers · 12-hour duration','Tanya layanan →':'Ask about this service →',
    'Armada Swift · 16 kendaraan':'Swift Fleet · 16 vehicles','Kendaraan yang tepat untuk setiap perjalanan.':'The right vehicle for every journey.',
    'Dari MPV untuk perjalanan harian, SUV dan kendaraan premium, hingga van berkapasitas besar. Semua unit dirawat rutin dan tersedia dengan driver profesional.':'From MPVs for daily travel to SUVs, premium vehicles, and high-capacity vans. Every vehicle is regularly maintained and available with a professional driver.',
    'penumpang · Driver profesional':'passengers · Professional driver','Dalam Kota · 12 jam':'City Use · 12 hours',
    'Belum termasuk BBM, tol, parkir, dan makan driver.':'Fuel, tolls, parking, and driver meals are not included.','Paket All-in':'All-in Package',
    'Sudah termasuk BBM, tol, dan makan driver sesuai rute yang disepakati.':'Includes fuel, tolls, and driver meals for the agreed route.',
    'Butuh rekomendasi?':'Need a recommendation?','Kirim jumlah penumpang, rute, tanggal, dan durasi lewat WhatsApp.':'Send your passenger count, route, date, and duration via WhatsApp.',
    'Layanan':'Services','Satu operator, semua kebutuhan perjalanan':'One operator for every travel need','Mobil + Driver':'Car + Driver',
    'Antar Jemput Bandara':'Airport Transfer','Travel Antar Kota':'Intercity Travel','Tour & Wisata':'Tours & Sightseeing',
    'Tentang Kami':'About Us','Langkah Pemesanan':'Booking Steps','Dari inquiry sampai keberangkatan':'From inquiry to departure',
    'Kontak':'Contact','Satu kanal resmi. Balasan cepat.':'One official channel. Fast replies.','Kirim pesan cepat':'Send a quick message',
    'Nama':'Name','Nama Anda':'Your name','Pesan':'Message','Kirim via WhatsApp':'Send via WhatsApp',
    'Navigasi':'Navigation','Resmi · Verified':'Official · Verified','Rental mobil profesional dengan driver berpengalaman. Bogor · Jabodetabek · Bandung & kota besar Indonesia.':'Professional car rental with experienced drivers across Bogor, Greater Jakarta, Bandung, and major Indonesian cities.',
    'Pertanyaan yang sering muncul':'Frequently asked questions','Kebijakan Pembatalan':'Cancellation Policy','Transparan sejak awal':'Transparent from the start',
    'Mulai booking →':'Start booking →','Harga Terjangkau':'Affordable Rates','Mobil Terawat':'Well-maintained Vehicles','Berpengalaman':'Experienced',
    'Hubungi via WhatsApp':'Contact us via WhatsApp','WhatsApp Utama':'Primary WhatsApp','WhatsApp Alternatif':'Alternative WhatsApp'
    ,'Hanya nomor & rekening di atas yang resmi. Abaikan pihak lain yang mengatasnamakan Swift Rental.':'Only the numbers and bank account above are official. Ignore anyone else claiming to represent Swift Rental.'
    ,'Isi di bawah — kami buatkan pesan WhatsApp yang siap dikirim ke admin.':'Fill in the details below and we will prepare a WhatsApp message ready to send to our team.'
    ,'Mau booking unit / rute apa, tanggal, jumlah penumpang…':'Which vehicle or route, date, and passenger count would you like to book?'
    ,'Kirim via WhatsApp →':'Send via WhatsApp →','Verified · Anti-impersonation':'Verified · Anti-impersonation'
    ,'Sewa mobil dengan supir berpengalaman untuk kebutuhan harian dalam kota.':'Car rental with an experienced driver for daily city travel.'
    ,'Layanan antar jemput bandara siap 24 jam, tepat waktu dan nyaman.':'Reliable and comfortable 24-hour airport transfers.'
    ,'Carter mobil untuk perjalanan ke luar kota dari korridor kami.':'Private vehicle hire for intercity trips from our service area.'
    ,'Mobil bersih dan elegan untuk hari spesial Anda, dengan driver rapi.':'A clean, elegant vehicle and professional driver for your special day.'
    ,'Transportasi karyawan & tamu bisnis dengan layanan terjadwal.':'Scheduled transportation for employees and business guests.'
    ,'Paket perjalanan wisata dengan driver yang paham rute & destinasi.':'Sightseeing packages with drivers who know the routes and destinations.'
    ,'Perjalanan rapi, supir profesional.':'Seamless journeys, professional drivers.'
    ,'Armada terawat dan driver berpengalaman untuk dalam kota, antar kota, hingga bandara — di Bogor, Jabodetabek, Bandung, dan kota besar lainnya. Satu kanal resmi, harga transparan.':'Well-maintained vehicles and experienced drivers for city, intercity, and airport travel across Bogor, Greater Jakarta, Bandung, and other major cities. One official channel with transparent pricing.'
    ,'Kapasitas sudah termasuk jasa driver.':'Capacity includes the driver service.'
    ,'Harga sudah termasuk BBM dan toll?':'Does the price include fuel and tolls?','Berapa DP untuk booking?':'How much is the booking deposit?'
    ,'Apakah bisa untuk perjalanan beberapa hari?':'Can I book a multi-day trip?','Kota tujuan saya belum ada di daftar, bagaimana?':'What if my destination is not listed?'
    ,'Bagaimana memastikan ini Swift Rental Car Template yang resmi?':'How do I verify the official Swift Rental Car Template channel?'

    // Travel page
    ,'Carter mobil + driver ke luar kota':'Private car + driver for intercity travel'
    ,'Tentukan rute dan durasi, lihat estimasi tarif resmi, lalu kunci lewat WhatsApp. Berangkat dari Bogor, Jakarta, Depok, Bekasi, Tangerang & Bandung.':'Choose your route and trip length, view the official fare estimate, then confirm your booking via WhatsApp. Departures are available from Bogor, Jakarta, Depok, Bekasi, Tangerang, and Bandung.'
    ,'Estimasi travel Anda':'Estimate your trip'
    ,'12-Jam':'12 Hours','Dari':'From','Tujuan':'Destination','Kendaraan':'Vehicle','Durasi (hari)':'Duration (days)'
    ,'Lanjut Booking →':'Continue Booking →'
    ,'* Estimasi dari tarif resmi per unit × jumlah hari. Final & ketersediaan dikonfirmasi admin via WhatsApp.':'* Estimate based on the official daily vehicle rate × number of days. Final pricing and availability will be confirmed by our team via WhatsApp.'
    ,'Rute Favorit':'Popular Routes','Korridor yang paling sering dipesan':'Our most frequently booked routes'
    ,'All-in mulai':'All-in from','Book rute':'Book Route','FAQ Travel':'Travel FAQ'
    ,'Tergantung tier. Tarif All-in sudah termasuk BBM, toll, dan makan driver. Tarif Dalam Kota 12-jam belum termasuk BBM, toll, parkir, dan makan driver.':'It depends on the package. All-in rates include fuel, tolls, and driver meals. The 12-hour City Use rate excludes fuel, tolls, parking, and driver meals.'
    ,'DP 20% dari nilai invoice. Setelah transfer, kirim bukti via WhatsApp untuk konfirmasi.':'A 20% deposit is required based on the invoice total. After payment, send the receipt via WhatsApp for confirmation.'
    ,'Bisa. Sebutkan rute, jumlah hari, dan jumlah penumpang saat inquiry agar kami siapkan unit dan estimasi yang sesuai.':'Yes. Share your route, number of days, and passenger count when you inquire so we can recommend a suitable vehicle and provide an estimate.'
    ,'Hubungi kami via WhatsApp. Tim akan bantu verifikasi ketersediaan layanan untuk area Anda.':'Contact us via WhatsApp. Our team will check service availability in your area.'
    ,'Kami hanya bertransaksi lewat nomor WhatsApp resmi dan rekening yang tercantum. Abaikan nomor atau rekening lain.':'We only accept transactions through the official WhatsApp numbers and bank account listed on this website. Ignore any other numbers or accounts.'

    // About page
    ,'Sewa mobil profesional dengan pelayanan bintang 5':'Professional car rental with five-star service'
    ,'Swift Rental Car Template adalah template website sewa mobil profesional dan terpercaya. Template ini menampilkan layanan lengkap — mobil + driver, antar jemput bandara, dan mobil travel antar kota — dengan tampilan modern, responsif, dan mudah disesuaikan.':'Swift Rental Car Template is a professional, trustworthy car rental website template. It showcases a complete range of services—car and driver hire, airport transfers, and intercity travel—in a modern, responsive design that is easy to customize.'
    ,'Driver terlatih, paham rute & etika berkendara.':'Trained drivers who understand local routes and professional driving etiquette.'
    ,'Tarif transparan dua tier, tanpa biaya tersembunyi.':'Transparent two-tier pricing with no hidden fees.'
    ,'Armada bersih dan rutin dicek demi kenyamanan.':'Clean, regularly inspected vehicles for a comfortable journey.'
    ,'Admin siap membantu kapan pun lewat WhatsApp.':'Our team is available around the clock via WhatsApp.'
    ,'Isi formulir pemesanan':'Complete the booking form','Lengkapi data pemesanan melalui WhatsApp.':'Send your booking details via WhatsApp.'
    ,'Kirim foto identitas':'Send your ID photo','Kirim foto KTP/SIM melalui WhatsApp.':'Send a photo of your ID or driver’s license via WhatsApp.'
    ,'Pembuatan invoice':'Invoice preparation','Kami buatkan invoice berisi rincian layanan.':'We will prepare an invoice with a full breakdown of the service.'
    ,'Transfer DP 20%':'Pay the 20% deposit','Transfer DP sesuai invoice, kirim bukti via WA.':'Pay the deposit shown on the invoice and send the receipt via WhatsApp.'
    ,'Konfirmasi detail':'Confirm the details','Kami kirim data kendaraan (merk/plat) & nama + nomor driver.':'We will send the vehicle details (make and license plate), plus the driver’s name and phone number.'
    ,'Driver tiba':'Driver arrives','Driver menghubungi saat menuju lokasi & bertemu tamu.':'The driver will contact you on the way to the pickup point and upon arrival.'
    ,'Pelunasan':'Final payment','Pelunasan saat driver tiba sebelum keberangkatan (tunai/transfer/QR).':'Complete the payment when the driver arrives, before departure (cash, bank transfer, or QR payment).'
    ,'Jelas & adil':'Clear and fair','Pembatalan hingga H-1':'Cancellation up to one day before departure'
    ,'Uang muka (DP) 20% tidak dapat dikembalikan.':'The 20% deposit is non-refundable.'
    ,'Hari-H sebelum driver tiba / sebelum 10.00':'On departure day, before the driver arrives or before 10:00 AM'
    ,'Biaya pembatalan 50% dari total invoice.':'A cancellation fee of 50% of the invoice total applies.'
    ,'Hari-H setelah driver tiba / setelah 10.00':'On departure day, after the driver arrives or after 10:00 AM'
    ,'Biaya pembatalan 100% dari total invoice.':'A cancellation fee of 100% of the invoice total applies.'
    ,'Entitas Resmi':'Official Entity','Rekening demo · BCA 000 000 0000':'Demo account · BCA 000 000 0000'
    ,'Jl. Contoh No. 123, Jakarta, DKI Jakarta 10110.':'123 Example Street, Jakarta, DKI Jakarta 10110.'
    ,'Jl. Contoh No. 123, Jakarta, DKI Jakarta 10110':'123 Example Street, Jakarta, DKI Jakarta 10110'
    ,'a.n. PT Swift Rental Indonesia (Demo)':'Account name: PT Swift Rental Indonesia (Demo)'
    ,'Armada di garasi':'Vehicles at our garage','Driver berseragam':'Uniformed driver','Interior bersih':'Clean interior'
    ,'Antar jemput bandara':'Airport transfer','Perjalanan antar kota':'Intercity journey','Unit premium':'Premium vehicle','Tim Swift Rental':'Swift Rental team'

    // Blog index and article detail pages
    ,'Blog & Panduan':'Blog & Guides','Panduan sewa mobil & tips perjalanan':'Car rental guides & travel tips'
    ,'Baca artikel →':'Read Article →'
    ,'Artikel panduan adalah contoh struktur konten top-funnel. Isi final dapat disesuaikan oleh pengguna template.':'These guide articles demonstrate a top-of-funnel content structure. Template users can customize the final content.'
    ,'← Kembali ke Blog':'← Back to Blog'
    ,'Butuh rekomendasi untuk perjalanan Anda?':'Need a recommendation for your trip?'
    ,'Kirim rute, tanggal, dan jumlah penumpang. Tim kami akan membantu memilih kendaraan dan paket yang sesuai.':'Send us your route, date, and passenger count. Our team will help you choose the right vehicle and package.'
    ,'Konsultasi via WhatsApp →':'Consult Us on WhatsApp →'
    ,'Rute':'Routes','Panduan':'Guides'
    ,'Estimasi Biaya Sewa Mobil Jakarta ke Bandung':'Estimated Car Rental Cost from Jakarta to Bandung'
    ,'Rincian tarif dua tier, rekomendasi unit, dan tips berangkat dari koridor kami.':'A breakdown of our two pricing packages, vehicle recommendations, and departure tips for this route.'
    ,'Biaya perjalanan Jakarta–Bandung dipengaruhi oleh jenis kendaraan, durasi pemakaian, titik penjemputan, dan paket yang dipilih. Paket dalam kota cocok untuk penggunaan terbatas, sedangkan paket all-in memberi kepastian biaya untuk perjalanan antarkota.':'The cost of a Jakarta–Bandung trip depends on the vehicle type, rental duration, pickup point, and selected package. The City Use package suits limited local use, while the All-in package provides greater cost certainty for intercity travel.'
    ,'Untuk 4–6 penumpang, MPV seperti Avanza, Innova Reborn, atau Zenix memberi ruang dan kenyamanan yang seimbang. Rombongan lebih besar dapat memilih Hiace agar seluruh penumpang dan bagasi tetap tertampung dengan baik.':'For four to six passengers, MPVs such as the Avanza, Innova Reborn, or Zenix offer a good balance of space and comfort. Larger groups can choose a Hiace so every passenger and their luggage can travel comfortably.'
    ,'Sebelum memesan, kirim tanggal, alamat jemput, tujuan akhir, jumlah penumpang, serta kebutuhan singgah. Informasi yang lengkap membantu operator memberikan estimasi yang akurat tanpa biaya yang mengejutkan.':'Before booking, send your travel date, pickup address, final destination, passenger count, and any planned stops. Complete information helps our team provide an accurate estimate without unexpected charges.'
    ,'Beda Sewa Lepas Kunci vs Sewa dengan Supir':'Self-drive vs Chauffeured Car Rental: What’s the Difference?'
    ,'Mana yang cocok untuk kebutuhan Anda — keamanan, kenyamanan, dan tanggung jawab.':'Which option best fits your needs? Compare safety, comfort, and responsibility.'
    ,'Sewa lepas kunci memberi keleluasaan penuh, tetapi penyewa menanggung navigasi, parkir, kondisi kendaraan, dan risiko selama penggunaan. Persyaratan identitas dan deposit biasanya juga lebih ketat.':'A self-drive rental gives you complete freedom, but you are responsible for navigation, parking, vehicle condition, and risks during the rental. Identity checks and deposit requirements are also usually stricter.'
    ,'Sewa dengan supir lebih praktis untuk perjalanan bisnis, keluarga, bandara, dan antarkota. Driver memahami rute, titik istirahat, serta karakter kendaraan sehingga penumpang dapat fokus pada perjalanan.':'A chauffeured rental is more practical for business trips, family travel, airport transfers, and intercity journeys. The driver understands the route, rest stops, and vehicle, allowing passengers to relax and focus on the journey.'
    ,'Pilih berdasarkan tujuan, durasi, dan siapa yang akan mengemudi. Untuk jadwal padat atau rute yang belum dikenal, kendaraan dengan supir umumnya menjadi pilihan yang lebih nyaman dan terukur.':'Choose based on your destination, trip length, and who will be driving. For busy schedules or unfamiliar routes, a chauffeured vehicle is generally the more comfortable and predictable option.'
    ,'Tips Sewa Mobil untuk Mudik & Libur Panjang':'Car Rental Tips for Homecoming Trips & Long Holidays'
    ,'Persiapan, pemilihan armada, dan cara memastikan booking aman di musim ramai.':'How to prepare, choose the right vehicle, and secure your booking during peak season.'
    ,'Musim mudik dan libur panjang memiliki permintaan tinggi. Pesan kendaraan lebih awal agar pilihan unit, jadwal, dan harga masih tersedia sesuai kebutuhan.':'Demand is high during homecoming periods and long holidays. Book early to secure the vehicle, schedule, and price that fit your needs.'
    ,'Sesuaikan kapasitas mobil dengan jumlah penumpang dan bagasi. Jangan hanya menghitung kursi; ruang koper, stroller, atau perlengkapan perjalanan juga menentukan kenyamanan.':'Match the vehicle capacity to your passenger count and luggage. Do not count seats alone; space for suitcases, strollers, and other travel gear also affects comfort.'
    ,'Pastikan invoice mencantumkan unit, durasi, rute, fasilitas yang termasuk, biaya tambahan, serta kebijakan pembatalan. Simpan seluruh komunikasi melalui kanal resmi operator.':'Make sure the invoice lists the vehicle, duration, route, included services, extra charges, and cancellation policy. Keep all communication within the operator’s official channels.'
    ,'All-in vs 12 Jam: Mana yang Lebih Hemat?':'All-in vs 12 Hours: Which Costs Less?'
    ,'Kapan tarif All-in lebih untung dan kapan Dalam Kota 12-jam jadi pilihan tepat.':'When the All-in rate offers better value and when the 12-hour City Use package is the smarter choice.'
    ,'Paket 12 jam biasanya mencakup kendaraan dan driver, sementara BBM, tol, parkir, serta makan driver dibayar terpisah. Paket ini efisien untuk agenda dalam kota dengan jarak yang dapat diperkirakan.':'The 12-hour package usually includes the vehicle and driver, while fuel, tolls, parking, and driver meals are charged separately. It is efficient for city itineraries with predictable distances.'
    ,'Paket all-in menggabungkan sebagian besar komponen perjalanan ke dalam satu harga. Pilihan ini membantu mengendalikan anggaran untuk rute antarkota atau itinerary dengan banyak perpindahan.':'The All-in package combines most travel expenses into one price. This makes it easier to manage the budget for intercity routes or itineraries with multiple stops.'
    ,'Bandingkan total biaya, bukan hanya harga awal. Berikan itinerary sedetail mungkin agar operator dapat merekomendasikan paket yang benar-benar lebih hemat.':'Compare the total cost, not just the starting price. Share a detailed itinerary so the operator can recommend the package that genuinely offers better value.'
    ,'Rekomendasi Armada untuk Perjalanan Jarak Jauh':'Recommended Vehicles for Long-distance Travel'
    ,'Innova, Hiace, atau Elf? Memilih unit sesuai jumlah penumpang dan jarak.':'Innova, Hiace, or Elf? Choose a vehicle based on passenger count and distance.'
    ,'Untuk perjalanan jarak jauh, kenyamanan kursi, ruang kaki, kapasitas bagasi, dan kestabilan kendaraan sama pentingnya dengan jumlah kursi.':'For long-distance travel, seat comfort, legroom, luggage capacity, and vehicle stability are just as important as the number of seats.'
    ,'Innova cocok untuk keluarga kecil hingga menengah. Hiace menawarkan kabin lega bagi rombongan, sedangkan Elf Long ideal untuk jumlah penumpang lebih besar dengan koordinasi satu kendaraan.':'The Innova suits small to medium-sized families. The Hiace offers a spacious cabin for groups, while the Elf Long is ideal for larger parties that want to travel together in one vehicle.'
    ,'Pertimbangkan durasi, kondisi rute, jumlah pemberhentian, dan kebutuhan lansia atau anak-anak. Operator dapat membantu memilih unit setelah menerima detail perjalanan yang lengkap.':'Consider the trip length, road conditions, number of stops, and the needs of older passengers or children. Our team can recommend a vehicle after receiving your complete trip details.'
    ,'Checklist Sebelum Carter Mobil ke Luar Kota':'Checklist Before Booking a Car for an Intercity Trip'
    ,'Hal yang perlu dipastikan ke operator sebelum hari keberangkatan.':'What to confirm with the operator before departure day.'
    ,'Konfirmasi tanggal, jam jemput, alamat lengkap, rute, tujuan akhir, jumlah penumpang, dan estimasi bagasi sebelum invoice diterbitkan.':'Confirm the date, pickup time, full address, route, final destination, passenger count, and estimated luggage before the invoice is issued.'
    ,'Tanyakan apa saja yang sudah termasuk: BBM, tol, parkir, makan dan penginapan driver, overtime, serta biaya penyeberangan bila ada.':'Ask what is included: fuel, tolls, parking, driver meals and accommodation, overtime, and ferry fees where applicable.'
    ,'Menjelang keberangkatan, pastikan nomor driver, pelat kendaraan, kontak admin, dan metode pelunasan sudah diterima melalui kanal resmi.':'Before departure, make sure you have received the driver’s phone number, vehicle license plate, team contact, and final payment method through an official channel.'
  }));

  const lang = localStorage.getItem('swift-lang') === 'en' ? 'en' : 'id';

  function translateText(node) {
    if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue.trim()) return;
    const raw = node.nodeValue;
    const trimmed = raw.trim();
    let translated = translations.get(trimmed);
    if (!translated) {
      translated = trimmed
        .replace(/(\d+) penumpang/g, '$1 passengers')
        .replace(/(\d+) hari/g, '$1 days')
        .replace(/(\d+) menit baca/g, '$1 min read')
        .replace(/± (\d+) jam/g, '± $1 hours')
        .replace(/Dalam Kota 12-jam/g, '12-hour City Use')
        .replace(/\/hari/g, '/day')
        .replace(/harga unit ini on request/g, 'pricing for this vehicle is available on request')
        .replace(/Hubungi kami/g, 'Contact Us');
      if (translated === trimmed) return;
    }
    const next = raw.replace(trimmed, translated);
    if (next !== raw) node.nodeValue = next;
  }

  function translate(root) {
    if (lang !== 'en' || !root) return;
    if (root.nodeType === Node.TEXT_NODE) return translateText(root);
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.matches && root.matches('script,style,noscript')) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) { return node.parentElement && !node.parentElement.matches('script,style,noscript') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }
    });
    let node;
    while ((node = walker.nextNode())) translateText(node);
    if (root.querySelectorAll) root.querySelectorAll('[placeholder], [alt], [aria-label], [title]').forEach(el => {
      ['placeholder', 'alt', 'aria-label', 'title'].forEach(attr => {
        const value = translations.get(el.getAttribute(attr));
        if (value) el.setAttribute(attr, value);
      });
    });
  }

  function apply() {
    document.documentElement.lang = lang;
    if (lang === 'en') {
      document.title = 'Swift Rental Car Template — Car Rental with Professional Drivers';
      const description = document.querySelector('meta[name="description"]');
      if (description) description.setAttribute('content', 'Professional chauffeured car rental for city trips, airport transfers, and intercity travel from Bogor, Greater Jakarta, and Bandung. Transparent pricing and fast booking via official WhatsApp.');
      translate(document.body);
    }
  }

  window.SwiftLanguage = {
    set(next) {
      localStorage.setItem('swift-lang', next === 'en' ? 'en' : 'id');
      window.location.reload();
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    apply();
    const observer = new MutationObserver(records => records.forEach(record => {
      if (record.type === 'characterData') translate(record.target);
      else record.addedNodes.forEach(translate);
    }));
    observer.observe(document.body, {childList:true, characterData:true, subtree:true});
  });
})();
