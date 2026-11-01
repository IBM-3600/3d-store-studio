// src/editor/LightingEditor.js
import * as THREE from 'three';
import { EventBus } from '../core/EventBus.js';

export class LightingEditor {
  constructor(sceneManager) {
    this.scene = sceneManager.scene;
    this.lights = new Map();
    this.setupDefaultLighting();
  }

  setupDefaultLighting() {
    // Ambient Light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    ambient.name = 'AmbientLight';
    this.scene.add(ambient);
    this.lights.set('ambient', ambient);

    // Directional Light (Sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.name = 'DirectionalLight';
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    this.scene.add(dirLight);
    this.lights.set('directional', dirLight);

    // Hemisphere Light (Sky/Ground)
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x362907, 0.3);
    hemiLight.name = 'HemisphereLight';
    this.scene.add(hemiLight);
    this.lights.set('hemisphere', hemiLight);
  }

  addPointLight(position, color = 0xffffff, intensity = 1.0, distance = 10) {
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.copy(position);
    light.castShadow = true;
    light.name = `PointLight_${Date.now()}`;
    this.scene.add(light);
    
    const id = `point_${Date.now()}`;
    this.lights.set(id, light);
    
    EventBus.emit('lighting:light_added', { id, type: 'point', light });
    return id;
  }

  addSpotLight(position, target, color = 0xffffff, intensity = 1.0, angle = Math.PI / 6) {
    const light = new THREE.SpotLight(color, intensity, 20, angle);
    light.position.copy(position);
    light.target.position.copy(target);
    this.scene.add(light);
    this.scene.add(light.target);
    
    const id = `spot_${Date.now()}`;
    this.lights.set(id, light);
    
    EventBus.emit('lighting:light_added', { id, type: 'spot', light });
    return id;
  }

  updateLight(id, property, value) {
    const light = this.lights.get(id);
    if (!light) return;

    switch (property) {
      case 'color':
        light.color.set(value);
        break;
      case 'intensity':
        light.intensity = value;
        break;
      case 'position':
        light.position.set(value.x, value.y, value.z);
        break;
      case 'castShadow':
        light.castShadow = value;
        break;
    }

    EventBus.emit('lighting:light_updated', { id, property, value });
  }

  removeLight(id) {
    const light = this.lights.get(id);
    if (!light) return;

    this.scene.remove(light);
    if (light.target) this.scene.remove(light.target);
    this.lights.delete(id);

    EventBus.emit('lighting:light_removed', { id });
  }

  getLightConfig() {
    const config = {};
    for (const [id, light] of this.lights.entries()) {
      config[id] = {
        type: light.type,
        color: `#${light.color.getHexString()}`,
        intensity: light.intensity,
        position: { x: light.position.x, y: light.position.y, z: light.position.z },
        castShadow: light.castShadow
      };
    }
    return config;
  }
}