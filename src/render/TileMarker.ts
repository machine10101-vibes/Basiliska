import * as THREE from 'three';
import type { TileGrid } from '../grid/TileGrid';
import { UnlitVertexColorMaterial } from './UnlitVertexColorMaterial';
import { hexToRgb } from './vertexColors';

/**
 * A flat translucent quad that can be parked on any tile. Used for the hover
 * highlight and the click destination marker. One mesh, moved around; never
 * re-created.
 */
export class TileMarker {
  readonly mesh: THREE.Mesh<THREE.BufferGeometry, UnlitVertexColorMaterial>;
  private readonly grid: TileGrid;

  constructor(grid: TileGrid, colorHex: number, opacity: number, inset = 0.06) {
    this.grid = grid;

    const half = grid.tileSize * 0.5 - inset;
    const positions = new Float32Array([-half, 0, -half, half, 0, -half, half, 0, half, -half, 0, half]);
    const rgb = hexToRgb(colorHex);
    const colors = new Float32Array([...rgb, ...rgb, ...rgb, ...rgb]);
    const indices = new Uint16Array([0, 2, 1, 0, 3, 2]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    const material = new UnlitVertexColorMaterial({
      transparent: true,
      opacity,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.renderOrder = 1;
    this.mesh.visible = false;
  }

  /** Show the marker on a tile. */
  showAt(x: number, z: number): void {
    this.grid.tileToWorld(x, z, this.mesh.position, 0.008);
    this.mesh.visible = true;
  }

  hide(): void {
    this.mesh.visible = false;
  }
}
