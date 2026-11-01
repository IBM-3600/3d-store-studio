// backend/src/services/shopify.service.ts
import { prisma } from '../config/database';
import axios from 'axios';


const SHOPIFY_API_VERSION = '2026-04';

export class ShopifyService {
  private baseUrl: string;
  private headers: any;

  constructor(shop: string, accessToken: string) {
    this.baseUrl = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}`;
    this.headers = {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    };
  }

  async syncProducts(lastSyncedAt?: Date) {
    let hasNextPage = true;
    let cursor: string | null = null;
    const query = lastSyncedAt ? `?updated_at_min=${lastSyncedAt.toISOString()}` : '';

    while (hasNextPage) {
      const url: string = cursor 
        ? `${this.baseUrl}/products.json${query}&limit=250&page_info=${cursor}`
        : `${this.baseUrl}/products.json${query}&limit=250`;

      const response = await axios.get(url, { headers: this.headers });
      const products = response.data.products;
      const linkHeader = response.headers.link;

      // Upsert products in batches for performance
      await prisma.$transaction(
        products.map((p: any) =>
          prisma.product.upsert({
            where: { shopifyid: Number(p.id) },
            update: {
              name: p.title,
              price: parseFloat(p.variants[0]?.price || '0'),
              inventory: p.variants.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0),
              images: p.images.map((img: any) => img.src),
              lastSyncedAt: new Date()
            },
            create: {
              shopifyid: Number(p.id),
              name: p.title,
              price: parseFloat(p.variants[0]?.price || '0'),
              inventory: p.variants.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0),
              images: p.images.map((img: any) => img.src),
              variants: JSON.stringify(p.variants),
              lastSyncedAt: new Date()
            }
          })
        )
      );

      // Parse pagination cursor from Link header
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        if (nextMatch) {
          const nextUrl = new URL(nextMatch[1]);
          cursor = nextUrl.searchParams.get('page_info');
        } else {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }
    }
  }
}