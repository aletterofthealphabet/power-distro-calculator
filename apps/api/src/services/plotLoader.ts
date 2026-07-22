import type { PrismaClient } from '@prisma/client';
import type {
  CircuitInput,
  DistroInput,
  EquipmentLoadInput,
  PhaseLeg,
  PlotInput,
} from '@power-distro/calc-engine';
import { resolveConnectorMaxAmps } from './connectorTable.js';

const DEFAULT_VOLTAGE_DROP_THRESHOLD_PCT = 3;

/**
 * Fetches Plot + nested distroUnits/circuits/equipmentInstances via
 * Prisma and maps DB rows into calc-engine's plain PlotInput DTOs
 * (DESIGN.md §3.2, §4.5). This is the ONLY place Prisma models are
 * translated into engine input — analysisService and every route call
 * through here rather than touching Prisma rows directly.
 */
export async function loadPlotInput(prisma: PrismaClient, plotId: string): Promise<PlotInput> {
  const plot = await prisma.plot.findUniqueOrThrow({
    where: { id: plotId },
    include: {
      instances: { include: { equipmentSpec: true, cableSpec: true } },
      distroUnits: { include: { circuits: true } },
    },
  });

  const cableByCircuitId = new Map(
    plot.instances
      .filter((instance) => instance.cableSpec !== null && instance.cableLengthFt !== null)
      .map((instance) => [
        instance.circuitId,
        {
          ratedAmps: Number(instance.cableSpec!.ratedAmps),
          resistanceOhmsPer1000ft: Number(instance.cableSpec!.resistanceOhmsPer1000ft),
          lengthFt: Number(instance.cableLengthFt),
          connectorType: instance.cableSpec!.connectorType,
        },
      ]),
  );

  const distros: DistroInput[] = plot.distroUnits.map((distroUnit) => {
    const circuits: CircuitInput[] = distroUnit.circuits.map((circuit) => {
      const breakerRatingAmps = Number(circuit.breakerRatingAmps);

      return {
        circuitId: circuit.id,
        breakerRatingAmps,
        voltage: Number(circuit.voltage),
        phaseLeg: circuit.phaseLeg as PhaseLeg,
        connectorType: circuit.connectorType,
        connectorMaxAmps: resolveConnectorMaxAmps(circuit.connectorType, breakerRatingAmps),
        isContinuousOverride: circuit.isContinuousOverride ?? undefined,
        cable: cableByCircuitId.get(circuit.id),
      };
    });

    return {
      distroUnitId: distroUnit.id,
      maxAmps: Number(distroUnit.maxAmps),
      phaseConfig: distroUnit.phaseConfig as 1 | 3,
      circuits,
    };
  });

  const equipment: EquipmentLoadInput[] = plot.instances.map((instance) => ({
    instanceId: instance.id,
    quantity: instance.quantity,
    powerWatts: instance.equipmentSpec.powerWatts !== null
      ? Number(instance.equipmentSpec.powerWatts)
      : undefined,
    currentAmps: instance.equipmentSpec.currentAmps !== null
      ? Number(instance.equipmentSpec.currentAmps)
      : undefined,
    voltage: Number(instance.equipmentSpec.voltage),
    isContinuousLoad: instance.equipmentSpec.isContinuousLoad,
    circuitId: instance.circuitId,
    pinned: instance.pinned,
    connectorType: instance.equipmentSpec.connectorType,
  }));

  return {
    plotId: plot.id,
    distros,
    equipment,
    voltageDropThresholdPct: DEFAULT_VOLTAGE_DROP_THRESHOLD_PCT,
  };
}
