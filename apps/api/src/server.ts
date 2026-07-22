import Fastify from 'fastify';
import { registerErrorHandler } from './plugins/errorHandler.js';
import { equipmentSpecsRoutes } from './routes/equipmentSpecs.routes.js';
import { cableSpecsRoutes } from './routes/cableSpecs.routes.js';
import { plotsRoutes } from './routes/plots.routes.js';
import { distroUnitsRoutes } from './routes/distroUnits.routes.js';
import { circuitsRoutes } from './routes/circuits.routes.js';
import { equipmentInstancesRoutes } from './routes/equipmentInstances.routes.js';
import { analysisRoutes } from './routes/analysis.routes.js';

export function buildServer() {
  const app = Fastify({ logger: true });

  app.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
    if (request.method === 'OPTIONS') {
      reply.code(204).send();
    }
  });

  registerErrorHandler(app);

  app.get('/health', async () => ({ status: 'ok' }));

  app.register(equipmentSpecsRoutes);
  app.register(cableSpecsRoutes);
  app.register(plotsRoutes);
  app.register(distroUnitsRoutes);
  app.register(circuitsRoutes);
  app.register(equipmentInstancesRoutes);
  app.register(analysisRoutes);

  return app;
}

async function main() {
  const app = buildServer();
  const port = Number(process.env.PORT ?? 3001);
  await app.listen({ port, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
