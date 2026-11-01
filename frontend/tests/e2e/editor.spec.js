// frontend/tests/e2e/editor.spec.js
import { test, expect } from '@playwright/test';

test.describe('3D Store Studio Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/editor/**');
  });

  test('should load editor with all panels', async ({ page }) => {
    await expect(page.locator('studio-toolbar')).toBeVisible();
    await expect(page.locator('studio-outliner')).toBeVisible();
    await expect(page.locator('studio-inspector')).toBeVisible();
    await expect(page.locator('#three-canvas')).toBeVisible();
  });

  test('should drag product from asset browser to viewport', async ({ page }) => {
    const product = page.locator('.asset-item').first();
    const viewport = page.locator('#three-canvas');
    
    await product.dragTo(viewport);
    
    // Verify object appears in outliner
    await expect(page.locator('studio-outliner .node').last()).toContainText('Product');
  });

  test('should update transform in inspector', async ({ page }) => {
    // Select an object
    await page.click('studio-outliner .node-row').first();
    
    // Update position
    await page.fill('studio-inspector input[data-prop="position.x"]', '5.5');
    await page.press('studio-inspector input[data-prop="position.x"]', 'Enter');
    
    // Verify update
    await expect(page.locator('studio-inspector input[data-prop="position.x"]')).toHaveValue('5.5');
  });

  test('should undo/redo with keyboard shortcuts', async ({ page }) => {
    await page.click('studio-outliner .node-row').first();
    
    // Move object
    await page.fill('studio-inspector input[data-prop="position.x"]', '10');
    await page.press('studio-inspector input[data-prop="position.x"]', 'Enter');
    
    // Undo
    await page.keyboard.press('Control+z');
    await expect(page.locator('studio-inspector input[data-prop="position.x"]')).toHaveValue('0');
    
    // Redo
    await page.keyboard.press('Control+y');
    await expect(page.locator('studio-inspector input[data-prop="position.x"]')).toHaveValue('10');
  });

  test('should publish world successfully', async ({ page }) => {
    await page.click('button[data-action="publish"]');
    
    // Wait for publish modal
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal-header')).toContainText('Publish World');
    
    await page.click('button:has-text("Confirm Publish")');
    
    // Verify success message
    await expect(page.locator('.statusbar')).toContainText('Published');
  });
});