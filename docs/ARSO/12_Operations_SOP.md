# 12 — OPERATIONS SOP

**Phase:** 0 (immediately actionable, no code)
**Audience:** Swift Rental admin + owner

> Software automates a process. It does not invent one. **Every SOP below works today,
> with zero engineering, and several of them remove more risk than the entire Phase 1
> build.** Fix the process first; then automate the fixed process.

---

## 12.1 Quote SOP — the latency fix

**Target: p50 first response < 5 minutes during business hours.**

| Step | Action |
|---|---|
| 1 | WA arrives. **If it carries a `ref`** → the request is already structured. Skip to 3. |
| 2 | If not → reply with the estimator link: *"Biar cepat, isi di sini ya: [link] — 30 detik, langsung dapat estimasi."* |
| 3 | Open the estimator, enter the same inputs, read the price. **Do not compute by hand.** |
| 4 | Reply with the price **and the breakdown**. Not just the number. |
| 5 | If the customer negotiates → check the margin band before answering (Phase 1). Phase 0: check against a printed floor sheet. |
| 6 | Log the outcome: `WON` / `LOST + reason` / `NO_RESPONSE`. |

**Rule: the price on WhatsApp is the price from the estimator. Always.**
If they differ, the estimator is wrong → file it → fix the rule. Never "fix" it by quoting
around the tool; that is how problem #3 survives the entire project.

**Step 6 is not bureaucracy — it is the Δconversion measurement** that prices Phase 1
(`10` §10.5-D). Without it, the Phase 1 business case has no evidence and the answer
defaults to "no."

---

## 12.2 Availability SOP (Phase 0 — a shared calendar)

| Rule | Detail |
|---|---|
| One calendar, shared, everyone writes to it | |
| One event per booking | Title: `BK-xxx · VH-004 · JKT→BDG · Budi` |
| **Event spans trip + buffers, not the trip** | A car finishing in Bandung at 18:00 is **not** free at 19:00. Block until it is home. |
| Colour = vehicle | |
| Check before confirming. Every time. | |
| Maintenance is an event too | 14 vehicles minus 2 in the shop is a 12-vehicle fleet (BR-011) |

> **This prevents most double-bookings.** The remaining ones are a discipline failure, and
> software does not fix discipline — it relocates it into a system nobody updates either.
>
> **If double-bookings persist *after* the calendar is used consistently for 60 days,
> that is real evidence for Gate 0→1.** If they persist *because* the calendar isn't used,
> the booking engine will be ignored too, and you will have paid Rp 200jt to learn that.

---

## 12.3 Pricing rule change SOP

| Step | Action |
|---|---|
| 1 | Owner edits the pricing Google Sheet |
| 2 | **`reason` column is mandatory.** No reason → no change. No exceptions. |
| 3 | Export CSV → run the validation script |
| 4 | Script runs the §9.7 backtest. **Fails → the change does not ship.** |
| 5 | PR → review → merge → auto-deploy (~2 min) |
| 6 | Spot-check one live estimate |
| 7 | Wrong → `git revert` → redeploy (< 5 min) |

**Only the owner changes prices.** Not the admin, not the developer.
The `reason` column is the cheapest governance control in the whole system: in three years
someone will ask why Cibubur is 150k, and this column is the only thing that will answer
(`09` §9.6).

---

## 12.4 KTP / SIM handling SOP ⚠ — **do this this week**

> **This is a live UU PDP liability today, before any software exists.** It is a one-hour
> process change that removes more real risk than the entire Phase 1 encryption layer.
> It is also, by some distance, the highest value-per-minute item in this document set.

### The problem
KTP/SIM photos arrive over WhatsApp and stay in the admin's phone gallery — unencrypted,
indefinitely, **auto-backed-up to a consumer Google/iCloud account**, on a device that
leaves the office every night.

### The fix — Phase 0, no code

| Step | Action |
|---|---|
| 1 | **Turn off WhatsApp media auto-save to gallery.** Settings → Chats → Media visibility: OFF. *This alone is most of the risk.* |
| 2 | **Turn off WhatsApp cloud backup**, or exclude media from it. |
| 3 | One dedicated device or account for booking ops. Not a personal phone. |
| 4 | Move the image to a **password-protected, access-controlled folder** (business Drive with restricted sharing, not a personal account). Filename: `BK-xxx-ktp`. |
| 5 | **Delete from WhatsApp and from the gallery immediately** after moving. |
| 6 | **Delete from the folder 30 days after trip completion.** Calendar reminder, weekly, named owner. |
| 7 | Tell the customer why you need it and how long you keep it. One sentence. It is both a legal requirement and a trust signal — the same block that warns about fraud can say this. |

### Do not
- ❌ Forward KTP images to drivers. The driver needs a **name and a phone number**, not an identity document.
- ❌ Keep them "just in case." That is not a legal basis.
- ❌ Store them in a personal Google Photos account.

> **The most likely failure (EC-PDP-006):** the customer sends it to WhatsApp anyway, no
> matter what flow exists. The SOP must assume this permanently. Even in Phase 1 with a
> proper encrypted upload, step 5 remains a human habit.

---

## 12.5 Payment verification SOP

| Step | Action |
|---|---|
| 1 | Customer transfers DP 20% → sends proof |
| 2 | **Verify against the BCA app, never against the screenshot.** Screenshots are trivially forged; verifying the image is verifying nothing. |
| 3 | Match: amount, sender name, timestamp |
| 4 | Mismatch → do not confirm. Ask. |
| 5 | Confirm → send vehicle (merk/plat) + driver name & number |
| 6 | **Delete the proof screenshot from WhatsApp/gallery once verified** |

> **Step 6 matters more than it looks.** The proof contains the customer's **bank account
> number** → *data keuangan pribadi* → **specific personal data** under UU PDP Art. 4(2).
> That is a *higher* protection class than their name. It is currently sitting in a chat
> thread on a phone in someone's pocket.

**Only one canonical BCA account is ever quoted: BCA 000 000 0000 a.n. PT Swift Rental Indonesia (Demo).**
Never any other account, for any reason, including "the owner's personal account, just this
once." That sentence is what the fraud warning on the website exists to make impossible —
and a single exception makes the warning a lie.

---

## 12.6 Incident SOP (breakdown, driver no-show, accident)

**Not a software problem. Software records; humans solve.**

| Incident | First action | Then |
|---|---|---|
| Breakdown mid-trip | Call the customer **before** they call you | Dispatch a replacement / arrange alternative |
| Driver no-show | Reassign immediately | Root-cause after |
| Accident | **Safety first.** Then insurance, then customer, then internal. | Full write-up within 24h |
| Customer no-show | Wait `{{TOKEN}}` min → call → escalate | **BR-017 undefined — needs a policy** |

**Communication rule: Swift Rental calls first.** In a trust business, the customer discovering
the problem before you tell them costs more than the problem itself.

---

## 12.7 Escalation & continuity ⚠

> **The single admin is the real single point of failure in this business, and no software
> in this document set fixes it.**

If the admin is sick, on leave, or unreachable, the business stops. Not degrades — **stops**.
The pricing knowledge, the WhatsApp threads, the calendar context, and the customer
relationships all live in one head and one phone.

| Control | Status |
|---|---|
| Second person with WA access | `{{TOKEN}}` |
| Documented escalation roster | `{{TOKEN}}` |
| Owner can quote using the estimator | ✅ **After Phase 0** — this is a real, unbilled benefit of the estimator |
| Shared calendar (not one person's) | `{{TOKEN}}` |
| Pricing knowledge outside one head | ✅ **After Phase 0** — this is what `09_Pricing_Engine.md` actually delivers |

> **Two of these five are solved by Phase 0 as a side effect.** The estimator's stated job
> is quote latency; its unstated job is **getting the pricing model out of one person's
> head and into a file**. That is business continuity, and it is worth more than the
> conversion lift. Say this in the pitch — it is the argument that survives a sceptical owner.

---

## 12.8 Weekly ops review (30 min, owner + admin)

| Item | Question |
|---|---|
| Leads | How many? Won / lost / no response? |
| Lost reasons | Price? Availability? Speed? **This is the Gate 0→1 evidence.** |
| Estimator mismatches | Did the tool ever disagree with the final price? Why? |
| Overrides | Which corridor? > 20% → the rule is wrong. |
| Double-bookings | Any? Cause? |
| Vehicle issues | Maintenance, documents expiring |
| KTP purge | Done? |

> **This meeting is the measurement instrument for the entire Phase 1 business case.**
> It costs 30 minutes a week. Skipping it means Phase 1 gets decided on intuition, and the
> gates in `00` §0.3 become decoration.

---

## 12.9 The five-day study — start here

From `10_Financial_Model.md` §10.9. Ranked by value-per-day. **No code, no build, no budget.**

| # | Study | Days | Output |
|---|---|---|---|
| 1 | **Leakage** — 30 trips: engine price vs. invoiced price | 2 | Decides the whole Rp 300jt question |
| 2 | **Deadhead** — paid km vs. unpaid km per corridor | 1 | May reprice the business |
| 3 | **Per-vehicle contribution** — which car loses money | 2 | May sell 2 cars. Instant cash. |

> These five days are worth more than the next six months of engineering, and they are the
> only work in this entire document set that can be started tomorrow morning.

---

*End 12.*
