# DB schema findings

Spec discrepancies fixed while implementing `docs/ARSO/07_Database_Spec.md` to a schema
that actually applies on Postgres 16. All are small; each is marked with a `NOTE
(correction vs doc)` comment at the site in the migrations.

## D-1 — Partitioned tables need the partition key in the PK (§7.8)

The doc writes `id BIGSERIAL PRIMARY KEY … PARTITION BY RANGE (at)` for `audit_log` and
`analytics_events`. Postgres rejects this: a partitioned table's PK must include the
partition key. Fixed to `PRIMARY KEY (id, at)` (identity column + range key). Same
semantics. Also added concrete partitions (`_2026` + a `DEFAULT`) so the tables accept
inserts.

## D-2 — `WHERE expires_at > CURRENT_DATE` is not a valid index predicate (§7.3)

`idx_vehicle_docs_expiry` used `CURRENT_DATE`, which is `STABLE`, not `IMMUTABLE` — a
partial-index predicate must be `IMMUTABLE`. Replaced with a plain b-tree on `expires_at`;
the reminder job (`WHERE expires_at < now() + interval '…'`) uses it just as cheaply.

## D-3 — Partial UNIQUE can't be inline (§7.7)

`customers … UNIQUE (phone_e164) WHERE deleted_at IS NULL` is not valid inline table syntax.
Implemented as a `CREATE UNIQUE INDEX … WHERE deleted_at IS NULL AND anonymised_at IS NULL`
— which also keeps the index valid after PDP erasure rewrites the phone (§7.9).

## D-4 — Glue tables the doc references but never defines

`users`, `partners`, `maintenance`, and `booking_addons` are referenced by FKs / the ERD
but have no DDL in the doc. Added minimal faithful definitions: `users` carries the RBAC
`user_role` enum from 06 §6.5; `partners` carries `revenue_share_pct` for the Q2
partner-ownership case; `bookings` gained a `deleted_at` (the §7.10 index assumes it).

## D-5 — UUID v7 generator (§7.1)

Postgres 16 has no native `uuidv7()` (lands in 18). Implemented `uuid_generate_v7()`
explicitly (48-bit ms timestamp + random, version/variant bits set per RFC 9562) and
proved the version nibble in the acceptance suite (T1).
