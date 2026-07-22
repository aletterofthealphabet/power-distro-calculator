// Thin fetch wrapper (DESIGN.md §2 apps/web/src/lib/apiClient.ts). The
// frontend never queries Postgres directly (DESIGN.md §1.1) — every
// mutation and every "source of truth" read goes through here to
// apps/api. Vite's dev proxy rewrites /api/* to the Fastify server
// (apps/web/vite.config.ts).

import type {
  CableSpec,
  Circuit,
  DistroUnit,
  EquipmentInstance,
  EquipmentSpec,
  Plot,
} from '@power-distro/shared-types';
import type { AnalysisReport, BalanceProposal } from '@power-distro/calc-engine';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${res.status} ${body}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export const api = {
  equipmentSpecs: {
    list: () => request<EquipmentSpec[]>('/equipment-specs'),
    get: (id: string) => request<EquipmentSpec>(`/equipment-specs/${id}`),
    create: (body: Partial<EquipmentSpec>) =>
      request<EquipmentSpec>('/equipment-specs', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<EquipmentSpec>) =>
      request<EquipmentSpec>(`/equipment-specs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) => request<void>(`/equipment-specs/${id}`, { method: 'DELETE' }),
  },
  cableSpecs: {
    list: () => request<CableSpec[]>('/cable-specs'),
    create: (body: Partial<CableSpec>) =>
      request<CableSpec>('/cable-specs', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CableSpec>) =>
      request<CableSpec>(`/cable-specs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) => request<void>(`/cable-specs/${id}`, { method: 'DELETE' }),
  },
  plots: {
    list: () => request<Plot[]>('/plots'),
    get: (id: string) =>
      request<Plot & { distroUnits: (DistroUnit & { circuits: Circuit[] })[]; instances: EquipmentInstance[] }>(
        `/plots/${id}`,
      ),
    create: (body: Partial<Plot>) => request<Plot>('/plots', { method: 'POST', body: JSON.stringify(body) }),
    remove: (id: string) => request<void>(`/plots/${id}`, { method: 'DELETE' }),
  },
  distroUnits: {
    create: (plotId: string, body: Partial<DistroUnit>) =>
      request<DistroUnit>(`/plots/${plotId}/distro-units`, { method: 'POST', body: JSON.stringify(body) }),
    remove: (id: string) => request<void>(`/distro-units/${id}`, { method: 'DELETE' }),
  },
  circuits: {
    create: (distroUnitId: string, body: Partial<Circuit>) =>
      request<Circuit>(`/distro-units/${distroUnitId}/circuits`, { method: 'POST', body: JSON.stringify(body) }),
    remove: (id: string) => request<void>(`/circuits/${id}`, { method: 'DELETE' }),
  },
  equipmentInstances: {
    create: (plotId: string, body: Partial<EquipmentInstance>) =>
      request<EquipmentInstance>(`/plots/${plotId}/equipment-instances`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Partial<EquipmentInstance>) =>
      request<EquipmentInstance>(`/equipment-instances/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) => request<void>(`/equipment-instances/${id}`, { method: 'DELETE' }),
  },
  analysis: {
    analyze: (plotId: string) => request<AnalysisReport>(`/plots/${plotId}/analyze`, { method: 'POST' }),
    autoBalance: (plotId: string) => request<BalanceProposal>(`/plots/${plotId}/auto-balance`, { method: 'POST' }),
  },
};
