import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prismaClient.js';

interface CableSpecBody {
  gaugeAwg: string;
  conductorCount: number;
  connectorType: string;
  ratedAmps: number;
  resistanceOhmsPer1000ft: number;
  source?: string;
  unverified?: boolean;
}

export async function cableSpecsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/cable-specs', async () => {
    return prisma.cableSpec.findMany({ orderBy: { gaugeAwg: 'asc' } });
  });

  app.get<{ Params: { id: string } }>('/cable-specs/:id', async (request) => {
    return prisma.cableSpec.findUniqueOrThrow({ where: { id: request.params.id } });
  });

  app.post<{ Body: CableSpecBody }>('/cable-specs', async (request, reply) => {
    const spec = await prisma.cableSpec.create({ data: request.body });
    reply.code(201).send(spec);
  });

  app.patch<{ Params: { id: string }; Body: Partial<CableSpecBody> }>(
    '/cable-specs/:id',
    async (request) => {
      return prisma.cableSpec.update({ where: { id: request.params.id }, data: request.body });
    },
  );

  app.delete<{ Params: { id: string } }>('/cable-specs/:id', async (request, reply) => {
    await prisma.cableSpec.delete({ where: { id: request.params.id } });
    reply.code(204).send();
  });
}
