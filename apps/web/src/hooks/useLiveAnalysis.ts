import { useEffect, useRef, useState } from 'react';
import { analyzePlot } from '@power-distro/calc-engine';
import type { AnalysisReport, PlotInput } from '@power-distro/calc-engine';

const EMPTY_REPORT: AnalysisReport = {
  circuits: [],
  balance: { legs: [], deviationPct: 0 },
  violations: [],
  totalDrawAmps: 0,
};

/**
 * Calls analyzePlot() directly (imported from calc-engine, no network
 * round trip) on every plotDraft change, debounced to animation frame,
 * for instant feedback while building a plot (DESIGN.md §4.7, plan §6
 * Phase 4). The server re-runs the same engine on save as the source
 * of truth — see apps/api's analysisService.
 */
export function useLiveAnalysis(plotDraft: PlotInput | null): AnalysisReport {
  const [report, setReport] = useState<AnalysisReport>(EMPTY_REPORT);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!plotDraft) {
      setReport(EMPTY_REPORT);
      return;
    }

    if (frameRef.current !== undefined) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      setReport(analyzePlot(plotDraft));
    });

    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [plotDraft]);

  return report;
}
