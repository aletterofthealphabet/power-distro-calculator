import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prismaClient.js';

interface EquipmentInstanceBody {
  equipmentSpecId: string;
  circuitId?: string | null;
  cableSpecId?: string | null;
  cableLengthFt?: number | null;
  quantity?: number;
  pinned?: boolean;
}

export async function equipmentInstancesRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { plotId: string }; Body: EquipmentInstanceBody }>(
    '/plots/:plotId/equipment-instances',
    async (request, reply) => {
      const instance = await prisma.equipmentInstance.create({
        data: { ...request.body, plotId: request.params.plotId },
      });
      reply.code(201).send(instance);
    },
  );

  // Includes assign/unassign circuit and set `pinned` (DESIGN.md §9).
  app.patch<{ Params: { id: string }; Body: Partial<EquipmentInstanceBody> }>(
    '/equipment-instances/:id',
    async (request) => {
      return prisma.equipmentInstance.update({
        where: { id: request.params.id },
        data: request.body,
      });
    },
  );

  app.delete<{ Params: { id: string } }>('/equipment-instances/:id', async (request, reply) => {
    await prisma.equipmentInstance.delete({ where: { id: request.params.id } });
    reply.code(204).send();
  });
}
