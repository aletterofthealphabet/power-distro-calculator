// Client-side mirror of apps/api/src/services/plotLoader.ts (DESIGN.md
// §4.5): maps the same Plot shape the API returns into calc-engine's
// PlotInput so useLiveAnalysis can call analyzePlot() with zero network
// round trips while a plot is being edited. The API re-runs the same
// engine server-side as the source of truth on save/analyze.

import type { CableSpec, Circuit, DistroUnit, EquipmentInstance, EquipmentSpec, PhaseLeg } from '@power-distro/shared-types';
import type { CircuitInput, DistroInput, EquipmentLoadInput, PlotInput } from '@power-distro/calc-engine';

const DEFAULT_VOLTAGE_DROP_THRESHOLD_PCT = 3;

export function buildPlotInput(
  plot: { id: string; distroUnits: (DistroUnit & { circuits: Circuit[] })[]; instances: EquipmentInstance[] },
  specsById: Map<string, EquipmentSpec>,
  cableSpecsById: Map<string, CableSpec>,
): PlotInput {
  const distros: DistroInput[] = plot.distroUnits.map((distroUnit) => {
    const circuits: CircuitInput[] = distroUnit.circuits.map((circuit) => ({
      circuitId: circuit.id,
      breakerRatingAmps: circuit.breakerRatingAmps,
      voltage: circuit.voltage,
      phaseLeg: circuit.phaseLeg as PhaseLeg,
      connectorType: circuit.connectorType,
      connectorMaxAmps: circuit.breakerRatingAmps,
      isContinuousOverride: circuit.isContinuousOverride ?? undefined,
      cable: undefined,
    }));
    return {
      distroUnitId: distroUnit.id,
      maxAmps: distroUnit.maxAmps,
      phaseConfig: distroUnit.phaseConfig,
      circuits,
    };
  });

  // Attach cable info per circuit from whichever instance on it carries one.
  for (const instance of plot.instances) {
    if (!instance.circuitId || !instance.cableSpecId || instance.cableLengthFt == null) continue;
    const cableSpec = cableSpecsById.get(instance.cableSpecId);
    if (!cableSpec) continue;
    for (const distro of distros) {
      const circuit = distro.circuits.find((c) => c.circuitId === instance.circuitId);
      if (circuit) {
        circuit.cable = {
          ratedAmps: cableSpec.ratedAmps,
          resistanceOhmsPer1000ft: cableSpec.resistanceOhmsPer1000ft,
          lengthFt: instance.cableLengthFt,
        };
      }
    }
  }

  const equipment: EquipmentLoadInput[] = plot.instances.map((instance) => {
    const spec = specsById.get(instance.equipmentSpecId);
    return {
      instanceId: instance.id,
      quantity: instance.quantity,
      powerWatts: spec?.powerWatts ?? undefined,
      currentAmps: spec?.currentAmps ?? undefined,
      voltage: spec?.voltage ?? 0,
      isContinuousLoad: spec?.isContinuousLoad ?? true,
      circuitId: instance.circuitId,
      pinned: instance.pinned,
    };
  });

  return {
    plotId: plot.id,
    distros,
    equipment,
    voltageDropThresholdPct: DEFAULT_VOLTAGE_DROP_THRESHOLD_PCT,
  };
}
