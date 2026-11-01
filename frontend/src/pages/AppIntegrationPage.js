// frontend/src/pages/AppIntegrationPage.js
import { authService } from '../services/AuthService.js';
import { router } from '../core/Router.js';

export class AppIntegrationPage {
  constructor(container, params) {
    this.container = container;
    this.appId = params.appId;
    this.app = null;
    this.snippets = null;
    this.loading = true;
    this.activeSnippet = 'javascript';
    this.copiedField = null;
  }

  async render() {
    await this.loadData();

    this.container.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="integration-page">
        <header class="page-header">
          <button class="back-btn" id="back-btn">← Back to ${this.app ? this.escapeHtml(this.app.name) : 'App'}</button>
          <h1>🔌 Integration Guide</h1>
        </header>

        <div class="integration-content">
          ${this.loading ? this.renderLoading() : this.renderContent()}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  async loadData() {
    try {
      const [appResponse, snippetsResponse] = await Promise.all([
        fetch(`/api/applications/${this.appId}`, {
          headers: { 'Authorization': `Bearer ${authService.getToken()}` }
        }),
        fetch(`/api/applications/${this.appId}/integration-code`, {
          headers: { 'Authorization': `Bearer ${authService.getToken()}` }
        })
      ]);

      if (!appResponse.ok || !snippetsResponse.ok) {
        throw new Error('Failed to load integration data');
      }

      this.app = await appResponse.json();
      this.snippets = await snippetsResponse.json();
      this.loading = false;
    } catch (error) {
      console.error('[Integration] Load error:', error);
      this.loading = false;
    }
  }

  renderLoading() {
    return `
      <div class="loading-state">
        <div class="spinner-large"></div>
        <p>Generating integration code...</p>
      </div>
    `;
  }

  renderContent() {
    if (!this.app || !this.snippets) {
      return `
        <div class="error-state">
          <h2>Failed to load integration</h2>
          <button class="primary-btn" onclick="history.back()">Go Back</button>
        </div>
      `;
    }

    return `
      <div class="integration-layout">
        <!-- Left: Credentials -->
        <aside class="credentials-panel">
          <h2>🔑 Credentials</h2>
          <p class="hint">Add these to your 3D Store's environment variables.</p>

          <div class="credential-item">
            <label>STUDIO_API_URL</label>
            <div class="credential-value">
              <code>${this.escapeHtml(this.snippets.apiBaseUrl)}</code>
              <button class="copy-btn" data-copy="${this.snippets.apiBaseUrl}" data-field="apiUrl">📋</button>
            </div>
          </div>

          <div class="credential-item">
            <label>STUDIO_APP_ID</label>
            <div class="credential-value">
              <code>${this.app.id}</code>
              <button class="copy-btn" data-copy="${this.app.id}" data-field="appId">📋</button>
            </div>
          </div>

          <div class="credential-item">
            <label>STUDIO_APP_SECRET</label>
            <div class="credential-value">
              <code class="masked">sk_************${this.app.appSecret?.slice(-4) || '****'}</code>
              <button class="copy-btn" data-action="regenerate">🔄</button>
            </div>
            <small class="hint warning">Secret not shown for security. Use Regenerate to get a new one.</small>
          </div>

          ${this.app.webhookSecret ? `
            <div class="credential-item">
              <label>STUDIO_WEBHOOK_SECRET</label>
              <div class="credential-value">
                <code class="masked">whsec_************${this.app.webhookSecret.slice(-4)}</code>
                <button class="copy-btn" data-action="regenerate">🔄</button>
              </div>
            </div>
          ` : ''}

          <div class="credential-item">
            <label>Bucket Base URL</label>
            <div class="credential-value">
              <code>${this.escapeHtml(this.app.bucketBaseUrl || 'Not configured')}</code>
            </div>
          </div>

          <hr />

          <div class="credential-item">
            <h3>🌐 Environments</h3>
            ${(this.app.environments || []).map(env => `
              <div class="env-mini">
                <div class="env-mini-header">
                  <span class="env-type-badge ${env.type.toLowerCase()}">${env.type}</span>
                  <span class="env-version">v${env.currentVersion || 0}</span>
                </div>
                ${env.notifyEndpoint ? `
                  <div class="env-endpoint">
                    <small>Notify endpoint:</small>
                    <code>${this.escapeHtml(env.notifyEndpoint)}</code>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </aside>

        <!-- Right: Code Snippets -->
        <main class="snippets-panel">
          <div class="snippet-tabs">
            <button class="snippet-tab ${this.activeSnippet === 'javascript' ? 'active' : ''}" data-snippet="javascript">
              📦 JS SDK
            </button>
            <button class="snippet-tab ${this.activeSnippet === 'vanillaJs' ? 'active' : ''}" data-snippet="vanillaJs">
              ⚡ Vanilla JS
            </button>
            <button class="snippet-tab ${this.activeSnippet === 'react' ? 'active' : ''}" data-snippet="react">
              ⚛️ React
            </button>
            <button class="snippet-tab ${this.activeSnippet === 'webhookHandler' ? 'active' : ''}" data-snippet="webhookHandler">
              🎣 Webhook Handler
            </button>
            <button class="snippet-tab ${this.activeSnippet === 'envTemplate' ? 'active' : ''}" data-snippet="envTemplate">
              🔧 .env File
            </button>
          </div>

          <div class="snippet-content">
            <div class="snippet-header">
              <h3>${this.getSnippetTitle()}</h3>
              <div class="snippet-actions">
                <button class="secondary-btn" id="copy-snippet-btn">📋 Copy Code</button>
                <button class="secondary-btn" id="download-snippet-btn">⬇️ Download</button>
              </div>
            </div>

            <div class="snippet-description">
              ${this.getSnippetDescription()}
            </div>

            <div class="code-block">
              <pre><code id="snippet-code">${this.escapeHtml(this.snippets.snippets[this.activeSnippet] || '')}</code></pre>
            </div>

            ${this.activeSnippet === 'vanillaJs' || this.activeSnippet === 'javascript' ? `
              <div class="setup-steps">
                <h3>📖 Setup Steps</h3>
                <ol>
                  <li>Copy the code above into your 3D Store frontend</li>
                  <li>Add your API credentials from the left panel</li>
                  <li>Call <code>initStore()</code> when your page loads</li>
                  <li>Configure your webhook endpoint in Studio</li>
                  <li>Deploy your 3D Store — you're ready!</li>
                </ol>
              </div>
            ` : ''}
          </div>
        </main>
      </div>
    `;
  }

  getSnippetTitle() {
    const titles = {
      javascript: 'JavaScript SDK Integration',
      vanillaJs: 'Vanilla JavaScript (No SDK)',
      react: 'React Component Integration',
      webhookHandler: 'Node.js Webhook Handler',
      envTemplate: 'Environment Variables'
    };
    return titles[this.activeSnippet] || 'Code';
  }

  getSnippetDescription() {
    const descriptions = {
      javascript: 'Use the official Studio SDK for the easiest integration. Includes real-time updates, automatic reconnection, and type safety.',
      vanillaJs: 'Pure JavaScript integration with no dependencies. Perfect for static sites or when you want full control.',
      react: 'React hook-style integration that automatically handles loading states and real-time updates.',
      webhookHandler: 'Server-side webhook handler for your 3D Store backend. Verifies signatures and processes Studio events.',
      envTemplate: 'Environment variables to add to your 3D Store\'s configuration. Copy these into your .env file.'
    };
    return descriptions[this.activeSnippet] || '';
  }

  attachEventListeners() {
    document.getElementById('back-btn')?.addEventListener('click', () => {
      router.navigate(`/applications/${this.appId}`);
    });

    // Snippet tabs
    document.querySelectorAll('.snippet-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeSnippet = btn.dataset.snippet;
        this.render();
      });
    });

    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === 'regenerate') {
          this.handleRegenerateSecret();
        } else {
          this.copyToClipboard(btn.dataset.copy, btn);
        }
      });
    });

    // Copy snippet
    document.getElementById('copy-snippet-btn')?.addEventListener('click', () => {
      const code = this.snippets.snippets[this.activeSnippet];
      const btn = document.getElementById('copy-snippet-btn');
      this.copyToClipboard(code, btn);
    });

    // Download snippet
    document.getElementById('download-snippet-btn')?.addEventListener('click', () => {
      this.downloadSnippet();
    });
  }

  async copyToClipboard(text, buttonEl) {
    try {
      await navigator.clipboard.writeText(text);
      const original = buttonEl.textContent;
      buttonEl.textContent = '✓';
      buttonEl.classList.add('copied');
      setTimeout(() => {
        buttonEl.textContent = original;
        buttonEl.classList.remove('copied');
      }, 2000);
    } catch (error) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  downloadSnippet() {
    const code = this.snippets.snippets[this.activeSnippet];
    const ext = this.activeSnippet === 'envTemplate' ? 'env' : 
                this.activeSnippet === 'react' ? 'jsx' : 'js';
    const filename = `${this.app.slug}-${this.activeSnippet}.${ext}`;

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async handleRegenerateSecret() {
    if (!confirm('Regenerate the app secret? The old secret will stop working immediately.')) return;

    try {
      const response = await fetch(`/api/applications/${this.appId}/regenerate-secret`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });

      const result = await response.json();

      if (result.success) {
        // Show secret reveal modal
        await import('../ui/components/AppSecretReveal.js');
        const modal = document.createElement('app-secret-reveal');
        document.body.appendChild(modal);
        modal.open({
          secret: result.appSecret,
          appName: this.app.name,
          appId: this.app.id,
          webhookSecret: this.app.webhookSecret
        });

        modal.addEventListener('closed', () => {
          this.loadData().then(() => this.render());
        });
      } else {
        alert(result.error || 'Failed to regenerate');
      }
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  getStyles() {
    return `
      .integration-page {
        min-height: 100vh;
        background: #1e1e1e;
        color: #ccc;
        padding: 24px;
        overflow-y: auto;
      }
      .page-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
        max-width: 1600px;
        margin-left: auto;
        margin-right: auto;
      }
      .back-btn {
        background: #2d2d30;
        border: 1px solid #3e3e42;
        color: #ccc;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }
      .back-btn:hover { background: #2a2d2e; }
      .page-header h1 { margin: 0; color: #fff; font-size: 22px; flex: 1; }

      .integration-content {
        max-width: 1600px;
        margin: 0 auto;
      }

      .integration-layout {
        display: grid;
        grid-template-columns: 340px 1fr;
        gap: 24px;
        align-items: start;
      }
      @media (max-width: 1024px) {
        .integration-layout { grid-template-columns: 1fr; }
      }

      .credentials-panel {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        padding: 20px;
        position: sticky;
        top: 24px;
      }
      .credentials-panel h2 { margin: 0 0 8px 0; color: #fff; font-size: 16px; }
      .credentials-panel > .hint { color: #858585; font-size: 12px; margin-bottom: 20px; }
      .credentials-panel hr { border: none; border-top: 1px solid #3e3e42; margin: 20px 0; }
      .credentials-panel h3 { margin: 0 0 12px 0; color: #fff; font-size: 14px; }

      .credential-item { margin-bottom: 16px; }
      .credential-item label {
        display: block;
        color: #858585;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
      }
      .credential-value {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .credential-value code {
        flex: 1;
        background: #1e1e1e;
        padding: 8px 10px;
        border-radius: 4px;
        font-family: 'SF Mono', 'Consolas', monospace;
        font-size: 12px;
        color: #4ade80;
        word-break: break-all;
      }
      .credential-value code.masked { color: #858585; }
      .copy-btn {
        background: #2d2d30;
        border: 1px solid #3e3e42;
        color: #ccc;
        padding: 6px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        flex-shrink: 0;
      }
      .copy-btn:hover { background: #3e3e42; border-color: #007acc; }
      .copy-btn.copied { background: rgba(74, 222, 128, 0.2); border-color: #4ade80; color: #4ade80; }
      .credential-item .hint {
        color: #858585;
        font-size: 11px;
        margin-top: 4px;
      }
      .credential-item .hint.warning { color: #fbbf24; }

      .env-mini {
        background: #1e1e1e;
        padding: 10px 12px;
        border-radius: 6px;
        margin-bottom: 8px;
      }
      .env-mini:last-child { margin-bottom: 0; }
      .env-mini-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      .env-type-badge {
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .env-type-badge.development { background: rgba(34, 211, 238, 0.2); color: #22d3ee; }
      .env-type-badge.staging { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
      .env-type-badge.production { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
      .env-version { color: #4ade80; font-family: monospace; font-weight: 600; font-size: 12px; }
      .env-endpoint { margin-top: 4px; }
      .env-endpoint small { display: block; color: #858585; font-size: 10px; margin-bottom: 2px; }
      .env-endpoint code {
        font-size: 10px;
        color: #ccc;
        word-break: break-all;
      }

      .snippets-panel {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        overflow: hidden;
      }

      .snippet-tabs {
        display: flex;
        gap: 4px;
        padding: 8px;
        background: #2a2a2d;
        border-bottom: 1px solid #3e3e42;
        overflow-x: auto;
      }
      .snippet-tab {
        background: transparent;
        border: none;
        color: #858585;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        white-space: nowrap;
        transition: all 0.15s;
      }
      .snippet-tab:hover { color: #ccc; background: #2d2d30; }
      .snippet-tab.active {
        color: #fff;
        background: #007acc;
      }

      .snippet-content { padding: 24px; }
      .snippet-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .snippet-header h3 { margin: 0; color: #fff; font-size: 18px; }
      .snippet-actions { display: flex; gap: 8px; }
      .secondary-btn {
        background: #2d2d30;
        color: #ccc;
        border: 1px solid #3e3e42;
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
      }
      .secondary-btn:hover { background: #3e3e42; border-color: #007acc; }

      .snippet-description {
        color: #858585;
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 20px;
      }

      .code-block {
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        padding: 20px;
        overflow-x: auto;
        margin-bottom: 20px;
      }
      .code-block pre {
        margin: 0;
        font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
        font-size: 13px;
        line-height: 1.6;
        color: #d4d4d4;
        white-space: pre;
      }
      .code-block code {
        color: inherit;
      }

      .setup-steps {
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        padding: 20px;
      }
      .setup-steps h3 { margin: 0 0 12px 0; color: #fff; font-size: 15px; }
      .setup-steps ol { margin: 0; padding-left: 20px; }
      .setup-steps li {
        color: #ccc;
        font-size: 13px;
        line-height: 1.8;
      }
      .setup-steps code {
        background: #252526;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 12px;
        color: #4ade80;
      }

      .loading-state, .error-state {
        text-align: center;
        padding: 60px 20px;
      }
      .spinner-large {
        width: 40px;
        height: 40px;
        border: 3px solid #3e3e42;
        border-top-color: #007acc;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 16px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .primary-btn {
        background: #007acc;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }
      .primary-btn:hover { background: #0098ff; }
    `;
  }

  destroy() {}
}