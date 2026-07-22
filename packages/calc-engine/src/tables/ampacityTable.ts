// NEC Table 310.16-derived copper conductor ampacity, 75°C column (the
// typical column for equipment terminations rated 75°C, the common case
// for breakers/connectors in entertainment power distro). Source is
// noted per row per DESIGN.md §5 / plan §7a.4; `unverified: true` rows
// have not been cross-checked against the current NEC edition and must
// not be treated as authoritative without independent verification.

export interface AmpacityTableRow {
  gaugeAwg: string;
  ampacity75C: number;
  source: string;
  unverified: boolean;
}

export const AMPACITY_TABLE_75C: AmpacityTableRow[] = [
  { gaugeAwg: '14', ampacity75C: 20, source: 'NEC Table 310.16 (75°C Cu)', unverified: true },
  { gaugeAwg: '12', ampacity75C: 25, source: 'NEC Table 310.16 (75°C Cu)', unverified: true },
  { gaugeAwg: '10', ampacity75C: 35, source: 'NEC Table 310.16 (75°C Cu)', unverified: true },
  { gaugeAwg: '8', ampacity75C: 50, source: 'NEC Table 310.16 (75°C Cu)', unverified: true },
  { gaugeAwg: '6', ampacity75C: 65, source: 'NEC Table 310.16 (75°C Cu)', unverified: true },
  { gaugeAwg: '4', ampacity75C: 85, source: 'NEC Table 310.16 (75°C Cu)', unverified: true },
  { gaugeAwg: '3', ampacity75C: 100, source: 'NEC Table 310.16 (75°C Cu)', unverified: true },
  { gaugeAwg: '2', ampacity75C: 115, source: 'NEC Table 310.16 (75°C Cu)', unverified: true },
  { gaugeAwg: '1', ampacity75C: 130, source: 'NEC Table 310.16 (75°C Cu)', unverified: true },
  { gaugeAwg: '1/0', ampacity75C: 150, source: 'NEC Table 310.16 (75°C Cu)', unverified: true },
  { gaugeAwg: '2/0', ampacity75C: 175, source: 'NEC Table 310.16 (75°C Cu)', unverified: true },
  { gaugeAwg: '3/0', ampacity75C: 200, source: 'NEC Table 310.16 (75°C Cu)', unverified: true },
  { gaugeAwg: '4/0', ampacity75C: 230, source: 'NEC Table 310.16 (75°C Cu)', unverified: true },
];

export function lookupAmpacity(gaugeAwg: string): AmpacityTableRow | undefined {
  return AMPACITY_TABLE_75C.find((row) => row.gaugeAwg === gaugeAwg);
}
