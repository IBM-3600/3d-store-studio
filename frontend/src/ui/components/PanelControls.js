// frontend/src/ui/components/PanelControls.js
import { EventBus } from '../../core/EventBus.js';

export class PanelControls extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Default configuration
    this.showClose = this.hasAttribute('hide-close') ? false : true;
    this.showMinimize = this.hasAttribute('hide-minimize') ? false : true;
    this.showDock = this.hasAttribute('hide-dock') ? false : true;
    this.panelId = this.getAttribute('panel-id') || 'unknown-panel';
  }

  static get observedAttributes() {
    return ['hide-close', 'hide-minimize', 'hide-dock', 'panel-id'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'hide-close') this.showClose = newValue === null;
    if (name === 'hide-minimize') this.showMinimize = newValue === null;
    if (name === 'hide-dock') this.showDock = newValue === null;
    if (name === 'panel-id') this.panelId = newValue || 'unknown-panel';
    this.render();
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          align-items: center;
          gap: 2px;
          user-select: none;
        }

        .panel-controls{
            display: flex;
        }
            
        .control-btn {
          background: transparent;
          border: none;
          color: #858585;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 14px;
          line-height: 1;
        }

        .control-btn:hover {
          background: #3e3e42;
          color: #cccccc;
        }

        .control-btn.close-btn:hover {
          background: #f87171;
          color: #ffffff;
        }

        .control-btn:active {
          transform: scale(0.95);
        }

        .control-btn svg {
          width: 14px;
          height: 14px;
          fill: currentColor;
        }
      </style>

      <div class="panel-controls">
        ${this.showDock ? `
          <button class="control-btn dock-btn" title="Toggle Dock / Float" data-action="dock">
            <svg viewBox="0 0 24 24"><path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2z"/></svg>
          </button>
        ` : ''}
        
        ${this.showMinimize ? `
          <button class="control-btn minimize-btn" title="Minimize Panel" data-action="minimize">
            <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
          </button>
        ` : ''}
        
        ${this.showClose ? `
          <button class="control-btn close-btn" title="Close Panel" data-action="close">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        ` : ''}
      </div>
    `;
  }

  attachEventListeners() {
    this.shadowRoot.querySelectorAll('.control-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering parent click events
        const action = btn.dataset.action;
        
        // Dispatch custom event for the parent component to listen to
        this.dispatchEvent(new CustomEvent(`panel:${action}`, {
          bubbles: true,
          composed: true,
          detail: { panelId: this.panelId }
        }));

        // Also emit via global EventBus for decoupled components
        EventBus.emit(`panel:${action}`, { panelId: this.panelId });
      });
    });
  }
}

customElements.define('studio-panel-controls', PanelControls);