// Plain input/output DTOs for the engine (DESIGN.md §3.2). Deliberately
// redeclared here rather than imported from @power-distro/shared-types —
// calc-engine has zero dependencies (DESIGN.md §1.2), including on that
// package, so it can be fuzz-/property-tested standalone. apps/api and
// apps/web map their own (structurally identical) shared-types DTOs to
// these at the boundary.

export type PhaseLeg = 'L1' | 'L2' | 'L3' | 'hot' | 'neutral';

export interface EquipmentLoadInput {
  instanceId: string;
  quantity: number;
  powerWatts?: number;
  currentAmps?: number;
  voltage: number;
  isContinuousLoad: boolean;
  circuitId: string | null;
  pinned: boolean;
  connectorType: string;
}

export interface CircuitInput {
  circuitId: string;
  breakerRatingAmps: number;
  voltage: number;
  phaseLeg: PhaseLeg;
  connectorType: string;
  connectorMaxAmps: number;
  isContinuousOverride?: boolean;
  cable?: {
    ratedAmps: number;
    resistanceOhmsPer1000ft: number;
    lengthFt: number;
    connectorType?: string;
  };
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
  | 'connector_compatibility'
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
