import type { GridEntity } from '../grid/GridEntity';
import type { TileGrid } from '../grid/TileGrid';

/**
 * Minimal NPC behaviour: idle for a moment, then stroll to a random walkable
 * tile within `radius`. Exists to prove that NPCs share the same grid, the
 * same pathfinder and the same tile-reservation rules as the player.
 */
export class Wanderer {
  private readonly entity: GridEntity;
  private readonly grid: TileGrid;
  private readonly radius: number;
  private idleTimer: number;

  constructor(entity: GridEntity, grid: TileGrid, radius = 2) {
    this.entity = entity;
    this.grid = grid;
    this.radius = radius;
    this.idleTimer = this.nextIdle();
  }

  update(dt: number): void {
    if (this.entity.isMoving) return;

    this.idleTimer -= dt;
    if (this.idleTimer > 0) return;
    this.idleTimer = this.nextIdle();

    // A few random probes; if none is walkable we simply idle again.
    for (let attempt = 0; attempt < 6; attempt++) {
      const x = this.entity.tile.x + randInt(-this.radius, this.radius);
      const z = this.entity.tile.z + randInt(-this.radius, this.radius);
      if (!this.grid.isWalkable(x, z, this.entity.id)) continue;
      if (x === this.entity.tile.x && z === this.entity.tile.z) continue;
      if (this.entity.moveTo(x, z)) return;
    }
  }

  private nextIdle(): number {
    return 1.5 + Math.random() * 2;
  }
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}
