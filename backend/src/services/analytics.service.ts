import { prisma } from '../config/database';



export class AnalyticsService {
  async getWorldSummary(worldId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get top viewed products
    const topProducts = await prisma.$queryRaw`
      SELECT 
        p.id,
        p.name,
        COUNT(*) as views
      FROM "AnalyticsEvent" ae
      JOIN "Product" p ON ae."productId" = p.id
      WHERE ae."worldId" = ${worldId}
        AND ae."eventType" = 'product_view'
        AND ae."timestamp" >= ${startDate}
      GROUP BY p.id, p.name
      ORDER BY views DESC
      LIMIT 10
    `;

    // Get traffic data
    const traffic = await prisma.$queryRaw`
      SELECT 
        DATE("timestamp") as date,
        COUNT(DISTINCT "sessionId") as visitors
      FROM "AnalyticsEvent"
      WHERE "worldId" = ${worldId}
        AND "timestamp" >= ${startDate}
      GROUP BY DATE("timestamp")
      ORDER BY date ASC
    `;

    // Get conversion rate
    const conversions = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT CASE WHEN "eventType" = 'product_view' THEN "sessionId" END) as viewers,
        COUNT(DISTINCT CASE WHEN "eventType" = 'add_to_cart' THEN "sessionId" END) as converters
      FROM "AnalyticsEvent"
      WHERE "worldId" = ${worldId}
        AND "timestamp" >= ${startDate}
    `;

    return {
      topProducts,
      traffic,
      conversions
    };
  }

  async trackEvent(worldId: string, eventType: string, productId: string | null, sessionId: string, metadata: any = {}) {
    await prisma.$executeRaw`
      INSERT INTO "AnalyticsEvent" (id, "worldId", "eventType", "productId", "sessionId", metadata, "timestamp")
      VALUES (gen_random_uuid(), ${worldId}, ${eventType}, ${productId}, ${sessionId}, ${JSON.stringify(metadata)}::jsonb, NOW())
    `;
  }

  async getHeatmapData(worldId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const heatmap = await prisma.$queryRaw`
      SELECT 
        metadata->>'x' as x,
        metadata->>'y' as y,
        metadata->>'z' as z,
        COUNT(*) as count
      FROM "AnalyticsEvent"
      WHERE "worldId" = ${worldId}
        AND "eventType" = 'player_position'
        AND "timestamp" >= ${startDate}
      GROUP BY metadata->>'x', metadata->>'y', metadata->>'z'
      ORDER BY count DESC
      LIMIT 1000
    `;

    return heatmap;
  }
}