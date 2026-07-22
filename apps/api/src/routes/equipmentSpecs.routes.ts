import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prismaClient.js';

interface EquipmentSpecBody {
  name: string;
  category: string;
  powerWatts?: number;
  currentAmps?: number;
  voltage: number;
  powerFactor?: number;
  phase: 1 | 3;
  connectorType: string;
  isContinuousLoad?: boolean;
  notes?: string;
  source?: string;
  unverified?: boolean;
  createdById?: string;
}

export async function equipmentSpecsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/equipment-specs', async () => {
    return prisma.equipmentSpec.findMany({ orderBy: { name: 'asc' } });
  });

  app.get<{ Params: { id: string } }>('/equipment-specs/:id', async (request) => {
    return prisma.equipmentSpec.findUniqueOrThrow({ where: { id: request.params.id } });
  });

  app.post<{ Body: EquipmentSpecBody }>('/equipment-specs', async (request, reply) => {
    const spec = await prisma.equipmentSpec.create({ data: request.body });
    reply.code(201).send(spec);
  });

  app.patch<{ Params: { id: string }; Body: Partial<EquipmentSpecBody> }>(
    '/equipment-specs/:id',
    async (request) => {
      return prisma.equipmentSpec.update({
        where: { id: request.params.id },
        data: request.body,
      });
    },
  );

  app.delete<{ Params: { id: string } }>('/equipment-specs/:id', async (request, reply) => {
    await prisma.equipmentSpec.delete({ where: { id: request.params.id } });
    reply.code(204).send();
  });
}
