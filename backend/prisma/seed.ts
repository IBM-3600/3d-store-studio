import { PrismaClient, Role } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';
import { prisma,connectDatabase } from "../src/config/database";
import { products } from './products';

async function main() {

  console.log('[Seed] Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: Role.ADMIN
    }
  });

  console.log('[Seed] Created admin user:', admin.email);

  // Create editor user
  const editorPassword = await bcrypt.hash('editor123', 10);
  const editor = await prisma.user.upsert({
    where: { email: 'editor@example.com' },
    update: {},
    create: {
      email: 'editor@example.com',
      passwordHash: editorPassword,
      role: Role.EDITOR
    }
  });

  console.log('[Seed] Created editor user:', editor.email);

  // Create viewer user
  const viewerPassword = await bcrypt.hash('viewer123', 10);
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: {
      email: 'viewer@example.com',
      passwordHash: viewerPassword,
      role: Role.VIEWER
    }
  });

  console.log('[Seed] Created viewer user:', viewer.email);

  // Create sample world
  const world = await prisma.world.create({
    data: {
      name: 'Sample Virtual Mall',
      description: 'A sample virtual shopping mall for testing',
      status: 'DRAFT',
      theme: JSON.stringify({
        skyboxUrl: '/assets/skies/default.hdr',
        ambientLight: { color: '#ffffff', intensity: 0.6 },
        backgroundColor: '#2a2a2a'
      })
    }
  });

  console.log('[Seed] Created sample world:', world.name);

  // Create building
  const building = await prisma.building.create({
    data: {
      worldId: world.id,
      name: 'Main Building'
    }
  });

  console.log('[Seed] Created building:', building.name);

  // Create floor
  const floor = await prisma.floor.create({
    data: {
      buildingId: building.id,
      name: 'Ground Floor'
    }
  });

  console.log('[Seed] Created floor:', floor.name);

  // Create store
  const store = await prisma.store.create({
    data: {
      floorId: floor.id,
      name: 'Electronics Store'
    }
  });

  console.log('[Seed] Created store:', store.name);

  // Create shelf
  const shelf = await prisma.shelf.create({
    data: {
      storeId: store.id,
      name: 'Display Shelf A',
      dimensions: JSON.stringify({
        width: 2.0,
        height: 1.8,
        depth: 0.4,
        levels: 4,
        levelHeight: 0.45
      })
    }
  });

  console.log('[Seed] Created shelf:', shelf.name);

  // Create sample products
  // const products = [
  //   {
  //     shopifyid: 1001,
  //     name: 'Wireless Headphones',
  //     price: 99.99,
  //     vendor: 'AudioTech',
  //     tags: ['electronics', 'audio'],
  //     images: JSON.stringify(['https://example.com/headphones.jpg']),
  //     variants: JSON.stringify([{ id: 'v1', price: '99.99', inventory_quantity: 50 }]),
  //     inventory: 50
  //   },
  //   {
  //     shopifyid: 1002,
  //     name: 'Smart Watch',
  //     price: 299.99,
  //     vendor: 'TechWear',
  //     tags: ['electronics', 'wearable'],
  //     images: JSON.stringify(['https://example.com/watch.jpg']),
  //     variants: JSON.stringify([{ id: 'v2', price: '299.99', inventory_quantity: 30 }]),
  //     inventory: 30
  //   },
  //   {
  //     shopifyid: 1003,
  //     name: 'Bluetooth Speaker',
  //     price: 79.99,
  //     vendor: 'AudioTech',
  //     tags: ['electronics', 'audio'],
  //     images: JSON.stringify(['https://example.com/speaker.jpg']),
  //     variants: JSON.stringify([{ id: 'v3', price: '79.99', inventory_quantity: 100 }]),
  //     inventory: 100
  //   }
  // ];

  for (const productData of products) {
    const product = await prisma.product.create({ data: productData });
    console.log('[Seed] Created product:', product.name);

    // Create instance on shelf
    await prisma.objectInstance.create({
      data: {
        storeId: store.id,
        productId: product.id,
        shelfId: shelf.id,
        positionX: Math.random() * 1.5 - 0.75,
        positionY: 0.5,
        positionZ: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        visibility: true
      }
    });
  }

  console.log('[Seed] Created product instances');

  console.log('[Seed] Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });