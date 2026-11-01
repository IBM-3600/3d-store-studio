import { EventBus } from './core/EventBus.js';
import { StateManager } from './core/StateManager.js';
import { CommandHistory } from './core/CommandHistory.js';
import { SceneManager } from './editor/SceneManager.js';
import { EntityManager } from './editor/EntityManager.js';
import { SelectionManager } from './editor/SelectionManager.js';
import { LightingEditor } from './editor/LightingEditor.js';
import { PreviewMode } from './editor/PreviewMode.js';
import { AudioManager } from './editor/AudioManager.js';
import { AnimationTimeline } from './editor/AnimationTimeline.js';
import { PluginManager } from './core/PluginManager.js';
import { ApiService } from './services/ApiService.js';
import { SocketService } from './services/SocketService.js';
import { IndexedDBService } from './services/IndexedDBService.js';
import { AssetLoader } from './loaders/AssetLoader.js';
import { WooCommerceSyncPlugin } from './plugins/WooCommerceSyncPlugin.js';
import { layoutManager } from './core/LayoutManager.js'

import { router, authGuard } from './core/Router.js';
import { authService } from './services/AuthService.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { EditorPage } from './pages/EditorPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';
import { UploadPage } from './pages/UploadPage.js';
import { AssetsPage } from './pages/AssetsPage.js';
import { ApplicationsPage } from './pages/ApplicationsPage.js';
import { AppDetailPage } from './pages/AppDetailPage.js';        // ← ADD
import { AppIntegrationPage } from './pages/AppIntegrationPage.js'; // ← ADD
// Import UI Components
//import './ui/components/Toolbar.js';
//import './ui/components/Outliner.js';
//import './ui/components/AssetBrowser.js';
//import './ui/components/Inspector.js';
import './ui/components/Modal.js';

class App {
  constructor() {
    this.initialized = false;
    this.container = document.getElementById('app');
  }

  async init() {
    console.log('[App] Initializing 3D Store Studio...');


     // Setup router container
    router.setContainer(this.container);

    // Add auth guard to all routes
    router.addGuard(authGuard);

    // Register routes
    router.register('/login', LoginPage);
    router.register('/dashboard', DashboardPage);
    router.register('/editor/:worldId', EditorPage);
    router.register('/settings', SettingsPage);
    router.register('/upload', UploadPage);
    router.register('/assets', AssetsPage);
    router.register('/404', NotFoundPage);
    router.register('*', NotFoundPage);
    router.register('/applications', ApplicationsPage);
    router.register('/applications/:appId', AppDetailPage);          // ← ADD
    router.register('/applications/:appId/integration', AppIntegrationPage); // ←
    // Determine initial route
    let initialPath = '/';
    if (authService.isAuthenticated()) {
      initialPath = '/dashboard';
    } else {
      initialPath = '/login';
    }

    // Start router
    router.start(initialPath);

    // Initialize core services
    this.eventBus = EventBus;
    this.stateManager = new StateManager();
    this.commandHistory = new CommandHistory();
    this.apiService = new ApiService();
    this.socketService = new SocketService();
    this.idbService = new IndexedDBService();
    this.pluginManager = new PluginManager();

    // Initialize Three.js scene
    // const viewportContainer = document.getElementById('three-canvas');
    // this.sceneManager = new SceneManager(viewportContainer);
    // this.entityManager = new EntityManager(this.sceneManager);
    // this.selectionManager = new SelectionManager(this.sceneManager, this.entityManager);
    // this.assetLoader = new AssetLoader(this.sceneManager.renderer);

    // Initialize editors
    // this.lightingEditor = new LightingEditor(this.sceneManager);
    // this.previewMode = new PreviewMode(this.sceneManager);
    // this.audioManager = new AudioManager(this.sceneManager);
    // this.animationTimeline = new AnimationTimeline();

    // Setup inspector
    // const inspector = document.getElementById('inspector-panel');
    // inspector.setCommandHistory(this.commandHistory);



    // Setup event listeners
    //this.setupEventListeners();

    // Setup panel tabs
    //this.setupPanelTabs();

    // Load plugins
    this.pluginManager.register(new WooCommerceSyncPlugin());

    // Authenticate and load initial data
    await this.authenticate();
    await this.loadInitialData();

    this.initialized = true;
    console.log('[App] Initialization complete');
  }

  // setupEventListeners() {
  //   // Toolbar actions
  //   this.eventBus.on('toolbar:save', () => this.saveScene());
  //   this.eventBus.on('toolbar:publish', () => this.publishScene());
  //   this.eventBus.on('toolbar:preview', () => this.previewMode.toggle());
  //   this.eventBus.on('toolbar:undo', () => this.commandHistory.undo());
  //   this.eventBus.on('toolbar:redo', () => this.commandHistory.redo());
  //   this.eventBus.on('toolbar:duplicate', () => this.duplicateSelected());
  //   this.eventBus.on('toolbar:delete', () => this.deleteSelected());
  //   this.eventBus.on('toolbar:toggle-grid', () => this.toggleGrid());
  //   this.eventBus.on('toolbar:toggle-shadows', () => this.toggleShadows());
  //   this.eventBus.on('toolbar:toggle-stats', () => this.toggleStats());

  //   // Tool changes
  //   this.eventBus.on('toolbar:tool_changed', (tool) => {
  //     this.sceneManager.transformControl.setMode(tool);
  //   });

  //   // Selection
  //   this.eventBus.on('editor:select_object', (entityId) => {
  //     const entity = this.entityManager.getEntity(entityId);
  //     if (entity) {
  //       this.selectionManager.select(entity);
  //       this.sceneManager.attachTo(entity.object3d);
  //     }
  //   });

  //   this.eventBus.on('editor:deselect_all', () => {
  //     this.selectionManager.deselectAll();
  //     this.sceneManager.detach();
  //   });

  //   // Transform end (save to DB)
  //   this.eventBus.on('transform:end', () => {
  //     const selected = this.selectionManager.getSelected();
  //     if (selected) {
  //       this.saveEntityTransform(selected);
  //     }
  //   });

  //   // Entity property changes
  //   this.eventBus.on('entity:property_changed', (data) => {
  //     this.saveEntityProperty(data.entityId, data.property, data.value);
  //   });

  //   // Drag and drop from asset browser
  //   const viewport = document.getElementById('three-canvas');
  //   viewport.addEventListener('dragover', (e) => {
  //     e.preventDefault();
  //     e.dataTransfer.dropEffect = 'copy';
  //   });

  //   viewport.addEventListener('drop', (e) => {
  //     e.preventDefault();
  //     const data = JSON.parse(e.dataTransfer.getData('application/json'));
  //     this.handleAssetDrop(data, e);
  //   });

  //   // Real-time updates from other editors
  //   this.socketService.on('server:transform_update', (data) => {
  //     if (data.userId !== this.currentUserId) {
  //       const entity = this.entityManager.getEntity(data.objectId);
  //       if (entity) {
  //         this.entityManager.updateInstanceTransform(
  //           data.objectId,
  //           data.position,
  //           data.rotation,
  //           data.scale
  //         );
  //       }
  //     }
  //   });

  //   this.socketService.on('server:lock_acquired', (data) => {
  //     console.log(`[Socket] Lock acquired on ${data.objectId} by ${data.userId}`);
  //   });

  //   this.socketService.on('server:lock_denied', (data) => {
  //     console.warn(`[Socket] Lock denied on ${data.objectId}`);
  //     this.eventBus.emit('ui:show_notification', {
  //       type: 'warning',
  //       message: 'This object is locked by another editor'
  //     });
  //   });
  // }

  // setupPanelTabs() {
  //   const tabs = document.querySelectorAll('.panel-tab');
  //   const outlinerPanel = document.getElementById('outliner-panel');
  //   const assetsPanel = document.getElementById('assets-panel');

  //   tabs.forEach(tab => {
  //     tab.addEventListener('click', () => {
  //       tabs.forEach(t => t.classList.remove('active'));
  //       tab.classList.add('active');

  //       const tabName = tab.dataset.tab;
  //       if (tabName === 'outliner') {
  //         outlinerPanel.style.display = 'block';
  //         assetsPanel.style.display = 'none';
  //       } else if (tabName === 'assets') {
  //         outlinerPanel.style.display = 'none';
  //         assetsPanel.style.display = 'block';
  //       }
  //     });
  //   });
  // }

  async authenticate() {
    try {
      // Check for existing token
      const token = localStorage.getItem('studio_auth_token');
      if (!token) {
        // Redirect to login or show login modal
        console.log('[App] No auth token, redirecting to login');
        router.navigate("/login")
        return;
      }

      this.apiService.setToken(token);
      
      // Verify token and get user info
      const user = await this.apiService.get('/api/auth/me');
      this.currentUserId = user.id;
      
      // Update status bar
      document.getElementById('status-user').textContent = `User: ${user.email}`;
      
      // Connect to socket
      this.socketService.connect({
        userId: user.id,
        worldId: this.getCurrentWorldId()
      });
      
    } catch (error) {
      console.error('[App] Authentication failed:', error);
      localStorage.removeItem('studio_auth_token');
    }
  }

  async loadInitialData() {
    try {
      const worldId = this.getCurrentWorldId();
      
      // Load scene data
      const sceneData = await this.apiService.get(`/api/worlds/${worldId}/scene`);
      
      // Build hierarchy
      this.eventBus.emit('scene:hierarchy_updated', sceneData.hierarchy);
      
      // Load entities
      for (const instance of sceneData.instances) {
        await this.entityManager.loadInstance(instance, this.assetLoader);
      }
      
      // Update status
      document.getElementById('status-objects').textContent = 
        `Objects: ${this.entityManager.entities.size}`;
      
    } catch (error) {
      console.error('[App] Failed to load initial data:', error);
    }
  }

  getCurrentWorldId() {
    // Extract from URL or state
    const path = window.location.pathname;
    const match = path.match(/\/editor\/([^\/]+)/);
    return match ? match[1] : 'default-world';
  }

  // async saveScene() {
  //   try {
  //     const worldId = this.getCurrentWorldId();
  //     const sceneData = this.entityManager.serialize();
      
  //     await this.apiService.patch(`/api/worlds/${worldId}`, { scene: sceneData });
      
  //     this.eventBus.emit('ui:show_notification', {
  //       type: 'success',
  //       message: 'Scene saved successfully'
  //     });
      
  //   } catch (error) {
  //     console.error('[App] Failed to save scene:', error);
  //     this.eventBus.emit('ui:show_notification', {
  //       type: 'error',
  //       message: 'Failed to save scene'
  //     });
  //   }
  // }

  // async publishScene() {
  //   try {
  //     const worldId = this.getCurrentWorldId();
  //     const sceneData = this.entityManager.serialize();
      
  //     const result = await this.apiService.post(`/api/publish/${worldId}`, { scene: sceneData });
      
  //     this.eventBus.emit('ui:show_notification', {
  //       type: 'success',
  //       message: `Published version ${result.version}`
  //     });
      
  //   } catch (error) {
  //     console.error('[App] Failed to publish scene:', error);
  //     this.eventBus.emit('ui:show_notification', {
  //       type: 'error',
  //       message: error.message || 'Failed to publish scene'
  //     });
  //   }
  // }

  // duplicateSelected() {
  //   const selected = this.selectionManager.getSelected();
  //   if (!selected) return;

  //   const duplicate = this.entityManager.duplicate(selected);
  //   this.selectionManager.select(duplicate);
  //   this.sceneManager.attachTo(duplicate.object3d);
  // }

  // deleteSelected() {
  //   const selected = this.selectionManager.getSelected();
  //   if (!selected) return;

  //   this.entityManager.remove(selected.id);
  //   this.selectionManager.deselectAll();
  //   this.sceneManager.detach();
  // }

  // toggleGrid() {
  //   // Toggle grid visibility
  //   console.log('[App] Toggle grid');
  // }

  // toggleShadows() {
  //   this.sceneManager.renderer.shadowMap.enabled = 
  //     !this.sceneManager.renderer.shadowMap.enabled;
    
  //   // Update all materials
  //   this.entityManager.entities.forEach(entity => {
  //     if (entity.object3d) {
  //       entity.object3d.traverse(child => {
  //         if (child.isMesh) {
  //           child.material.needsUpdate = true;
  //         }
  //       });
  //     }
  //   });
  // }

  // toggleStats() {
  //   // Toggle Three.js stats panel
  //   console.log('[App] Toggle stats');
  // }

  // async handleAssetDrop(data, event) {
  //   if (data.type !== 'product') return;

  //   // Raycast to find drop position
  //   const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
  //   const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  //   const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  //   const position = this.selectionManager.getDropPosition(x, y);
  //   if (!position) return;

  //   // Create new instance
  //   const instance = await this.entityManager.createInstance({
  //     productId: data.productId,
  //     position: position,
  //     rotation: { x: 0, y: 0, z: 0 },
  //     scale: { x: 1, y: 1, z: 1 }
  //   });

  //   // Select new instance
  //   this.selectionManager.select(instance);
  //   this.sceneManager.attachTo(instance.object3d);
  // }

  // async saveEntityTransform(entity) {
  //   const transform = {
  //     position: {
  //       x: entity.object3d.position.x,
  //       y: entity.object3d.position.y,
  //       z: entity.object3d.position.z
  //     },
  //     rotation: {
  //       x: entity.object3d.rotation.x,
  //       y: entity.object3d.rotation.y,
  //       z: entity.object3d.rotation.z
  //     },
  //     scale: {
  //       x: entity.object3d.scale.x,
  //       y: entity.object3d.scale.y,
  //       z: entity.object3d.scale.z
  //     }
  //   };

  //   try {
  //     await this.apiService.patch(`/api/instances/${entity.id}`, { transform });
      
  //     // Broadcast to other editors
  //     this.socketService.emit('client:transform', {
  //       objectId: entity.id,
  //       ...transform
  //     });
      
  //   } catch (error) {
  //     console.error('[App] Failed to save transform:', error);
  //   }
  // }

  // async saveEntityProperty(entityId, property, value) {
  //   try {
  //     await this.apiService.patch(`/api/instances/${entityId}`, {
  //       [property]: value
  //     });
  //   } catch (error) {
  //     console.error('[App] Failed to save property:', error);
  //   }
  // }
}

// Initialize app
const app = new App();
window.app = app; // Expose for debugging and plugins

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}