// src/ui/components/Inspector.js
import { EventBus } from '../../core/EventBus.js';
import { TransformCommand } from '../../core/CommandHistory.js';
import './PanelControls.js';

export class Inspector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.selectedEntity = null;
    this.commandHistory = null;
    this.isMinimized = false;
  }

  connectedCallback() {
    this.render();
    EventBus.on('editor:select_object', this.handleSelection.bind(this));
    EventBus.on('editor:deselect_all', this.handleDeselect.bind(this));
  }

  setCommandHistory(history) {
    this.commandHistory = history;
  }

  handleSelection(entityId) {
    // Fetch entity from EntityManager (passed via EventBus or global reference)
    this.selectedEntity = window.app.entityManager.getEntity(entityId);
    this.render();
  }

  handleDeselect() {
    this.selectedEntity = null;
    this.render();
  }

  render() {
    if (!this.selectedEntity) {
      this.shadowRoot.innerHTML = `
        <style>${this.getStyles()}</style>
         <div class="panel-header">
        <span class="panel-title">Inspector</span>
        <!-- INSERT THE CUSTOM ELEMENT HERE -->
        <!--<studio-panel-controls panel-id="inspector"></studio-panel-controls> -->
      </div>
        <div class="empty-state">
          <p>No object selected</p>
        </div>
      `;
      return;
    }

    const entity = this.selectedEntity;
    const obj = entity.object3d;

    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="panel-header">
        <span class="panel-title">Inspector</span>
        <!-- INSERT THE CUSTOM ELEMENT HERE -->
       <!-- <studio-panel-controls panel-id="inspector"></studio-panel-controls>-->
      </div>
      
        <div class="section">
          <div class="section-header">Transform</div>
          <div class="row">
            <label>Position</label>
            <div class="vector3">
              <input type="number" step="0.01" value="${obj.position.x.toFixed(3)}" data-prop="position.x" />
              <input type="number" step="0.01" value="${obj.position.y.toFixed(3)}" data-prop="position.y" />
              <input type="number" step="0.01" value="${obj.position.z.toFixed(3)}" data-prop="position.z" />
            </div>
          </div>
          <div class="row">
            <label>Rotation (°)</label>
            <div class="vector3">
              <input type="number" step="1" value="${(obj.rotation.x * 180 / Math.PI).toFixed(1)}" data-prop="rotation.x" />
              <input type="number" step="1" value="${(obj.rotation.y * 180 / Math.PI).toFixed(1)}" data-prop="rotation.y" />
              <input type="number" step="1" value="${(obj.rotation.z * 180 / Math.PI).toFixed(1)}" data-prop="rotation.z" />
            </div>
          </div>
          <div class="row">
            <label>Scale</label>
            <div class="vector3">
              <input type="number" step="0.1" value="${obj.scale.x.toFixed(2)}" data-prop="scale.x" />
              <input type="number" step="0.1" value="${obj.scale.y.toFixed(2)}" data-prop="scale.y" />
              <input type="number" step="0.1" value="${obj.scale.z.toFixed(2)}" data-prop="scale.z" />
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">Product</div>
          <div class="row">
            <label>Name</label>
            <input type="text" value="${entity.productName || 'N/A'}" disabled />
          </div>
          <div class="row">
            <label>Price</label>
            <input type="text" value="$${entity.price || '0.00'}" disabled />
          </div>
          <div class="row">
            <label>Stock</label>
            <input type="number" value="${entity.inventory || 0}" disabled />
          </div>
          <div class="row">
            <label>Visible</label>
            <input type="checkbox" ${obj.visible ? 'checked' : ''} data-prop="visible" />
          </div>
        </div>

        <div class="section">
          <div class="section-header">Interaction</div>
          <div class="row">
            <label>Click Action</label>
            <select data-prop="clickAction">
              <option value="none">None</option>
              <option value="open_modal">Open Modal</option>
              <option value="add_to_cart">Add to Cart</option>
              <option value="play_animation">Play Animation</option>
            </select>
          </div>
          <div class="row">
            <label>Interaction Radius</label>
            <input type="number" step="0.1" value="${entity.interactionRadius || 1.0}" data-prop="interactionRadius" />
          </div>
        </div>

        <div class="section">
          <div class="section-header">Physics</div>
          <div class="row">
            <label>Collider</label>
            <select data-prop="colliderType">
              <option value="none">None</option>
              <option value="box">Box</option>
              <option value="sphere">Sphere</option>
            </select>
          </div>
          <div class="row">
            <label>Navigation Block</label>
            <input type="checkbox" ${entity.blocksNavigation ? 'checked' : ''} data-prop="blocksNavigation" />
          </div>
        </div>
      
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
      // Listen to events dispatched by the panel-controls component
    this.addEventListener('panel:minimize', () => this.toggleMinimize());
    this.addEventListener('panel:close', () => this.closePanel());
    this.addEventListener('panel:dock', () => this.toggleDock());

    this.shadowRoot.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('change', (e) => {
        const prop = e.target.dataset.prop;
        if (!prop) return;

        const oldValue = this.getPropertyValue(prop);
        const newValue = e.target.type === 'checkbox' ? e.target.checked : 
                        e.target.type === 'number' ? parseFloat(e.target.value) : 
                        e.target.value;

        // Create command for undo/redo
        if (this.commandHistory && prop.startsWith('position.') || prop.startsWith('rotation.') || prop.startsWith('scale.')) {
          const oldTransform = {
            position: { ...this.selectedEntity.object3d.position },
            rotation: { ...this.selectedEntity.object3d.rotation },
            scale: { ...this.selectedEntity.object3d.scale }
          };
          
          this.setPropertyValue(prop, newValue);
          
          const newTransform = {
            position: { ...this.selectedEntity.object3d.position },
            rotation: { ...this.selectedEntity.object3d.rotation },
            scale: { ...this.selectedEntity.object3d.scale }
          };

          const cmd = new TransformCommand(
            this.selectedEntity.object3d,
            oldTransform,
            newTransform,
            window.app.apiService
          );
          this.commandHistory.execute(cmd);
        } else {
          this.setPropertyValue(prop, newValue);
        }

        EventBus.emit('entity:property_changed', {
          entityId: this.selectedEntity.id,
          property: prop,
          value: newValue
        });
      });
    });
  }

  getPropertyValue(prop) {
    const parts = prop.split('.');
    let obj = this.selectedEntity;
    for (const part of parts) {
      obj = obj[part];
    }
    return obj;
  }

  setPropertyValue(prop, value) {
    const parts = prop.split('.');
    let obj = this.selectedEntity;
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    if (this.isMinimized) {
      this.setAttribute('minimized', '');
    } else {
      this.removeAttribute('minimized');
    }
  }

  closePanel() {
    this.setAttribute('closed', '');
    // Optionally notify parent layout to adjust grid
    EventBus.emit('layout:panel-closed', { panelId: 'inspector' });
  }

  toggleDock() {
    // Logic to undock into a floating window or dock to another area
    EventBus.emit('layout:panel-dock-toggled', { panelId: 'inspector' });
    console.log('[Inspector] Dock toggled');
  }

  getStyles() {
    return `
      :host {
        display: block;
        background: #252526;
        color: #ccc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        height: 100%;
        overflow-y: auto;
      }
        /* :host {
          display: flex;
          flex-direction: column;
          background: #252526;
          color: #ccc;
          height: 100%;
          overflow: hidden;
        }*/
          .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #2d2d30;
          border-bottom: 1px solid #3e3e42;
          cursor: grab;
        }
        .panel-title {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        /* State: Minimized */
        :host([minimized]) .panel-content {
          display: none;
        }
        :host([minimized]) {
          height: auto !important; /* Shrink to header size */
        }
        /* State: Closed */
        :host([closed]) {
          display: none !important;
        }

      .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #858585;
      }
      .section {
        border-bottom: 1px solid #3e3e42;
        padding: 12px;
      }
      .section-header {
        font-weight: 600;
        margin-bottom: 8px;
        color: #fff;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .row {
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: 8px;
        align-items: center;
        margin-bottom: 6px;
      }
      label {
        color: #858585;
        font-size: 12px;
      }
      input, select {
        background: #2d2d30;
        border: 1px solid #3e3e42;
        color: #ccc;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 12px;
        width: 100%;
      }
      input:focus, select:focus {
        outline: none;
        border-color: #007acc;
      }
      .vector3 {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 4px;
      }
      input[type="checkbox"] {
        width: auto;
      }
    `;
  }
}

customElements.define('studio-inspector', Inspector);