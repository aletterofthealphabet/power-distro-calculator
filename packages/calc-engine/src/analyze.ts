import type {
  AnalysisReport,
  BalanceResult,
  CircuitResult,
  PhaseLegResult,
  PlotInput,
  Violation,
} from './types.js';
import { aggregateCircuitLoad } from './load.js';
import { checkContinuousDerating } from './checks/continuousDerating.js';
import { checkCableAmpacity } from './checks/cableAmpacity.js';
import { checkConnectorRating } from './checks/connectorRating.js';
import { checkConnectorCompatibility } from './checks/connectorCompatibility.js';
import { checkDistroCapacity } from './checks/distroCapacity.js';
import { checkVoltageDrop } from './checks/voltageDrop.js';
import { checkPhaseLegOvercurrent } from './checks/phaseLegOvercurrent.js';
import { computeDeviationPct } from './balance/deviation.js';

/**
 * Orchestrates §4 of the plan: for each distro, for each circuit,
 * aggregate load and run every check in ./checks, collect violations,
 * roll up per-leg totals and a balance deviation score, and sum total
 * plot draw. Deterministic and side-effect free — safe to call on
 * every keystroke client-side (DESIGN.md §4.7) and again server-side
 * as the source of truth on save (DESIGN.md §4.6).
 */
export function analyzePlot(input: PlotInput): AnalysisReport {
  const circuits: CircuitResult[] = [];
  const violations: Violation[] = [];
  const allLegs: PhaseLegResult[] = [];
  let totalDrawAmps = 0;
  let maxDeviationPct = 0;

  for (const distro of input.distros) {
    const legTotals = new Map<string, number>();
    for (const circuit of distro.circuits) {
      if (!legTotals.has(circuit.phaseLeg)) {
        legTotals.set(circuit.phaseLeg, 0);
      }
    }

    const distroCircuitResults: CircuitResult[] = [];

    for (const circuit of distro.circuits) {
      const loadAmps = aggregateCircuitLoad(circuit, input.equipment);
      totalDrawAmps += loadAmps;

      const isContinuous = circuit.isContinuousOverride ?? true;
      const effectiveCapacity = isContinuous
        ? circuit.breakerRatingAmps * 0.8
        : circuit.breakerRatingAmps;
      const loadPct = effectiveCapacity > 0 ? (loadAmps / effectiveCapacity) * 100 : 0;

      const circuitResult: CircuitResult = { circuitId: circuit.circuitId, loadAmps, loadPct };
      circuits.push(circuitResult);
      distroCircuitResults.push(circuitResult);

      const equipmentOnCircuit = input.equipment.filter((item) => item.circuitId === circuit.circuitId);

      violations.push(...checkContinuousDerating(circuit, loadAmps));
      violations.push(...checkCableAmpacity(circuit, loadAmps));
      violations.push(...checkConnectorRating(circuit, loadAmps));
      violations.push(...checkConnectorCompatibility(circuit, equipmentOnCircuit));
      violations.push(...checkVoltageDrop(circuit, loadAmps, input.voltageDropThresholdPct));

      legTotals.set(circuit.phaseLeg, (legTotals.get(circuit.phaseLeg) ?? 0) + loadAmps);
    }

    violations.push(...checkDistroCapacity(distro, distroCircuitResults));

    const distroLegs: PhaseLegResult[] = [...legTotals].map(([leg, totalAmps]) => ({
      distroUnitId: distro.distroUnitId,
      leg,
      totalAmps,
    }));
    allLegs.push(...distroLegs);

    violations.push(...checkPhaseLegOvercurrent(distroLegs, distro));

    const deviation = computeDeviationPct(distroLegs);
    if (deviation > maxDeviationPct) {
      maxDeviationPct = deviation;
    }
  }

  const balance: BalanceResult = { legs: allLegs, deviationPct: maxDeviationPct };

  return { circuits, balance, violations, totalDrawAmps };
}
