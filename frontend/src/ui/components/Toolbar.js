// src/ui/components/Toolbar.js
import { EventBus } from '../../core/EventBus.js';

export class Toolbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.activeTool = 'move';
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
    this.setupKeyboardShortcuts();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      
      <div class="toolbar-group">
        <button class="toolbar-btn" data-action="save" title="Save (Ctrl+S)">💾 Save</button>
        <button class="toolbar-btn" data-action="publish" title="Publish">🚀 Publish</button>
        <button class="toolbar-btn" data-action="preview" title="Preview (Ctrl+P)">👁️ Preview</button>
      </div>

      <div class="toolbar-group">
        <button class="toolbar-btn" data-action="undo" title="Undo (Ctrl+Z)">↶ Undo</button>
        <button class="toolbar-btn" data-action="redo" title="Redo (Ctrl+Y)">↷ Redo</button>
      </div>

      <div class="toolbar-group">
        <button class="toolbar-btn ${this.activeTool === 'move' ? 'active' : ''}" data-tool="move" title="Move (W)">⬆️ Move</button>
        <button class="toolbar-btn ${this.activeTool === 'rotate' ? 'active' : ''}" data-tool="rotate" title="Rotate (E)">🔄 Rotate</button>
        <button class="toolbar-btn ${this.activeTool === 'scale' ? 'active' : ''}" data-tool="scale" title="Scale (R)">⤢ Scale</button>
      </div>

      <div class="toolbar-group">
        <button class="toolbar-btn" data-action="duplicate" title="Duplicate (Ctrl+D)">📋 Duplicate</button>
        <button class="toolbar-btn" data-action="delete" title="Delete (Del)">🗑️ Delete</button>
      </div>

      <div class="toolbar-group">
        <button class="toolbar-btn" data-action="toggle-grid" title="Toggle Grid (G)">📐 Grid</button>
        <button class="toolbar-btn" data-action="toggle-shadows" title="Toggle Shadows">🌑 Shadows</button>
        <button class="toolbar-btn" data-action="toggle-stats" title="Toggle Stats">📊 Stats</button>
      </div>
    `;
  }

  attachEventListeners() {
    this.shadowRoot.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const tool = btn.dataset.tool;

        if (action) {
          EventBus.emit(`toolbar:${action}`);
        }

        if (tool) {
          this.activeTool = tool;
          this.render();
          EventBus.emit('toolbar:tool_changed', tool);
        }
      });
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const ctrl = e.ctrlKey || e.metaKey;

      switch (e.key.toLowerCase()) {
        case 'w':
          this.setTool('move');
          break;
        case 'e':
          this.setTool('rotate');
          break;
        case 'r':
          this.setTool('scale');
          break;
        case 'g':
          EventBus.emit('toolbar:toggle-grid');
          break;
        case 'delete':
        case 'backspace':
          EventBus.emit('toolbar:delete');
          break;
        case 'z':
          if (ctrl) {
            e.preventDefault();
            EventBus.emit('toolbar:undo');
          }
          break;
        case 'y':
          if (ctrl) {
            e.preventDefault();
            EventBus.emit('toolbar:redo');
          }
          break;
        case 's':
          if (ctrl) {
            e.preventDefault();
            EventBus.emit('toolbar:save');
          }
          break;
        case 'p':
          if (ctrl) {
            e.preventDefault();
            EventBus.emit('toolbar:preview');
          }
          break;
        case 'd':
          if (ctrl) {
            e.preventDefault();
            EventBus.emit('toolbar:duplicate');
          }
          break;
      }
    });
  }

  setTool(tool) {
    this.activeTool = tool;
    this.render();
    EventBus.emit('toolbar:tool_changed', tool);
  }

  getStyles() {
    return `
      :host {
        display:flex;
        background: #252526;
        color: #ccc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        width: 100%;
        /*height: 100%; */
      }
      .toolbar-group {
        display: flex;
        gap: 4px;
        padding: 0 8px;
        border-right: 1px solid #3e3e42;
      }
      .toolbar-btn {
        background: transparent;
        border: none;
        color: #ccc;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        transition: background 0.15s;
      }
      .toolbar-btn:hover {
        background: #2a2d2e;
      }
      .toolbar-btn.active {
        background: #007acc;
        color: white;
      }
    `;
  }
}

customElements.define('studio-toolbar', Toolbar);