// backend/tests/unit/shopify.service.test.ts
import { ShopifyService } from '../../src/services/shopify.service';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

jest.mock('axios');
jest.mock('@prisma/client');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const prisma = new PrismaClient();

describe('ShopifyService', () => {
  let shopifyService: ShopifyService;

  beforeEach(() => {
    shopifyService = new ShopifyService('test-store.myshopify.com', 'test-token');
    jest.clearAllMocks();
  });

  describe('syncProducts', () => {
    it('should fetch and upsert products from Shopify', async () => {
      const mockProducts = {
        data: {
          products: [
            {
              id: 123,
              title: 'Test Product',
              variants: [{ price: '10.00', inventory_quantity: 5 }],
              images: [{ src: 'https://example.com/image.jpg' }]
            }
          ]
        },
        headers: {}
      };

      mockedAxios.get.mockResolvedValueOnce(mockProducts);
      (prisma.$transaction as jest.Mock).mockResolvedValue([]);

      await shopifyService.syncProducts();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/products.json'),
        expect.any(Object)
      );
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      const page1 = {
        data: { products: [{ id: 1, title: 'Product 1', variants: [], images: [] }] },
        headers: { link: '<https://test.com?page_info=abc>; rel="next"' }
      };
      const page2 = {
        data: { products: [{ id: 2, title: 'Product 2', variants: [], images: [] }] },
        headers: {}
      };

      mockedAxios.get
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2);

      await shopifyService.syncProducts();

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should throw error on API failure', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(shopifyService.syncProducts()).rejects.toThrow('API Error');
    });
  });
});