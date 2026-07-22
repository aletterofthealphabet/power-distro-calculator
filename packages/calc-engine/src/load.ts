import type { CircuitInput, EquipmentLoadInput } from './types.js';
import { asAmps, type Amps } from './units.js';

/** amps = currentAmps if given directly, else powerWatts / voltage (plan §4.1). */
export function computeItemAmps(item: EquipmentLoadInput): Amps {
  if (item.currentAmps !== undefined) {
    return asAmps(item.currentAmps);
  }
  if (item.powerWatts !== undefined) {
    return asAmps(item.powerWatts / item.voltage);
  }
  throw new Error(
    `EquipmentLoadInput ${item.instanceId} has neither currentAmps nor powerWatts`,
  );
}

/** Σ computeItemAmps(item) * item.quantity for items assigned to this circuit. */
export function aggregateCircuitLoad(
  circuit: CircuitInput,
  equipment: EquipmentLoadInput[],
): Amps {
  const total = equipment
    .filter((item) => item.circuitId === circuit.circuitId)
    .reduce((sum, item) => sum + computeItemAmps(item) * item.quantity, 0);
  return asAmps(total);
}
