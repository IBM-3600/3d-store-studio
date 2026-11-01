// backend/tests/integration/world.controller.test.ts
import request from 'supertest';
import app from '../../src/index';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../../src/utils/auth';

const prisma = new PrismaClient();

describe('World Controller Integration', () => {
  let authToken: string;
  let testWorldId: string;

  beforeAll(async () => {
    // Create test user and generate token
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashed',
        role: 'ADMIN'
      }
    });
    authToken = generateToken(user.id);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/worlds', () => {
    it('should create a new world', async () => {
      const response = await request(app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Mall',
          description: 'A test virtual mall'
        });

      expect(response.status).toBe(201);
      expect(response.body.world).toHaveProperty('id');
      expect(response.body.world.name).toBe('Test Mall');
      testWorldId = response.body.world.id;
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/worlds')
        .send({ name: 'Unauthorized World' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/worlds/:id/scene', () => {
    it('should return scene data with instances', async () => {
      // Create test data
      const building = await prisma.building.create({
        data: { worldId: testWorldId, name: 'Main Building' }
      });
      const floor = await prisma.floor.create({
        data: { buildingId: building.id, name: 'Floor 1' }
      });
      const store = await prisma.store.create({
        data: { floorId: floor.id, name: 'Electronics Store' }
      });

      const response = await request(app)
        .get(`/api/worlds/${testWorldId}/scene`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('buildings');
      expect(response.body.buildings).toHaveLength(1);
    });
  });
});