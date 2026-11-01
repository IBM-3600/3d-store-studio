// src/ui/components/Outliner.js
import { EventBus } from '../../core/EventBus.js';

export class StudioOutliner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.state = { items: [], expanded: new Set() };
  }

  connectedCallback() {
    this.render();
    EventBus.on('scene:hierarchy_updated', this.handleUpdate.bind(this));
  }

  disconnectedCallback() {
    EventBus.off('scene:hierarchy_updated', this.handleUpdate.bind(this));
  }

  handleUpdate(items) {
    this.state.items = items;
    this.render();
  }

  toggleExpand(id) {
    if (this.state.expanded.has(id)) {
      this.state.expanded.delete(id);
    } else {
      this.state.expanded.add(id);
    }
    this.render();
  }

  render() {
    const buildTree = (items, parentId = null, level = 0) => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => {
          const isExpanded = this.state.expanded.has(item.id);
          const hasChildren = items.some(i => i.parentId === item.id);
          const paddingLeft = `${level * 16 + 8}px`;

          return `
            <div class="node">
              <div class="node-row" style="padding-left: ${paddingLeft}" data-id="${item.id}">
                <span class="toggle ${hasChildren ? 'clickable' : ''}" onclick="this.getRootNode().host.toggleExpand('${item.id}')">
                  ${hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
                </span>
                <span class="icon">${item.type === 'PRODUCT' ? '📦' : '📁'}</span>
                <span class="name">${item.name}</span>
                <span class="visibility" data-id="${item.id}">${item.visible ? '👁️' : '🚫'}</span>
              </div>
              ${isExpanded ? buildTree(items, item.id, level + 1) : ''}
            </div>
          `;
        }).join('');
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; background: #1e1e1e; color: #ccc; font-family: sans-serif; font-size: 13px; overflow-y: auto; height: 100%; }
        .node-row { display: flex; align-items: center; padding: 4px 8px; cursor: pointer; user-select: none; }
        .node-row:hover { background: #2a2d2e; }
        .node-row.selected { background: #094771; color: white; }
        .toggle { width: 16px; text-align: center; }
        .toggle.clickable:hover { color: white; }
        .icon { margin-right: 6px; }
        .name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .visibility { cursor: pointer; opacity: 0.7; }
        .visibility:hover { opacity: 1; }
      </style>
      <div class="outliner">
        ${buildTree(this.state.items)}
      </div>
    `;

    // Event delegation for clicks
    this.shadowRoot.querySelectorAll('.node-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.classList.contains('visibility')) return; // Handled separately
        const id = row.dataset.id;
        EventBus.emit('editor:select_object', id);
        
        // Update UI selection state
        this.shadowRoot.querySelectorAll('.node-row').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
      });
    });
  }
}

customElements.define('studio-outliner', StudioOutliner);