// Standard copper conductor DC resistance per 1000ft, used as a fallback
// when a CableSpec row doesn't carry its own measured
// resistanceOhmsPer1000ft. Source per plan §7a.4 — unverified until
// cross-checked against a current reference.

export interface ResistanceTableRow {
  gaugeAwg: string;
  resistanceOhmsPer1000ft: number;
  source: string;
  unverified: boolean;
}

export const CONDUCTOR_RESISTANCE_TABLE: ResistanceTableRow[] = [
  { gaugeAwg: '14', resistanceOhmsPer1000ft: 3.07, source: 'NEC Chapter 9 Table 8 (Cu, uncoated)', unverified: true },
  { gaugeAwg: '12', resistanceOhmsPer1000ft: 1.93, source: 'NEC Chapter 9 Table 8 (Cu, uncoated)', unverified: true },
  { gaugeAwg: '10', resistanceOhmsPer1000ft: 1.21, source: 'NEC Chapter 9 Table 8 (Cu, uncoated)', unverified: true },
  { gaugeAwg: '8', resistanceOhmsPer1000ft: 0.764, source: 'NEC Chapter 9 Table 8 (Cu, uncoated)', unverified: true },
  { gaugeAwg: '6', resistanceOhmsPer1000ft: 0.491, source: 'NEC Chapter 9 Table 8 (Cu, uncoated)', unverified: true },
  { gaugeAwg: '4', resistanceOhmsPer1000ft: 0.308, source: 'NEC Chapter 9 Table 8 (Cu, uncoated)', unverified: true },
  { gaugeAwg: '3', resistanceOhmsPer1000ft: 0.245, source: 'NEC Chapter 9 Table 8 (Cu, uncoated)', unverified: true },
  { gaugeAwg: '2', resistanceOhmsPer1000ft: 0.194, source: 'NEC Chapter 9 Table 8 (Cu, uncoated)', unverified: true },
  { gaugeAwg: '1', resistanceOhmsPer1000ft: 0.154, source: 'NEC Chapter 9 Table 8 (Cu, uncoated)', unverified: true },
  { gaugeAwg: '1/0', resistanceOhmsPer1000ft: 0.122, source: 'NEC Chapter 9 Table 8 (Cu, uncoated)', unverified: true },
  { gaugeAwg: '2/0', resistanceOhmsPer1000ft: 0.0967, source: 'NEC Chapter 9 Table 8 (Cu, uncoated)', unverified: true },
  { gaugeAwg: '3/0', resistanceOhmsPer1000ft: 0.0766, source: 'NEC Chapter 9 Table 8 (Cu, uncoated)', unverified: true },
  { gaugeAwg: '4/0', resistanceOhmsPer1000ft: 0.0608, source: 'NEC Chapter 9 Table 8 (Cu, uncoated)', unverified: true },
];

export function lookupResistance(gaugeAwg: string): ResistanceTableRow | undefined {
  return CONDUCTOR_RESISTANCE_TABLE.find((row) => row.gaugeAwg === gaugeAwg);
}
