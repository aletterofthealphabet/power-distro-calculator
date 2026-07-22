// Branded primitives (DESIGN.md §3.2) so a raw `number` can't be passed
// where a specific unit is expected without an explicit cast at the
// boundary — catches amps/volts/watts mixups at compile time.

export type Amps = number & { readonly __unit: 'A' };
export type Volts = number & { readonly __unit: 'V' };
export type Watts = number & { readonly __unit: 'W' };
export type Ohms = number & { readonly __unit: 'ohm' };

export function asAmps(n: number): Amps {
  return n as Amps;
}

export function asVolts(n: number): Volts {
  return n as Volts;
}

export function asWatts(n: number): Watts {
  return n as Watts;
}

export function asOhms(n: number): Ohms {
  return n as Ohms;
}
