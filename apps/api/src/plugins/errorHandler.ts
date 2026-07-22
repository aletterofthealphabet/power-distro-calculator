import type { FastifyError, FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        reply.code(404).send({ error: 'Not found' });
        return;
      }
      if (error.code === 'P2002') {
        reply.code(409).send({ error: 'Conflict', details: error.meta });
        return;
      }
    }

    if (error.validation) {
      reply.code(400).send({ error: 'Validation error', details: error.validation });
      return;
    }

    const statusCode = error.statusCode ?? 500;
    app.log.error(error);
    reply.code(statusCode).send({ error: statusCode === 500 ? 'Internal server error' : error.message });
  });
}
