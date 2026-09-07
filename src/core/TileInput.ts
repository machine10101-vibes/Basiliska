import * as THREE from 'three';
import type { TileCoord, TileGrid } from '../grid/TileGrid';

/**
 * Translates pointer events into tile coordinates.
 *
 * Picking is done analytically: unproject the pointer through the camera and
 * intersect the ray with the y = 0 ground plane. No scene traversal, no
 * bounding-volume tests — one ray/plane intersection per pointer event,
 * and nothing at all per frame.
 */
export class TileInput {
  /** Tile under the pointer, or null when off-grid. Updated on pointer move. */
  readonly hovered: TileCoord = { x: -1, z: -1 };
  hasHover = false;

  /** Fired on primary-button click over a walkable-or-not tile. */
  onTileClick: ((x: number, z: number) => void) | null = null;

  private readonly canvas: HTMLCanvasElement;
  private readonly camera: THREE.Camera;
  private readonly grid: TileGrid;

  private readonly raycaster = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly hit = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement, camera: THREE.Camera, grid: TileGrid) {
    this.canvas = canvas;
    this.camera = camera;
    this.grid = grid;

    canvas.addEventListener('pointermove', this.handleMove);
    canvas.addEventListener('pointerdown', this.handleDown);
    canvas.addEventListener('pointerleave', this.handleLeave);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  dispose(): void {
    this.canvas.removeEventListener('pointermove', this.handleMove);
    this.canvas.removeEventListener('pointerdown', this.handleDown);
    this.canvas.removeEventListener('pointerleave', this.handleLeave);
  }

  private readonly handleMove = (e: PointerEvent): void => {
    this.pick(e);
  };

  private readonly handleDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    if (this.pick(e) && this.onTileClick) {
      this.onTileClick(this.hovered.x, this.hovered.z);
    }
  };

  private readonly handleLeave = (): void => {
    this.hasHover = false;
  };

  /** Resolve the pointer to a tile. Returns true when over the grid. */
  private pick(e: PointerEvent): boolean {
    const rect = this.canvas.getBoundingClientRect();
    this.ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.ndc, this.camera);
    const point = this.raycaster.ray.intersectPlane(this.ground, this.hit);
    this.hasHover = point !== null && this.grid.worldToTile(point, this.hovered);
    return this.hasHover;
  }
}
