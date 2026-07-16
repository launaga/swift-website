// Test/CLI helper: read the 4 JSON rule files from disk and build a RuleSet.
// Only test/script code touches the filesystem — the engine itself stays pure.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildRuleSet } from "../src/loader.ts";
import type { Corridor, RuleSet, Rules, VehicleClass, Zone } from "../src/types.ts";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(dataDir, name), "utf8")) as T;
}

export function loadRuleSet(): RuleSet {
  return buildRuleSet(
    readJson<VehicleClass[]>("vehicle_classes.json"),
    readJson<Zone[]>("zones.json"),
    readJson<Corridor[]>("corridors.json"),
    readJson<Rules>("rules.json"),
  );
}
