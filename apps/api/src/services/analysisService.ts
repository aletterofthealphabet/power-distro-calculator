import type { PrismaClient } from '@prisma/client';
import type { AnalysisReport, BalanceProposal } from '@power-distro/calc-engine';
import { analyzePlot, balanceGreedyLpt } from '@power-distro/calc-engine';
import { loadPlotInput } from './plotLoader.js';

/** loadPlotInput -> analyzePlot. Backs POST /plots/:id/analyze (DESIGN.md §4.6). */
export async function analyze(prisma: PrismaClient, plotId: string): Promise<AnalysisReport> {
  const plotInput = await loadPlotInput(prisma, plotId);
  return analyzePlot(plotInput);
}

/**
 * loadPlotInput -> balanceGreedyLpt per distro, merged. Backs
 * POST /plots/:id/auto-balance. Does NOT write to the DB — plan §9's
 * "propose, then confirm via PATCH" flow (DESIGN.md §4.6, §1.1).
 */
export async function autoBalance(prisma: PrismaClient, plotId: string): Promise<BalanceProposal> {
  const plotInput = await loadPlotInput(prisma, plotId);

  const proposed: BalanceProposal['proposed'] = [];
  const legs: BalanceProposal['projectedBalance']['legs'] = [];

  for (const distro of plotInput.distros) {
    const distroProposal = balanceGreedyLpt(distro, plotInput.equipment);
    proposed.push(...distroProposal.proposed);
    legs.push(...distroProposal.projectedBalance.legs);
  }

  const totals = legs.map((l) => l.totalAmps);
  const max = totals.length ? Math.max(...totals) : 0;
  const min = totals.length ? Math.min(...totals) : 0;
  const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  const deviationPct = avg > 0 ? ((max - min) / avg) * 100 : 0;

  return { proposed, projectedBalance: { legs, deviationPct } };
}
