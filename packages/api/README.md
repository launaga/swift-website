# @swift-rental/api

The ARSO API service layer (`docs/ARSO/08_API_Spec.yaml`). **Phase 1 — gated.** The thin
seam that composes the two tested layers into the booking vertical:

```
pricing-engine (ADR-006)  ──►  services.ts  ──►  Postgres schema (packages/db)
```

`services.ts` reuses the **exact** engine the site and admin use (no re-implementation), and
enforces the business rules the database can't express on its own — DP = 20%, a quote freezes
the `rule_version` that produced it, codes are gapless. The database enforces what *it* is
best at: quote immutability (rewrite RULE) and double-booking rejection (exclusion
constraint). Each layer does the job it's strongest at.

`http.ts` is a framework-free transport shell mapping the OpenAPI operations to the service
functions — at 280 bookings/month a router is all that's warranted (06 §6.1).

## Test

```bash
packages/api/test/run.sh
```

Boots a throwaway Postgres, applies the schema, and drives the whole vertical end-to-end:

- estimate reuses the engine → the worked example prices to Rp 850.000
- **quote → booking → invoice (20% DP = 170.000) → assignment** all succeed
- the issued quote is **immutable** (a direct `UPDATE` is a no-op)
- a second **overlapping assignment is rejected with a 409** `DOUBLE_BOOKING`

3 tests, all green. Needs `pg` (installed by the harness on first run).
