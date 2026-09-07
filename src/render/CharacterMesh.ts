import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createGlowShell, UnlitVertexColorMaterial } from './UnlitVertexColorMaterial';
import { paintBox } from './vertexColors';

export interface CharacterPalette {
  /** Side faces of the body. */
  body: number;
  /** Top face; lighter than the sides to fake a top-down light. */
  bodyTop: number;
  /** Small block on the +Z face so facing direction is readable. */
  nose: number;
}

export const PLAYER_PALETTE: CharacterPalette = {
  body: 0x8a2a1e, // dark red plate, à la Dark Knight armour
  bodyTop: 0xb0452e,
  nose: 0xf0c060,
};

export const NPC_PALETTE: CharacterPalette = {
  body: 0x2a4a8a,
  bodyTop: 0x3f66b0,
  nose: 0xd8e8ff,
};

/**
 * Low-poly stand-in for a character: a 0.6 x 1.0 x 0.6 body with a small
 * "nose" block on its local +Z face. `GridEntity.faceTile` rotates the object
 * so +Z points at the destination tile, so the nose always leads.
 *
 * Body and nose are merged into one geometry so a character is a single draw
 * call (two with a glow shell).
 */
export class CharacterMesh {
  readonly mesh: THREE.Mesh<THREE.BufferGeometry, UnlitVertexColorMaterial>;
  readonly material: UnlitVertexColorMaterial;
  private shell: THREE.Mesh<THREE.BufferGeometry, UnlitVertexColorMaterial> | null = null;

  constructor(palette: CharacterPalette, name: string) {
    const body = paintBox(new THREE.BoxGeometry(0.6, 1.0, 0.6), {
      base: palette.body,
      top: palette.bodyTop,
    });
    body.translate(0, 0.5, 0); // feet on the floor

    const nose = paintBox(new THREE.BoxGeometry(0.22, 0.22, 0.18), { base: palette.nose });
    nose.translate(0, 0.72, 0.38);

    const merged = mergeGeometries([body, nose], false);
    body.dispose();
    nose.dispose();
    if (!merged) throw new Error('CharacterMesh: failed to merge geometry');

    this.material = new UnlitVertexColorMaterial({ pulseSpeed: 4, pulseAmount: 0.25 });
    this.mesh = new THREE.Mesh(merged, this.material);
    this.mesh.name = name;
  }

  /**
   * Set the item glow. `intensity` 0 removes the effect entirely (and skips the
   * shell draw call); values above 1 overdrive toward white like +13/+15 gear.
   */
  setGlow(emissiveHex: number, intensity: number): void {
    this.material.emissive.setHex(emissiveHex);
    this.material.glowIntensity = intensity;

    if (intensity <= 0) {
      if (this.shell) this.shell.visible = false;
      return;
    }

    if (!this.shell) this.shell = createGlowShell(this.mesh, this.material);
    this.shell.visible = true;
    // Halo grows slightly with intensity so higher "levels" look bulkier.
    this.shell.scale.setScalar(1.05 + 0.05 * Math.min(intensity, 3));
  }
}
