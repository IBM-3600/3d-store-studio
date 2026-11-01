import * as THREE from 'three';
import { EventBus } from '../core/EventBus.js';

export class SelectionManager {
  constructor(sceneManager, entityManager) {
    this.sceneManager = sceneManager;
    this.entityManager = entityManager;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedEntities = new Set();
    this.hoveredEntity = null;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    const canvas = this.sceneManager.renderer.domElement;
    
    canvas.addEventListener('click', (e) => this.handleClick(e));
    canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
  }

  handleClick(event) {
    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
    
    // Get all interactive objects
    const interactiveObjects = this.getInteractiveObjects();
    const intersects = this.raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const entity = this.findEntityFromMesh(hit.object);
      
      if (entity) {
        if (event.ctrlKey || event.metaKey) {
          // Multi-select
          this.toggleSelection(entity);
        } else {
          // Single select
          this.select(entity);
        }
      }
    } else {
      // Clicked on empty space
      this.deselectAll();
    }
  }

  handleMouseMove(event) {
    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
    
    const interactiveObjects = this.getInteractiveObjects();
    const intersects = this.raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
      const entity = this.findEntityFromMesh(intersects[0].object);
      
      if (entity !== this.hoveredEntity) {
        if (this.hoveredEntity) {
          this.onHoverExit(this.hoveredEntity);
        }
        this.hoveredEntity = entity;
        if (entity) {
          this.onHoverEnter(entity);
        }
      }
    } else {
      if (this.hoveredEntity) {
        this.onHoverExit(this.hoveredEntity);
        this.hoveredEntity = null;
      }
    }
  }

  getInteractiveObjects() {
    const objects = [];
    this.entityManager.entities.forEach(entity => {
      if (entity.object3d && entity.interactive !== false) {
        objects.push(entity.object3d);
      }
    });
    return objects;
  }

  findEntityFromMesh(mesh) {
    // Walk up the hierarchy to find the entity
    let current = mesh;
    while (current) {
      const entity = this.entityManager.getEntityByObject3D(current);
      if (entity) return entity;
      current = current.parent;
    }
    return null;
  }

  select(entity) {
    this.deselectAll();
    this.selectedEntities.add(entity);
    this.highlightEntity(entity, true);
    EventBus.emit('editor:select_object', entity.id);
  }

  toggleSelection(entity) {
    if (this.selectedEntities.has(entity)) {
      this.selectedEntities.delete(entity);
      this.highlightEntity(entity, false);
    } else {
      this.selectedEntities.add(entity);
      this.highlightEntity(entity, true);
    }
    EventBus.emit('editor:selection_changed', this.getSelected());
  }

  deselectAll() {
    this.selectedEntities.forEach(entity => {
      this.highlightEntity(entity, false);
    });
    this.selectedEntities.clear();
    EventBus.emit('editor:deselect_all');
  }

  highlightEntity(entity, highlight) {
    if (!entity.object3d) return;
    
    entity.object3d.traverse(child => {
      if (child.isMesh && child.material) {
        if (highlight) {
          // Store original emissive
          if (!child.userData.originalEmissive) {
            child.userData.originalEmissive = child.material.emissive?.clone() || new THREE.Color(0);
          }
          if (child.material.emissive) {
            child.material.emissive.setHex(0x333333);
          }
        } else {
          // Restore original emissive
          if (child.userData.originalEmissive && child.material.emissive) {
            child.material.emissive.copy(child.userData.originalEmissive);
          }
        }
      }
    });
  }

  onHoverEnter(entity) {
    if (!entity.object3d) return;
    
    entity.object3d.traverse(child => {
      if (child.isMesh && child.material) {
        if (!child.userData.originalEmissiveHover) {
          child.userData.originalEmissiveHover = child.material.emissive?.clone() || new THREE.Color(0);
        }
        if (child.material.emissive) {
          child.material.emissive.setHex(0x222222);
        }
      }
    });
    
    document.body.style.cursor = 'pointer';
  }

  onHoverExit(entity) {
    if (!entity.object3d) return;
    
    entity.object3d.traverse(child => {
      if (child.isMesh && child.material) {
        if (child.userData.originalEmissiveHover && child.material.emissive) {
          child.material.emissive.copy(child.userData.originalEmissiveHover);
        }
      }
    });
    
    document.body.style.cursor = 'default';
  }

  getSelected() {
    return Array.from(this.selectedEntities);
  }

  getDropPosition(x, y) {
    this.mouse.set(x, y);
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
    
    // Raycast against floor plane
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersection);
    
    return intersection;
  }
}