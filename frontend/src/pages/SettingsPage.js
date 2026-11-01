// frontend/src/pages/SettingsPage.js
import { authService } from '../services/AuthService.js';
import { router } from '../core/Router.js';

export class SettingsPage {
  constructor(container) {
    this.container = container;
      this.s3Settings = null;
    this.loading = true;
    this.saving = false;
    this.testing = false;
  }

  async render() {
    await this.loadSettings();
    const user = authService.getUser();
    
    this.container.innerHTML = `
      <style>${this.getStyles()}</style>
      <style>${this.getStylesTwo()}</style>
      <div class="settings-page">
        <div class="settings-header">
          <button class="back-btn" id="back-btn">← Back</button>
          <h1>Settings</h1>
        </div>
        
        <div class="settings-content">
          <div class="settings-section">
            <h2>Account</h2>
            <div class="setting-row">
              <label>Email</label>
              <div class="setting-value">${user.email}</div>
            </div>
            <div class="setting-row">
              <label>Role</label>
              <div class="setting-value">${user.role}</div>
            </div>
            <div class="setting-row">
              <label>User ID</label>
              <div class="setting-value mono">${user.id}</div>
            </div>
          </div>

          <!--  Storage Configuration -->
                      <div class="settings-section">
              <div class="section-header">
                <h2>🗄️ Remote Storage (MiniBucket CDN)</h2>
                <div class="status-badge ${this.s3Settings?.isActive ? 'active' : 'inactive'}">
                  ${this.s3Settings?.isActive ? '● Active' : '○ Inactive'}
                </div>
              </div>
              
              <p class="section-description">
                Configure your MiniBucket CDN or any S3-compatible storage service. 
                Enter the API endpoint and authentication details from your OpenAPI spec.
              </p>

              <form id="s3-form" class="s3-form">
                <div class="form-row">
                  <div class="form-group">
                    <label>Storage Provider</label>
                    <select id="provider" name="provider">
                      <option value="local" ${this.s3Settings?.provider === 'local' ? 'selected' : ''}>Local Only</option>
                      <option value="custom" ${this.s3Settings?.provider === 'custom' ? 'selected' : ''}>Custom CDN (MiniBucket)</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" id="isActive" name="isActive" 
                        ${this.s3Settings?.isActive ? 'checked' : ''} />
                      <span>Enable Remote Storage</span>
                    </label>
                  </div>
                </div>

                <div class="form-group">
                  <label for="baseUrl">API Base URL *</label>
                  <input type="text" id="baseUrl" name="baseUrl" 
                    value="${this.s3Settings?.baseUrl || ''}"
                    placeholder="https://minibucket.example.com/api/v1" />
                  <small class="form-hint">The base URL of your MiniBucket API (from OpenAPI spec)</small>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="authType">Authentication Type</label>
                    <select id="authType" name="authType">
                      <option value="bearer" ${this.s3Settings?.authType === 'bearer' ? 'selected' : ''}>Bearer Token</option>
                      <option value="apikey" ${this.s3Settings?.authType === 'apikey' ? 'selected' : ''}>API Key (Header)</option>
                      <option value="basic" ${this.s3Settings?.authType === 'basic' ? 'selected' : ''}>Basic Auth</option>
                      <option value="none" ${this.s3Settings?.authType === 'none' ? 'selected' : ''}>No Authentication</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="authHeader">Auth Header Name</label>
                    <input type="text" id="authHeader" name="authHeader" 
                      value="${this.s3Settings?.authHeader || 'Authorization'}"
                      placeholder="Authorization or X-API-Key" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="apiKey">API Key / Token *</label>
                  <input type="password" id="apiKey" name="apiKey" 
                    value="${this.s3Settings?.apiKey || ''}"
                    placeholder="Your API key or access token" />
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="uploadEndpoint">Upload Endpoint</label>
                    <input type="text" id="uploadEndpoint" name="uploadEndpoint" 
                      value="${this.s3Settings?.uploadEndpoint || '/upload'}"
                      placeholder="/upload or /objects" />
                    <small class="form-hint">POST endpoint for file uploads</small>
                  </div>
                  
                  <div class="form-group">
                    <label for="deleteEndpoint">Delete Endpoint</label>
                    <input type="text" id="deleteEndpoint" name="deleteEndpoint" 
                      value="${this.s3Settings?.deleteEndpoint || '/objects'}"
                      placeholder="/objects or /files/{key}" />
                    <small class="form-hint">DELETE endpoint pattern. Use {key} for dynamic key.</small>
                  </div>
                </div>

                <div class="form-group">
                  <label for="listEndpoint">List Endpoint (Optional)</label>
                  <input type="text" id="listEndpoint" name="listEndpoint" 
                    value="${this.s3Settings?.listEndpoint || ''}"
                    placeholder="/objects or /files" />
                </div>

                <div class="form-group">
                  <label for="publicUrlBase">Public URL Base (Optional)</label>
                  <input type="text" id="publicUrlBase" name="publicUrlBase" 
                    value="${this.s3Settings?.publicUrlBase || ''}"
                    placeholder="https://cdn.minibucket.example.com" />
                  <small class="form-hint">Base URL for public file access. If empty, uses API base URL.</small>
                </div>

                <div class="form-group">
                  <label for="urlPattern">URL Pattern</label>
                  <input type="text" id="urlPattern" name="urlPattern" 
                    value="${this.s3Settings?.urlPattern || '{baseUrl}/{key}'}"
                    placeholder="{baseUrl}/{key}" />
                  <small class="form-hint">Template for constructing file URLs. Use {baseUrl} and {key} placeholders.</small>
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="forceHttps" name="forceHttps" 
                      ${this.s3Settings?.forceHttps !== false ? 'checked' : ''} />
                    <span>Force HTTPS</span>
                  </label>
                </div>

                <div class="form-actions">
                  <button type="button" class="secondary-btn" id="test-btn" ${this.testing ? 'disabled' : ''}>
                    ${this.testing ? 'Testing...' : '🔌 Test Connection'}
                  </button>
                  <button type="submit" class="primary-btn" ${this.saving ? 'disabled' : ''}>
                    ${this.saving ? 'Saving...' : '💾 Save Settings'}
                  </button>
                </div>

                <div id="s3-message" class="message-box hidden"></div>
              </form>
            </div>


          <div class="settings-section">
            <h2>Preferences</h2>
            <div class="setting-row">
              <label>Theme</label>
              <select class="setting-select">
                <option>Dark (Default)</option>
                <option>Light (Coming Soon)</option>
              </select>
            </div>
            <div class="setting-row">
              <label>Auto-save interval</label>
              <select class="setting-select">
                <option>Every 30 seconds</option>
                <option>Every minute</option>
                <option>Every 5 minutes</option>
                <option>Manual only</option>
              </select>
            </div>
          </div>

          <div class="settings-section">
            <h2>Session</h2>
            <button class="danger-btn" id="logout-btn">Sign Out</button>
          </div>
        </div>
      </div>
    `;

    // document.getElementById('back-btn').addEventListener('click', () => {
    //   router.navigate('/dashboard');
    // });

    // document.getElementById('logout-btn').addEventListener('click', async () => {
    //   await authService.logout();
    // });
    this.attachEventListeners();

  }

    async loadSettings() {
    try {
      const response = await fetch('/api/storage-settings', {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (response.ok) {
        this.s3Settings = await response.json();
      }
    } catch (error) {
      console.error('[Settings] Failed to load S3 settings:', error);
    } finally {
      this.loading = false;
    }
  }

  attachEventListeners() {
    document.getElementById('back-btn').addEventListener('click', () => {
      router.navigate('/dashboard');
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
      await authService.logout();
    });

    // S3 Form Submit
    document.getElementById('s3-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveSettings();
    });

    // Test Connection
    document.getElementById('test-btn').addEventListener('click', async () => {
      await this.testConnection();
    });
  }

getFormData() {
  return {
    provider: document.getElementById('provider').value,
    isActive: document.getElementById('isActive').checked,
    baseUrl: document.getElementById('baseUrl').value.trim(),
    apiKey: document.getElementById('apiKey').value.trim(),
    authType: document.getElementById('authType').value,
    authHeader: document.getElementById('authHeader').value.trim(),
    uploadEndpoint: document.getElementById('uploadEndpoint').value.trim(),
    deleteEndpoint: document.getElementById('deleteEndpoint').value.trim(),
    listEndpoint: document.getElementById('listEndpoint').value.trim(),
    publicUrlBase: document.getElementById('publicUrlBase').value.trim(),
    urlPattern: document.getElementById('urlPattern').value.trim(),
    forceHttps: document.getElementById('forceHttps').checked
  };
}

  async saveSettings() {
    this.saving = true;
    this.showMessage('Saving...', 'info');
    
    try {
      const data = this.getFormData();
      
      const response = await fetch('/api/storage-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        this.showMessage('✓ Settings saved successfully!', 'success');
        this.s3Settings = result.settings;
      } else {
        this.showMessage('✕ Failed to save settings', 'error');
      }
    } catch (error) {
      this.showMessage('✕ Error: ' + error.message, 'error');
    } finally {
      this.saving = false;
      setTimeout(() => this.render(), 1000);
    }
  }

  async testConnection() {
    this.testing = true;
    this.showMessage('Testing connection...', 'info');
    
    try {
      const data = this.getFormData();
      
      const response = await fetch('/api/storage-settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        this.showMessage('✓ ' + result.message, 'success');
      } else {
        this.showMessage('✕ ' + result.message, 'error');
      }
    } catch (error) {
      this.showMessage('✕ Test failed: ' + error.message, 'error');
    } finally {
      this.testing = false;
    }
  }

  showMessage(message, type) {
    const msgBox = document.getElementById('s3-message');
    if (msgBox) {
      msgBox.textContent = message;
      msgBox.className = `message-box ${type}`;
      msgBox.classList.remove('hidden');
    }
  }

  getStyles() {
    return `
      .settings-page {
        min-height: 100vh;
        background: #1e1e1e;
        color: #ccc;
        padding: 24px;
      }
      .settings-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 32px;
        max-width: 800px;
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
      .back-btn:hover {
        background: #2a2d2e;
      }
      .settings-header h1 {
        color: #fff;
        margin: 0;
      }
      .settings-content {
        max-width: 800px;
        margin: 0 auto;
      }
      .settings-section {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        padding: 24px;
        margin-bottom: 20px;
      }
      .settings-section h2 {
        color: #fff;
        font-size: 16px;
        margin: 0 0 16px 0;
        padding-bottom: 12px;
        border-bottom: 1px solid #3e3e42;
      }
      .setting-row {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 16px;
        align-items: center;
        padding: 12px 0;
      }
      .setting-row label {
        color: #858585;
        font-size: 13px;
      }
      .setting-value {
        color: #fff;
        font-size: 14px;
      }
      .setting-value.mono {
        font-family: monospace;
        font-size: 12px;
        color: #858585;
      }
      .setting-select {
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        color: #fff;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 13px;
        max-width: 300px;
      }
      .danger-btn {
        background: #dc2626;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }
      .danger-btn:hover {
        background: #b91c1c;
      }
    `;
  }

    getStylesTwo() {
    return `
      .settings-page {
        min-height: 100vh;
        background: #1e1e1e;
        color: #ccc;
        padding: 24px;
        overflow-y: auto;
      }
      .settings-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 32px;
        max-width: 900px;
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
      .settings-header h1 { color: #fff; margin: 0; }
      .settings-content {
        max-width: 900px;
        margin: 0 auto;
        padding-bottom: 40px;
      }
      .settings-section {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        padding: 24px;
        margin-bottom: 20px;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .settings-section h2 {
        color: #fff;
        font-size: 16px;
        margin: 0;
      }
      .section-description {
        color: #858585;
        font-size: 13px;
        margin: 8px 0 20px 0;
        line-height: 1.5;
      }
      .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
      .status-badge.active {
        background: rgba(74, 222, 128, 0.2);
        color: #4ade80;
      }
      .status-badge.inactive {
        background: rgba(255, 255, 255, 0.1);
        color: #858585;
      }
      .s3-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .form-group label {
        color: #ccc;
        font-size: 13px;
        font-weight: 500;
      }
      .form-group input, .form-group select {
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        color: #fff;
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 13px;
        width: 100%;
      }
      .form-group input:focus, .form-group select:focus {
        outline: none;
        border-color: #007acc;
      }
      .form-hint {
        color: #858585;
        font-size: 11px;
        margin-top: 2px;
      }
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        color: #ccc;
        font-size: 13px;
      }
      .checkbox-label input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 8px;
        padding-top: 16px;
        border-top: 1px solid #3e3e42;
      }
      .primary-btn {
        background: #007acc;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
      }
      .primary-btn:hover:not(:disabled) { background: #0098ff; }
      .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .secondary-btn {
        background: #2d2d30;
        color: #ccc;
        border: 1px solid #3e3e42;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
      }
      .secondary-btn:hover:not(:disabled) { background: #2a2d2e; }
      .secondary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .danger-btn {
        background: #dc2626;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
      }
      .danger-btn:hover { background: #b91c1c; }
      .message-box {
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 13px;
        margin-top: 8px;
      }
      .message-box.success {
        background: rgba(74, 222, 128, 0.1);
        border: 1px solid rgba(74, 222, 128, 0.3);
        color: #4ade80;
      }
      .message-box.error {
        background: rgba(248, 113, 113, 0.1);
        border: 1px solid rgba(248, 113, 113, 0.3);
        color: #f87171;
      }
      .message-box.info {
        background: rgba(0, 122, 204, 0.1);
        border: 1px solid rgba(0, 122, 204, 0.3);
        color: #007acc;
      }
      .message-box.hidden { display: none; }
      .setting-row {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 16px;
        align-items: center;
        padding: 12px 0;
      }
      .setting-row label {
        color: #858585;
        font-size: 13px;
      }
      .setting-value { color: #fff; font-size: 14px; }
    `;
  }

  destroy() {}
}