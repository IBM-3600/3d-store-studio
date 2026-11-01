import { EventBus } from '../../core/EventBus.js';

export class StudioModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    EventBus.on('ui:show_modal', this.show.bind(this));
    EventBus.on('ui:hide_modal', this.hide.bind(this));
  }

  show({ title, content, actions = [] }) {
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>${title}</h2>
            <button class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
          <div class="modal-footer">
            ${actions.map(action => `
              <button class="btn ${action.type || 'secondary'}" data-action="${action.id}">
                ${action.label}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Event listeners
    this.shadowRoot.querySelector('.close-btn').addEventListener('click', () => this.hide());
    this.shadowRoot.querySelector('.modal-overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.hide();
      }
    });

    actions.forEach(action => {
      const btn = this.shadowRoot.querySelector(`[data-action="${action.id}"]`);
      if (btn && action.onClick) {
        btn.addEventListener('click', () => {
          action.onClick();
          if (action.closeOnClick !== false) {
            this.hide();
          }
        });
      }
    });
  }

  hide() {
    this.shadowRoot.innerHTML = '';
  }

  getStyles() {
    return `
      :host {
        display: block;
      }
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        padding: 24px;
        min-width: 400px;
        max-width: 600px;
        color: #ccc;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .modal-header h2 {
        font-size: 18px;
        font-weight: 600;
        color: #fff;
        margin: 0;
      }
      .close-btn {
        background: transparent;
        border: none;
        color: #858585;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
      }
      .close-btn:hover {
        color: #fff;
      }
      .modal-body {
        margin-bottom: 20px;
      }
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      .btn {
        padding: 8px 16px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 13px;
      }
      .btn.primary {
        background: #007acc;
        color: white;
      }
      .btn.primary:hover {
        background: #0098ff;
      }
      .btn.secondary {
        background: #2d2d30;
        color: #ccc;
        border: 1px solid #3e3e42;
      }
      .btn.secondary:hover {
        background: #2a2d2e;
      }
    `;
  }
}

customElements.define('studio-modal', StudioModal);