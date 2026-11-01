// src/editor/AnimationTimeline.js
import { EventBus } from '../core/EventBus.js';

export class AnimationTimeline {
  constructor() {
    this.keyframes = new Map(); // entityId -> [{ time, property, value }]
    this.currentTime = 0;
    this.duration = 10; // seconds
    this.isPlaying = false;
    this.fps = 30;
  }

  addKeyframe(entityId, time, property, value) {
    if (!this.keyframes.has(entityId)) {
      this.keyframes.set(entityId, []);
    }

    const keyframes = this.keyframes.get(entityId);
    keyframes.push({ time, property, value });
    keyframes.sort((a, b) => a.time - b.time);

    EventBus.emit('timeline:keyframe_added', { entityId, time, property, value });
  }

  removeKeyframe(entityId, time, property) {
    const keyframes = this.keyframes.get(entityId);
    if (!keyframes) return;

    const index = keyframes.findIndex(k => k.time === time && k.property === property);
    if (index !== -1) {
      keyframes.splice(index, 1);
      EventBus.emit('timeline:keyframe_removed', { entityId, time, property });
    }
  }

  play() {
    this.isPlaying = true;
    this.startTime = performance.now();
    this.animate();
  }

  pause() {
    this.isPlaying = false;
  }

  animate() {
    if (!this.isPlaying) return;

    const elapsed = (performance.now() - this.startTime) / 1000;
    this.currentTime = elapsed % this.duration;

    // Interpolate values
    for (const [entityId, keyframes] of this.keyframes.entries()) {
      this.interpolateKeyframes(entityId, keyframes, this.currentTime);
    }

    EventBus.emit('timeline:time_updated', this.currentTime);
    requestAnimationFrame(() => this.animate());
  }

  interpolateKeyframes(entityId, keyframes, time) {
    // Group keyframes by property
    const byProperty = {};
    for (const kf of keyframes) {
      if (!byProperty[kf.property]) byProperty[kf.property] = [];
      byProperty[kf.property].push(kf);
    }

    // Interpolate each property
    for (const [property, propertyKeyframes] of Object.entries(byProperty)) {
      const prev = propertyKeyframes.filter(k => k.time <= time).pop();
      const next = propertyKeyframes.find(k => k.time > time);

      if (prev && next) {
        const t = (time - prev.time) / (next.time - prev.time);
        const value = this.lerp(prev.value, next.value, t);
        EventBus.emit('entity:property_updated', { entityId, property, value });
      } else if (prev) {
        EventBus.emit('entity:property_updated', { entityId, property, value: prev.value });
      }
    }
  }

  lerp(start, end, t) {
    if (typeof start === 'number') {
      return start + (end - start) * t;
    }
    if (typeof start === 'object' && start !== null) {
      const result = {};
      for (const key in start) {
        result[key] = this.lerp(start[key], end[key], t);
      }
      return result;
    }
    return start;
  }
}