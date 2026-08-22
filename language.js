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
    ,'Hanya nomor & rekening di atas yang resmi. Abaikan pihak lain yang mengatasnamakan Arasya.':'Only the numbers and bank account above are official. Ignore anyone else claiming to represent Arasya.'
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
    ,'Bagaimana memastikan ini Arasya yang resmi?':'How do I verify the official Arasya channel?'
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
        .replace(/± (\d+) jam/g, '± $1 hours');
      if (translated === trimmed) return;
    }
    node.nodeValue = raw.replace(trimmed, translated);
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
    if (root.querySelectorAll) root.querySelectorAll('[placeholder]').forEach(el => {
      const value = translations.get(el.getAttribute('placeholder'));
      if (value) el.setAttribute('placeholder', value);
    });
  }

  function apply() {
    document.documentElement.lang = lang;
    if (lang === 'en') {
      document.title = 'Swift Rental — Car Rental with Professional Drivers';
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
    const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(translate)));
    observer.observe(document.body, {childList:true, subtree:true});
  });
})();
