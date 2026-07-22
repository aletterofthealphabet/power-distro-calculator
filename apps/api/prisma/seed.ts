// Starter equipment/cable catalog (plan Phase 2, DESIGN.md §5) so the
// app isn't empty on first run. Cable ampacity/resistance figures are
// pulled from packages/calc-engine's NEC-310.16-derived tables (single
// source of truth) rather than re-entered here; equipment wattages are
// commonly published nominal figures for well-known entertainment gear,
// flagged `unverified: true` per plan §7a.4 until cross-checked against
// current manufacturer datasheets.

import { PrismaClient } from '@prisma/client';
import { lookupAmpacity, lookupResistance } from '@power-distro/calc-engine';

const prisma = new PrismaClient();

function cableFromGauge(gaugeAwg: string) {
  const ampacity = lookupAmpacity(gaugeAwg);
  const resistance = lookupResistance(gaugeAwg);
  if (!ampacity || !resistance) {
    throw new Error(`No table entry for gauge ${gaugeAwg}`);
  }
  return {
    ratedAmps: ampacity.ampacity75C,
    resistanceOhmsPer1000ft: resistance.resistanceOhmsPer1000ft,
    source: ampacity.source,
    unverified: ampacity.unverified || resistance.unverified,
  };
}

async function main() {
  await prisma.cableSpec.createMany({
    data: [
      {
        gaugeAwg: '12',
        conductorCount: 2,
        connectorType: 'stage pin',
        ...cableFromGauge('12'),
      },
      {
        gaugeAwg: '12',
        conductorCount: 2,
        connectorType: 'Edison',
        ...cableFromGauge('12'),
      },
      {
        gaugeAwg: '10',
        conductorCount: 4,
        connectorType: 'Socapex 19-pin',
        ...cableFromGauge('10'),
      },
      {
        gaugeAwg: '1/0',
        conductorCount: 1,
        connectorType: 'camlock',
        ...cableFromGauge('1/0'),
      },
      {
        gaugeAwg: '4/0',
        conductorCount: 1,
        connectorType: 'camlock',
        ...cableFromGauge('4/0'),
      },
    ],
  });

  await prisma.equipmentSpec.createMany({
    data: [
      {
        name: 'ETC Source Four 750W Ellipsoidal',
        category: 'lighting fixture',
        powerWatts: 750,
        voltage: 120,
        phase: 1,
        connectorType: 'stage pin',
        isContinuousLoad: true,
        source: 'ETC published datasheet (nominal lamp wattage)',
        unverified: true,
      },
      {
        name: 'ETC ColorSource PAR',
        category: 'LED fixture',
        powerWatts: 90,
        voltage: 120,
        phase: 1,
        connectorType: 'stage pin',
        isContinuousLoad: true,
        source: 'ETC published datasheet',
        unverified: true,
      },
      {
        name: 'Chauvet Rogue R2 Spot',
        category: 'moving light',
        powerWatts: 450,
        voltage: 120,
        phase: 1,
        connectorType: 'PowerCON TRUE1',
        isContinuousLoad: true,
        source: 'Chauvet published datasheet',
        unverified: true,
      },
      {
        name: 'Martin MAC Aura XB',
        category: 'moving light',
        powerWatts: 350,
        voltage: 120,
        phase: 1,
        connectorType: 'PowerCON TRUE1',
        isContinuousLoad: true,
        source: 'Martin published datasheet',
        unverified: true,
      },
      {
        name: 'Look Solutions Unique 2.1 Hazer',
        category: 'hazer',
        powerWatts: 1500,
        voltage: 120,
        phase: 1,
        connectorType: 'Edison',
        isContinuousLoad: false,
        notes: 'Cycles on demand — not a continuous 3hr+ load in typical use.',
        source: 'Look Solutions published datasheet',
        unverified: true,
      },
      {
        name: 'QSC CX Series Power Amp',
        category: 'audio amp',
        currentAmps: 12,
        voltage: 120,
        powerFactor: 0.95,
        phase: 1,
        connectorType: 'Edison',
        isContinuousLoad: true,
        notes: 'Amps-based spec — switch-mode PSU load, better characterized by current draw than nameplate watts.',
        source: 'QSC published datasheet',
        unverified: true,
      },
      {
        name: 'Chain Hoist Motor (0.5 ton)',
        category: 'motor',
        currentAmps: 12,
        voltage: 208,
        phase: 3,
        connectorType: 'camlock',
        isContinuousLoad: false,
        notes: 'Inductive motor load specified by amps; non-continuous (load-in/out duty cycle).',
        source: 'Generic manufacturer datasheet (motor nameplate FLA)',
        unverified: true,
      },
      {
        name: 'LED Video Wall Panel (500x500mm)',
        category: 'video wall',
        powerWatts: 300,
        voltage: 120,
        phase: 1,
        connectorType: 'PowerCON TRUE1',
        isContinuousLoad: true,
        source: 'Common panel spec (avg power, not max/peak)',
        unverified: true,
      },
    ],
  });

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
