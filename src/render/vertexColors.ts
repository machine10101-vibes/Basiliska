import * as THREE from 'three';

/**
 * Helpers for authoring per-vertex colour data. In this renderer vertex
 * colour *is* the lighting: shading is baked by painting faces different
 * shades, exactly how early fixed-function games faked depth.
 */

/** Unpack a 0xRRGGBB integer into 0..1 floats without any colour management. */
export function hexToRgb(hex: number, out: [number, number, number] = [0, 0, 0]) {
  out[0] = ((hex >> 16) & 0xff) / 255;
  out[1] = ((hex >> 8) & 0xff) / 255;
  out[2] = (hex & 0xff) / 255;
  return out;
}

/** Face order used by `THREE.BoxGeometry` (4 vertices per face, 24 total). */
export const BOX_FACE = { PX: 0, NX: 1, PY: 2, NY: 3, PZ: 4, NZ: 5 } as const;

export interface BoxFaceColors {
  /** Default colour for any face not listed explicitly. */
  base: number;
  top?: number;
  bottom?: number;
  px?: number;
  nx?: number;
  pz?: number;
  nz?: number;
}

/**
 * Attach a `color` attribute to a non-indexed-face BoxGeometry, giving each of
 * the six faces a flat colour. Top and side faces are typically painted with
 * different shades to produce a cheap, lighting-free sense of volume.
 */
export function paintBox(geometry: THREE.BoxGeometry, colors: BoxFaceColors): THREE.BoxGeometry {
  const perFace = [
    colors.px ?? colors.base,
    colors.nx ?? colors.base,
    colors.top ?? colors.base,
    colors.bottom ?? colors.base,
    colors.pz ?? colors.base,
    colors.nz ?? colors.base,
  ];

  const count = geometry.attributes.position.count; // 24 for a 1-segment box
  const data = new Float32Array(count * 3);
  const rgb: [number, number, number] = [0, 0, 0];
  const vertsPerFace = count / 6;

  for (let face = 0; face < 6; face++) {
    hexToRgb(perFace[face], rgb);
    for (let v = 0; v < vertsPerFace; v++) {
      const i = (face * vertsPerFace + v) * 3;
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(data, 3));
  return geometry;
}

/**
 * Deterministic pseudo-random in [0, 1) from integer coordinates. Used to add
 * subtle per-vertex noise (fake texture) without `Math.random` so the floor
 * looks identical every load.
 */
export function hash2(x: number, z: number): number {
  let h = (x * 374761393 + z * 668265263) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
