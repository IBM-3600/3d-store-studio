// src/core/PluginManager.js
import { EventBus } from './EventBus.js';

export class PluginManager {
  constructor() {
    this.plugins = new Map();
  }

  register(plugin) {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already registered.`);
      return;
    }

    console.log(`[Plugin] Registering: ${plugin.name} v${plugin.version}`);
    this.plugins.set(plugin.name, plugin);

    // Initialize plugin, passing core APIs it is allowed to use
    if (typeof plugin.init === 'function') {
      plugin.init({
        eventBus: EventBus,
        sceneManager: window.app.sceneManager, // Exposed globally or via DI
        apiService: window.app.apiService,
        ui: {
          registerToolbarButton: this.registerToolbarButton,
          registerInspectorPanel: this.registerInspectorPanel
        }
      });
    }
  }

  unregister(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (plugin && typeof plugin.destroy === 'function') {
      plugin.destroy();
    }
    this.plugins.delete(pluginName);
  }

  // Hooks for plugins to extend UI
  registerToolbarButton(pluginName, buttonConfig) {
    EventBus.emit('ui:register_toolbar_button', { pluginName, ...buttonConfig });
  }
}

export const pluginManager = new PluginManager();