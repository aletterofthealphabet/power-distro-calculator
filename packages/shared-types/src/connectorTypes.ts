// Canonical connector-type vocabulary shared between apps/web (dropdowns)
// and apps/api (connectorTable.ts's amp lookup) — the single source of
// truth both sides import across the packages/* boundary (DESIGN.md §1.1).

export interface ConnectorTypeOption {
  value: string;
  label: string;
  maxAmps: number;
}

export const CONNECTOR_TYPES: ConnectorTypeOption[] = [
  { value: 'edison', label: 'Edison (NEMA 5-15)', maxAmps: 15 },
  { value: 'nema 5-20', label: 'NEMA 5-20', maxAmps: 20 },
  { value: 'stage pin', label: 'Stage Pin', maxAmps: 20 },
  { value: 'l5-20', label: 'Twist-Lock L5-20', maxAmps: 20 },
  { value: 'l6-30', label: 'Twist-Lock L6-30', maxAmps: 30 },
  { value: 'powercon', label: 'PowerCON TRUE1', maxAmps: 20 },
  { value: 'iec c13', label: 'IEC C13', maxAmps: 10 },
  { value: 'iec c19', label: 'IEC C19', maxAmps: 16 },
  { value: 'socapex', label: 'Socapex 19-pin', maxAmps: 20 },
  { value: 'camlock', label: 'Camlock 400A', maxAmps: 400 },
];

export const OTHER_CONNECTOR_VALUE = 'other';
