# 06 — SYSTEM ARCHITECTURE

**Phase:** All
**Precedence:** subordinate to `00`, `02`, `09`.

---

## 6.1 The architecture decision, stated first

> **A modular monolith on one Postgres instance, behind a static CDN, for the next five years.**

Sizing, from `10_Financial_Model.md` and `07_Database_Spec.md` §7.10:

| Metric | Value |
|---|---|
| Fleet | 14 |
| Bookings/month | ~280 `[ASUMSI, pending Q7]` |
| Bookings/year | ~3.400 |
| Rows after 10 years | ~34.000 |
| Peak concurrent users | < 50 |
| Admin users | 1–3 |

**34.000 rows.** That is a rounding error. It fits in RAM on the cheapest instance any
cloud sells. There is no scaling problem here, and pretending there is costs real money.

**Rejected, explicitly:** Kubernetes, microservices, Redis cluster, message broker,
read replicas, sharding, service mesh, event sourcing.

Every one of these was in the stakeholder brief. Every one solves a problem this business
does not have, will not have for five years, and would pay for monthly in the meantime —
in infrastructure, in build time, and in the two-person team who must operate it at 2am.

> **Architecture is a liability you pay rent on.** The correct question is not
> "will this scale to a million users?" It is "what is the least machinery that makes this
> correct?" NestJS + Rust + K8s + Redis + Metabase for 280 bookings/month is not
> engineering; it is résumé-building at the client's expense.

---

## 6.2 Phase 0 — the entire architecture

```
┌──────────────┐        ┌────────────────────┐        ┌──────────────┐
│   Browser    │───────►│  Static CDN        │        │  WhatsApp    │
│  (mobile)    │        │  (Vercel/Netlify)  │        │  (operator)  │
└──────┬───────┘        │                    │        └──────▲───────┘
       │                │  • HTML/CSS/JS     │               │
       │                │  • pricing JSON ×4 │        deep link + prefill
       │                │  • images          │               │
       │                └────────────────────┘               │
       │                                                     │
       │  pure function: estimate(input, rules) → breakdown  │
       └─────────────────────────────────────────────────────┘
                              │
                              ▼
                          ┌────────┐
                          │  GA4   │  (no PII)
                          └────────┘
```

**That is the whole system.**

| Component | Choice | Rationale |
|---|---|---|
| Framework | Astro or Next.js (static export) | SSG → CWV targets met by construction |
| Hosting | Vercel/Netlify free/hobby | ~Rp 0/yr at this traffic |
| Pricing rules | 4 JSON files in the repo | Versioned, reviewable, diffable, rollback = `git revert` |
| Rule editing | Google Sheet → CSV → validate → JSON → PR → deploy | 2 min. No admin UI needed. |
| Backend | **None** | |
| Database | **None** | |
| Auth | **None** | |
| Analytics | GA4, no PII | |

**Servers: zero. Monthly cost: ~zero. Attack surface: a static file.**
Compare to the brief's proposed stack. That comparison **is** the scope argument, and it
should go in the proposal verbatim.

---

## 6.3 Phase 1 — minimum viable addition (GATED)

```
┌──────────┐   ┌──────────┐   ┌─────────────────────────────┐   ┌──────────┐
│ Browser  │──►│   CDN    │──►│      App (monolith)         │──►│ Postgres │
└──────────┘   └──────────┘   │                             │   └──────────┘
                              │  modules:                   │
┌──────────┐                  │   • pricing  (SAME CODE     │   ┌──────────┐
│  Admin   │─────────────────►│      as Phase 0. shared     │──►│    S3    │
└──────────┘                  │      package. one impl.)    │   │ private  │
                              │   • quotes/bookings         │   └──────────┘
┌──────────┐  webhook         │   • invoices/payments       │
│   PSP    │─────────────────►│   • customers/consent       │   ┌──────────┐
└──────────┘                  │   • jobs (cron in-process)  │──►│ WA API   │
                              └─────────────────────────────┘   └──────────┘
```

| Component | Choice | Rationale |
|---|---|---|
| Runtime | Node + TypeScript | Same language as FE. **One team, one language, at this size.** |
| Framework | Fastify or NestJS | Either. Not Rust — hiring pool in Indonesia, and there is no perf problem to solve. |
| DB | Postgres 16, single managed instance | `07`. Exclusion constraints are the reason Postgres is non-negotiable. |
| Files | S3 (or IDN-region equivalent) | Two buckets: `docs` and `payment-proofs` (separate KMS keys — BR-026) |
| Jobs | In-process cron | 3 jobs. A broker would be more moving parts than work. |
| PSP | Midtrans or Xendit | **The PSP holds the licence, not Arasya** (`00` §0.5) |
| Deploy | One container, one host | |

**The single most important architectural rule in Phase 1:**

> **The pricing engine is ONE implementation, shared as a package between the public site
> and the backend.**
>
> Re-implementing it server-side "for security" produces two engines that drift, and the
> day they disagree, the customer sees one number on the site and a different one on the
> invoice — which destroys the trust the entire business is built on. A pure function with
> no I/O ports trivially. Share it.

### Data residency
`{{TOKEN}}` — confirm with counsel. UU PDP does not mandate onshore storage in general,
but it constrains cross-border transfer. If an IDN region is available at comparable cost,
take it and remove the question.

---

## 6.4 Phase 2 (GATED)
Add: dispatch module, fleet module, driver module, reporting (Metabase read-only replica —
**the first legitimate use for a replica in this system**, and only because analytics
queries should not touch the transactional DB).

Still one monolith. Still one Postgres.

---

## 6.5 Security architecture

| Layer | Control |
|---|---|
| Transport | TLS 1.3, HSTS |
| Rest | AES-256; separate KMS key for payment proofs |
| Auth (P1) | Session cookies, `HttpOnly` + `Secure` + `SameSite=Lax`, 2FA for admin |
| Authz | RBAC: `OWNER`/`ADMIN`/`FINANCE`/`DISPATCH`/`DRIVER`/`READONLY`; column-level on `drivers.base_salary_idr` |
| Files | Private buckets. Access via **short-lived signed URLs only** — never public, never unexpiring |
| Secrets | Managed secret store. CI secret scanning. |
| Input | Zod at every boundary |
| Audit | `audit_log`, append-only, partitioned |
| Deps | CI CVE gate |
| Rate limit | Estimator endpoint (P1) |

**Threat model — the ones that are actually real here:**

| Threat | Likelihood | Note |
|---|---|---|
| **Impersonation / fraud** (fake WA + fake BCA) | **High — happening now** | The live site already warns about it. Mitigated by the trust component, not by code. **This is the #1 real threat and it is a content problem.** |
| Admin account compromise | Medium | 2FA. One compromised admin = the whole customer database. |
| ID document leak | Medium | The **highest-impact** breach available. KTP images are identity-theft-grade. |
| Payment proof leak | Medium | Account numbers → specific personal data |
| Price tampering client-side | **Low impact** | An estimate is non-binding by design (`09` §9.9). The operator confirms. **This is why the Estimate/Quote split is a security control, not just UX.** |
| DDoS | Low | Static CDN absorbs it |
| SQL injection | Low | Parameterised queries, ORM |

> Note that the two highest-ranked threats are **not solved by architecture**. One is
> content, one is a process. Spending the security budget on a service mesh while KTP
> photos sit in an admin's Google Photos is misallocation.

---

## 6.6 Deployment & environments

| Env | Purpose | Data |
|---|---|---|
| `local` | Dev | Seed fixtures. **Never production data.** |
| `staging` | QA, calibration backtests | Anonymised |
| `production` | Live | Real |

**Pipeline:** PR → lint + typecheck + unit + pricing backtest + Lighthouse + CVE scan →
review → merge → auto-deploy staging → manual promote to production.

> **`pricing backtest` is a CI gate, not a nice-to-have.** A rule change that breaks the
> §9.7 backtest fails the build. This is the only automated defence against silently
> repricing the business with a one-line JSON edit.

**Backups (P1):** PITR, 35-day retention. That window is also the documented erasure SLA
(`07` §7.9). The two numbers are the same number, deliberately — one constraint, one
promise, no gap.

---

## 6.7 Observability

| Signal | Tool | Alert |
|---|---|---|
| Uptime | Uptime monitor | Public site down > 2 min |
| Errors | Sentry (**PII scrubbing on**) | New error type |
| Purge job | Job monitor | **Any failure — pages someone** |
| PSP reconciliation | Job monitor | Any unmatched payment |
| Pricing anomaly | Query on `quotes.margin_pct` | Any quote below `cost_floor` without `loss_leader` |
| Override rate | Weekly report | Corridor > 20% overridden → the rule is wrong |

> **Every alert names an owner and a first action, or it gets muted within a month and
> then it never existed.** An unowned alert is worse than no alert: it creates the belief
> that something is being watched.

---

## 6.8 Architecture decision records

| ID | Decision | Rationale | Revisit |
|---|---|---|---|
| ADR-001 | No backend in Phase 0 | Pure function + JSON is the whole engine | Gate 0→1 |
| ADR-002 | Modular monolith, not microservices | 2-person ops team; 34k rows | Fleet > 100 |
| ADR-003 | Postgres, not MySQL/Mongo | **Exclusion constraints** are the double-booking fix. Non-negotiable. | Never |
| ADR-004 | Money as `BIGINT` rupiah | Float in an invoice is a defect | Never |
| ADR-005 | Zone pricing, not distance | Deterministic, free, offline-testable | > 30 corridors |
| ADR-006 | **Pricing engine shared as one package** | Two impls drift; drift breaks trust | Never |
| ADR-007 | WhatsApp stays the conversion endpoint | It is the moat, not the problem (`01` §1.3) | Gate 0→1 |
| ADR-008 | Node/TS, not Rust | One language, one team, no perf problem | Never, realistically |
| ADR-009 | No Kubernetes | One container. See §6.1. | Fleet > 100 |
| ADR-010 | Estimate is non-binding by design | Makes client-side tampering a non-threat | Never |

---

*End 06.*
