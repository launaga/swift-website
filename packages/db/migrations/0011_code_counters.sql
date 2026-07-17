-- ARSO schema — 0011 gapless human-readable code counters.
-- 07 §7.1/§7.7 require gapless sequential codes (QT-2026-00187, INV-2026-00318).
-- A Postgres SEQUENCE is NOT gapless (a rolled-back txn burns a value); a counter
-- row bumped inside the same transaction as the insert is. Low volume (§7.10),
-- so the per-(prefix,year) row lock is a non-issue.
CREATE TABLE code_counters (
  prefix TEXT NOT NULL,
  year   INTEGER NOT NULL,
  n      BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (prefix, year)
);
