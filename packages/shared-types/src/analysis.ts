// calc-engine input/output DTOs (DESIGN.md §3.2). packages/calc-engine
// depends on nothing, including this package — it redeclares the same
// shapes as plain in-file interfaces. This copy is what apps/web and
// apps/api import so both sides of the HTTP boundary and the direct
// import boundary agree on shape without either depending on the other's
// app code.

import type { PhaseLeg } from './entities.js';

export interface EquipmentLoadInput {
  instanceId: string;
  quantity: number;
  powerWatts?: number;
  currentAmps?: number;
  voltage: number;
  isContinuousLoad: boolean;
  circuitId: string | null;
  pinned: boolean;
}

export interface CircuitInput {
  circuitId: string;
  breakerRatingAmps: number;
  voltage: number;
  phaseLeg: PhaseLeg;
  connectorType: string;
  connectorMaxAmps: number;
  isContinuousOverride?: boolean;
  cable?: { ratedAmps: number; resistanceOhmsPer1000ft: number; lengthFt: number };
}

export interface DistroInput {
  distroUnitId: string;
  maxAmps: number;
  phaseConfig: 1 | 3;
  circuits: CircuitInput[];
}

export interface PlotInput {
  plotId: string;
  distros: DistroInput[];
  equipment: EquipmentLoadInput[];
  voltageDropThresholdPct: number;
}

export type Severity = 'ok' | 'warning' | 'violation';

export type CheckId =
  | 'continuous_derating'
  | 'cable_ampacity'
  | 'connector_rating'
  | 'distro_capacity'
  | 'voltage_drop'
  | 'phase_leg_overcurrent';

export interface Violation {
  severity: Severity;
  checkId: CheckId;
  circuitId?: string;
  distroUnitId?: string;
  message: string;
  necReference?: string;
}

export interface CircuitResult {
  circuitId: string;
  loadAmps: number;
  loadPct: number;
}

export interface PhaseLegResult {
  distroUnitId: string;
  leg: string;
  totalAmps: number;
}

export interface BalanceResult {
  legs: PhaseLegResult[];
  deviationPct: number;
}

export interface AnalysisReport {
  circuits: CircuitResult[];
  balance: BalanceResult;
  violations: Violation[];
  totalDrawAmps: number;
}

export interface ReassignmentProposal {
  instanceId: string;
  fromCircuitId: string | null;
  toCircuitId: string;
}

export interface BalanceProposal {
  proposed: ReassignmentProposal[];
  projectedBalance: BalanceResult;
}
