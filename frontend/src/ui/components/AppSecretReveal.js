// frontend/src/ui/components/AppSecretReveal.js

export class AppSecretReveal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.secret = '';
    this.appName = '';
    this.appId = '';
    this.webhookSecret = '';
    this.revealed = false;
    this.copied = false;
  }

  connectedCallback() {
    this.render();
  }

  /**
   * Public method to open the modal with data.
   * Called from ApplicationsPage after successful registration.
   */
  open({ secret, appName, appId, webhookSecret }) {
    this.secret = secret || '';
    this.appName = appName || 'Your App';
    this.appId = appId || '';
    this.webhookSecret = webhookSecret || '';
    this.revealed = false;
    this.copied = false;
    this.render();

    // Trigger entrance animation
    requestAnimationFrame(() => {
      const overlay = this.shadowRoot.querySelector('.modal-overlay');
      if (overlay) overlay.classList.add('visible');
    });

    // Auto-reveal after a short delay for dramatic effect
    setTimeout(() => this.revealSecret(), 800);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      
      <div class="modal-overlay">
        <div class="modal">
          <!-- Header -->
          <div class="modal-header">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div>
              <h2>Application Registered</h2>
              <p class="app-name">${this.escapeHtml(this.appName)}</p>
            </div>
          </div>

          <!-- Warning Banner -->
          <div class="warning-banner">
            <span class="warning-icon">⚠️</span>
            <div>
              <strong>Save this secret now.</strong>
              <p>For security, it will not be shown again. If lost, you'll need to regenerate it.</p>
            </div>
          </div>

          <!-- Secret Display -->
          <div class="secret-container">
            <label class="secret-label">App Secret</label>
            
            <div class="secret-display" id="secret-display">
              <div class="secret-text" id="secret-text">
                ${this.revealed ? this.formatSecret() : this.getMaskedSecret()}
              </div>
              
              <div class="secret-actions">
                <button class="icon-btn" id="toggle-btn" title="${this.revealed ? 'Hide' : 'Reveal'}">
                  ${this.revealed ? '🙈' : '👁️'}
                </button>
                <button class="icon-btn" id="copy-btn" title="Copy to clipboard">
                  ${this.copied ? '✓' : '📋'}
                </button>
              </div>
            </div>

            ${this.revealed ? `
              <div class="secret-meta">
                <span class="meta-item">Length: ${this.secret.length} chars</span>
                <span class="meta-item">Format: sk_ + hex</span>
              </div>
            ` : ''}
          </div>

          <!-- Webhook Secret (Optional) -->
          ${this.webhookSecret ? `
            <div class="secondary-secret">
              <label>Webhook Secret</label>
              <code class="webhook-secret">${this.escapeHtml(this.webhookSecret)}</code>
            </div>
          ` : ''}

          <!-- Actions -->
          <div class="modal-actions">
            <button class="btn-secondary" id="download-btn">
              ⬇️ Download .env
            </button>
            <button class="btn-primary" id="done-btn">
              I've Saved It — Continue
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachListeners();
  }

  formatSecret() {
    // Split into chunks for readability (every 16 chars)
    const chunks = this.secret.match(/.{1,16}/g) || [];
    return chunks.map((chunk, i) => `<span class="chunk" style="animation-delay: ${i * 0.1}s">${this.escapeHtml(chunk)}</span>`).join('');
  }

  getMaskedSecret() {
    const masked = '•'.repeat(Math.min(this.secret.length, 48));
    return `<span class="masked">${masked}</span>`;
  }

  revealSecret() {
    if (this.revealed) return;
    
    this.revealed = true;
    const display = this.shadowRoot.getElementById('secret-display');
    const textEl = this.shadowRoot.getElementById('secret-text');
    
    if (!display || !textEl) return;

    // Add reveal animation class
    display.classList.add('revealing');
    
    // Animate the text reveal
    setTimeout(() => {
      textEl.innerHTML = this.formatSecret();
      display.classList.add('revealed');
      display.classList.remove('revealing');
      
      // Trigger chunk animation
      const chunks = textEl.querySelectorAll('.chunk');
      chunks.forEach((chunk) => {
        chunk.classList.add('animate-in');
      });
    }, 300);
  }

  hideSecret() {
    this.revealed = false;
    this.render();
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.secret);
      this.copied = true;
      
      const copyBtn = this.shadowRoot.getElementById('copy-btn');
      if (copyBtn) {
        copyBtn.classList.add('copied');
        copyBtn.textContent = '✓';
      }
      
      this.showToast('Secret copied to clipboard');
      
      setTimeout(() => {
        this.copied = false;
        if (copyBtn) {
          copyBtn.classList.remove('copied');
          copyBtn.textContent = '📋';
        }
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = this.secret;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        this.showToast('Secret copied to clipboard');
      } catch (e) {
        this.showToast('Failed to copy', 'error');
      }
      document.body.removeChild(textArea);
    }
  }

  downloadAsEnv() {
    const content = `# 3D Store Studio - Application Credentials
# App: ${this.appName}
# Generated: ${new Date().toISOString()}

STUDIO_API_URL=${window.location.origin}
STUDIO_APP_ID=${this.appId}
STUDIO_APP_SECRET=${this.secret}
${this.webhookSecret ? `STUDIO_WEBHOOK_SECRET=${this.webhookSecret}` : ''}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(this.appName || 'app').toLowerCase().replace(/\s+/g, '-')}-credentials.env`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('Credentials downloaded');
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    this.shadowRoot.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('visible'));
    
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  attachListeners() {
    const toggleBtn = this.shadowRoot.getElementById('toggle-btn');
    const copyBtn = this.shadowRoot.getElementById('copy-btn');
    const doneBtn = this.shadowRoot.getElementById('done-btn');
    const downloadBtn = this.shadowRoot.getElementById('download-btn');
    const overlay = this.shadowRoot.querySelector('.modal-overlay');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (this.revealed) {
          this.hideSecret();
        } else {
          this.revealSecret();
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadAsEnv());
    }
    
    if (doneBtn) {
      doneBtn.addEventListener('click', () => {
        if (overlay) overlay.classList.remove('visible');
        setTimeout(() => {
          this.dispatchEvent(new CustomEvent('closed', { 
            bubbles: true, 
            composed: true 
          }));
          this.remove();
        }, 300);
      });
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  getStyles() {
    return `
      :host {
        display: block;
      }

      /* ─── Overlay ─── */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        padding: 20px;
      }

      .modal-overlay.visible {
        opacity: 1;
      }

      /* ─── Modal ─── */
      .modal {
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        border-radius: 16px;
        padding: 32px;
        width: 100%;
        max-width: 560px;
        box-shadow: 
          0 0 0 1px rgba(255, 255, 255, 0.05),
          0 20px 60px rgba(0, 0, 0, 0.5),
          0 0 100px rgba(0, 122, 204, 0.1);
        transform: translateY(20px) scale(0.95);
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal-overlay.visible .modal {
        transform: translateY(0) scale(1);
      }

      /* ─── Header ─── */
      .modal-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }

      .success-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: rgba(74, 222, 128, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        animation: pulse 2s ease-in-out infinite;
      }

      .success-icon svg {
        width: 24px;
        height: 24px;
        color: #4ade80;
        stroke-dasharray: 100;
        stroke-dashoffset: 100;
        animation: draw 0.6s ease forwards 0.3s;
      }

      @keyframes draw {
        to { stroke-dashoffset: 0; }
      }

      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.3); }
        50% { box-shadow: 0 0 0 12px rgba(74, 222, 128, 0); }
      }

      .modal-header h2 {
        margin: 0;
        color: #fff;
        font-size: 20px;
        font-weight: 600;
      }

      .app-name {
        margin: 4px 0 0;
        color: #858585;
        font-size: 14px;
      }

      /* ─── Warning Banner ─── */
      .warning-banner {
        display: flex;
        gap: 12px;
        background: rgba(251, 191, 36, 0.1);
        border: 1px solid rgba(251, 191, 36, 0.3);
        border-radius: 8px;
        padding: 14px 16px;
        margin-bottom: 24px;
        animation: slideIn 0.4s ease 0.2s both;
      }

      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .warning-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .warning-banner strong {
        color: #fbbf24;
        font-size: 14px;
        display: block;
        margin-bottom: 4px;
      }

      .warning-banner p {
        margin: 0;
        color: #d4a72c;
        font-size: 13px;
        line-height: 1.5;
      }

      /* ─── Secret Display ─── */
      .secret-container {
        margin-bottom: 20px;
      }

      .secret-label {
        display: block;
        color: #858585;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }

      .secret-display {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #121212;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        padding: 14px 16px;
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .secret-display::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, rgba(0, 122, 204, 0.1), transparent);
        transform: translateX(-100%);
        animation: shimmer 2s ease-in-out infinite;
        pointer-events: none;
      }

      .secret-display.revealed::before {
        animation: none;
      }

      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }

      .secret-display.revealing {
        border-color: #007acc;
        box-shadow: 0 0 20px rgba(0, 122, 204, 0.2);
      }

      .secret-display.revealed {
        border-color: #4ade80;
        box-shadow: 0 0 20px rgba(74, 222, 128, 0.15);
      }

      .secret-text {
        flex: 1;
        font-family: 'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
        font-size: 13px;
        color: #fff;
        word-break: break-all;
        line-height: 1.6;
        filter: blur(6px);
        transition: filter 0.5s ease;
        user-select: none;
      }

      .secret-display.revealed .secret-text {
        filter: blur(0);
        user-select: text;
      }

      .secret-text .masked {
        color: #555;
        letter-spacing: 2px;
      }

      .secret-text .chunk {
        display: inline;
        margin-right: 6px;
        opacity: 0;
      }

      .secret-text .chunk.animate-in {
        animation: chunkIn 0.4s ease forwards;
      }

      @keyframes chunkIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .secret-text .chunk:nth-child(1) { color: #4ade80; }
      .secret-text .chunk:nth-child(2) { color: #22d3ee; }
      .secret-text .chunk:nth-child(3) { color: #a78bfa; }
      .secret-text .chunk:nth-child(4) { color: #f472b6; }
      .secret-text .chunk:nth-child(5) { color: #fbbf24; }
      .secret-text .chunk:nth-child(6) { color: #fb923c; }

      .secret-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }

      .icon-btn {
        width: 36px;
        height: 36px;
        border-radius: 6px;
        border: 1px solid #3e3e42;
        background: #2d2d30;
        color: #ccc;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .icon-btn:hover {
        background: #3e3e42;
        border-color: #007acc;
        transform: translateY(-1px);
      }

      .icon-btn.copied {
        background: rgba(74, 222, 128, 0.2);
        border-color: #4ade80;
        color: #4ade80;
      }

      .secret-meta {
        display: flex;
        gap: 16px;
        margin-top: 8px;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .meta-item {
        color: #858585;
        font-size: 11px;
      }

      /* ─── Secondary Secret ─── */
      .secondary-secret {
        margin-bottom: 20px;
        padding: 12px 16px;
        background: #1a1a1a;
        border: 1px solid #2d2d30;
        border-radius: 8px;
      }

      .secondary-secret label {
        display: block;
        color: #858585;
        font-size: 11px;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .webhook-secret {
        color: #d4d4d4;
        font-size: 12px;
        font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
        word-break: break-all;
        display: block;
      }

      /* ─── Actions ─── */
      .modal-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }

      .btn-primary, .btn-secondary {
        flex: 1;
        padding: 12px 20px;
        border-radius: 8px;
        border: none;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-primary {
        background: linear-gradient(135deg, #007acc, #0098ff);
        color: white;
        box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 122, 204, 0.4);
      }

      .btn-secondary {
        background: #2d2d30;
        color: #ccc;
        border: 1px solid #3e3e42;
      }

      .btn-secondary:hover {
        background: #3e3e42;
        border-color: #555;
      }

      /* ─── Toast ─── */
      .toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        color: #fff;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10001;
        transition: transform 0.3s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      }

      .toast.visible {
        transform: translateX(-50%) translateY(0);
      }

      .toast.success { border-left: 4px solid #4ade80; }
      .toast.error { border-left: 4px solid #f87171; }
    `;
  }
}

customElements.define('app-secret-reveal', AppSecretReveal);