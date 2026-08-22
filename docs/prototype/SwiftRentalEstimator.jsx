import { useState, useMemo } from "react";

/* ── DATA (mirrors pricing.json — in production this is imported, not inlined) ── */

const WA = "6280000000001";

const VEHICLES = [
  { id: "avanza", name: "Toyota Avanza", pax: 7, price: 700000, status: "confirmed" },
  { id: "ertiga", name: "Suzuki Ertiga", pax: 7, price: 700000, status: "derived" },
  { id: "xpander", name: "Mitsubishi Xpander", pax: 7, price: 756000, status: "derived" },
  { id: "terios", name: "Daihatsu Terios", pax: 7, price: 756000, status: "derived" },
  { id: "rush", name: "Toyota Rush", pax: 7, price: 756000, status: "derived" },
  { id: "innova", name: "Toyota Innova Reborn", pax: 7, price: 840000, status: "derived" },
  { id: "venturer", name: "Toyota Innova Venturer", pax: 6, price: 1008000, status: "derived" },
  { id: "zenix", name: "Toyota Zenix", pax: 7, price: 1008000, status: "derived" },
  { id: "fortuner", name: "Toyota Fortuner", pax: 6, price: 1232000, status: "derived" },
  { id: "hiace", name: "Toyota Hiace Commuter", pax: 14, price: null, status: "unconfirmed" },
  { id: "alphard", name: "Toyota Alphard", pax: 6, price: null, status: "unconfirmed" },
  { id: "elf", name: "Isuzu Elf Long", pax: 19, price: null, status: "unconfirmed" },
];

const PICKUP = [
  { id: "jkt-pusat", label: "Jakarta Pusat", fee: 0 },
  { id: "jkt-selatan", label: "Jakarta Selatan", fee: 0 },
  { id: "jkt-barat", label: "Jakarta Barat", fee: 0 },
  { id: "jkt-timur", label: "Jakarta Timur", fee: 0 },
  { id: "jkt-utara", label: "Jakarta Utara", fee: 0 },
  { id: "cibubur", label: "Cibubur", fee: 150000 },
  { id: "bekasi", label: "Bekasi", fee: 200000 },
  { id: "bogor", label: "Bogor", fee: 300000 },
  { id: "depok", label: "Depok", fee: null },
  { id: "tangerang", label: "Tangerang", fee: null },
  { id: "jkt-lain", label: "Area lain — dihitung admin", fee: null },
];

const DROPOFF = [
  { id: "bdg-kota", label: "Bandung Kota", fee: 0 },
  { id: "dago", label: "Dago", fee: 0 },
  { id: "lembang", label: "Lembang", fee: 200000 },
  { id: "ciwidey", label: "Ciwidey", fee: 350000 },
  { id: "bdg-lain", label: "Area lain — dihitung admin", fee: null },
];

const INCLUDED_STOPS = 3;
const INCLUDED_HOURS = 12;

const rp = (n) => "Rp " + n.toLocaleString("id-ID");

/* ── UI atoms ── */

const Chip = ({ tone, children }) => {
  const tones = {
    ok: "bg-blue-50 text-blue-800 border-blue-200",
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    off: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span className={`inline-block border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
};

const Field = ({ label, hint, children }) => (
  <div className="mb-5">
    <div className="mb-1.5 flex items-baseline justify-between">
      <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</label>
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </div>
    {children}
  </div>
);

const Select = ({ value, onChange, children }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full appearance-none rounded-none border border-slate-300 bg-white px-3 py-3 text-[15px] text-slate-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
  >
    {children}
  </select>
);

/* ── Price stack row (the signature element) ── */

const Row = ({ label, sub, value, muted, strong }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-200 py-2.5 last:border-0">
    <div className="min-w-0">
      <div className={`text-[13px] ${strong ? "font-semibold text-slate-900" : "text-slate-700"}`}>{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-400">{sub}</div>}
    </div>
    <div
      className={`shrink-0 font-mono text-[13px] tabular-nums ${
        muted ? "text-slate-400" : strong ? "font-semibold text-slate-900" : "text-slate-800"
      }`}
    >
      {value}
    </div>
  </div>
);

/* ── Main ── */

export default function SwiftRentalEstimator() {
  const [vehicleId, setVehicleId] = useState("avanza");
  const [pickupId, setPickupId] = useState("cibubur");
  const [dropoffId, setDropoffId] = useState("dago");
  const [stops, setStops] = useState(3);
  const [date, setDate] = useState("");

  const vehicle = VEHICLES.find((v) => v.id === vehicleId);
  const pickup = PICKUP.find((z) => z.id === pickupId);
  const dropoff = DROPOFF.find((z) => z.id === dropoffId);

  const calc = useMemo(() => {
    const extraStops = Math.max(0, stops - INCLUDED_STOPS);
    const blockers = [];
    if (vehicle.price === null) blockers.push(`harga ${vehicle.name} untuk rute ini`);
    if (pickup.fee === null) blockers.push(`biaya penjemputan ${pickup.label.split(" —")[0]}`);
    if (dropoff.fee === null) blockers.push(`biaya area ${dropoff.label.split(" —")[0]}`);
    if (extraStops > 0) blockers.push(`${extraStops} titik tambahan`);

    const total =
      blockers.length === 0 ? vehicle.price + pickup.fee + dropoff.fee : null;

    return { extraStops, blockers, total };
  }, [vehicle, pickup, dropoff, stops]);

  const waHref = useMemo(() => {
    const lines = [
      "Halo Swift Rental, saya mau booking:",
      "Rute: Jakarta → Bandung (sekali jalan)",
      `Kendaraan: ${vehicle.name} (${vehicle.pax} pax)`,
      `Titik jemput: ${pickup.label.split(" —")[0]}`,
      `Titik tujuan: ${dropoff.label.split(" —")[0]}`,
      `Jumlah titik di Bandung: ${stops}`,
      date ? `Tanggal: ${date}` : "Tanggal: (belum diisi)",
      calc.total ? `Estimasi dari web: ${rp(calc.total)}` : "Estimasi: perlu konfirmasi admin",
      `(ref: jakarta-bandung/${vehicle.id}/${pickup.id})`,
    ];
    return `https://wa.me/${WA}?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [vehicle, pickup, dropoff, stops, date, calc]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 font-sans antialiased">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-blue-700">
            Estimasi Perjalanan
          </div>
          <h1 className="mt-1.5 text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
            Jakarta <span className="text-blue-700">→</span> Bandung
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
            Sudah termasuk mobil, driver, {INCLUDED_HOURS} jam pemakaian, dan {INCLUDED_STOPS} titik
            tujuan. Belum termasuk BBM, tol, parkir, dan makan driver.
          </p>
        </div>

        {/* Form */}
        <div className="border border-slate-200 bg-white p-5">
          <Field label="Armada" hint={`${vehicle.pax} penumpang`}>
            <Select value={vehicleId} onChange={setVehicleId}>
              {VEHICLES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} · {v.pax} pax
                  {v.price === null ? " · harga via admin" : ""}
                </option>
              ))}
            </Select>
            {vehicle.status === "derived" && (
              <div className="mt-2">
                <Chip tone="warn">Harga belum dikonfirmasi klien</Chip>
              </div>
            )}
          </Field>

          <Field label="Titik jemput" hint="di area Jabodetabek">
            <Select value={pickupId} onChange={setPickupId}>
              {PICKUP.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                  {z.fee ? ` (+${rp(z.fee)})` : z.fee === 0 ? "" : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Titik tujuan utama" hint="di area Bandung">
            <Select value={dropoffId} onChange={setDropoffId}>
              {DROPOFF.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                  {z.fee ? ` (+${rp(z.fee)})` : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Jumlah titik di Bandung" hint={`${INCLUDED_STOPS} titik sudah termasuk`}>
            <div className="flex items-stretch border border-slate-300">
              <button
                onClick={() => setStops((s) => Math.max(1, s - 1))}
                className="w-12 border-r border-slate-300 bg-slate-50 text-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-300"
                aria-label="Kurangi titik"
              >
                −
              </button>
              <div className="flex-1 py-3 text-center font-mono text-[15px] tabular-nums text-slate-900">
                {stops}
              </div>
              <button
                onClick={() => setStops((s) => Math.min(8, s + 1))}
                className="w-12 border-l border-slate-300 bg-slate-50 text-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-300"
                aria-label="Tambah titik"
              >
                +
              </button>
            </div>
          </Field>

          <Field label="Tanggal berangkat">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-none border border-slate-300 bg-white px-3 py-3 text-[15px] text-slate-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
            />
          </Field>
        </div>

        {/* Price stack */}
        <div className="mt-4 border border-slate-900 bg-white">
          <div className="border-b border-slate-200 bg-slate-900 px-5 py-2.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white">
              Rincian estimasi
            </span>
          </div>

          <div className="px-5 py-3">
            <Row
              label={vehicle.name}
              sub="Tarif dasar Jakarta → Bandung, sekali jalan"
              value={vehicle.price === null ? "via admin" : rp(vehicle.price)}
              muted={vehicle.price === null}
            />
            <Row
              label={`Penjemputan · ${pickup.label.split(" —")[0]}`}
              sub={pickup.fee === 0 ? "Termasuk area Jakarta" : "Di luar area Jakarta"}
              value={pickup.fee === null ? "via admin" : pickup.fee === 0 ? "—" : "+ " + rp(pickup.fee)}
              muted={!pickup.fee}
            />
            <Row
              label={`Tujuan · ${dropoff.label.split(" —")[0]}`}
              sub={dropoff.fee === 0 ? "Termasuk area Bandung kota" : "Di luar Bandung kota"}
              value={dropoff.fee === null ? "via admin" : dropoff.fee === 0 ? "—" : "+ " + rp(dropoff.fee)}
              muted={!dropoff.fee}
            />
            <Row
              label={`Titik tambahan · ${calc.extraStops}`}
              sub={calc.extraStops === 0 ? `Masih dalam ${INCLUDED_STOPS} titik` : "Melebihi kuota titik"}
              value={calc.extraStops === 0 ? "—" : "via admin"}
              muted
            />
          </div>

          {/* Total */}
          <div className="border-t border-slate-900 px-5 py-4">
            {calc.total !== null ? (
              <>
                <div className="flex items-end justify-between">
                  <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    Estimasi
                  </div>
                  <div className="font-mono text-[28px] font-semibold tabular-nums leading-none text-blue-700">
                    {rp(calc.total)}
                  </div>
                </div>
                {VEHICLES.find((v) => v.id === vehicleId).status === "derived" && (
                  <p className="mt-3 text-[11px] leading-relaxed text-amber-700">
                    Tarif armada ini masih turunan dari tarif Avanza. Angkanya bisa berubah.
                  </p>
                )}
              </>
            ) : (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Perlu dihitung admin
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
                  Kombinasi ini belum punya tarif tetap: {calc.blockers.join(", ")}. Kirim detailnya
                  ke admin, harga dikonfirmasi dalam beberapa menit.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block w-full bg-blue-700 py-4 text-center text-[15px] font-semibold text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
        >
          {calc.total !== null ? "Konfirmasi harga via WhatsApp" : "Minta harga via WhatsApp"}
        </a>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
          Estimasi, bukan harga final. Admin mengonfirmasi sebelum invoice terbit.
          <br />
          Swift Rental hanya bertransaksi lewat {WA.replace("62", "0")} dan rekening BCA a.n. PT Swift Rental Indonesia (Demo).
        </p>
      </div>
    </div>
  );
}
