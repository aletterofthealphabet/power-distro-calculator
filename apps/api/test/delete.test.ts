import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server.js';
import { prisma } from '../src/db/prismaClient.js';

// Regression coverage for the "delete distro / delete circuit buttons do
// nothing" bug (specs/extension.md item 4, DESIGN_EXTENSION.md §2). The
// root cause was an uncaught rejection in the frontend click handler, not
// the API — this test asserts the server side of the contract the fix
// depends on: DELETE against a distro/circuit that still has an
// EquipmentInstance attached succeeds and cascades correctly.

let app: FastifyInstance;
const createdPlotIds: string[] = [];
const createdSpecIds: string[] = [];

async function seedPlotWithEquipment() {
  const plot = await prisma.plot.create({ data: { name: 'Delete-test plot' } });
  const distroUnit = await prisma.distroUnit.create({
    data: { plotId: plot.id, name: 'D1', inputConnector: 'camlock', maxAmps: 200, phaseConfig: 3, voltage: 208 },
  });
  const circuit = await prisma.circuit.create({
    data: {
      distroUnitId: distroUnit.id,
      breakerRatingAmps: 20,
      voltage: 120,
      phaseLeg: 'L1',
      connectorType: 'stage pin',
    },
  });
  const equipmentSpec = await prisma.equipmentSpec.create({
    data: { name: 'Test fixture', category: 'lighting fixture', powerWatts: 500, voltage: 120, phase: 1, connectorType: 'stage pin' },
  });
  const instance = await prisma.equipmentInstance.create({
    data: { plotId: plot.id, equipmentSpecId: equipmentSpec.id, circuitId: circuit.id, quantity: 1 },
  });
  createdPlotIds.push(plot.id);
  createdSpecIds.push(equipmentSpec.id);
  return { plot, distroUnit, circuit, equipmentSpec, instance };
}

beforeEach(() => {
  app = buildServer();
});

afterEach(async () => {
  // Plot cascade deletes DistroUnit/Circuit/EquipmentInstance rows it owns
  // (schema.prisma onDelete: Cascade) — this also cleans up whichever of
  // those the test itself already deleted, since deleting an
  // already-deleted row is a no-op via deleteMany.
  await prisma.plot.deleteMany({ where: { id: { in: createdPlotIds.splice(0) } } });
  await prisma.equipmentSpec.deleteMany({ where: { id: { in: createdSpecIds.splice(0) } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('DELETE /circuits/:id', () => {
  it('deletes a circuit that still has an equipment instance assigned, and unassigns (not deletes) the instance', async () => {
    const { circuit, instance } = await seedPlotWithEquipment();

    const res = await app.inject({ method: 'DELETE', url: `/circuits/${circuit.id}` });
    expect(res.statusCode).toBe(204);

    const found = await prisma.circuit.findUnique({ where: { id: circuit.id } });
    expect(found).toBeNull();

    const updatedInstance = await prisma.equipmentInstance.findUnique({ where: { id: instance.id } });
    expect(updatedInstance).not.toBeNull();
    expect(updatedInstance!.circuitId).toBeNull();
  });
});

describe('DELETE /distro-units/:id', () => {
  it('deletes a distro that still has a circuit with an equipment instance assigned', async () => {
    const { distroUnit, circuit, instance } = await seedPlotWithEquipment();

    const res = await app.inject({ method: 'DELETE', url: `/distro-units/${distroUnit.id}` });
    expect(res.statusCode).toBe(204);

    const foundDistro = await prisma.distroUnit.findUnique({ where: { id: distroUnit.id } });
    expect(foundDistro).toBeNull();

    const foundCircuit = await prisma.circuit.findUnique({ where: { id: circuit.id } });
    expect(foundCircuit).toBeNull();

    const updatedInstance = await prisma.equipmentInstance.findUnique({ where: { id: instance.id } });
    expect(updatedInstance).not.toBeNull();
    expect(updatedInstance!.circuitId).toBeNull();
  });
});
