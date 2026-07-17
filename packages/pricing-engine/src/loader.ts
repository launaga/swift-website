// Load + shape the 4 JSON rule files into a RuleSet.
// Kept separate from the engine so the engine stays pure/I-O-free: callers load
// the RuleSet (however they want — fs, fetch, import) and inject it.

import type { Corridor, RuleSet, Rules, VehicleClass, Zone } from "./types.ts";

export function buildRuleSet(
  vehicleClasses: VehicleClass[],
  zones: Zone[],
  corridors: Corridor[],
  rules: Rules,
): RuleSet {
  return {
    vehicle_classes: vehicleClasses,
    zones,
    corridors,
    rules,
  };
}
