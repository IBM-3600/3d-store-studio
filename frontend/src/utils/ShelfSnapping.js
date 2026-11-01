// src/utils/ShelfSnapping.js
import * as THREE from 'three';

export class ShelfSnapper {
  /**
   * Calculates the optimal snapped position for a product on a shelf.
   * @param {THREE.Object3D} productMesh - The product being placed
   * @param {THREE.Object3D} shelfMesh - The target shelf
   * @param {Object} shelfConfig - { width, depth, levels, levelHeight }
   * @returns {THREE.Vector3} Snapped position
   */
  calculateSnapPosition(productMesh, shelfMesh, shelfConfig, intersectPoint) {
    // 1. Determine which shelf level was clicked based on Y intersection
    const relativeY = intersectPoint.y - shelfMesh.position.y;
    const levelIndex = Math.min(
      Math.floor(relativeY / shelfConfig.levelHeight),
      shelfConfig.levels - 1
    );
    const targetY = shelfMesh.position.y + (levelIndex * shelfConfig.levelHeight) + (productMesh.geometry.boundingBox.getSize(new THREE.Vector3()).y / 2);

    // 2. Grid Snap on X and Z axes relative to the shelf's local space
    const shelfBox = new THREE.Box3().setFromObject(shelfMesh);
    const gridSize = 0.1; // 10cm grid

    let snapX = Math.round(intersectPoint.x / gridSize) * gridSize;
    let snapZ = Math.round(intersectPoint.z / gridSize) * gridSize;

    // 3. Constrain to shelf boundaries (with small padding)
    const padding = 0.05;
    const minX = shelfBox.min.x + padding;
    const maxX = shelfBox.max.x - padding;
    const minZ = shelfBox.min.z + padding;
    const maxZ = shelfBox.max.z - padding;

    snapX = THREE.MathUtils.clamp(snapX, minX, maxX);
    snapZ = THREE.MathUtils.clamp(snapZ, minZ, maxZ);

    return new THREE.Vector3(snapX, targetY, snapZ);
  }

  /**
   * Auto-fills a shelf level with a specific product, respecting capacity.
   */
  autoFillShelfLevel(shelfMesh, productData, levelIndex, shelfConfig) {
    const instances = [];
    const productWidth = productData.dimensions.width || 0.2; // Default 20cm
    const productDepth = productData.dimensions.depth || 0.2;
    const spacing = 0.02; // 2cm gap between products

    const startX = shelfMesh.position.x - (shelfConfig.width / 2) + (productWidth / 2) + 0.05;
    const startZ = shelfMesh.position.z - (shelfConfig.depth / 2) + (productDepth / 2) + 0.05;
    const targetY = shelfMesh.position.y + (levelIndex * shelfConfig.levelHeight) + (productData.dimensions.height / 2 || 0.15);

    let currentX = startX;
    let currentZ = startZ;

    while (currentX + productWidth <= shelfMesh.position.x + (shelfConfig.width / 2) - 0.05) {
      while (currentZ + productDepth <= shelfMesh.position.z + (shelfConfig.depth / 2) - 0.05) {
        instances.push({
          productId: productData.id,
          position: { x: currentX, y: targetY, z: currentZ },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        });
        currentZ += productDepth + spacing;
      }
      currentZ = startZ; // Reset Z for next row
      currentX += productWidth + spacing;
    }

    return instances;
  }
}