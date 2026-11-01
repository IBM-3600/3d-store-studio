// frontend/src/ui/components/ModelPreview.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export class ModelPreview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.currentModel = null;
    this.animationId = null;
  }

  connectedCallback() {
    this.render();
    this.initThree();
  }

  disconnectedCallback() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          background: #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }
        .preview-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
        canvas {
          display: block;
          width: 100%;
          height: 100%;
        }
        .placeholder {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: #858585;
          pointer-events: none;
        }
        .placeholder-icon {
          font-size: 64px;
          margin-bottom: 12px;
          opacity: 0.5;
        }
        .placeholder-text {
          font-size: 14px;
        }
        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          text-align: center;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #3e3e42;
          border-top-color: #007acc;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .info-bar {
          position: absolute;
          bottom: 8px;
          left: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.6);
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 11px;
          color: #ccc;
          display: flex;
          justify-content: space-between;
          backdrop-filter: blur(4px);
        }
        .hidden {
          display: none !important;
        }
      </style>
      <div class="preview-container">
        <div class="placeholder" id="placeholder">
          <div class="placeholder-icon">📦</div>
          <div class="placeholder-text">No model loaded</div>
        </div>
        <div class="loading hidden" id="loading">
          <div class="spinner"></div>
          <div>Loading model...</div>
        </div>
        <div class="info-bar hidden" id="info-bar">
          <span id="model-info">-</span>
          <span id="model-stats">-</span>
        </div>
      </div>
    `;
  }

  initThree() {
    const container = this.shadowRoot.querySelector('.preview-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(2, 2, 2);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.insertBefore(this.renderer.domElement, container.firstChild);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x362907, 0.3);
    this.scene.add(hemiLight);

    // Grid helper
    const grid = new THREE.GridHelper(10, 20, 0x444444, 0x222222);
    this.scene.add(grid);

    // Resize observer
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);

    // Start animation
    this.animate();
  }

  onResize() {
    const container = this.shadowRoot.querySelector('.preview-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

   async loadModel(url, fileName = '') {
    const placeholder = this.shadowRoot.getElementById('placeholder');
    const loading = this.shadowRoot.getElementById('loading');
    const infoBar = this.shadowRoot.getElementById('info-bar');
    

    // Reset UI state
    placeholder.classList.add('hidden');
    loading.classList.remove('hidden');
    infoBar.classList.add('hidden');
  

    // Remove previous model safely
    this.clearModel();

    try {
      // Setup loader
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/libs/draco/gltf/');
      loader.setDRACOLoader(dracoLoader);

      // Load the model
      const gltf = await new Promise((resolve, reject) => {
        loader.load(
          url,
          resolve,
          undefined, // onProgress
          (error) => reject(error)
        );
      });

      // Validate the loaded scene
      let modelScene = gltf.scene;
      
      // Fallback: some GLTF files use scenes array
      if (!modelScene && gltf.scenes && gltf.scenes.length > 0) {
        modelScene = gltf.scenes[0];
      }

      if (!modelScene) {
        throw new Error('Model has no valid scene data');
      }

      // Clone the scene to avoid mutation issues
      this.currentModel = modelScene.clone();

      // Ensure the model is valid before computing bounds
      // Add to scene first so Three.js can build the scene graph
      this.scene.add(this.currentModel);

      // Force update of the world matrix before computing bounds
      this.currentModel.updateMatrixWorld(true);

      // Calculate bounding box safely
      let box;
      try {
        box = new THREE.Box3().setFromObject(this.currentModel);
      } catch (boundsError) {
        console.warn('[ModelPreview] Bounds calculation failed, using default:', boundsError);
        box = new THREE.Box3(
          new THREE.Vector3(-1, -1, -1),
          new THREE.Vector3(1, 1, 1)
        );
      }

      // Check if bounding box is valid
      if (box.isEmpty()) {
        console.warn('[ModelPreview] Bounding box is empty, using default');
        box = new THREE.Box3(
          new THREE.Vector3(-1, -1, -1),
          new THREE.Vector3(1, 1, 1)
        );
      }

      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Center the model
      this.currentModel.position.sub(center);

      // Scale to fit view
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const scale = 2 / maxDim;
        this.currentModel.scale.setScalar(scale);
      }

      // Enable shadows
      this.currentModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Reset camera
      this.camera.position.set(2, 2, 2);
      this.controls.target.set(0, 0, 0);
      this.controls.update();

      // Count stats
      let triangles = 0;
      let materials = 0;
      const materialSet = new Set();
      
      this.currentModel.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) {
            if (child.geometry.index) {
              triangles += child.geometry.index.count / 3;
            } else if (child.geometry.attributes && child.geometry.attributes.position) {
              triangles += child.geometry.attributes.position.count / 3;
            }
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => materialSet.add(m.uuid));
            } else {
              materialSet.add(child.material.uuid);
            }
          }
        }
      });
      materials = materialSet.size;

      // Show info
      loading.classList.add('hidden');
      infoBar.classList.remove('hidden');
      this.shadowRoot.getElementById('model-info').textContent = 
        fileName || 'Model loaded';
      this.shadowRoot.getElementById('model-stats').textContent = 
        `${Math.round(triangles).toLocaleString()} tris • ${materials} mats • ${size.x.toFixed(2)}×${size.y.toFixed(2)}×${size.z.toFixed(2)}m`;

      return {
        triangles: Math.round(triangles),
        materials,
        dimensions: {
          width: size.x,
          height: size.y,
          depth: size.z
        }
      };

    } catch (error) {
      console.error('[ModelPreview] Load error:', error);
      loading.classList.add('hidden');
      placeholder.classList.remove('hidden');
      placeholder.querySelector('.placeholder-text').textContent = 
        'Failed to load model';
      throw error;
    }
  }

  clearModel() {
    if (this.currentModel) {
      // Remove from scene
      this.scene.remove(this.currentModel);
      
      // Dispose geometries and materials
      this.currentModel.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          } else {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        }
      });
      
      this.currentModel = null;
    }
  }

  clear() {
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.currentModel = null;
    }
    const placeholder = this.shadowRoot.getElementById('placeholder');
    const infoBar = this.shadowRoot.getElementById('info-bar');
    placeholder.classList.remove('hidden');
    placeholder.querySelector('.placeholder-text').textContent = 'No model loaded';
    infoBar.classList.add('hidden');
  }
}

customElements.define('model-preview', ModelPreview);