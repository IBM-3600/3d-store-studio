// // src/editor/EntityManager.js (Snippet)
// import * as THREE from 'three';

// export class EntityManager {
//   constructor(sceneManager) {
//     this.scene = sceneManager.scene;
//     this.entities = new Map(); // id -> Entity
//     this.instancedGroups = new Map(); // productId -> { mesh, count, matrix }
//   }

//   addProductInstance(instanceData, geometry, material) {
//     const { id, productId, position, rotation, scale } = instanceData;

//     // Check if we already have an InstancedMesh for this product
//     if (!this.instancedGroups.has(productId)) {
//       // Max 1000 instances per mesh, create new one if exceeded (simplified here)
//       const instancedMesh = new THREE.InstancedMesh(geometry, material, 1000);
//       instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
//       instancedMesh.castShadow = true;
//       instancedMesh.receiveShadow = true;
//       this.scene.add(instancedMesh);
      
//       this.instancedGroups.set(productId, {
//         mesh: instancedMesh,
//         count: 0,
//         idToIndex: new Map()
//       });
//     }

//     const group = this.instancedGroups.get(productId);
//     const index = group.count++;
    
//     // Calculate matrix
//     const matrix = new THREE.Matrix4();
//     matrix.compose(
//       new THREE.Vector3(position.x, position.y, position.z),
//       new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z)),
//       new THREE.Vector3(scale.x, scale.y, scale.z)
//     );
    
//     group.mesh.setMatrixAt(index, matrix);
//     group.mesh.instanceMatrix.needsUpdate = true;
//     group.idToIndex.set(id, index);

//     // Store lightweight reference for raycasting/selection
//     this.entities.set(id, { type: 'INSTANCE', productId, index, matrix });
//   }

//   updateInstanceTransform(id, newPosition, newRotation, newScale) {
//     const entity = this.entities.get(id);
//     if (!entity || entity.type !== 'INSTANCE') return;

//     const group = this.instancedGroups.get(entity.productId);
//     const matrix = new THREE.Matrix4();
//     matrix.compose(
//       new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z),
//       new THREE.Quaternion().setFromEuler(new THREE.Euler(newRotation.x, newRotation.y, newRotation.z)),
//       new THREE.Vector3(newScale.x, newScale.y, newScale.z)
//     );

//     group.mesh.setMatrixAt(entity.index, matrix);
//     group.mesh.instanceMatrix.needsUpdate = true;
//     entity.matrix = matrix;
//   }

//   remove(id) {
//     const entity = this.entities.get(id);
//     if (!entity || entity.type !== 'INSTANCE') return;
//   }
// }

// frontend/src/editor/EntityManager.js
import * as THREE from 'three';
import { EventBus } from '../core/EventBus.js';
import { apiService } from '../services/ApiService.js';
import { v4 as uuidv4 } from 'uuid';

// random uuidv4 generator
const randomUUIDv4Generator = () => {
  return uuidv4();
};

export class EntityManager {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.scene = sceneManager.scene;
    this.api = apiService;
    this.eventBus = EventBus;

    /** @type {Map<string, EntityRecord>} */
    this.entities = new Map();

    /** Product lookup cache (productId → product metadata) */
    this.productCache = new Map();

    // Group all root scene nodes under a parent for tidy management
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'SceneRoot';
    this.scene.add(this.rootGroup);

    // Dirty flag for auto-save
    this.isDirty = false;
  }

  // ════════════════════════════════════════════════════════════
  //  LOADING
  // ════════════════════════════════════════════════════════════

  /**
   * Load a scene instance (from backend /api/worlds/:id/scene)
   * @param {Object} instance  – DB row with transform + metadata
   * @param {AssetLoader} assetLoader
   */
  async loadInstance(instance, assetLoader) {
    try {
      // Skip duplicates (e.g. during re-render)
      if (this.entities.has(instance.id)) return this.entities.get(instance.id);

      // Decide what to build
      let object3d;
      if (instance.product?.modelUrl) {
        object3d = await assetLoader.loadModel(instance.product.modelUrl);
      } else if (instance.assetUrl) {
        object3d = await assetLoader.loadModel(instance.assetUrl);
      } else {
        object3d = this.createPlaceholder(instance);
      }

      // Apply transform
      object3d.position.set(
        instance.positionX ?? 0,
        instance.positionY ?? 0,
        instance.positionZ ?? 0
      );
      object3d.rotation.set(
        instance.rotationX ?? 0,
        instance.rotationY ?? 0,
        instance.rotationZ ?? 0
      );
      object3d.scale.set(
        instance.scaleX ?? 1,
        instance.scaleY ?? 1,
        instance.scaleZ ?? 1
      );

      object3d.visible = instance.visibility !== false;
      object3d.name = instance.product?.name || instance.name || `Node_${instance.id}`;
      object3d.userData.entityId = instance.id;

      // Enable shadows
      object3d.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Add to scene graph
      if (instance.parentId && this.entities.has(instance.parentId)) {
        this.entities.get(instance.parentId).object3d.add(object3d);
      } else {
        this.rootGroup.add(object3d);
      }

      // Cache product metadata
      if (instance.product) {
        this.productCache.set(instance.productId, instance.product);
      }

      // Register entity
      const record = {
        id: instance.id,
        productId: instance.productId || null,
        shelfId: instance.shelfId || null,
        parentId: instance.parentId || null,
        storeId: instance.storeId || null,
        object3d,
        name: object3d.name,
        interactive: instance.visibility !== false,
        productName: instance.product?.name || null,
        price: instance.product?.price || null,
        inventory: instance.product?.inventory || null,
        metadata: instance.customMetadata || {},
        createdAt: instance.createdAt
      };

      this.entities.set(instance.id, record);
      return record;
    } catch (error) {
      console.error('[EntityManager] Failed to load instance:', instance.id, error);
      return null;
    }
  }

  /**
   * Create a new instance from user action (asset drop, duplicate, etc.)
   */
  async createInstance(data) {
    const {
      productId,
      position = { x: 0, y: 0, z: 0 },
      rotation = { x: 0, y: 0, z: 0 },
      scale = { x: 1, y: 1, z: 1 },
      parentId = null,
      assetUrl = null,
      name = null
    } = data;

    let object3d;
    let productName = null;
    let price = null;

    if (productId) {
      const product = this.productCache.get(productId);
      if (product?.modelUrl) {
        const { AssetLoader } = await import('../loaders/AssetLoader.js');
        const loader = new AssetLoader(this.sceneManager.renderer);
        object3d = await loader.loadModel(product.modelUrl);
        productName = product.name;
        price = product.price;
      } else {
        object3d = this.createPlaceholder({ name: productName });
      }
    } else if (assetUrl) {
      const { AssetLoader } = await import('../loaders/AssetLoader.js');
      const loader = new AssetLoader(this.sceneManager.renderer);
      object3d = await loader.loadModel(assetUrl);
    } else {
      object3d = this.createPlaceholder({ name });
    }

    object3d.position.set(position.x, position.y, position.z);
    object3d.rotation.set(rotation.x, rotation.y, rotation.z);
    object3d.scale.set(scale.x, scale.y, scale.z);
    object3d.name = name || productName || `New_Object_${Date.now()}`;
    object3d.userData.entityId = null; // Will be set after save

    object3d.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Persist to DB first to get a real ID
    try {
      const worldId = this.getWorldIdFromUrl();
      const response = await this.api.post(`/api/worlds/${worldId}/instances`, {
        productId,
        parentId,
        transform: { position, rotation, scale },
        metadata: {
          name: object3d.name,
          productName,
          price
        }
      });

      const savedInstance = response.instance || response;
      const id = savedInstance.id;

      object3d.userData.entityId = id;
      object3d.name = object3d.name;

      // Add to scene
      if (parentId && this.entities.has(parentId)) {
        this.entities.get(parentId).object3d.add(object3d);
      } else {
        this.rootGroup.add(object3d);
      }

      const record = {
        id,
        productId: productId || null,
        shelfId: null,
        parentId: parentId || null,
        storeId: savedInstance.storeId || null,
        object3d,
        name: object3d.name,
        interactive: true,
        productName,
        price,
        inventory: null,
        metadata: {},
        createdAt: new Date().toISOString()
      };

      this.entities.set(id, record);
      this.isDirty = true;

      this.eventBus.emit('entity:created', { entity: record });
      this.eventBus.emit('scene:hierarchy_updated', this.getHierarchy());
      this.updateStatusCount();

      return record;
    } catch (error) {
      console.error('[EntityManager] Failed to create instance:', error);
      // Cleanup the orphaned 3D object
      object3d.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          child.material?.dispose?.();
        }
      });
      throw error;
    }
  }

  // ════════════════════════════════════════════════════════════
  //  LOOKUPS
  // ════════════════════════════════════════════════════════════

  getEntity(id) {
    return this.entities.get(id);
  }

  getEntityByObject3D(object3d) {
    let current = object3d;
    while (current) {
      const id = current.userData?.entityId;
      if (id && this.entities.has(id)) return this.entities.get(id);
      current = current.parent;
    }
    return null;
  }

  getChildren(parentId) {
    const results = [];
    for (const entity of this.entities.values()) {
      if (entity.parentId === parentId) results.push(entity);
    }
    return results;
  }

  getHierarchy() {
    const roots = [];
    for (const entity of this.entities.values()) {
      if (!entity.parentId || !this.entities.has(entity.parentId)) {
        roots.push(this.buildTreeNode(entity));
      }
    }
    return roots;
  }

  buildTreeNode(entity) {
    return {
      id: entity.id,
      name: entity.name,
      type: entity.productId ? 'PRODUCT' : 'OBJECT',
      visible: entity.object3d.visible,
      children: this.getChildren(entity.id).map((c) => this.buildTreeNode(c))
    };
  }

  // ════════════════════════════════════════════════════════════
  //  MODIFICATIONS
  // ════════════════════════════════════════════════════════════

  duplicate(sourceEntity) {
    if (!sourceEntity) return null;

    const clone = sourceEntity.object3d.clone(true);
    clone.position.x += 1; // offset so duplicates don't overlap
    clone.userData.entityId = null;

    // Assign new IDs to all children too
    const reassignIds = (obj) => {
      obj.userData.entityId = null;
      obj.children.forEach(reassignIds);
    };
    reassignIds(clone);

    // Persist to backend
    this.persistDuplicate(sourceEntity, clone);
    return this.registerDuplicate(sourceEntity, clone);
  }

  registerDuplicate(source, clone) {
    const id = `temp_${randomUUIDv4Generator()}`; // Temporary until DB responds
    clone.userData.entityId = id;

    // Add to scene next to source
    if (source.parentId && this.entities.has(source.parentId)) {
      this.entities.get(source.parentId).object3d.add(clone);
    } else {
      this.rootGroup.add(clone);
    }

    const record = {
      id,
      productId: source.productId,
      shelfId: source.shelfId,
      parentId: source.parentId,
      storeId: source.storeId,
      object3d: clone,
      name: `${source.name} (copy)`,
      interactive: true,
      productName: source.productName,
      price: source.price,
      inventory: null,
      metadata: { ...source.metadata },
      createdAt: new Date().toISOString()
    };

    this.entities.set(id, record);
    this.isDirty = true;

    this.eventBus.emit('entity:created', { entity: record });
    this.eventBus.emit('scene:hierarchy_updated', this.getHierarchy());
    this.updateStatusCount();
    return record;
  }

  async persistDuplicate(source, clone) {
    try {
      const worldId = this.getWorldIdFromUrl();
      await this.api.post(`/api/worlds/${worldId}/instances`, {
        productId: source.productId,
        parentId: source.parentId,
        transform: {
          position: { x: clone.position.x, y: clone.position.y, z: clone.position.z },
          rotation: { x: clone.rotation.x, y: clone.rotation.y, z: clone.rotation.z },
          scale: { x: clone.scale.x, y: clone.scale.y, z: clone.scale.z }
        },
        metadata: source.metadata
      });
    } catch (error) {
      console.error('[EntityManager] Duplicate persist failed:', error);
    }
  }

  remove(id) {
    const entity = this.entities.get(id);
    if (!entity) return;

    // Recursively remove children
    const childIds = this.getChildren(id).map((c) => c.id);
    for (const childId of childIds) {
      this.remove(childId);
    }

    // Remove from scene
    if (entity.object3d.parent) {
      entity.object3d.parent.remove(entity.object3d);
    }

    // Dispose geometry/materials
    entity.object3d.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => m?.dispose?.());
      }
    });

    this.entities.delete(id);
    this.isDirty = true;

    // Notify backend
    this.api.delete(`/api/instances/${id}`).catch((err) =>
      console.error('[EntityManager] Delete failed:', err)
    );

    this.eventBus.emit('entity:removed', { id });
    this.eventBus.emit('scene:hierarchy_updated', this.getHierarchy());
    this.updateStatusCount();
  }

  // ════════════════════════════════════════════════════════════
  //  REAL-TIME SYNC
  // ════════════════════════════════════════════════════════════

  /**
   * Apply a transform update from another editor (via socket)
   */
  updateInstanceTransform(id, position, rotation, scale) {
    const entity = this.entities.get(id);
    if (!entity) return;

    entity.object3d.position.set(position.x, position.y, position.z);
    entity.object3d.rotation.set(rotation.x, rotation.y, rotation.z);
    entity.object3d.scale.set(scale.x, scale.y, scale.z);

    this.eventBus.emit('entity:transform_updated', { id, position, rotation, scale });
  }

  // ════════════════════════════════════════════════════════════
  //  SERIALIZATION
  // ════════════════════════════════════════════════════════════

  /**
   * Serialize the entire scene into the format the backend expects.
   * Used by saveScene() and publishScene().
   */
  serialize() {
    const instances = [];

    for (const entity of this.entities.values()) {
      const obj = entity.object3d;
      instances.push({
        id: entity.id,
        productId: entity.productId,
        shelfId: entity.shelfId,
        parentId: entity.parentId,
        storeId: entity.storeId,
        transform: {
          position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
          rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
          scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z }
        },
        visibility: obj.visible,
        metadata: {
          name: entity.name,
          productName: entity.productName,
          price: entity.price,
          ...entity.metadata
        }
      });
    }

    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      instanceCount: instances.length,
      instances
    };
  }

  // ════════════════════════════════════════════════════════════
  //  HELPERS
  // ════════════════════════════════════════════════════════════

  createPlaceholder(instance = {}) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x007acc,
      wireframe: false,
      transparent: true,
      opacity: 0.85
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = instance.name || 'Placeholder';
    return mesh;
  }

  getWorldIdFromUrl() {
    const match = window.location.pathname.match(/\/editor\/([^\/]+)/);
    return match ? match[1] : 'default-world';
  }

  updateStatusCount() {
    const el = document.getElementById('status-objects');
    if (el) {
      el.textContent = `Objects: ${this.entities.size}`;
    }
  }

  clearAll() {
    for (const entity of Array.from(this.entities.values())) {
      this.remove(entity.id);
    }
    this.entities.clear();
    this.isDirty = false;
  }

  dispose() {
    this.clearAll();
    if (this.rootGroup.parent) {
      this.rootGroup.parent.remove(this.rootGroup);
    }
  }
}