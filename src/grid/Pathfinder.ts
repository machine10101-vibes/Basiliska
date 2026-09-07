import { NO_OCCUPANT, type TileGrid } from './TileGrid';

const SQRT2 = Math.SQRT2;

/** 8-connected neighbourhood: dx, dz pairs. Orthogonal first, then diagonals. */
const NEIGHBOUR_DX = [1, -1, 0, 0, 1, 1, -1, -1];
const NEIGHBOUR_DZ = [0, 0, 1, -1, 1, -1, 1, -1];

/**
 * A* pathfinder over a `TileGrid`.
 *
 * Designed for a single-threaded client:
 *  - All working memory is allocated once, sized to the grid, and reused.
 *    A per-search "stamp" marks which entries are valid, so nothing needs
 *    clearing between searches.
 *  - The open set is a binary min-heap on f-score stored in typed arrays.
 *  - Output is written into a caller-provided array to avoid allocation in
 *    the hot path.
 *
 * Movement rules mirror the original client: 8 directions, diagonal steps
 * are not allowed to cut a blocked corner.
 */
export class Pathfinder {
  private readonly grid: TileGrid;

  private readonly gScore: Float32Array;
  private readonly fScore: Float32Array;
  private readonly parent: Int32Array;
  private readonly openStamp: Uint32Array;
  private readonly closedStamp: Uint32Array;

  private readonly heap: Int32Array;
  private heapSize = 0;

  /** Incremented per search; entries whose stamp != current are stale. */
  private stamp = 0;

  constructor(grid: TileGrid) {
    this.grid = grid;
    const n = grid.width * grid.height;
    this.gScore = new Float32Array(n);
    this.fScore = new Float32Array(n);
    this.parent = new Int32Array(n);
    this.openStamp = new Uint32Array(n);
    this.closedStamp = new Uint32Array(n);
    this.heap = new Int32Array(n);
  }

  /**
   * Find the cheapest walkable path from (sx, sz) to (tx, tz).
   *
   * @param outPath  Receives flat tile indices, in order, *excluding* the start
   *                 tile and *including* the target. Cleared on entry.
   * @param entityId Tiles occupied by this entity count as walkable.
   * @returns true if a path was found (also true for a zero-length path).
   */
  findPath(
    sx: number,
    sz: number,
    tx: number,
    tz: number,
    outPath: number[],
    entityId: number = NO_OCCUPANT,
  ): boolean {
    outPath.length = 0;
    const grid = this.grid;

    if (!grid.inBounds(sx, sz) || !grid.isWalkable(tx, tz, entityId)) return false;
    if (sx === tx && sz === tz) return true;

    const stamp = ++this.stamp;
    const start = grid.index(sx, sz);
    const goal = grid.index(tx, tz);

    this.heapSize = 0;
    this.gScore[start] = 0;
    this.fScore[start] = octile(sx, sz, tx, tz);
    this.parent[start] = -1;
    this.openStamp[start] = stamp;
    this.heapPush(start);

    while (this.heapSize > 0) {
      const current = this.heapPop();
      if (current === goal) {
        this.reconstruct(start, goal, outPath);
        return true;
      }
      this.closedStamp[current] = stamp;

      const cx = grid.xOf(current);
      const cz = grid.zOf(current);
      const g = this.gScore[current];

      for (let d = 0; d < 8; d++) {
        const dx = NEIGHBOUR_DX[d];
        const dz = NEIGHBOUR_DZ[d];
        const nx = cx + dx;
        const nz = cz + dz;

        if (!grid.isWalkable(nx, nz, entityId)) continue;

        // No corner cutting: a diagonal move needs both adjacent orthogonals free.
        const diagonal = d >= 4;
        if (
          diagonal &&
          (!grid.isWalkable(cx + dx, cz, entityId) || !grid.isWalkable(cx, cz + dz, entityId))
        ) {
          continue;
        }

        const ni = grid.index(nx, nz);
        if (this.closedStamp[ni] === stamp) continue;

        const tentative = g + (diagonal ? SQRT2 : 1);
        const inOpen = this.openStamp[ni] === stamp;
        if (inOpen && tentative >= this.gScore[ni]) continue;

        this.gScore[ni] = tentative;
        this.fScore[ni] = tentative + octile(nx, nz, tx, tz);
        this.parent[ni] = current;

        if (inOpen) {
          this.heapUpdate(ni);
        } else {
          this.openStamp[ni] = stamp;
          this.heapPush(ni);
        }
      }
    }

    return false;
  }

  // ---------------------------------------------------------------------------
  // Path reconstruction
  // ---------------------------------------------------------------------------

  private reconstruct(start: number, goal: number, outPath: number[]): void {
    // Walk parent links backwards, then reverse in place.
    let node = goal;
    while (node !== start) {
      outPath.push(node);
      node = this.parent[node];
    }
    outPath.reverse();
  }

  // ---------------------------------------------------------------------------
  // Binary min-heap keyed on fScore
  // ---------------------------------------------------------------------------

  private heapPush(node: number): void {
    let i = this.heapSize++;
    this.heap[i] = node;
    this.siftUp(i);
  }

  private heapPop(): number {
    const top = this.heap[0];
    const last = this.heap[--this.heapSize];
    if (this.heapSize > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  /** A node already in the heap had its fScore lowered; restore heap order. */
  private heapUpdate(node: number): void {
    // Linear scan is acceptable: the heap is bounded by grid size and this
    // path is rare (only on re-discovery of an open node with a better cost).
    for (let i = 0; i < this.heapSize; i++) {
      if (this.heap[i] === node) {
        this.siftUp(i);
        return;
      }
    }
  }

  private siftUp(i: number): void {
    const heap = this.heap;
    const f = this.fScore;
    const node = heap[i];
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (f[heap[p]] <= f[node]) break;
      heap[i] = heap[p];
      i = p;
    }
    heap[i] = node;
  }

  private siftDown(i: number): void {
    const heap = this.heap;
    const f = this.fScore;
    const size = this.heapSize;
    const node = heap[i];
    for (;;) {
      let child = 2 * i + 1;
      if (child >= size) break;
      const right = child + 1;
      if (right < size && f[heap[right]] < f[heap[child]]) child = right;
      if (f[heap[child]] >= f[node]) break;
      heap[i] = heap[child];
      i = child;
    }
    heap[i] = node;
  }
}

/** Octile distance: exact cost-to-go on an 8-connected grid with no obstacles. */
function octile(ax: number, az: number, bx: number, bz: number): number {
  const dx = Math.abs(ax - bx);
  const dz = Math.abs(az - bz);
  return dx > dz ? dx + (SQRT2 - 1) * dz : dz + (SQRT2 - 1) * dx;
}
