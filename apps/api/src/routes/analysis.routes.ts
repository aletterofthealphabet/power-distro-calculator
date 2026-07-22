import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prismaClient.js';
import { analyze, autoBalance } from '../services/analysisService.js';

export async function analysisRoutes(app: FastifyInstance): Promise<void> {
  // Read-only, safe to call on every UI edit (DESIGN.md §9).
  app.post<{ Params: { id: string } }>('/plots/:id/analyze', async (request) => {
    return analyze(prisma, request.params.id);
  });

  // Returns a proposed diff; nothing is written until a follow-up
  // PATCH on the affected equipment instances (DESIGN.md §1.1, §9).
  app.post<{ Params: { id: string } }>('/plots/:id/auto-balance', async (request) => {
    return autoBalance(prisma, request.params.id);
  });
}
