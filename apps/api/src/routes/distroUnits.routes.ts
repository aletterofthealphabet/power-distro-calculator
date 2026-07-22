import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prismaClient.js';

interface DistroUnitBody {
  name: string;
  inputConnector: string;
  maxAmps: number;
  phaseConfig: 1 | 3;
  voltage: number;
}

export async function distroUnitsRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { plotId: string }; Body: DistroUnitBody }>(
    '/plots/:plotId/distro-units',
    async (request, reply) => {
      const distroUnit = await prisma.distroUnit.create({
        data: { ...request.body, plotId: request.params.plotId },
      });
      reply.code(201).send(distroUnit);
    },
  );

  app.patch<{ Params: { id: string }; Body: Partial<DistroUnitBody> }>(
    '/distro-units/:id',
    async (request) => {
      return prisma.distroUnit.update({ where: { id: request.params.id }, data: request.body });
    },
  );

  app.delete<{ Params: { id: string } }>('/distro-units/:id', async (request, reply) => {
    await prisma.distroUnit.delete({ where: { id: request.params.id } });
    reply.code(204).send();
  });
}
