import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prismaClient.js';

interface CircuitBody {
  breakerRatingAmps: number;
  voltage: number;
  phaseLeg: 'L1' | 'L2' | 'L3' | 'hot' | 'neutral';
  connectorType: string;
  isContinuousOverride?: boolean;
}

export async function circuitsRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { distroUnitId: string }; Body: CircuitBody }>(
    '/distro-units/:distroUnitId/circuits',
    async (request, reply) => {
      const circuit = await prisma.circuit.create({
        data: { ...request.body, distroUnitId: request.params.distroUnitId },
      });
      reply.code(201).send(circuit);
    },
  );

  app.patch<{ Params: { id: string }; Body: Partial<CircuitBody> }>(
    '/circuits/:id',
    async (request) => {
      return prisma.circuit.update({ where: { id: request.params.id }, data: request.body });
    },
  );

  app.delete<{ Params: { id: string } }>('/circuits/:id', async (request, reply) => {
    await prisma.circuit.delete({ where: { id: request.params.id } });
    reply.code(204).send();
  });
}
