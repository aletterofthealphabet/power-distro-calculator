import { describe, expect, it } from 'vitest';
import { analyzePlot } from '../src/analyze.js';
import type { PlotInput } from '../src/types.js';

describe('analyzePlot (e2e)', () => {
  it('reports a clean plot with no violations', () => {
    const input: PlotInput = {
      plotId: 'p1',
      voltageDropThresholdPct: 3,
      distros: [
        {
          distroUnitId: 'd1',
          maxAmps: 100,
          phaseConfig: 1,
          circuits: [
            {
              circuitId: 'c1',
              breakerRatingAmps: 20,
              voltage: 120,
              phaseLeg: 'hot',
              connectorType: 'Edison',
              connectorMaxAmps: 20,
              cable: { ratedAmps: 25, resistanceOhmsPer1000ft: 1.93, lengthFt: 20 },
            },
          ],
        },
      ],
      equipment: [
        {
          instanceId: 'e1',
          quantity: 1,
          currentAmps: 10,
          voltage: 120,
          isContinuousLoad: true,
          circuitId: 'c1',
          pinned: false,
          connectorType: 'Edison',
        },
      ],
    };

    const report = analyzePlot(input);

    expect(report.violations).toEqual([]);
    expect(report.totalDrawAmps).toBe(10);
    expect(report.circuits).toEqual([{ circuitId: 'c1', loadAmps: 10, loadPct: 62.5 }]);
  });

  it('surfaces multiple violation types for an overloaded, imbalanced plot', () => {
    const input: PlotInput = {
      plotId: 'p2',
      voltageDropThresholdPct: 3,
      distros: [
        {
          distroUnitId: 'd1',
          maxAmps: 30,
          phaseConfig: 3,
          circuits: [
            {
              circuitId: 'c-L1',
              breakerRatingAmps: 20,
              voltage: 208,
              phaseLeg: 'L1',
              connectorType: 'stage pin',
              connectorMaxAmps: 20,
              cable: { ratedAmps: 20, resistanceOhmsPer1000ft: 1.93, lengthFt: 200 },
            },
            {
              circuitId: 'c-L2',
              breakerRatingAmps: 20,
              voltage: 208,
              phaseLeg: 'L2',
              connectorType: 'stage pin',
              connectorMaxAmps: 20,
              isContinuousOverride: false,
            },
          ],
        },
      ],
      equipment: [
        {
          instanceId: 'e1',
          quantity: 1,
          currentAmps: 25, // overloads breaker, connector, cable, and (with c-L2) the distro
          voltage: 208,
          isContinuousLoad: true,
          circuitId: 'c-L1',
          pinned: false,
          connectorType: 'stage pin',
        },
        {
          instanceId: 'e2',
          quantity: 1,
          currentAmps: 15,
          voltage: 208,
          isContinuousLoad: false,
          circuitId: 'c-L2',
          pinned: false,
          connectorType: 'stage pin',
        },
      ],
    };

    const report = analyzePlot(input);
    const checkIds = report.violations.map((v) => v.checkId);

    expect(checkIds).toContain('continuous_derating');
    expect(checkIds).toContain('cable_ampacity');
    expect(checkIds).toContain('connector_rating');
    expect(checkIds).toContain('voltage_drop');
    expect(checkIds).toContain('distro_capacity');

    expect(report.totalDrawAmps).toBe(40);
    expect(report.balance.legs).toHaveLength(2);
    expect(report.balance.deviationPct).toBeGreaterThan(0);
  });

  it('handles a plot with no distros or equipment', () => {
    const input: PlotInput = { plotId: 'empty', voltageDropThresholdPct: 3, distros: [], equipment: [] };
    const report = analyzePlot(input);
    expect(report).toEqual({
      circuits: [],
      balance: { legs: [], deviationPct: 0 },
      violations: [],
      totalDrawAmps: 0,
    });
  });
});
