// frontend/src/pages/EditorPage.js
import { authService } from '../services/AuthService.js';
import { router } from '../core/Router.js';
import { EventBus } from '../core/EventBus.js';
import { SceneManager } from '../editor/SceneManager.js';
import { EntityManager } from '../editor/EntityManager.js';
import { SelectionManager } from '../editor/SelectionManager.js';
import { CommandHistory } from '../core/CommandHistory.js';
import { apiService } from '../services/ApiService.js';
import { AssetLoader } from '../loaders/AssetLoader.js';
import { socketService } from '../services/SocketService.js';
// Import UI components
import '../ui/components/Toolbar.js';
import '../ui/components/Outliner.js';
import '../ui/components/AssetBrowser.js';
import '../ui/components/Inspector.js';
import '../ui/components/PanelControls.js';

export class EditorPage {
  constructor(container, params) {
    this.container = container;
    this.worldId = params.worldId;
    this.sceneManager = null;
    this.entityManager = null;
    this.commandHistory = new CommandHistory();
    this.api = apiService;
    this.eventBus = EventBus;
    this.socketService = socketService;
  }

  async render() {
    // Set auth token for API service
    this.api.setToken(authService.getToken());

    this.container.innerHTML = `
      <style>${this.getEditorStyles()}</style>
      <studio-toolbar></studio-toolbar>
      <div class="editor-layout">
        <!-- Top Bar -->
        <div class="editor-topbar">
        <div class="topbar-left">
        <button class="back-btn" id="back-btn" title="Back to Dashboard">←</button>
        <div class="world-title">
              <span class="world-icon">🏬</span>
              <span id="world-name">Loading...</span>
            </div>
            </div>
            <div class="topbar-center">
            <button class="topbar-btn" id="inspector-btn">🔬 Inspector</button>
            </div>
          <div class="topbar-right">
           <!-- <button class="topbar-btn" id="save-btn">💾 Save</button> -->
            <button class="topbar-btn primary" id="publish-btn">🚀 Publish</button>
            <div class="user-chip">
              <span class="user-avatar-sm">${authService.getUser().email[0].toUpperCase()}</span>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="editor-main">
          <!-- Left Panel -->
          <div class="editor-left">
            <div class="panel-tabs">
              <button class="panel-tab active" data-panel="outliner">Outliner</button>
              <button class="panel-tab" data-panel="assets">Assets</button>
            </div>
            <studio-panel-controls panel-id="inspector"></studio-panel-controls>
            <div class="panel-content">
              <studio-outliner id="outliner-panel"></studio-outliner>
              <studio-asset-browser id="assets-panel" style="display: none;"></studio-asset-browser>
            </div>
          </div>

          <!-- Viewport -->
          <div class="editor-viewport" id="viewport-container">
            <div id="three-canvas"></div>
          </div>

          <!-- Right Panel -->
          <div class="editor-right">
            <studio-panel-controls panel-id="inspector"></studio-panel-controls>
            <studio-inspector id="inspector-panel"></studio-inspector>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="editor-statusbar">
          <div class="status-item">
            <span id="status-objects">Objects: 0</span>
          </div>
          <div class="status-item">
            <span id="status-fps">FPS: 60</span>
          </div>
          <div class="status-item">
            <span id="status-save">Saved</span>
          </div>
          <div class="status-item right">
            <span>World: ${this.worldId}</span>
          </div>
        </div>
      </div>
    `;

    await this.initializeEditor();
    this.attachEventListeners();
    this.setupEventListeners()
  }

  async initializeEditor() {
    try {
      // Load world info
      const worldData = await this.api.get(`/api/worlds/${this.worldId}`);
      document.getElementById('world-name').textContent = worldData.name;

      // Initialize Three.js scene
      const viewportContainer = document.getElementById('three-canvas');
      this.sceneManager = new SceneManager(viewportContainer);
      this.entityManager = new EntityManager(this.sceneManager);
      this.selectionManager = new SelectionManager(this.sceneManager, this.entityManager);
      this.assetLoader = new AssetLoader(this.sceneManager.renderer);

      // Setup inspector
      const inspector = document.getElementById('inspector-panel');
      inspector.setCommandHistory(this.commandHistory);

      // Load scene data
      const sceneData = await this.api.get(`/api/worlds/${this.worldId}/scene`);
      EventBus.emit('scene:hierarchy_updated', sceneData.hierarchy);

      // Update status
      document.getElementById('status-objects').textContent = 
        `Objects: ${sceneData.instances?.length || 0}`;

    } catch (error) {
      console.error('[Editor] Initialization error:', error);
      alert('Failed to load editor: ' + error.message);
      //router.navigate('/dashboard');
    }
  }

  attachEventListeners() {
    // Back button
    document.getElementById('back-btn').addEventListener('click', () => {
      router.navigate('/dashboard');
    });

    // Save button
    // document.getElementById('save-btn').addEventListener('click', () => {
    //   this.saveScene();
    // });

    // Publish button
    document.getElementById('publish-btn').addEventListener('click', () => {
      this.publishScene();
    });

    // Panel tabs
    document.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const panel = tab.dataset.panel;
        document.getElementById('outliner-panel').style.display = 
          panel === 'outliner' ? 'block' : 'none';
        document.getElementById('assets-panel').style.display = 
          panel === 'assets' ? 'block' : 'none';
      });
    });

    // Keyboard shortcuts
    this.keyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const ctrl = e.ctrlKey || e.metaKey;
      
      if (ctrl && e.key === 's') {
        e.preventDefault();
        this.saveScene();
      }
    };
    document.addEventListener('keydown', this.keyHandler);
  }


  async saveScene() {
    const statusEl = document.getElementById('status-save');
    statusEl.textContent = 'Saving...';
    
    try {
      const sceneData = this.entityManager ? this.entityManager.serialize() : {};
      await this.api.patch(`/api/worlds/${this.worldId}`, { scene: sceneData });
      statusEl.textContent = '✓ Saved';
      setTimeout(() => { statusEl.textContent = 'Saved'; }, 2000);
    } catch (error) {
      console.error('[Editor] Save error:', error);
      statusEl.textContent = '✕ Save failed';
    }
  }

  async publishScene() {
    if (!confirm('Publish this world? It will be visible to customers.')) return;
    
    try {
      const sceneData = this.entityManager ? this.entityManager.serialize() : {};
      const result = await this.api.post(`/api/publish/${this.worldId}`, { scene: sceneData });
      alert(`Published version ${result.version} successfully!`);
    } catch (error) {
      alert('Failed to publish: ' + error.message);
    }
  }

  getEditorStyles() {
    return `
      .editor-layout {
        display: grid;
        grid-template-rows: 40px 1fr 24px;
        height: 100vh;
        background: #1e1e1e;
        color: #ccc;
      }
      .editor-topbar {
        background: #252526;
        border-bottom: 1px solid #3e3e42;
        display: grid;
        grid-template-columns: auto 1fr auto;
         grid-template-areas:
            "left toolbar right";
        align-items: center;
        padding: 0 12px;
        gap: 12px;
      }
      .topbar-left {
        grid-area: left;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .back-btn {
        background: transparent;
        border: 1px solid #3e3e42;
        color: #ccc;
        width: 32px;
        height: 32px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }
      .back-btn:hover {
        background: #2d2d30;
        border-color: #007acc;
      }
      .world-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #fff;
      }
      .world-icon {
        font-size: 20px;
      }
      .topbar-center {
        grid-area: toolbar;
        /*display: flex;*/
        /*justify-content: center;*/
      }
      .topbar-right {
        grid-area: right;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .topbar-btn {
        background: #2d2d30;
        border: 1px solid #3e3e42;
        color: #ccc;
        padding: 6px 14px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      }
      .topbar-btn:hover {
        background: #2a2d2e;
      }
      .topbar-btn.primary {
        background: #007acc;
        border-color: #007acc;
        color: white;
      }
      .topbar-btn.primary:hover {
        background: #0098ff;
      }
      .user-chip {
        margin-left: 8px;
      }
      .user-avatar-sm {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #007acc;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 12px;
      }
      .editor-main {
        display: grid;
        grid-template-columns: 280px 1fr 320px;
        overflow: hidden;
      }
      .editor-left, .editor-right {
        background: #252526;
        border-right: 1px solid #3e3e42;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .editor-right {
        border-right: none;
        border-left: 1px solid #3e3e42;
      }
      .panel-tabs {
        display: flex;
        background: #2d2d30;
        border-bottom: 1px solid #3e3e42;
      }
      .panel-tab {
        flex: 1;
        background: transparent;
        border: none;
        color: #858585;
        padding: 10px;
        cursor: pointer;
        font-size: 13px;
        border-bottom: 2px solid transparent;
        transition: all 0.15s;
      }
      .panel-tab:hover {
        color: #ccc;
      }
      .panel-tab.active {
        color: #fff;
        border-bottom-color: #007acc;
      }
      .panel-content {
        flex: 1;
        overflow-y: auto;
      }
      .editor-viewport {
        background: #1e1e1e;
        position: relative;
        overflow: hidden;
      }
      #three-canvas {
        width: 100%;
        height: 100%;
      }
      .editor-statusbar {
        background: #252526;
        border-top: 1px solid #3e3e42;
        display: flex;
        align-items: center;
        padding: 0 12px;
        font-size: 11px;
        color: #858585;
        gap: 16px;
      }
      .status-item.right {
        margin-left: auto;
      }
    `;
  }

  destroy() {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }
    if (this.sceneManager) {
      this.sceneManager.dispose?.();
    }
  }

    setupEventListeners() {
    // Toolbar actions
    this.eventBus.on('toolbar:save', () => this.saveScene());
    this.eventBus.on('toolbar:publish', () => this.publishScene());
    this.eventBus.on('toolbar:preview', () => this.previewMode.toggle());
    this.eventBus.on('toolbar:undo', () => this.commandHistory.undo());
    this.eventBus.on('toolbar:redo', () => this.commandHistory.redo());
    this.eventBus.on('toolbar:duplicate', () => this.duplicateSelected());
    this.eventBus.on('toolbar:delete', () => this.deleteSelected());
    this.eventBus.on('toolbar:toggle-grid', () => this.toggleGrid());
    this.eventBus.on('toolbar:toggle-shadows', () => this.toggleShadows());
    this.eventBus.on('toolbar:toggle-stats', () => this.toggleStats());

    // Tool changes
    this.eventBus.on('toolbar:tool_changed', (tool) => {
      this.sceneManager.transformControl.setMode(tool);
    });

    // Selection
    this.eventBus.on('editor:select_object', (entityId) => {
      const entity = this.entityManager.getEntity(entityId);
      if (entity) {
        this.selectionManager.select(entity);
        this.sceneManager.attachTo(entity.object3d);
      }
    });

    this.eventBus.on('editor:deselect_all', () => {
      //this.selectionManager.deselectAll();
      this.sceneManager.detach();
    });

    // Transform end (save to DB)
    this.eventBus.on('transform:end', () => {
      const selected = this.selectionManager.getSelected();
      if (selected) {
        this.saveEntityTransform(selected);
      }
    });

    // Entity property changes
    this.eventBus.on('entity:property_changed', (data) => {
      this.saveEntityProperty(data.entityId, data.property, data.value);
    });

    // Drag and drop from asset browser
    const viewport = document.getElementById('three-canvas');
    viewport.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    viewport.addEventListener('drop', (e) => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      this.handleAssetDrop(data, e);
    });

    // Real-time updates from other editors
    this.socketService.on('server:transform_update', (data) => {
      if (data.userId !== this.currentUserId) {
        const entity = this.entityManager.getEntity(data.objectId);
        if (entity) {
          this.entityManager.updateInstanceTransform(
            data.objectId,
            data.position,
            data.rotation,
            data.scale
          );
        }
      }
    });

    this.socketService.on('server:lock_acquired', (data) => {
      console.log(`[Socket] Lock acquired on ${data.objectId} by ${data.userId}`);
    });

    this.socketService.on('server:lock_denied', (data) => {
      console.warn(`[Socket] Lock denied on ${data.objectId}`);
      this.eventBus.emit('ui:show_notification', {
        type: 'warning',
        message: 'This object is locked by another editor'
      });
    });
  }

  setupPanelTabs() {
    const tabs = document.querySelectorAll('.panel-tab');
    const outlinerPanel = document.getElementById('outliner-panel');
    const assetsPanel = document.getElementById('assets-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabName = tab.dataset.tab;
        if (tabName === 'outliner') {
          outlinerPanel.style.display = 'block';
          assetsPanel.style.display = 'none';
        } else if (tabName === 'assets') {
          outlinerPanel.style.display = 'none';
          assetsPanel.style.display = 'block';
        }
      });
    });
  }

  // async authenticate() {
  //   try {
  //     // Check for existing token
  //     const token = localStorage.getItem('auth_token');
  //     if (!token) {
  //       // Redirect to login or show login modal
  //       console.log('[App] No auth token, redirecting to login');
  //       return;
  //     }

  //     this.apiService.setToken(token);
      
  //     // Verify token and get user info
  //     const user = await this.apiService.get('/api/auth/me');
  //     this.currentUserId = user.id;
      
  //     // Update status bar
  //     document.getElementById('status-user').textContent = `User: ${user.email}`;
      
  //     // Connect to socket
  //     this.socketService.connect({
  //       userId: user.id,
  //       worldId: this.getCurrentWorldId()
  //     });
      
  //   } catch (error) {
  //     console.error('[App] Authentication failed:', error);
  //     localStorage.removeItem('auth_token');
  //   }
  // }

  // async loadInitialData() {
  //   try {
  //     const worldId = this.getCurrentWorldId();
      
  //     // Load scene data
  //     const sceneData = await this.apiService.get(`/api/worlds/${worldId}/scene`);
      
  //     // Build hierarchy
  //     this.eventBus.emit('scene:hierarchy_updated', sceneData.hierarchy);
      
  //     // Load entities
  //     for (const instance of sceneData.instances) {
  //       await this.entityManager.loadInstance(instance, this.assetLoader);
  //     }
      
  //     // Update status
  //     document.getElementById('status-objects').textContent = 
  //       `Objects: ${this.entityManager.entities.size}`;
      
  //   } catch (error) {
  //     console.error('[App] Failed to load initial data:', error);
  //   }
  // }

  // getCurrentWorldId() {
  //   // Extract from URL or state
  //   const path = window.location.pathname;
  //   const match = path.match(/\/editor\/([^\/]+)/);
  //   return match ? match[1] : 'default-world';
  // }

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

  duplicateSelected() {
    const selected = this.selectionManager.getSelected();
    if (!selected) return;

    const duplicate = this.entityManager.duplicate(selected);
    this.selectionManager.select(duplicate);
    this.sceneManager.attachTo(duplicate.object3d);
  }

  deleteSelected() {
    const selected = this.selectionManager.getSelected();
    if (!selected) return;

    this.entityManager.remove(selected.id);
    this.selectionManager.deselectAll();
    this.sceneManager.detach();
  }

  toggleGrid() {
    // Toggle grid visibility
    console.log('[App] Toggle grid');
  }

  toggleShadows() {
    this.sceneManager.renderer.shadowMap.enabled = 
      !this.sceneManager.renderer.shadowMap.enabled;
    
    // Update all materials
    this.entityManager.entities.forEach(entity => {
      if (entity.object3d) {
        entity.object3d.traverse(child => {
          if (child.isMesh) {
            child.material.needsUpdate = true;
          }
        });
      }
    });
  }

  toggleStats() {
    // Toggle Three.js stats panel
    console.log('[App] Toggle stats');
  }

  async handleAssetDrop(data, event) {
    if (data.type !== 'product') return;

    // Raycast to find drop position
    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const position = this.selectionManager.getDropPosition(x, y);
    if (!position) return;

    // Create new instance
    const instance = await this.entityManager.createInstance({
      productId: data.productId,
      position: position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    });

    // Select new instance
    this.selectionManager.select(instance);
    this.sceneManager.attachTo(instance.object3d);
  }

  async saveEntityTransform(entity) {
    const transform = {
      position: {
        x: entity.object3d.position.x,
        y: entity.object3d.position.y,
        z: entity.object3d.position.z
      },
      rotation: {
        x: entity.object3d.rotation.x,
        y: entity.object3d.rotation.y,
        z: entity.object3d.rotation.z
      },
      scale: {
        x: entity.object3d.scale.x,
        y: entity.object3d.scale.y,
        z: entity.object3d.scale.z
      }
    };

    try {
      await this.apiService.patch(`/api/instances/${entity.id}`, { transform });
      
      // Broadcast to other editors
      this.socketService.emit('client:transform', {
        objectId: entity.id,
        ...transform
      });
      
    } catch (error) {
      console.error('[App] Failed to save transform:', error);
    }
  }

  async saveEntityProperty(entityId, property, value) {
    try {
      await this.apiService.patch(`/api/instances/${entityId}`, {
        [property]: value
      });
    } catch (error) {
      console.error('[App] Failed to save property:', error);
    }
  }
}