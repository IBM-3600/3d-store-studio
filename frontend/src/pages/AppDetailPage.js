// frontend/src/pages/AppDetailPage.js
import { authService } from '../services/AuthService.js';
import { router } from '../core/Router.js';
import '../ui/components/AppSecretReveal.js';

export class AppDetailPage {
  constructor(container, params) {
    this.container = container;
    this.appId = params.appId;
    this.app = null;
    this.loading = true;
    this.saving = false;
    this.activeTab = 'overview';
  }

  async render() {
    await this.loadApp();

    this.container.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="app-detail-page">
        <header class="page-header">
          <button class="back-btn" id="back-btn">← Back to Applications</button>
          ${this.app ? `
            <div class="header-title">
              <h1>${this.escapeHtml(this.app.name)}</h1>
              <span class="app-status ${this.app.status.toLowerCase()}">${this.app.status}</span>
            </div>
            <div class="header-actions">
              <button class="secondary-btn" id="toggle-status-btn">
                ${this.app.status === 'ACTIVE' ? '⏸️ Suspend' : '▶️ Activate'}
              </button>
              <button class="danger-btn" id="delete-btn">🗑️ Delete</button>
            </div>
          ` : ''}
        </header>

        <div class="detail-content">
          ${this.loading ? this.renderLoading() : this.renderTabs()}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  async loadApp() {
    try {
      const response = await fetch(`/api/applications/${this.appId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });

      if (!response.ok) throw new Error('Failed to load application');

      this.app = await response.json();
      this.loading = false;
    } catch (error) {
      console.error('[AppDetail] Load error:', error);
      this.loading = false;
      this.container.innerHTML = `
        <div class="error-state">
          <h2>Failed to load application</h2>
          <p>${error.message}</p>
          <button class="primary-btn" onclick="history.back()">Go Back</button>
        </div>
      `;
    }
  }

  renderLoading() {
    return `
      <div class="loading-state">
        <div class="spinner-large"></div>
        <p>Loading application details...</p>
      </div>
    `;
  }

  renderTabs() {
    if (!this.app) return '';

    const tabs = [
      { id: 'overview', label: '📋 Overview' },
      { id: 'environments', label: '🌐 Environments' },
      { id: 'webhooks', label: '🔔 Webhooks' },
      { id: 'history', label: '📜 Publish History' },
      { id: 'logs', label: '📊 Integration Logs' }
    ];

    return `
      <nav class="tab-nav">
        ${tabs.map(tab => `
          <button class="tab-btn ${this.activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">
            ${tab.label}
          </button>
        `).join('')}
      </nav>

      <div class="tab-content">
        ${this.renderTabContent()}
      </div>
    `;
  }

  renderTabContent() {
    switch (this.activeTab) {
      case 'overview': return this.renderOverviewTab();
      case 'environments': return this.renderEnvironmentsTab();
      case 'webhooks': return this.renderWebhooksTab();
      case 'history': return this.renderHistoryTab();
      case 'logs': return this.renderLogsTab();
      default: return this.renderOverviewTab();
    }
  }

  renderOverviewTab() {
    return `
      <div class="overview-grid">
        <!-- App Details Card -->
        <div class="card">
          <div class="card-header">
            <h2>Application Details</h2>
            <button class="secondary-btn" id="edit-details-btn">✏️ Edit</button>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">App ID</span>
              <code>${this.app.id}</code>
            </div>
            <div class="info-row">
              <span class="label">Slug</span>
              <code>${this.app.slug}</code>
            </div>
            <div class="info-row">
              <span class="label">Website</span>
              <span>${this.app.website || '—'}</span>
            </div>
            <div class="info-row">
              <span class="label">Description</span>
              <span>${this.escapeHtml(this.app.description) || '—'}</span>
            </div>
            <div class="info-row">
              <span class="label">Status</span>
              <span class="status-badge ${this.app.status.toLowerCase()}">${this.app.status}</span>
            </div>
            <div class="info-row">
              <span class="label">Created</span>
              <span>${new Date(this.app.createdAt).toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="label">Secret Last Used</span>
              <span>${this.app.secretLastUsed ? new Date(this.app.secretLastUsed).toLocaleString() : 'Never'}</span>
            </div>
          </div>
        </div>

        <!-- Allowed Origins Card -->
        <div class="card">
          <div class="card-header">
            <h2>Allowed Origins</h2>
            <button class="secondary-btn" id="edit-origins-btn">✏️ Edit</button>
          </div>
          <div class="card-body">
            ${this.app.allowedOrigins && this.app.allowedOrigins.length > 0 
              ? this.app.allowedOrigins.map(origin => `
                  <div class="origin-tag">
                    <span>${this.escapeHtml(origin)}</span>
                  </div>
                `).join('')
              : '<p class="empty-text">No origins configured. All origins are allowed.</p>'
            }
          </div>
        </div>

        <!-- Quick Stats Card -->
        <div class="card">
          <div class="card-header">
            <h2>Statistics</h2>
          </div>
          <div class="card-body">
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">${this.app.environments?.length || 0}</span>
                <span class="stat-label">Environments</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">${this.app.webhooks?.length || 0}</span>
                <span class="stat-label">Webhooks</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">${this.app.publishedVersions?.length || 0}</span>
                <span class="stat-label">Publishes</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">${this.app.integrationLogs?.length || 0}</span>
                <span class="stat-label">API Calls</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions Card -->
        <div class="card">
          <div class="card-header">
            <h2>Quick Actions</h2>
          </div>
          <div class="card-body">
            <button class="action-btn-full" onclick="window.location.href='/applications/${this.app.id}/integration'">
              🔌 View Integration Code
            </button>
            <button class="action-btn-full" id="regenerate-secret-btn">
              🔄 Regenerate Secret
            </button>
            <button class="action-btn-full" id="publish-all-btn">
              🚀 Publish to All Environments
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderEnvironmentsTab() {
    const environments = this.app.environments || [];

    return `
      <div class="environments-section">
        <div class="section-header">
          <h2>Environments</h2>
          <p class="section-desc">Each environment has its own independent deployment state and version history.</p>
        </div>

        <div class="env-grid">
          ${environments.map(env => `
            <div class="env-card ${!env.isActive ? 'inactive' : ''}">
              <div class="env-header">
                <div class="env-type-badge ${env.type.toLowerCase()}">${env.type}</div>
                <div class="env-status ${env.isActive ? 'active' : 'inactive'}">
                  ${env.isActive ? '● Active' : '○ Inactive'}
                </div>
              </div>
              
              <h3>${this.escapeHtml(env.name)}</h3>
              
              <div class="env-details">
                <div class="env-row">
                  <span class="label">Store URL</span>
                  <span class="value">${env.storeUrl || '—'}</span>
                </div>
                <div class="env-row">
                  <span class="label">Notify Endpoint</span>
                  <span class="value mono">${env.notifyEndpoint || '—'}</span>
                </div>
                <div class="env-row">
                  <span class="label">Current Version</span>
                  <span class="value version">v${env.currentVersion || 0}</span>
                </div>
                <div class="env-row">
                  <span class="label">Current World</span>
                  <span class="value">${env.currentWorldName || 'None'}</span>
                </div>
                <div class="env-row">
                  <span class="label">Last Deployed</span>
                  <span class="value">${env.lastDeployedAt ? new Date(env.lastDeployedAt).toLocaleString() : 'Never'}</span>
                </div>
              </div>

              <div class="env-actions">
                <button class="action-btn" data-env-action="edit" data-env-id="${env.id}">✏️ Edit</button>
                <button class="action-btn" data-env-action="publish" data-env-id="${env.id}">🚀 Publish</button>
                <button class="action-btn" data-env-action="toggle" data-env-id="${env.id}">
                  ${env.isActive ? '⏸️ Disable' : '▶️ Enable'}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderWebhooksTab() {
    const webhooks = this.app.webhooks || [];

    return `
      <div class="webhooks-section">
        <div class="section-header">
          <div>
            <h2>Webhooks</h2>
            <p class="section-desc">Endpoints that receive real-time notifications when events occur.</p>
          </div>
          <button class="primary-btn" id="add-webhook-btn">+ Add Webhook</button>
        </div>

        ${webhooks.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🔔</div>
            <h3>No webhooks configured</h3>
            <p>Add a webhook to receive real-time notifications when worlds are published.</p>
          </div>
        ` : `
          <div class="webhooks-list">
            ${webhooks.map(webhook => `
              <div class="webhook-card ${!webhook.isActive ? 'inactive' : ''}">
                <div class="webhook-header">
                  <div class="webhook-url">${this.escapeHtml(webhook.url)}</div>
                  <div class="webhook-status ${webhook.lastStatus >= 200 && webhook.lastStatus < 300 ? 'success' : webhook.lastStatus ? 'error' : 'pending'}">
                    ${webhook.lastStatus ? `Last: ${webhook.lastStatus}` : 'Not triggered'}
                  </div>
                </div>
                
                <div class="webhook-events">
                  ${(webhook.events || []).map(event => `
                    <span class="event-tag">${event}</span>
                  `).join('')}
                </div>

                <div class="webhook-meta">
                  <span>${webhook.isActive ? '✓ Active' : '✗ Disabled'}</span>
                  <span>Last triggered: ${webhook.lastTriggeredAt ? new Date(webhook.lastTriggeredAt).toLocaleString() : 'Never'}</span>
                </div>

                <div class="webhook-actions">
                  <button class="action-btn" data-webhook-action="test" data-webhook-id="${webhook.id}">🧪 Test</button>
                  <button class="action-btn" data-webhook-action="toggle" data-webhook-id="${webhook.id}">
                    ${webhook.isActive ? '⏸️ Disable' : '▶️ Enable'}
                  </button>
                  <button class="action-btn danger" data-webhook-action="delete" data-webhook-id="${webhook.id}">🗑️ Delete</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  renderHistoryTab() {
    const history = this.app.publishedVersions || [];

    return `
      <div class="history-section">
        <div class="section-header">
          <h2>Publish History</h2>
          <p class="section-desc">Recent publish events across all environments.</p>
        </div>

        ${history.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📜</div>
            <h3>No publish history</h3>
            <p>This application hasn't received any published worlds yet.</p>
          </div>
        ` : `
          <div class="history-list">
            ${history.map(record => `
              <div class="history-row ${record.state.toLowerCase()}">
                <div class="history-version">v${record.version}</div>
                <div class="history-info">
                  <div class="history-world">${record.worldName || 'World'}</div>
                  <div class="history-env">${record.environmentType || '—'}</div>
                </div>
                <div class="history-state">
                  <span class="state-badge ${record.state.toLowerCase()}">${record.state}</span>
                </div>
                <div class="history-date">
                  ${new Date(record.publishedAt).toLocaleString()}
                </div>
                <div class="history-actions">
                  ${record.state === 'SUCCESS' ? `
                    <button class="action-btn" data-history-action="rollback" data-record-id="${record.id}">
                      ⏪ Rollback
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  renderLogsTab() {
    const logs = this.app.integrationLogs || [];

    return `
      <div class="logs-section">
        <div class="section-header">
          <h2>Integration Logs</h2>
          <p class="section-desc">Recent API calls made by your 3D Store servers.</p>
        </div>

        ${logs.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <h3>No API calls logged</h3>
            <p>API calls from your 3D Store will appear here.</p>
          </div>
        ` : `
          <div class="logs-table">
            <div class="logs-header">
              <span>Time</span>
              <span>Method</span>
              <span>Endpoint</span>
              <span>Action</span>
              <span>IP</span>
            </div>
            ${logs.map(log => `
              <div class="logs-row">
                <span>${new Date(log.createdAt).toLocaleString()}</span>
                <span class="method ${log.method?.toLowerCase()}">${log.method}</span>
                <span class="endpoint">${this.escapeHtml(log.endpoint || '—')}</span>
                <span>${this.escapeHtml(log.action)}</span>
                <span class="ip">${this.escapeHtml(log.ipAddress || '—')}</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  attachEventListeners() {
    document.getElementById('back-btn')?.addEventListener('click', () => {
      router.navigate('/applications');
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.render();
      });
    });

    // Header actions
    document.getElementById('toggle-status-btn')?.addEventListener('click', () => {
      this.toggleAppStatus();
    });

    document.getElementById('delete-btn')?.addEventListener('click', () => {
      this.deleteApp();
    });

    // Overview actions
    document.getElementById('edit-details-btn')?.addEventListener('click', () => {
      this.showEditDetailsModal();
    });

    document.getElementById('edit-origins-btn')?.addEventListener('click', () => {
      this.showEditOriginsModal();
    });

    document.getElementById('regenerate-secret-btn')?.addEventListener('click', () => {
      this.handleRegenerateSecret();
    });

    document.getElementById('publish-all-btn')?.addEventListener('click', () => {
      this.showPublishModal();
    });

    // Environment actions
    document.querySelectorAll('[data-env-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.envAction;
        const envId = btn.dataset.envId;
        this.handleEnvironmentAction(action, envId);
      });
    });

    // Webhook actions
    document.getElementById('add-webhook-btn')?.addEventListener('click', () => {
      this.showAddWebhookModal();
    });

    document.querySelectorAll('[data-webhook-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.webhookAction;
        const webhookId = btn.dataset.webhookId;
        this.handleWebhookAction(action, webhookId);
      });
    });

    // History actions
    document.querySelectorAll('[data-history-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.historyAction;
        const recordId = btn.dataset.recordId;
        this.handleHistoryAction(action, recordId);
      });
    });
  }

  // ═══════════════════════════════════════════════════
  //  ACTIONS
  // ═══════════════════════════════════════════════════

  async toggleAppStatus() {
    const newStatus = this.app.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    
    if (!confirm(`${newStatus === 'SUSPENDED' ? 'Suspend' : 'Activate'} this application?`)) return;

    try {
      const response = await fetch(`/api/applications/${this.appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');

      this.app.status = newStatus;
      this.render();
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  }

  async deleteApp() {
    if (!confirm(`Delete "${this.app.name}"? This cannot be undone.`)) return;
    if (!confirm(`Type "${this.app.slug}" to confirm deletion`)) return;

    try {
      const response = await fetch(`/api/applications/${this.appId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });

      if (!response.ok) throw new Error('Failed to delete application');

      router.navigate('/applications');
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  }

  async handleRegenerateSecret() {
    if (!confirm('Regenerate secret? The old secret will stop working immediately.')) return;

    try {
      const response = await fetch(`/api/applications/${this.appId}/regenerate-secret`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });

      const result = await response.json();

      if (result.success) {
        const modal = document.createElement('app-secret-reveal');
        document.body.appendChild(modal);
        modal.open({
          secret: result.appSecret,
          appName: this.app.name,
          appId: this.app.id,
          webhookSecret: this.app.webhookSecret
        });
      } else {
        alert(result.error || 'Failed to regenerate');
      }
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  }

  showEditDetailsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>Edit Application</h2>
          <button class="close-btn">&times;</button>
        </div>
        <form id="edit-form">
          <div class="form-group">
            <label>Name</label>
            <input type="text" id="edit-name" value="${this.escapeHtml(this.app.name)}" required />
          </div>
          <div class="form-group">
            <label>Website</label>
            <input type="url" id="edit-website" value="${this.escapeHtml(this.app.website || '')}" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="edit-description" rows="3">${this.escapeHtml(this.app.description || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Logo URL</label>
            <input type="url" id="edit-logo" value="${this.escapeHtml(this.app.logoUrl || '')}" />
          </div>
          <div class="modal-footer">
            <button type="button" class="secondary-btn cancel-btn">Cancel</button>
            <button type="submit" class="primary-btn">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachModalListeners(modal, async () => {
      const data = {
        name: document.getElementById('edit-name').value.trim(),
        website: document.getElementById('edit-website').value.trim(),
        description: document.getElementById('edit-description').value.trim(),
        logoUrl: document.getElementById('edit-logo').value.trim()
      };

      const response = await fetch(`/api/applications/${this.appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to update');

      modal.remove();
      await this.loadApp();
      this.render();
    });
  }

  showEditOriginsModal() {
    const origins = (this.app.allowedOrigins || []).join(', ');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>Edit Allowed Origins</h2>
          <button class="close-btn">&times;</button>
        </div>
        <form id="origins-form">
          <div class="form-group">
            <label>Allowed Origins (comma-separated)</label>
            <textarea id="edit-origins" rows="4" placeholder="https://mystore.com, http://localhost:3000">${origins}</textarea>
            <small>Leave empty to allow all origins</small>
          </div>
          <div class="modal-footer">
            <button type="button" class="secondary-btn cancel-btn">Cancel</button>
            <button type="submit" class="primary-btn">Save</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachModalListeners(modal, async () => {
      const originsStr = document.getElementById('edit-origins').value.trim();
      const allowedOrigins = originsStr ? originsStr.split(',').map(o => o.trim()).filter(o => o) : [];

      const response = await fetch(`/api/applications/${this.appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ allowedOrigins })
      });

      if (!response.ok) throw new Error('Failed to update');

      modal.remove();
      await this.loadApp();
      this.render();
    });
  }

  showAddWebhookModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>Add Webhook</h2>
          <button class="close-btn">&times;</button>
        </div>
        <form id="webhook-form">
          <div class="form-group">
            <label>Webhook URL *</label>
            <input type="url" id="webhook-url" required placeholder="https://mystore.com/webhooks/studio" />
          </div>
          <div class="form-group">
            <label>Events (comma-separated)</label>
            <input type="text" id="webhook-events" value="world.published,world.rolled_back" />
            <small>Use * for all events</small>
          </div>
          <div class="modal-footer">
            <button type="button" class="secondary-btn cancel-btn">Cancel</button>
            <button type="submit" class="primary-btn">Add Webhook</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachModalListeners(modal, async () => {
      const url = document.getElementById('webhook-url').value.trim();
      const eventsStr = document.getElementById('webhook-events').value.trim();
      const events = eventsStr ? eventsStr.split(',').map(e => e.trim()) : ['*'];

      const response = await fetch(`/api/applications/${this.appId}/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ url, events })
      });

      if (!response.ok) throw new Error('Failed to add webhook');

      modal.remove();
      await this.loadApp();
      this.render();
    });
  }

  showPublishModal() {
    const worlds = []; // Would load from API
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>Publish to All Environments</h2>
          <button class="close-btn">&times;</button>
        </div>
        <form id="publish-form">
          <div class="form-group">
            <label>Select World</label>
            <select id="publish-world" required>
              <option value="">Choose a world...</option>
              <option value="placeholder">Loading worlds...</option>
            </select>
          </div>
          <div class="warning-box">
            ⚠️ This will publish the selected world to all active environments.
          </div>
          <div class="modal-footer">
            <button type="button" class="secondary-btn cancel-btn">Cancel</button>
            <button type="submit" class="primary-btn">🚀 Publish</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachModalListeners(modal, async () => {
      const worldId = document.getElementById('publish-world').value;
      if (!worldId) throw new Error('Select a world');

      const response = await fetch(`/api/publish/apps/${this.appId}/all-environments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ worldId })
      });

      if (!response.ok) throw new Error('Publish failed');

      modal.remove();
      alert('Publish initiated');
      this.activeTab = 'history';
      this.render();
    });

    // Load worlds into select
    this.loadWorldsIntoSelect(modal.querySelector('#publish-world'));
  }

  async loadWorldsIntoSelect(selectEl) {
    try {
      const response = await fetch('/api/worlds', {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });

      const data = await response.json();
      const worlds = data.worlds || [];

      selectEl.innerHTML = '<option value="">Choose a world...</option>' +
        worlds.map(w => `<option value="${w.id}">${this.escapeHtml(w.name)}</option>`).join('');
    } catch (error) {
      selectEl.innerHTML = '<option value="">Failed to load worlds</option>';
    }
  }

  async handleEnvironmentAction(action, envId) {
    switch (action) {
      case 'edit':
        this.showEditEnvironmentModal(envId);
        break;
      case 'publish':
        this.showPublishToEnvironmentModal(envId);
        break;
      case 'toggle':
        this.toggleEnvironment(envId);
        break;
    }
  }

  async handleWebhookAction(action, webhookId) {
    switch (action) {
      case 'test':
        await this.testWebhook(webhookId);
        break;
      case 'toggle':
        await this.toggleWebhook(webhookId);
        break;
      case 'delete':
        if (confirm('Delete this webhook?')) {
          await this.deleteWebhook(webhookId);
        }
        break;
    }
  }

  async handleHistoryAction(action, recordId) {
    if (action === 'rollback') {
      if (!confirm('Rollback to this version?')) return;
      // Implement rollback logic
      alert('Rollback initiated');
    }
  }

  async toggleEnvironment(envId) {
    const env = this.app.environments.find(e => e.id === envId);
    if (!env) return;

    try {
      await fetch(`/api/applications/${this.appId}/environments/${envId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ isActive: !env.isActive })
      });

      await this.loadApp();
      this.render();
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  }

  async testWebhook(webhookId) {
    try {
      const response = await fetch(`/api/applications/${this.appId}/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });

      const result = await response.json();
      alert(result.success ? '✓ Webhook test successful' : '✕ Test failed: ' + result.message);
    } catch (error) {
      alert('Test failed: ' + error.message);
    }
  }

  async toggleWebhook(webhookId) {
    const webhook = this.app.webhooks.find(w => w.id === webhookId);
    if (!webhook) return;

    try {
      await fetch(`/api/applications/${this.appId}/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ isActive: !webhook.isActive })
      });

      await this.loadApp();
      this.render();
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  }

  async deleteWebhook(webhookId) {
    try {
      await fetch(`/api/applications/${this.appId}/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });

      await this.loadApp();
      this.render();
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  }

  showEditEnvironmentModal(envId) {
    const env = this.app.environments.find(e => e.id === envId);
    if (!env) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>Edit ${env.name} Environment</h2>
          <button class="close-btn">&times;</button>
        </div>
        <form id="env-form">
          <div class="form-group">
            <label>Environment Name</label>
            <input type="text" id="env-name" value="${this.escapeHtml(env.name)}" required />
          </div>
          <div class="form-group">
            <label>Store URL</label>
            <input type="url" id="env-store-url" value="${this.escapeHtml(env.storeUrl || '')}" placeholder="https://mystore.com" />
          </div>
          <div class="form-group">
            <label>Notify Endpoint</label>
            <input type="url" id="env-notify-endpoint" value="${this.escapeHtml(env.notifyEndpoint || '')}" placeholder="https://mystore.com/api/studio/notify" />
          </div>
          <div class="modal-footer">
            <button type="button" class="secondary-btn cancel-btn">Cancel</button>
            <button type="submit" class="primary-btn">Save</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachModalListeners(modal, async () => {
      const data = {
        name: document.getElementById('env-name').value.trim(),
        storeUrl: document.getElementById('env-store-url').value.trim(),
        notifyEndpoint: document.getElementById('env-notify-endpoint').value.trim()
      };

      const response = await fetch(`/api/applications/${this.appId}/environments/${envId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to update');

      modal.remove();
      await this.loadApp();
      this.render();
    });
  }

  showPublishToEnvironmentModal(envId) {
    const env = this.app.environments.find(e => e.id === envId);
    if (!env) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>Publish to ${env.name}</h2>
          <button class="close-btn">&times;</button>
        </div>
        <form id="publish-env-form">
          <div class="form-group">
            <label>Select World</label>
            <select id="publish-env-world" required>
              <option value="">Choose a world...</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="secondary-btn cancel-btn">Cancel</button>
            <button type="submit" class="primary-btn">🚀 Publish</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachModalListeners(modal, async () => {
      const worldId = document.getElementById('publish-env-world').value;
      if (!worldId) throw new Error('Select a world');

      const response = await fetch(`/api/publish/apps/${this.appId}/environments/${envId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ worldId })
      });

      if (!response.ok) throw new Error('Publish failed');

      modal.remove();
      alert('Published successfully');
      await this.loadApp();
      this.render();
    });

    this.loadWorldsIntoSelect(modal.querySelector('#publish-env-world'));
  }

  attachModalListeners(modal, onSubmit) {
    const submit = async (e) => {
      e.preventDefault();
      const submitBtn = modal.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        await onSubmit();
      } catch (error) {
        alert('Error: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || 'Submit';
      }
    };

    modal.querySelector('form').addEventListener('submit', submit);
    modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
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
      .app-detail-page {
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
        max-width: 1400px;
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
      .header-title { flex: 1; display: flex; align-items: center; gap: 12px; }
      .header-title h1 { margin: 0; color: #fff; font-size: 22px; }
      .header-actions { display: flex; gap: 8px; }
      .app-status {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .app-status.active { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
      .app-status.suspended { background: rgba(248, 113, 113, 0.2); color: #f87171; }
      .app-status.inactive { background: rgba(255, 255, 255, 0.1); color: #858585; }
      .primary-btn {
        background: #007acc;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
      }
      .primary-btn:hover { background: #0098ff; }
      .secondary-btn {
        background: #2d2d30;
        color: #ccc;
        border: 1px solid #3e3e42;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
      }
      .secondary-btn:hover { background: #2a2d2e; }
      .danger-btn {
        background: rgba(248, 113, 113, 0.1);
        color: #f87171;
        border: 1px solid rgba(248, 113, 113, 0.3);
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
      }
      .danger-btn:hover { background: rgba(248, 113, 113, 0.2); }

      .detail-content {
        max-width: 1400px;
        margin: 0 auto;
      }

      .tab-nav {
        display: flex;
        gap: 4px;
        border-bottom: 1px solid #3e3e42;
        margin-bottom: 24px;
        overflow-x: auto;
      }
      .tab-btn {
        background: transparent;
        border: none;
        color: #858585;
        padding: 12px 20px;
        cursor: pointer;
        font-size: 14px;
        white-space: nowrap;
        border-bottom: 2px solid transparent;
        transition: all 0.15s;
      }
      .tab-btn:hover { color: #ccc; }
      .tab-btn.active {
        color: #fff;
        border-bottom-color: #007acc;
      }

      .overview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
      }
      .card {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        overflow: hidden;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #3e3e42;
        background: #2a2a2d;
      }
      .card-header h2 { margin: 0; color: #fff; font-size: 15px; }
      .card-body { padding: 16px 20px; }

      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #2d2d30;
      }
      .info-row:last-child { border-bottom: none; }
      .info-row .label { color: #858585; font-size: 13px; }
      .info-row .value, .info-row code { color: #fff; font-size: 13px; }
      .info-row code {
        background: #1e1e1e;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
      .info-row .mono { font-family: monospace; font-size: 12px; }

      .origin-tag {
        display: inline-block;
        background: #1e1e1e;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        color: #4ade80;
        margin: 4px 4px 4px 0;
        font-family: monospace;
      }
      .empty-text { color: #858585; font-size: 13px; font-style: italic; }

      .status-badge {
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .status-badge.active { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
      .status-badge.suspended { background: rgba(248, 113, 113, 0.2); color: #f87171; }
      .status-badge.success { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
      .status-badge.failed { background: rgba(248, 113, 113, 0.2); color: #f87171; }
      .status-badge.pending { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
      .stat-item { text-align: center; padding: 12px; background: #1e1e1e; border-radius: 6px; }
      .stat-value { display: block; font-size: 24px; font-weight: 600; color: #fff; }
      .stat-label { font-size: 12px; color: #858585; }

      .action-btn-full {
        width: 100%;
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        color: #ccc;
        padding: 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        text-align: left;
        margin-bottom: 8px;
        transition: all 0.15s;
      }
      .action-btn-full:hover {
        background: #2d2d30;
        border-color: #007acc;
      }
      .action-btn-full:last-child { margin-bottom: 0; }

      .section-header { margin-bottom: 20px; }
      .section-header h2 { margin: 0 0 8px 0; color: #fff; }
      .section-desc { color: #858585; font-size: 13px; margin: 0; }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .env-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 20px;
      }
      .env-card {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        padding: 20px;
      }
      .env-card.inactive { opacity: 0.6; }
      .env-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .env-type-badge {
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .env-type-badge.development { background: rgba(34, 211, 238, 0.2); color: #22d3ee; }
      .env-type-badge.staging { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
      .env-type-badge.production { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
      .env-status { font-size: 12px; }
      .env-status.active { color: #4ade80; }
      .env-status.inactive { color: #858585; }
      .env-card h3 { margin: 0 0 16px 0; color: #fff; font-size: 16px; }
      .env-details { margin-bottom: 16px; }
      .env-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #2d2d30;
        font-size: 12px;
      }
      .env-row:last-child { border-bottom: none; }
      .env-row .label { color: #858585; }
      .env-row .value { color: #fff; max-width: 60%; text-align: right; word-break: break-all; }
      .env-row .value.mono { font-family: monospace; font-size: 11px; }
      .env-row .value.version { font-weight: 600; color: #4ade80; }
      .env-actions { display: flex; gap: 6px; }
      .action-btn {
        flex: 1;
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        color: #ccc;
        padding: 6px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.15s;
      }
      .action-btn:hover { background: #2d2d30; border-color: #007acc; }
      .action-btn.danger { color: #f87171; }
      .action-btn.danger:hover { background: rgba(248, 113, 113, 0.1); }

      .webhooks-list { display: flex; flex-direction: column; gap: 12px; }
      .webhook-card {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        padding: 16px;
      }
      .webhook-card.inactive { opacity: 0.6; }
      .webhook-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .webhook-url {
        color: #fff;
        font-family: monospace;
        font-size: 13px;
        word-break: break-all;
      }
      .webhook-status {
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 10px;
      }
      .webhook-status.success { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
      .webhook-status.error { background: rgba(248, 113, 113, 0.2); color: #f87171; }
      .webhook-status.pending { background: rgba(255, 255, 255, 0.1); color: #858585; }
      .webhook-events { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
      .event-tag {
        background: #1e1e1e;
        padding: 3px 10px;
        border-radius: 4px;
        font-size: 11px;
        color: #22d3ee;
      }
      .webhook-meta {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #858585;
        margin-bottom: 12px;
      }
      .webhook-actions { display: flex; gap: 6px; }

      .history-list {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        overflow: hidden;
      }
      .history-row {
        display: grid;
        grid-template-columns: 80px 1fr 120px 180px 100px;
        gap: 16px;
        padding: 14px 20px;
        border-bottom: 1px solid #2d2d30;
        align-items: center;
      }
      .history-row:last-child { border-bottom: none; }
      .history-version { font-family: monospace; font-weight: 600; color: #4ade80; }
      .history-world { color: #fff; font-size: 13px; }
      .history-env { color: #858585; font-size: 11px; }
      .history-date { color: #858585; font-size: 12px; }

      .logs-section { background: #252526; border: 1px solid #3e3e42; border-radius: 8px; overflow: hidden; }
      .logs-table { padding: 0; }
      .logs-header {
        display: grid;
        grid-template-columns: 180px 80px 1fr 150px 120px;
        gap: 16px;
        padding: 12px 20px;
        background: #2a2a2d;
        font-size: 11px;
        font-weight: 600;
        color: #858585;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .logs-row {
        display: grid;
        grid-template-columns: 180px 80px 1fr 150px 120px;
        gap: 16px;
        padding: 10px 20px;
        border-bottom: 1px solid #2d2d30;
        font-size: 12px;
      }
      .logs-row:last-child { border-bottom: none; }
      .logs-row .method { font-family: monospace; font-weight: 600; text-transform: uppercase; }
      .logs-row .method.get { color: #4ade80; }
      .logs-row .method.post { color: #22d3ee; }
      .logs-row .method.patch { color: #fbbf24; }
      .logs-row .method.delete { color: #f87171; }
      .logs-row .endpoint { font-family: monospace; color: #fff; word-break: break-all; }
      .logs-row .ip { color: #858585; font-family: monospace; font-size: 11px; }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
      }
      .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
      .empty-state h3 { color: #fff; margin: 0 0 8px 0; }
      .empty-state p { color: #858585; margin: 0; }

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

      .modal-overlay {
        position: fixed;
        inset: 0;
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
        width: 100%;
        max-width: 550px;
        max-height: 90vh;
        overflow-y: auto;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .modal-header h2 { margin: 0; color: #fff; font-size: 18px; }
      .close-btn {
        background: transparent;
        border: none;
        color: #858585;
        font-size: 24px;
        cursor: pointer;
      }
      .close-btn:hover { color: #fff; }
      .form-group { margin-bottom: 16px; }
      .form-group label {
        display: block;
        color: #ccc;
        font-size: 13px;
        margin-bottom: 6px;
      }
      .form-group input, .form-group textarea, .form-group select {
        width: 100%;
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        color: #fff;
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
      }
      .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
        outline: none;
        border-color: #007acc;
      }
      .form-group small { color: #858585; font-size: 11px; margin-top: 4px; display: block; }
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 20px;
      }
      .warning-box {
        background: rgba(251, 191, 36, 0.1);
        border: 1px solid rgba(251, 191, 36, 0.3);
        color: #fbbf24;
        padding: 12px;
        border-radius: 6px;
        font-size: 13px;
        margin: 16px 0;
      }
    `;
  }

  destroy() {}
}