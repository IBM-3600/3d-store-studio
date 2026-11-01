// src/plugins/WooCommerceSyncPlugin.js
export class WooCommerceSyncPlugin {
  constructor() {
    this.name = 'WooCommerceSync';
    this.version = '1.0.0';
  }

  init({ eventBus, apiService, ui }) {
    // 1. Add a button to the top toolbar
    ui.registerToolbarButton(this.name, {
      id: 'wc-sync-btn',
      label: 'Sync WooCommerce',
      icon: '🔄',
      onClick: () => this.triggerSync(apiService)
    });

    // 2. Listen for core events to extend behavior
    eventBus.on('product:selected', (product) => {
      if (product.source === 'woocommerce') {
        console.log('Extending inspector for WooCommerce specific fields...');
        // Emit event to dynamically inject WC-specific fields into the Inspector panel
        eventBus.emit('inspector:inject_fields', { fields: ['wc_category', 'wc_attributes'] });
      }
    });
  }

  async triggerSync(apiService) {
    console.log('Triggering WC Sync...');
    // Call backend endpoint specific to this plugin
    await apiService.post('/api/plugins/woocommerce/sync');
  }

  destroy() {
    // Cleanup listeners, remove UI elements
    console.log('WooCommerceSync plugin destroyed.');
  }
}