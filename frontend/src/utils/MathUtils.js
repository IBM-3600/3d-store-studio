import * as THREE from 'three';

export class MathUtils {
  static snapToGrid(value, gridSize) {
    return Math.round(value / gridSize) * gridSize;
  }

  static snapVector3(vector, gridSize) {
    return new THREE.Vector3(
      this.snapToGrid(vector.x, gridSize),
      this.snapToGrid(vector.y, gridSize),
      this.snapToGrid(vector.z, gridSize)
    );
  }

  static lerp(a, b, t) {
    return a + (b - a) * t;
  }

  static lerpVector3(start, end, t) {
    return new THREE.Vector3(
      this.lerp(start.x, end.x, t),
      this.lerp(start.y, end.y, t),
      this.lerp(start.z, end.z, t)
    );
  }

  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  static distanceBetween(a, b) {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2) +
      Math.pow(a.z - b.z, 2)
    );
  }

  static angleBetween(v1, v2) {
    const dot = v1.dot(v2);
    const magnitudes = v1.length() * v2.length();
    return Math.acos(this.clamp(dot / magnitudes, -1, 1));
  }

  static randomInRange(min, max) {
    return min + Math.random() * (max - min);
  }

  static randomVector3(min, max) {
    return new THREE.Vector3(
      this.randomInRange(min.x, max.x),
      this.randomInRange(min.y, max.y),
      this.randomInRange(min.z, max.z)
    );
  }

  static degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  static radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
  }
}