import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { TileGrid } from '../grid/TileGrid';
import { UnlitVertexColorMaterial } from './UnlitVertexColorMaterial';
import { hash2, hexToRgb, paintBox } from './vertexColors';

/** Cobblestone palette, sampled per vertex with a tiny deterministic jitter. */
const STONE_LIGHT = 0x5c5a52;
const STONE_DARK = 0x4a4842;
const STONE_BLOCKED = 0x3a2a26;
const GRID_LINE = 0x2a2822;
const OBSTACLE_SIDE = 0x2e2c28;
const OBSTACLE_TOP = 0x45423a;

/**
 * Visual representation of a `TileGrid`.
 *
 * Everything is pre-baked into as few draw calls as possible:
 *  - 1 mesh for all floor tiles (4 verts / 6 indices per tile, vertex coloured)
 *  - 1 line batch for the tile borders
 *  - 1 merged mesh for every obstacle block
 *
 * The floor is static; nothing here is touched per frame.
 */
export class GridFloor {
  readonly group = new THREE.Group();

  constructor(grid: TileGrid) {
    this.group.name = 'GridFloor';
    this.group.matrixAutoUpdate = false;
    this.group.add(buildTiles(grid), buildGridLines(grid));

    const obstacles = buildObstacles(grid);
    if (obstacles) this.group.add(obstacles);
  }
}

function buildTiles(grid: TileGrid): THREE.Mesh {
  const tileCount = grid.width * grid.height;
  const positions = new Float32Array(tileCount * 4 * 3);
  const colors = new Float32Array(tileCount * 4 * 3);
  const indices = new Uint16Array(tileCount * 6);

  const corner = new THREE.Vector3();
  const rgb: [number, number, number] = [0, 0, 0];
  const half = grid.tileSize * 0.5;

  let v = 0;
  let i = 0;
  for (let z = 0; z < grid.height; z++) {
    for (let x = 0; x < grid.width; x++) {
      grid.tileToWorld(x, z, corner);
      const blocked = grid.isBlocked(x, z);
      const baseHex = blocked ? STONE_BLOCKED : (x + z) % 2 === 0 ? STONE_LIGHT : STONE_DARK;
      hexToRgb(baseHex, rgb);

      // Quad corners in a consistent winding (viewed from +Y): (-,-) (+,-) (+,+) (-,+)
      const cx = [-half, half, half, -half];
      const cz = [-half, -half, half, half];
      const first = v;
      for (let c = 0; c < 4; c++) {
        const px = corner.x + cx[c];
        const pz = corner.z + cz[c];
        positions[v * 3] = px;
        positions[v * 3 + 1] = 0;
        positions[v * 3 + 2] = pz;

        // Per-vertex jitter: shared corners hash the same, so shading is continuous.
        const jitter = (hash2(Math.round(px * 2), Math.round(pz * 2)) - 0.5) * 0.12;
        colors[v * 3] = rgb[0] + jitter;
        colors[v * 3 + 1] = rgb[1] + jitter;
        colors[v * 3 + 2] = rgb[2] + jitter;
        v++;
      }

      // Two triangles, counter-clockwise when seen from above (+Y normal).
      indices[i++] = first;
      indices[i++] = first + 2;
      indices[i++] = first + 1;
      indices[i++] = first;
      indices[i++] = first + 3;
      indices[i++] = first + 2;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  const mesh = new THREE.Mesh(geometry, new UnlitVertexColorMaterial());
  mesh.name = 'FloorTiles';
  mesh.matrixAutoUpdate = false;
  return mesh;
}

function buildGridLines(grid: TileGrid): THREE.LineSegments {
  const lineCount = grid.width + 1 + grid.height + 1;
  const positions = new Float32Array(lineCount * 2 * 3);
  const colors = new Float32Array(lineCount * 2 * 3);
  const rgb = hexToRgb(GRID_LINE);

  const min = new THREE.Vector3();
  const max = new THREE.Vector3();
  grid.tileToWorld(0, 0, min);
  grid.tileToWorld(grid.width - 1, grid.height - 1, max);
  const half = grid.tileSize * 0.5;
  const x0 = min.x - half;
  const x1 = max.x + half;
  const z0 = min.z - half;
  const z1 = max.z + half;
  const y = 0.004; // lifted a hair to avoid z-fighting with the floor

  let p = 0;
  const push = (x: number, z: number) => {
    positions[p * 3] = x;
    positions[p * 3 + 1] = y;
    positions[p * 3 + 2] = z;
    colors[p * 3] = rgb[0];
    colors[p * 3 + 1] = rgb[1];
    colors[p * 3 + 2] = rgb[2];
    p++;
  };

  for (let x = 0; x <= grid.width; x++) {
    const wx = x0 + x * grid.tileSize;
    push(wx, z0);
    push(wx, z1);
  }
  for (let z = 0; z <= grid.height; z++) {
    const wz = z0 + z * grid.tileSize;
    push(x0, wz);
    push(x1, wz);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const lines = new THREE.LineSegments(geometry, new UnlitVertexColorMaterial());
  lines.name = 'GridLines';
  lines.matrixAutoUpdate = false;
  return lines;
}

/** Merge every blocked tile into one obstacle mesh. Returns null if none. */
function buildObstacles(grid: TileGrid): THREE.Mesh | null {
  const parts: THREE.BufferGeometry[] = [];
  const centre = new THREE.Vector3();
  const size = grid.tileSize * 0.9;
  const height = grid.tileSize * 0.7;

  for (let z = 0; z < grid.height; z++) {
    for (let x = 0; x < grid.width; x++) {
      if (!grid.isBlocked(x, z)) continue;
      const box = paintBox(new THREE.BoxGeometry(size, height, size), {
        base: OBSTACLE_SIDE,
        top: OBSTACLE_TOP,
      });
      grid.tileToWorld(x, z, centre, height * 0.5);
      box.translate(centre.x, centre.y, centre.z);
      parts.push(box);
    }
  }

  if (parts.length === 0) return null;

  const merged = mergeGeometries(parts, false);
  for (const part of parts) part.dispose();
  if (!merged) return null;

  const mesh = new THREE.Mesh(merged, new UnlitVertexColorMaterial());
  mesh.name = 'Obstacles';
  mesh.matrixAutoUpdate = false;
  return mesh;
}
