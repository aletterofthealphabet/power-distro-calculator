import type { BalanceProposal, DistroInput, EquipmentLoadInput } from '../types.js';

/**
 * Post-MVP refinement (plan §4.3 step 2 / §7a.5): pairwise swap items
 * between legs while it improves balance, subject to the same
 * cabling-aware and pin constraints as balanceGreedyLpt. Explicitly out
 * of scope until real plot sizes show greedy LPT is insufficient —
 * stubbed so the module boundary exists without committing to an
 * algorithm (local search vs. ILP) prematurely.
 */
export function balanceLocalSearch(
  _distro: DistroInput,
  _equipment: EquipmentLoadInput[],
): BalanceProposal {
  throw new Error('balanceLocalSearch is not implemented yet (plan §7a.5) — use balanceGreedyLpt.');
}
