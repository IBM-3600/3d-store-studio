// src/editor/AudioManager.js
import * as THREE from 'three';

export class AudioManager {
  constructor(sceneManager) {
    this.scene = sceneManager.scene;
    this.camera = sceneManager.camera;
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);
    this.sounds = new Map();
  }

  addAmbientSound(url, volume = 0.5, loop = true) {
    const sound = new THREE.Audio(this.listener);
    const audioLoader = new THREE.AudioLoader();
    
    audioLoader.load(url, (buffer) => {
      sound.setBuffer(buffer);
      sound.setVolume(volume);
      sound.setLoop(loop);
      sound.play();
    });

    const id = `ambient_${Date.now()}`;
    this.sounds.set(id, sound);
    return id;
  }

  addPositionalSound(url, position, volume = 1.0, distance = 10) {
    const sound = new THREE.PositionalAudio(this.listener);
    const audioLoader = new THREE.AudioLoader();
    
    audioLoader.load(url, (buffer) => {
      sound.setBuffer(buffer);
      sound.setVolume(volume);
      sound.setRefDistance(distance);
      sound.setLoop(true);
      sound.play();
    });

    sound.position.copy(position);
    this.scene.add(sound);

    const id = `positional_${Date.now()}`;
    this.sounds.set(id, sound);
    return id;
  }

  updateSound(id, property, value) {
    const sound = this.sounds.get(id);
    if (!sound) return;

    switch (property) {
      case 'volume':
        sound.setVolume(value);
        break;
      case 'position':
        sound.position.copy(value);
        break;
      case 'play':
        if (value && !sound.isPlaying) sound.play();
        if (!value && sound.isPlaying) sound.pause();
        break;
    }
  }

  removeSound(id) {
    const sound = this.sounds.get(id);
    if (!sound) return;

    sound.stop();
    if (sound.parent) this.scene.remove(sound);
    this.sounds.delete(id);
  }
}