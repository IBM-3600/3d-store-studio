import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { idbService } from '../services/IndexedDBService.js';

export class AssetLoader {
  constructor(renderer) {
    this.renderer = renderer;
    
    // Setup GLTF Loader
    this.gltfLoader = new GLTFLoader();
    
    // Setup DRACO Loader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    this.gltfLoader.setDRACOLoader(dracoLoader);
    
    // Setup KTX2 Loader
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath('/basis/');
    ktx2Loader.detectSupport(renderer);
    this.gltfLoader.setKTX2Loader(ktx2Loader);
    
    // Enable Meshopt
    this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    
    // Texture loader
    this.textureLoader = new THREE.TextureLoader();
    
    // Cache
    this.cache = new Map();
  }

  async loadModel(url, onProgress) {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url).clone();
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          this.cache.set(url, gltf.scene);
          resolve(gltf.scene.clone());
        },
        onProgress,
        reject
      );
    });
  }

  async loadTexture(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          this.cache.set(url, texture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  async loadWithCache(url, type = 'model') {
    const cachedUrl = await idbService.getCachedAsset(url);
    
    if (cachedUrl) {
      console.log(`[AssetLoader] Cache hit: ${url}`);
      if (type === 'model') {
        return await this.loadModel(cachedUrl);
      } else {
        return await this.loadTexture(cachedUrl);
      }
    }

    console.log(`[AssetLoader] Cache miss: ${url}`);
    
    // Fetch and cache
    const response = await fetch(url);
    const blob = await response.blob();
    await idbService.cacheAsset(url, blob, type);
    
    const objectUrl = URL.createObjectURL(blob);
    
    try {
      if (type === 'model') {
        return await this.loadModel(objectUrl);
      } else {
        return await this.loadTexture(objectUrl);
      }
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  dispose() {
    this.cache.forEach(asset => {
      if (asset.dispose) {
        asset.dispose();
      }
    });
    this.cache.clear();
  }
}