// Mirrors apps/api/prisma/schema.prisma models (DESIGN.md §3.1) as plain
// TS types for use in apps/web and apps/api outside of Prisma's generated
// client (e.g. API response shapes). Not imported by packages/calc-engine,
// which takes plain DTOs from analysis.ts instead (DESIGN.md §1.2).

export type PhaseLeg = 'L1' | 'L2' | 'L3' | 'hot' | 'neutral';

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface EquipmentSpec {
  id: string;
  name: string;
  category: string;
  powerWatts: number | null;
  currentAmps: number | null;
  voltage: number;
  powerFactor: number | null;
  phase: 1 | 3;
  connectorType: string;
  isContinuousLoad: boolean;
  notes: string | null;
  source: string | null;
  unverified: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CableSpec {
  id: string;
  gaugeAwg: string;
  conductorCount: number;
  connectorType: string;
  ratedAmps: number;
  resistanceOhmsPer1000ft: number;
  source: string | null;
  unverified: boolean;
}

export interface Plot {
  id: string;
  name: string;
  venue: string | null;
  eventDate: string | null;
  ownerId: string | null;
  createdAt: string;
}

export interface DistroUnit {
  id: string;
  plotId: string;
  name: string;
  inputConnector: string;
  maxAmps: number;
  phaseConfig: 1 | 3;
  voltage: number;
}

export interface Circuit {
  id: string;
  distroUnitId: string;
  breakerRatingAmps: number;
  voltage: number;
  phaseLeg: PhaseLeg;
  connectorType: string;
  isContinuousOverride: boolean | null;
}

export interface EquipmentInstance {
  id: string;
  plotId: string;
  equipmentSpecId: string;
  circuitId: string | null;
  cableSpecId: string | null;
  cableLengthFt: number | null;
  quantity: number;
  pinned: boolean;
}
