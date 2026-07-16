// ARSO Console (05_Admin_OS.md). A functional, self-contained admin that runs
// the REAL pricing engine (bundled from packages/pricing-engine — ADR-006) and
// mirrors the SOP: quote → confirm → assign, payment verify, versioned pricing,
// margin reports. Data persists in localStorage; no backend to provision.
import { estimate, buildWhatsAppUrl, formatIDR } from "./lib/pricing-engine.js";

// ───────────────────────── config ─────────────────────────
const TODAY = "2026-07-16";
const ROLES = {
  OWNER:    { margin: true,  pay: true,  publish: true,  assign: true,  desc: "Semua akses — termasuk margin, gaji, publish harga." },
  ADMIN:    { margin: false, pay: false, publish: false, assign: false, desc: "Quote, booking, customer. TIDAK bisa lihat margin (by design §5.4)." },
  FINANCE:  { margin: true,  pay: true,  publish: false, assign: false, desc: "Invoice, pembayaran, bukti, margin." },
  DISPATCH: { margin: false, pay: false, publish: false, assign: true,  desc: "Assignment & ketersediaan. Tanpa harga/finansial." },
};
const NAV = [
  { id: "quote",    label: "Quote Console", key: "1" },
  { id: "board",    label: "Booking Board", key: "2" },
  { id: "payments", label: "Pembayaran",    key: "3" },
  { id: "pricing",  label: "Harga",         key: "4" },
  { id: "reports",  label: "Laporan",       key: "5" },
];
const PIPELINE = ["PENDING_PAYMENT", "CONFIRMED", "ASSIGNED", "IN_PROGRESS", "COMPLETED"];
const STATUS_COLOR = {
  DRAFT:"#6b7690", PENDING_PAYMENT:"#e8b13a", CONFIRMED:"#2E6FE0", ASSIGNED:"#8b5cf6",
  IN_PROGRESS:"#2fbf71", COMPLETED:"#3a4658", CANCELLED:"#e5544b", NO_SHOW:"#e5544b",
};

// ───────────────────────── state ─────────────────────────
const LS_KEY = "arso-console-v1";
let SEED = null;      // immutable seed (from seed.json)
let db = null;        // mutable working set (persisted)
let role = "OWNER";
let view = "quote";
let quoteState = { input: null, result: null, tier: "DALAM_KOTA_12H" };

const $ = (s, r = document) => r.querySelector(s);
const caps = () => ROLES[role];
const money = (n) => formatIDR(n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));

async function boot() {
  SEED = await fetch("./data/seed.json").then((r) => r.json());
  load();
  buildChrome();
  render();
  window.addEventListener("keydown", onKey);
}

function load() {
  const saved = localStorage.getItem(LS_KEY);
  db = saved ? JSON.parse(saved) : freshDb();
}
function freshDb() {
  return {
    ruleset: structuredClone(SEED.ruleset),
    bookings: structuredClone(SEED.bookings),
    payments: structuredClone(SEED.payments),
    vehicles: structuredClone(SEED.vehicles),
    drivers: structuredClone(SEED.drivers),
    quotes: [],
    priceChanges: [],
    audit: [],
    seq: { QT: 187 },
  };
}
function save() { localStorage.setItem(LS_KEY, JSON.stringify(db)); }
function audit(action, detail) {
  db.audit.unshift({ at: new Date().toISOString(), role, action, detail });
  save();
}

// ───────────────────────── chrome ─────────────────────────
function buildChrome() {
  $("#nav").innerHTML = NAV.map((n) =>
    `<button data-nav="${n.id}"><span>${n.label}</span><span class="k">${n.key}</span></button>`).join("");
  $("#nav").onclick = (e) => { const b = e.target.closest("[data-nav]"); if (b) { view = b.dataset.nav; render(); } };
  const sel = $("#role");
  sel.innerHTML = Object.keys(ROLES).map((r) => `<option value="${r}">${r}</option>`).join("");
  sel.value = role;
  sel.onchange = () => { role = sel.value; render(); };
  $("#reset").onclick = () => { if (confirm("Reset semua data demo?")) { db = freshDb(); save(); render(); toast("Data demo di-reset."); } };
}

function render() {
  $("#roleDesc").textContent = caps().desc;
  document.querySelectorAll("[data-nav]").forEach((b) => b.classList.toggle("on", b.dataset.nav === view));
  const v = $("#view");
  ({ quote: renderQuote, board: renderBoard, payments: renderPayments, pricing: renderPricing, reports: renderReports }[view])(v);
}

function onKey(e) {
  if (e.target.matches("input,select,textarea")) { if (e.key === "Enter" && e.target.id === "ref") lookupRef(); return; }
  const n = NAV.find((x) => x.key === e.key);
  if (n) { view = n.id; render(); }
  if (e.key === "/") { e.preventDefault(); view = "quote"; render(); $("#ref")?.focus(); }
}

// ═══════════════════════ QUOTE CONSOLE (§5.3.1) ═══════════════════════
function renderQuote(root) {
  const rs = db.ruleset;
  const opt = (arr, cur, val = (x)=>x.id, lab = (x)=>x.label||x.id) =>
    arr.map((x) => `<option value="${val(x)}" ${val(x)===cur?"selected":""}>${lab(x)}</option>`).join("");
  const i = quoteState.input || {};
  root.innerHTML = `
    <h1>Quote Console</h1>
    <p class="sub">Tempel <code>ref</code> dari WhatsApp → request tersusun otomatis. Admin konfirmasi, bukan ngetik ulang. <b>Ini solusi masalah #1.</b></p>
    <div class="grid" style="grid-template-columns:minmax(0,380px) 1fr">
      <div class="card">
        <h3>Reconstruct dari ref</h3>
        <div class="row" style="margin-bottom:14px">
          <input id="ref" class="mono" placeholder="ref: q-5d7308" style="flex:1">
          <button class="btn ghost" id="refBtn">Cari</button>
        </div>
        <div class="muted" style="font-size:11.5px;margin:-6px 0 14px">Coba: ${Object.keys(SEED.refs).map((r)=>`<code style="cursor:pointer;color:#9db6e8" data-ref="${r}">${r}</code>`).join(" · ")}</div>
        <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
          <label class="fld"><span>Korridor</span><select id="q_cor">${opt(rs.corridors,i.corridorId,(x)=>x.id,(x)=>x.from_city+"→"+x.to_city)}</select></label>
          <label class="fld"><span>Kelas</span><select id="q_cls">${opt(rs.vehicle_classes,i.vehicleClassId)}</select></label>
          <label class="fld"><span>Tipe</span><select id="q_trip"><option value="ONE_WAY" ${i.tripType==="ONE_WAY"?"selected":""}>Sekali jalan</option><option value="ROUND_TRIP" ${i.tripType==="ROUND_TRIP"?"selected":""}>Pulang pergi</option></select></label>
          <label class="fld"><span>Tier</span><select id="q_tier"><option value="DALAM_KOTA_12H" ${quoteState.tier==="DALAM_KOTA_12H"?"selected":""}>Dalam Kota 12j</option><option value="ALL_IN" ${quoteState.tier==="ALL_IN"?"selected":""}>All-in</option></select></label>
          <label class="fld"><span>Jemput (zona)</span><select id="q_pu">${opt(rs.zones,i.pickupZoneId)}</select></label>
          <label class="fld"><span>Tujuan (zona)</span><select id="q_do">${opt(rs.zones,i.dropoffZoneId)}</select></label>
          <label class="fld"><span>Tanggal</span><input id="q_date" type="date" value="${i.tripDate||TODAY}"></label>
          <label class="fld"><span>Pax</span><input id="q_pax" type="number" min="1" value="${i.pax||4}"></label>
        </div>
        <label class="fld" style="margin-top:12px"><span>Titik (dwell → jam kerja)</span>
          <select id="q_stops" multiple size="4">
            ${["DROP_ONLY","PICKUP_ONLY","SHORT_WAIT","MEETING","MEAL","LONG_WAIT"].map((t)=>`<option value="${t}" ${(i.stops||[]).some(s=>s.type===t)?"selected":""}>${t}</option>`).join("")}
          </select>
        </label>
        <div class="muted" style="font-size:11px;margin-top:6px">Ctrl/⌘-klik untuk pilih beberapa titik. Pelanggan pilih <i>jenis</i>, engine yang hitung jam.</div>
        <button class="btn" id="calc" style="width:100%;margin-top:14px">Hitung Estimasi</button>
      </div>
      <div class="card" id="q_out"><p class="muted">Isi request lalu klik <b>Hitung Estimasi</b>, atau tempel sebuah <code>ref</code>.</p></div>
    </div>`;

  $("#refBtn").onclick = lookupRef;
  root.querySelectorAll("[data-ref]").forEach((c)=>c.onclick=()=>{ $("#ref").value=c.dataset.ref; lookupRef(); });
  $("#calc").onclick = () => { quoteState.input = readForm(); quoteState.tier = $("#q_tier").value; computeAndShow(); };
  if (quoteState.input) computeAndShow();
  else $("#ref")?.focus();
}

function readForm() {
  const stops = [...$("#q_stops").selectedOptions].map((o) => ({ type: o.value }));
  return {
    corridorId: $("#q_cor").value, vehicleClassId: $("#q_cls").value, tripType: $("#q_trip").value,
    pickupZoneId: $("#q_pu").value, dropoffZoneId: $("#q_do").value, stops,
    tripDate: $("#q_date").value, pax: Number($("#q_pax").value) || 1, pickupTime: "07:00",
  };
}

function lookupRef() {
  const key = ($("#ref").value || "").trim();
  const r = SEED.refs[key];
  if (!r) return toast("ref tidak dikenal: " + key, "bad");
  quoteState.input = { corridorId:r.corridorId, vehicleClassId:r.vehicleClassId, tripType:r.tripType,
    pickupZoneId:r.pickupZoneId, dropoffZoneId:r.dropoffZoneId, stops:r.stops, tripDate:r.tripDate, pax:r.pax, pickupTime:r.pickupTime };
  quoteState.tier = r.tier; quoteState.meta = { name: r.customerName, phone: r.customerPhone };
  render();
  toast("Request dari " + (r.customerName||key) + " berhasil disusun ulang.", "good");
}

function costFloor(totalBeforeTax) { return Math.round(totalBeforeTax * SEED.cost_floor_pct_of_base / 10000) * 10000; }

function computeAndShow() {
  const input = quoteState.input; const res = estimate(input, db.ruleset);
  quoteState.result = res;
  const out = $("#q_out");
  const cor = db.ruleset.corridors.find((c)=>c.id===input.corridorId);
  const cls = db.ruleset.vehicle_classes.find((c)=>c.id===input.vehicleClassId);
  const head = `<div class="mono muted" style="font-size:12px">${cor?cor.from_city+" → "+cor.to_city:""} · ${cls?cls.label:""} · ${input.tripType==="ROUND_TRIP"?"PP":"Sekali jalan"} · ${input.pax} pax</div>`;

  if (res.status !== "OK") {
    out.innerHTML = `${head}
      <div class="brk" style="margin-top:12px"><div class="ln"><span>Harga</span><b>Hubungi untuk harga terbaik</b></div></div>
      <p class="muted" style="margin-top:10px">Path <code>quote_only</code> / data belum lengkap (<code>${esc(res.reason)}</code>) → angka tidak ditampilkan. CTA WhatsApp tetap jalan (09 §9.9).</p>
      <div class="row" style="margin-top:12px"><a class="btn" href="${buildWhatsAppUrl(input,res,db.ruleset)}" target="_blank" rel="noopener">Salin ke WhatsApp →</a></div>`;
    return;
  }
  const floor = costFloor(res.totalBeforeTax);
  const margin = ((res.total - floor) / res.total) * 100;
  const belowFloor = res.total < floor;
  const marginHtml = caps().margin
    ? `<div class="margin-box"><span>💰 Cost floor <b class="mono">${money(floor)}</b> <span class="muted">(model biaya demo)</span></span><span class="pill" style="background:${belowFloor?"rgba(229,84,75,.16)":"rgba(47,191,113,.16)"};color:${belowFloor?"#e5544b":"#2fbf71"}">Margin ${margin.toFixed(0)}%</span></div>`
    : `<div class="margin-box"><span class="locked">🔒 Margin & cost floor — hanya OWNER/FINANCE (§5.4)</span></div>`;

  out.innerHTML = `${head}
    <div class="brk" style="margin-top:12px">
      ${res.breakdown.map((b)=>`<div class="ln"><span>${esc(b.label)}</span>${b.included?`<span class="incl">✓ termasuk</span>`:`<b class="mono">${money(b.amount)}</b>`}</div>`).join("")}
      <div class="ln tot"><span>ESTIMASI</span><span>${money(res.total)}</span></div>
    </div>
    ${marginHtml}
    <p class="muted" style="font-size:11.5px;margin-top:10px">${esc(res.disclaimer)}</p>
    <div class="row" style="margin-top:14px">
      <button class="btn good" id="issue">Terbitkan Quote</button>
      <button class="btn ghost" id="override">Override</button>
      <a class="btn ghost" href="${buildWhatsAppUrl(input,res,db.ruleset)}" target="_blank" rel="noopener">Salin ke WhatsApp →</a>
    </div>
    <div class="mono muted" style="font-size:11px;margin-top:10px">ref ${esc(res.refFull)}</div>`;

  $("#issue").onclick = () => issueQuote(res, floor);
  $("#override").onclick = () => overrideModal(res, floor);
}

function nextCode(prefix) { db.seq[prefix] = (db.seq[prefix]||0) + 1; return `${prefix}-2026-${String(db.seq[prefix]).padStart(5,"0")}`; }

function issueQuote(res, floor, override) {
  const code = nextCode("QT");
  const q = {
    code, ref: res.ref, corridorId: quoteState.input.corridorId, classId: quoteState.input.vehicleClassId,
    total: override ? override.amount : res.total, base_total: res.total, cost_floor: floor,
    margin: ((( override?override.amount:res.total) - floor) / (override?override.amount:res.total)) * 100,
    rule_version: "rv-demo-1", frozen_at: new Date().toISOString(),
    override_reason: override ? override.reason : null,
    customer: quoteState.meta?.name || "(web self-serve)",
  };
  db.quotes.unshift(q); audit(override ? "quote.override" : "quote.issue", `${code} ${money(q.total)}${override?" · "+override.reason:""}`); save();
  toast(`Quote ${code} diterbitkan${override?" (override)":""} — rule version dibekukan, row immutable.`, "good");
}

function overrideModal(res, floor) {
  modal(`<h3>Override harga</h3><p class="muted" style="margin:0 0 14px;font-size:13px">Override butuh <b>alasan wajib</b> (§5.3.1 / BR-113). Dicatat, immutable, superseding.</p>
    <label class="fld" style="margin-bottom:12px"><span>Harga baru (Rp)</span><input id="ov_amt" type="number" value="${res.total}"></label>
    <label class="fld" style="margin-bottom:16px"><span>Alasan (wajib)</span><select id="ov_reason"><option value="">— pilih —</option><option>Repeat customer</option><option>Match kompetitor</option><option>Corporate rate</option><option>Kompensasi keterlambatan</option><option>Promo</option></select></label>
    <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Batal</button><button class="btn" id="ov_go">Terbitkan override</button></div>`,
    (m) => {
      $("#ov_go", m).onclick = () => {
        const amount = Number($("#ov_amt", m).value); const reason = $("#ov_reason", m).value;
        if (!reason) return toast("Alasan override wajib diisi.", "bad");
        if (amount < floor && !confirm(`${money(amount)} di bawah cost floor ${money(floor)}. Lanjut?`)) return;
        closeModal(); issueQuote(res, floor, { amount, reason });
      };
    });
}

// ═══════════════════════ BOOKING BOARD (§5.3.2) ═══════════════════════
function renderBoard(root) {
  root.innerHTML = `<h1>Booking Board</h1><p class="sub">Kanban per status. Seret kartu untuk transisi. Konflik ditolak database & di-<i>namai</i> (§5.3.2).</p><div class="board" id="board"></div>`;
  const board = $("#board");
  board.innerHTML = PIPELINE.map((st) => {
    const items = db.bookings.filter((b) => b.status === st);
    return `<div class="col" data-status="${st}"><div class="h"><span>${st.replace("_"," ")}</span><span>${items.length}</span></div>
      ${items.map((b)=>cardHtml(b)).join("")}</div>`;
  }).join("");
  wireBoard(board);
}
function cardHtml(b) {
  const veh = b.vehicle ? ` · ${b.vehicle}` : "";
  const canAssign = caps().assign && (b.status === "CONFIRMED");
  return `<div class="bkg" draggable="true" data-code="${b.code}">
    <div class="c">${b.code}</div><div class="who">${esc(b.customer)}</div>
    <div class="meta">${b.corridor} · ${b.class}${veh}</div>
    <div class="meta">${b.start.replace("T"," ")}</div>
    ${caps().margin ? `<div class="meta mono">${money(b.total)}</div>` : ""}
    ${canAssign ? `<button class="btn ghost" style="margin-top:8px;padding:6px 10px;font-size:12px" data-assign="${b.code}">Assign unit</button>` : ""}
  </div>`;
}
function wireBoard(board) {
  let dragCode = null;
  board.querySelectorAll(".bkg").forEach((el) => {
    el.addEventListener("dragstart", () => { dragCode = el.dataset.code; el.classList.add("drag"); });
    el.addEventListener("dragend", () => el.classList.remove("drag"));
  });
  board.querySelectorAll(".col").forEach((col) => {
    col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("over"); });
    col.addEventListener("dragleave", () => col.classList.remove("over"));
    col.addEventListener("drop", () => {
      col.classList.remove("over");
      const b = db.bookings.find((x) => x.code === dragCode); if (!b) return;
      const to = col.dataset.status;
      if (to === b.status) return;
      if (to === "ASSIGNED" && !b.vehicle) return toast(`Assign unit dulu sebelum ${b.code} → ASSIGNED.`, "bad");
      b.status = to; audit("booking.status", `${b.code} → ${to}`); save(); renderBoard($("#view"));
      toast(`${b.code} → ${to.replace("_"," ")}`);
    });
  });
  board.querySelectorAll("[data-assign]").forEach((btn) => btn.onclick = () => assignModal(btn.dataset.assign));
}
function assignModal(code) {
  const b = db.bookings.find((x) => x.code === code);
  const vehs = db.vehicles.filter((v) => v.status === "ACTIVE" && v.class_id === b.class);
  const drs = db.drivers.filter((d) => d.status === "ACTIVE");
  modal(`<h3>Assign — ${code}</h3><p class="muted" style="margin:0 0 14px;font-size:13px">${esc(b.customer)} · ${b.corridor} · ${b.start.replace("T"," ")} → ${b.end.replace("T"," ")}</p>
    <label class="fld" style="margin-bottom:12px"><span>Unit (kelas ${b.class})</span><select id="as_v">${vehs.length?vehs.map((v)=>`<option value="${v.code}">${v.code} · ${esc(v.name)} (${esc(v.plate)})</option>`).join(""):`<option value="">— tak ada unit ACTIVE —</option>`}</select></label>
    <label class="fld" style="margin-bottom:16px"><span>Driver</span><select id="as_d">${drs.map((d)=>`<option value="${d.code}">${d.code} · ${esc(d.name)}</option>`).join("")}</select></label>
    <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Batal</button><button class="btn" id="as_go">Assign</button></div>`,
    (m) => { $("#as_go", m).onclick = () => {
      const vcode = $("#as_v", m).value; if (!vcode) return toast("Tidak ada unit.", "bad");
      const conflict = findConflict(vcode, b);
      if (conflict) return toast(`Konflik: ${vcode} sudah dipakai ${conflict.code} (${conflict.customer}) yang overlap. Pilih unit lain.`, "bad");
      b.vehicle = vcode; b.driver = $("#as_d", m).value; b.status = "ASSIGNED";
      audit("booking.assign", `${b.code} → ${vcode}/${b.driver}`); save(); closeModal(); renderBoard($("#view"));
      toast(`${b.code} di-assign ke ${vcode}.`, "good");
    }; });
}
// Mirrors the DB exclusion constraint (§7.6.1): the buffer-padded window overlap check.
function findConflict(vcode, self) {
  const s = new Date(self.start).getTime() - 60*60000, e = new Date(self.end).getTime() + 120*60000;
  return db.bookings.find((b) => b.vehicle === vcode && b.code !== self.code &&
    ["ASSIGNED","IN_PROGRESS"].includes(b.status) &&
    new Date(b.start).getTime() < e && new Date(b.end).getTime() > s);
}

// ═══════════════════════ PAYMENT VERIFICATION (§5.3.3) ═══════════════════════
function renderPayments(root) {
  if (!caps().pay) return lock(root, "Pembayaran", "Hanya FINANCE / OWNER. Bukti transfer = specific personal data (§5.3.3).");
  const pend = db.payments.filter((p) => p.status === "PENDING");
  root.innerHTML = `<h1>Verifikasi Pembayaran</h1><p class="sub">Antrean <code>PENDING</code>. Bandingkan nominal harapan vs bukti. Setiap aksi dicatat.</p>
    <div class="card">${pend.length ? `<table><thead><tr><th>Kode</th><th>Customer</th><th>Metode</th><th>Diharap</th><th>Diterima</th><th></th></tr></thead><tbody>
      ${pend.map((p)=>`<tr><td class="mono">${p.code}</td><td>${esc(p.customer)}</td><td>${p.method}${p.is_dp?" · DP":""}</td><td class="mono">${money(p.expected)}</td>
        <td class="mono" style="color:${p.amount===p.expected?"#2fbf71":"#e8b13a"}">${money(p.amount)}</td>
        <td class="row" style="justify-content:flex-end"><button class="btn good" style="padding:7px 12px" data-verify="${p.code}">Verify</button><button class="btn bad" style="padding:7px 12px" data-reject="${p.code}">Reject</button></td></tr>`).join("")}
    </tbody></table>` : `<p class="muted">Tidak ada pembayaran menunggu. 🎉</p>`}</div>`;
  root.querySelectorAll("[data-verify]").forEach((b)=>b.onclick=()=>{ const p=db.payments.find(x=>x.code===b.dataset.verify); p.status="VERIFIED"; audit("payment.verify",p.code); save(); renderPayments(root); toast(`${p.code} diverifikasi.`,"good"); });
  root.querySelectorAll("[data-reject]").forEach((b)=>b.onclick=()=>{ const reason=prompt("Alasan reject (wajib):"); if(!reason)return; const p=db.payments.find(x=>x.code===b.dataset.reject); p.status="REJECTED"; audit("payment.reject",`${p.code} · ${reason}`); save(); renderPayments(root); toast(`${p.code} ditolak.`,"bad"); });
}

// ═══════════════════════ PRICING ADMIN (§5.3.4) ═══════════════════════
function renderPricing(root) {
  const rs = db.ruleset;
  const rows = [];
  for (const c of rs.corridors) for (const cls of Object.keys(c.price)) {
    const cell = c.price[cls].ONE_WAY;
    rows.push({ corridor: c.id, cls, price: cell });
  }
  root.innerHTML = `<h1>Harga (versioned)</h1><p class="sub">Tidak pernah <code>UPDATE</code> — selalu supersede + alasan. Publish menjalankan backtest §9.7; gagal = ditolak.</p>
    <div class="card"><table><thead><tr><th>Korridor</th><th>Kelas</th><th>One-way</th><th></th></tr></thead><tbody>
      ${rows.map((r)=>`<tr><td class="mono">${r.corridor}</td><td>${r.cls}</td>
        <td class="mono">${r.price==null?'<span class="muted">quote-only</span>':typeof r.price==="number"?money(r.price):'<span style="color:#e8b13a">{{TOKEN}}</span>'}</td>
        <td style="text-align:right">${caps().publish?`<button class="btn ghost" style="padding:6px 11px;font-size:12px" data-sup="${r.corridor}|${r.cls}">Supersede</button>`:""}</td></tr>`).join("")}
    </tbody></table>
    ${caps().publish?`<div class="row" style="margin-top:16px;justify-content:space-between;align-items:center"><span class="muted" style="font-size:12px">${db.priceChanges.length} perubahan belum ter-publish</span><button class="btn" id="publish">Publish + jalankan backtest</button></div>`:`<p class="locked" style="margin-top:14px">🔒 Publish harga — OWNER saja (§5.4).</p>`}
    </div>`;
  if (caps().publish) {
    root.querySelectorAll("[data-sup]").forEach((b)=>b.onclick=()=>supersedeModal(...b.dataset.sup.split("|")));
    $("#publish").onclick = publish;
  }
}
function supersedeModal(corridor, cls) {
  const c = db.ruleset.corridors.find((x)=>x.id===corridor); const cur = c.price[cls].ONE_WAY;
  modal(`<h3>Supersede ${corridor} · ${cls}</h3><p class="muted" style="margin:0 0 14px;font-size:13px">Harga lama: ${typeof cur==="number"?money(cur):esc(String(cur))}. Baris baru dengan <code>effective_from</code>, alasan wajib.</p>
    <label class="fld" style="margin-bottom:12px"><span>Harga baru (Rp)</span><input id="sp_p" type="number" value="${typeof cur==="number"?cur:""}"></label>
    <label class="fld" style="margin-bottom:12px"><span>Berlaku dari</span><input id="sp_from" type="date" value="${TODAY}"></label>
    <label class="fld" style="margin-bottom:12px"><span>Alasan (wajib)</span><input id="sp_reason" placeholder="mis. kenaikan BBM Q3"></label>
    <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:16px"><input type="checkbox" id="sp_loss" style="width:auto"> loss-leader (izinkan di bawah cost floor)</label>
    <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Batal</button><button class="btn" id="sp_go">Simpan (staged)</button></div>`,
    (m)=>{ $("#sp_go",m).onclick=()=>{
      const price=Number($("#sp_p",m).value), reason=$("#sp_reason",m).value.trim();
      if(!reason) return toast("Alasan wajib.","bad");
      c.price[cls].ONE_WAY = price;
      db.priceChanges.push({ corridor, cls, price, from:$("#sp_from",m).value, reason, loss_leader:$("#sp_loss",m).checked });
      audit("price.supersede", `${corridor}/${cls} → ${money(price)} · ${reason}`); save(); closeModal(); renderPricing($("#view"));
      toast("Perubahan di-stage. Publish untuk jalankan backtest.");
    }; });
}
function publish() {
  // §9.7 backtest gate: the calibration anchor must still price within ±10%.
  const anchor = estimate({ corridorId:"JKT_BDG", vehicleClassId:"ECONOMY_MPV", tripType:"ONE_WAY",
    pickupZoneId:"ZONE_CIBUBUR", dropoffZoneId:"ZONE_DAGO",
    stops:[{type:"MEETING"},{type:"MEETING"},{type:"MEETING"}], tripDate:"2026-08-12" }, db.ruleset);
  const ok = anchor.status === "OK" && Math.abs(anchor.total - 850000) / 850000 <= 0.10;
  if (!ok) return toast(`Backtest GAGAL — anchor JKT→BDG jadi ${anchor.status==="OK"?money(anchor.total):"quote-only"} (harusnya ~Rp 850.000, ±10%). Publish ditolak (§5.3.4).`, "bad");
  audit("price.publish", `${db.priceChanges.length} perubahan · backtest lolos`);
  db.priceChanges = []; save(); renderPricing($("#view"));
  toast("Backtest lolos ✓ — harga di-publish.", "good");
}

// ═══════════════════════ REPORTS (§5.3.6) ═══════════════════════
function renderReports(root) {
  const expiring = db.vehicles.map((v)=>({ ...v, days: Math.round((new Date(v.stnk_expires)-new Date(TODAY))/86400000) }))
    .filter((v)=>v.days<=60).sort((a,b)=>a.days-b.days);
  const marginBlock = caps().margin ? marginHeat() : `<div class="card"><h3>Margin per korridor</h3><p class="locked">🔒 Margin — hanya OWNER/FINANCE (§5.4).</p></div>`;
  root.innerHTML = `<h1>Laporan</h1><p class="sub">Dari <code>quotes.margin_pct</code> (generated column §7.5) & jadwal dokumen. "Which corridor is bleeding money" = satu SELECT.</p>
    <div class="grid" style="grid-template-columns:1fr 1fr;align-items:start">
      ${marginBlock}
      <div class="card"><h3>Dokumen jatuh tempo (60/30/7 hari)</h3>
        ${expiring.length?expiring.map((v)=>`<div class="alert" style="border-color:${v.days<=7?"var(--bad)":v.days<=30?"var(--warn)":"var(--line)"}">
          <span class="pill" style="background:rgba(232,177,58,.16);color:${v.days<=7?"#e5544b":"#e8b13a"}">${v.days}h</span>
          <div><b>${v.code}</b> STNK · ${esc(v.name)}<div class="muted" style="font-size:12px">expires ${v.stnk_expires}</div></div></div>`).join(""):`<p class="muted">Tidak ada yang jatuh tempo dalam 60 hari.</p>`}
      </div>
    </div>
    <div class="card" style="margin-top:16px"><h3>Audit log (${db.audit.length})</h3>
      ${db.audit.length?`<table><thead><tr><th>Waktu</th><th>Peran</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>
        ${db.audit.slice(0,12).map((a)=>`<tr><td class="mono muted">${a.at.slice(5,16).replace("T"," ")}</td><td>${a.role}</td><td class="mono">${a.action}</td><td class="muted">${esc(a.detail)}</td></tr>`).join("")}
      </tbody></table>`:`<p class="muted">Belum ada aktivitas. Terbitkan quote atau pindahkan booking untuk mengisi log.</p>`}
    </div>`;
}
function marginHeat() {
  const byCor = {};
  for (const q of db.quotes) { (byCor[q.corridorId] ||= []).push(q.margin); }
  const rows = Object.entries(byCor).map(([c, ms]) => ({ c, m: ms.reduce((a,b)=>a+b,0)/ms.length, n: ms.length }))
    .sort((a,b)=>a.m-b.m); // worst first (§5.3.6 / 10 §10.4)
  const color = (m)=> m<15?"#e5544b":m<25?"#e8b13a":"#2fbf71";
  return `<div class="card"><h3>Margin per korridor — terburuk dulu</h3>
    ${rows.length?`<table class="heat"><thead><tr><th>Korridor</th><th>Quote</th><th style="text-align:right">Avg margin</th></tr></thead><tbody>
      ${rows.map((r)=>`<tr><td class="mono">${r.c}</td><td class="muted">${r.n}</td><td class="m" style="text-align:right;color:${color(r.m)}">${r.m.toFixed(0)}%</td></tr>`).join("")}
    </tbody></table>`:`<p class="muted">Belum ada quote diterbitkan. Terbitkan beberapa quote di Console untuk mengisi heatmap.</p>`}</div>`;
}

// ───────────────────────── ui helpers ─────────────────────────
function lock(root, title, why) { root.innerHTML = `<h1>${title}</h1><div class="card"><p class="locked">🔒 ${esc(why)}</p><p class="muted" style="font-size:12px;margin-top:8px">Ganti peran ke OWNER/FINANCE di panel kiri untuk mendemokan RBAC.</p></div>`; }
function toast(msg, kind = "") {
  const t = document.createElement("div"); t.className = "toast " + kind; t.textContent = msg;
  $("#toast-root").appendChild(t); setTimeout(() => t.remove(), 3400);
}
function modal(html, wire) {
  const root = $("#modal-root");
  root.innerHTML = `<div class="modal-bg"><div class="modal">${html}</div></div>`;
  root.querySelector(".modal-bg").addEventListener("click", (e) => { if (e.target.classList.contains("modal-bg")) closeModal(); });
  root.querySelectorAll("[data-close]").forEach((b) => b.onclick = closeModal);
  if (wire) wire(root);
}
function closeModal() { $("#modal-root").innerHTML = ""; }

boot();
