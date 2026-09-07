import * as THREE from 'three';
import type { Pathfinder } from './Pathfinder';
import type { TileCoord, TileGrid } from './TileGrid';

/**
 * Anything that stands on the grid and moves tile-by-tile: the player, NPCs,
 * monsters. Owns the mapping from logical tile -> 3D object transform.
 *
 * Movement model (matches the original client's feel):
 *  1. `moveTo` runs A* and stores a list of tiles.
 *  2. Each frame the entity advances along the *current step* (centre of the
 *     tile it is leaving -> centre of the tile it is entering).
 *  3. When a step begins, the object's yaw snaps to face the destination tile.
 *     Because tile deltas are always -1/0/1, this yields exactly 8 headings.
 *  4. Re-targeting mid-step is queued and applied when the current step ends,
 *     so the entity is always tile-aligned when it changes plan.
 *
 * The entity reserves the tile it is entering *before* it starts moving, so
 * two movers can never converge on the same tile.
 */
export class GridEntity {
  readonly id: number;
  readonly object: THREE.Object3D;
  /** Tiles per second. */
  speed: number;

  /** Logical tile the entity currently stands on (updated on arrival). */
  readonly tile: TileCoord;

  private readonly grid: TileGrid;
  private readonly pathfinder: Pathfinder;

  private readonly path: number[] = [];
  private pathCursor = 0;

  /** Current step, valid while `stepping` is true. */
  private stepping = false;
  private readonly stepFrom = new THREE.Vector3();
  private readonly stepTo = new THREE.Vector3();
  private readonly stepTile: TileCoord = { x: 0, z: 0 };
  private stepLength = 1;
  private stepProgress = 0; // 0..1 along the current step

  /** Destination requested while mid-step; consumed when the step completes. */
  private pendingTarget: TileCoord | null = null;

  /** Final destination of the current path (for re-planning around movers). */
  private readonly destination: TileCoord = { x: 0, z: 0 };

  constructor(
    id: number,
    object: THREE.Object3D,
    grid: TileGrid,
    pathfinder: Pathfinder,
    startTile: TileCoord,
    speed: number,
  ) {
    this.id = id;
    this.object = object;
    this.grid = grid;
    this.pathfinder = pathfinder;
    this.speed = speed;
    this.tile = { x: startTile.x, z: startTile.z };

    grid.setOccupant(startTile.x, startTile.z, id);
    grid.tileToWorld(startTile.x, startTile.z, object.position);
  }

  /** True while the entity has steps left to take. */
  get isMoving(): boolean {
    return this.stepping || this.pathCursor < this.path.length;
  }

  /**
   * Plan a route to a tile. Returns false if the tile is unreachable.
   * If the entity is mid-step, the request is deferred until the step ends,
   * and this returns true optimistically (the deferred plan may still fail).
   */
  moveTo(x: number, z: number): boolean {
    if (this.stepping) {
      this.pendingTarget = { x, z };
      return true;
    }
    return this.plan(x, z);
  }

  /** Drop the current route. The in-progress step still completes. */
  stop(): void {
    this.path.length = 0;
    this.pathCursor = 0;
    this.pendingTarget = null;
  }

  /** Advance the simulation by `dt` seconds. */
  update(dt: number): void {
    if (!this.stepping && !this.beginNextStep()) return;

    // Distance-based progress so diagonals take sqrt(2) longer than orthogonals.
    this.stepProgress += (dt * this.speed) / this.stepLength;

    if (this.stepProgress < 1) {
      this.object.position.lerpVectors(this.stepFrom, this.stepTo, this.stepProgress);
      return;
    }

    this.arrive();

    // Carry leftover time into the next step so speed is exact at any frame rate.
    const overflow = (this.stepProgress - 1) * this.stepLength;
    this.stepProgress = 0;
    if (this.beginNextStep() && overflow > 0) {
      this.stepProgress = Math.min(overflow / this.stepLength, 0.999);
      this.object.position.lerpVectors(this.stepFrom, this.stepTo, this.stepProgress);
    }
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private plan(x: number, z: number): boolean {
    this.destination.x = x;
    this.destination.z = z;
    this.pathCursor = 0;
    const ok = this.pathfinder.findPath(this.tile.x, this.tile.z, x, z, this.path, this.id);
    if (!ok) this.path.length = 0;
    return ok;
  }

  /**
   * Pop the next tile from the path and start moving toward it.
   * Returns false when there is nothing to do.
   */
  private beginNextStep(): boolean {
    if (this.pathCursor >= this.path.length) return false;

    const next = this.path[this.pathCursor];
    const nx = this.grid.xOf(next);
    const nz = this.grid.zOf(next);

    // Someone may have stepped onto our next tile since we planned. Re-plan
    // from where we stand; if that fails, give up on this route.
    if (!this.grid.isWalkable(nx, nz, this.id)) {
      if (!this.plan(this.destination.x, this.destination.z)) return false;
      return this.beginNextStep();
    }

    this.pathCursor++;
    this.stepTile.x = nx;
    this.stepTile.z = nz;
    this.grid.setOccupant(nx, nz, this.id);

    this.stepFrom.copy(this.object.position);
    this.grid.tileToWorld(nx, nz, this.stepTo, this.object.position.y);
    this.stepLength = this.stepFrom.distanceTo(this.stepTo) / this.grid.tileSize;
    if (this.stepLength < 1e-4) this.stepLength = 1;
    this.stepProgress = 0;
    this.stepping = true;

    this.faceTile(nx, nz);
    return true;
  }

  /** Snap yaw so the object's local +Z axis points at the given tile. */
  private faceTile(x: number, z: number): void {
    const dx = x - this.tile.x;
    const dz = z - this.tile.z;
    if (dx === 0 && dz === 0) return;
    this.object.rotation.y = Math.atan2(dx, dz);
  }

  /** Finish the current step: release the old tile, adopt the new one. */
  private arrive(): void {
    this.object.position.copy(this.stepTo);
    this.grid.clearOccupant(this.tile.x, this.tile.z, this.id);
    this.tile.x = this.stepTile.x;
    this.tile.z = this.stepTile.z;
    this.stepping = false;

    if (this.pendingTarget) {
      const { x, z } = this.pendingTarget;
      this.pendingTarget = null;
      this.plan(x, z);
    }
  }
}
