// src/editor/SceneSerializer.js
export class SceneSerializer {
  constructor(entityManager) {
    this.entityManager = entityManager;
  }

  /**
   * Serializes the current scene state into a clean, versioned JSON payload.
   * @returns {Object} The serialized scene data
   */
  serialize() {
    const instances = [];
    
    // Iterate only over persistent entities, ignoring helpers, lights, and controls
    for (const [id, entity] of this.entityManager.entities.entries()) {
      if (entity.type === 'TEMP_HELPER' || entity.type === 'LIGHT') continue;

      const obj = entity.object3d; // The underlying THREE.Object3D
      
      instances.push({
        id: id,
        productId: entity.productId || null,
        shelfId: entity.shelfId || null,
        parentId: entity.parentId || null,
        transform: {
          position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
          rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
          scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z }
        },
        metadata: {
          visibility: obj.visible,
          interactionRadius: entity.interactionRadius || 1.0,
          customLabels: entity.customLabels || {}
        }
      });
    }

    return {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      environment: {
        skyboxUrl: "/assets/skies/warehouse_01.hdr",
        ambientLight: { color: "#ffffff", intensity: 0.6 },
        backgroundColor: "#2a2a2a"
      },
      instances: instances
    };
  }
}