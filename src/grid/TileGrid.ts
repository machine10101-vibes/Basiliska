import * as THREE from 'three';

/** Integer tile coordinate. `x` is the column, `z` is the row (matches world X/Z). */
export interface TileCoord {
  x: number;
  z: number;
}

/** Sentinel stored in the occupant layer for a free tile. */
export const NO_OCCUPANT = -1;

/**
 * The authoritative 2D grid that gameplay runs on.
 *
 * The 3D scene is only a *view* of this grid: every entity has a logical tile,
 * and world-space vectors are derived from tile coordinates (and vice versa)
 * through `tileToWorld` / `worldToTile`. Nothing in gameplay reads 3D positions
 * to make decisions.
 *
 * Two layers are stored as flat typed arrays (index = z * width + x):
 *  - `blocked`   : static walkability (walls, props) — Uint8Array, 0/1
 *  - `occupant`  : dynamic occupancy (entity id or NO_OCCUPANT) — Int16Array
 */
export class TileGrid {
  readonly width: number;
  readonly height: number;
  readonly tileSize: number;

  /** World-space position of the min corner of tile (0, 0). */
  private readonly origin = new THREE.Vector3();

  private readonly blocked: Uint8Array;
  private readonly occupant: Int16Array;

  constructor(width: number, height: number, tileSize: number) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;

    // Centre the grid on the world origin so the camera target starts at (0,0,0).
    this.origin.set((-width * tileSize) / 2, 0, (-height * tileSize) / 2);

    this.blocked = new Uint8Array(width * height);
    this.occupant = new Int16Array(width * height).fill(NO_OCCUPANT);
  }

  // ---------------------------------------------------------------------------
  // Indexing
  // ---------------------------------------------------------------------------

  /** Flat array index for a tile. Caller must ensure the tile is in bounds. */
  index(x: number, z: number): number {
    return z * this.width + x;
  }

  /** Column of a flat index. */
  xOf(index: number): number {
    return index % this.width;
  }

  /** Row of a flat index. */
  zOf(index: number): number {
    return (index / this.width) | 0;
  }

  inBounds(x: number, z: number): boolean {
    return x >= 0 && z >= 0 && x < this.width && z < this.height;
  }

  // ---------------------------------------------------------------------------
  // Static walkability
  // ---------------------------------------------------------------------------

  setBlocked(x: number, z: number, blocked: boolean): void {
    if (this.inBounds(x, z)) this.blocked[this.index(x, z)] = blocked ? 1 : 0;
  }

  isBlocked(x: number, z: number): boolean {
    return !this.inBounds(x, z) || this.blocked[this.index(x, z)] === 1;
  }

  // ---------------------------------------------------------------------------
  // Dynamic occupancy
  // ---------------------------------------------------------------------------

  setOccupant(x: number, z: number, entityId: number): void {
    if (this.inBounds(x, z)) this.occupant[this.index(x, z)] = entityId;
  }

  clearOccupant(x: number, z: number, entityId: number): void {
    if (!this.inBounds(x, z)) return;
    const i = this.index(x, z);
    // Only the owner may release a tile; avoids races when two movers overlap.
    if (this.occupant[i] === entityId) this.occupant[i] = NO_OCCUPANT;
  }

  occupantAt(x: number, z: number): number {
    return this.inBounds(x, z) ? this.occupant[this.index(x, z)] : NO_OCCUPANT;
  }

  /**
   * True when `entityId` may stand on the tile: in bounds, not statically
   * blocked, and either free or already held by that same entity.
   */
  isWalkable(x: number, z: number, entityId: number = NO_OCCUPANT): boolean {
    if (!this.inBounds(x, z)) return false;
    const i = this.index(x, z);
    if (this.blocked[i] === 1) return false;
    const occ = this.occupant[i];
    return occ === NO_OCCUPANT || occ === entityId;
  }

  // ---------------------------------------------------------------------------
  // 2D <-> 3D mapping
  // ---------------------------------------------------------------------------

  /** World-space centre of a tile, written into `out` (y is passed through). */
  tileToWorld(x: number, z: number, out: THREE.Vector3, y = 0): THREE.Vector3 {
    const half = this.tileSize * 0.5;
    out.x = this.origin.x + x * this.tileSize + half;
    out.y = y;
    out.z = this.origin.z + z * this.tileSize + half;
    return out;
  }

  /**
   * Tile containing a world-space point, written into `out`.
   * Returns false (and leaves `out` clamped) if the point is outside the grid.
   */
  worldToTile(point: THREE.Vector3, out: TileCoord): boolean {
    const fx = (point.x - this.origin.x) / this.tileSize;
    const fz = (point.z - this.origin.z) / this.tileSize;
    out.x = Math.floor(fx);
    out.z = Math.floor(fz);
    return this.inBounds(out.x, out.z);
  }
}
