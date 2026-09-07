import * as THREE from 'three';
import {
  CAMERA_DISTANCE,
  CAMERA_FOLLOW_RATE,
  CAMERA_PITCH_DEG,
  CAMERA_VIEW_HALF_HEIGHT,
  CAMERA_YAW_DEG,
} from './constants';

const DEG2RAD = Math.PI / 180;

/**
 * Fixed, non-rotatable isometric camera.
 *
 * - Orthographic projection: no perspective foreshortening, so every tile
 *   renders at the same screen size regardless of depth (classic MU/Diablo look).
 * - Orientation is baked once in the constructor and never changes:
 *   pitch = -45° about X (looking down), yaw = 45° about Y.
 * - There are deliberately no orbit / rotate / zoom controls. The only thing
 *   that moves is the camera's *position*, which follows a target point.
 */
export class IsometricCamera {
  readonly camera: THREE.OrthographicCamera;

  /** Unit vector the camera looks along. Constant after construction. */
  private readonly forward = new THREE.Vector3();

  /** Point currently centred in the view. */
  private readonly target = new THREE.Vector3();

  constructor(aspect: number) {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, CAMERA_DISTANCE * 3);

    // Yaw first, then pitch, so the "downward tilt" is applied relative to the
    // already-rotated heading. This is the order humans describe the view in.
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.set(-CAMERA_PITCH_DEG * DEG2RAD, CAMERA_YAW_DEG * DEG2RAD, 0);

    // Three.js cameras look down their local -Z axis.
    this.forward.set(0, 0, -1).applyEuler(this.camera.rotation);

    this.setAspect(aspect);
    this.snapTo(this.target);
  }

  /** Recompute the orthographic frustum for a new viewport aspect ratio. */
  setAspect(aspect: number): void {
    const halfH = CAMERA_VIEW_HALF_HEIGHT;
    const halfW = halfH * aspect;
    const cam = this.camera;
    cam.left = -halfW;
    cam.right = halfW;
    cam.top = halfH;
    cam.bottom = -halfH;
    cam.updateProjectionMatrix();
  }

  /** Immediately centre the view on `point` (no smoothing). */
  snapTo(point: THREE.Vector3): void {
    this.target.copy(point);
    this.applyPosition();
  }

  /**
   * Move the view centre toward `point` with frame-rate independent exponential
   * smoothing. Call once per frame.
   */
  follow(point: THREE.Vector3, dt: number): void {
    if (!Number.isFinite(CAMERA_FOLLOW_RATE)) {
      this.snapTo(point);
      return;
    }
    const alpha = 1 - Math.exp(-CAMERA_FOLLOW_RATE * dt);
    this.target.lerp(point, alpha);
    this.applyPosition();
  }

  /** Position = target pulled back along the fixed view direction. */
  private applyPosition(): void {
    this.camera.position.copy(this.target).addScaledVector(this.forward, -CAMERA_DISTANCE);
  }
}
