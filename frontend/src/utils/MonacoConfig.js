// src/utils/MonacoConfig.js
import * as monaco from 'monaco-editor';

// Note: In Vite, you need the vite-plugin-monaco-editor to handle web workers properly.
// For vanilla JS without bundlers, load Monaco via AMD loader from a CDN.

export function initMonacoEditor(containerElement, initialCode = '') {
  // If using a bundler like Vite, import directly. 
  // If vanilla via CDN, use require.config as shown below:
  
  require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});

  return new Promise((resolve) => {
    require(['vs/editor/editor.main'], () => {
      const editor = monaco.editor.create(containerElement, {
        value: initialCode || `// Custom Interaction Script
// Available context: \`entity\`, \`sceneManager\`, \`analytics\`

function onHover(entity) {
  // GSAP animation example
  // gsap.to(entity.object3d.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.2 });
}

function onClick(entity) {
  analytics.track('product_click', { productId: entity.productId });
  // Open custom modal or trigger animation
}`,
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        scrollBeyondLastLine: false,
        roundedSelection: false,
      });

      resolve(editor);
    });
  });
}

// Usage in Inspector Panel:
// const editor = await initMonacoEditor(document.getElementById('script-editor-container'));
// editor.onDidChangeModelContent(() => {
//   const code = editor.getValue();
//   EventBus.emit('entity:script_updated', { entityId: currentEntity.id, code });
// });