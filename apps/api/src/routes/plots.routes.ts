import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prismaClient.js';

interface PlotBody {
  name: string;
  venue?: string;
  eventDate?: string;
  ownerId?: string;
}

export async function plotsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/plots', async () => {
    return prisma.plot.findMany({ orderBy: { createdAt: 'desc' } });
  });

  app.get<{ Params: { id: string } }>('/plots/:id', async (request) => {
    return prisma.plot.findUniqueOrThrow({
      where: { id: request.params.id },
      include: {
        distroUnits: { include: { circuits: true } },
        instances: true,
      },
    });
  });

  app.post<{ Body: PlotBody }>('/plots', async (request, reply) => {
    const { eventDate, ...rest } = request.body;
    const plot = await prisma.plot.create({
      data: { ...rest, eventDate: eventDate ? new Date(eventDate) : undefined },
    });
    reply.code(201).send(plot);
  });

  app.patch<{ Params: { id: string }; Body: Partial<PlotBody> }>('/plots/:id', async (request) => {
    const { eventDate, ...rest } = request.body;
    return prisma.plot.update({
      where: { id: request.params.id },
      data: { ...rest, eventDate: eventDate ? new Date(eventDate) : undefined },
    });
  });

  app.delete<{ Params: { id: string } }>('/plots/:id', async (request, reply) => {
    await prisma.plot.delete({ where: { id: request.params.id } });
    reply.code(204).send();
  });
}
