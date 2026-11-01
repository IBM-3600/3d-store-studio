// src/editor/SceneManager.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EventBus } from '../core/EventBus.js';

export class SceneManager {
  constructor(container) {
    this.container = container;
     this.settings = {
      gridSize: 1,
      snap: true,
      angleSnap: 15,      // degrees (Shift-drag rotation, gizmo rotate)
      worldSize: 40,      // grid/world-bounds extent in units
      autosave: true,
    };
    this.state = {settings: this.settings}
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a2a2a);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(5, 5, 5);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // CSS2D Renderer (for HTML labels like product names)
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(container.clientWidth, container.clientHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0px';
    this.labelRenderer.domElement.style.pointerEvents = 'none'; // Let clicks pass through to WebGL
    container.appendChild(this.labelRenderer.domElement);

     this._buildEnvironment()
    // Controls
    this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbit.enableDamping = true;
    
    this.transformControl = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControl.addEventListener('dragging-changed', (event) => {
      this.orbit.enabled = !event.value;
      if (!event.value) EventBus.emit('transform:end'); // Save to history/DB
    });
    this.scene.add(this.transformControl);

    // Post-Processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 0.5, 0.4, 0.85);
    this.bloomPass.enabled = false; // Toggled via Lighting Panel
    this.composer.addPass(this.bloomPass);

    // Lighting (Default)
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Resize Observer
    new ResizeObserver(() => this.onResize()).observe(container);
    
    // Start Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

    /* ── environment ─────────────────────────────────────────────────── */
  _buildEnvironment() {
    this.scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x2a2118, 0.85));

    const sun = new THREE.DirectionalLight(0xfff1dd, 1.7);
    sun.position.set(18, 26, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -30;
    sun.shadow.camera.right = sun.shadow.camera.top = 30;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 90;
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);

    this.axes = new THREE.AxesHelper(2.4);
    this.scene.add(this.axes);

    // Shadow catcher — raycast disabled so empty clicks fall through to deselect.
    const groundGeo = new THREE.PlaneGeometry(400, 400);
    groundGeo.rotateX(-Math.PI / 2);
    this.ground = new THREE.Mesh(groundGeo, new THREE.ShadowMaterial({ opacity: 0.35 }));
    this.ground.position.y = -0.002;
    this.ground.receiveShadow = true;
    this.ground.raycast = () => {};
    this.scene.add(this.ground);

    this.rebuildGrid();
  }

  rebuildGrid() {
    if (this.grid) {
      this.scene.remove(this.grid);
      this.grid.geometry.dispose();
      this.grid.material.dispose();
    }
    const s = this.state.settings;
    const divisions = Math.max(2, Math.min(800, Math.round(s.worldSize / s.gridSize)));
    this.grid = new THREE.GridHelper(s.worldSize, divisions, 0x3d5c8a, 0x24334d);
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.9;
    this.scene.add(this.grid);
  }

  onResize() {
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
    this.labelRenderer.setSize(clientWidth, clientHeight);
    this.composer.setSize(clientWidth, clientHeight);
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.orbit.update();
    this.composer.render();
    this.labelRenderer.render(this.scene, this.camera);
  }

  attachTo(object) {
    this.transformControl.attach(object);
  }

  detach() {
    this.transformControl.detach();
  }
}