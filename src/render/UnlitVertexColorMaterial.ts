import * as THREE from 'three';
import fragmentShader from './shaders/unlit.frag.glsl?raw';
import vertexShader from './shaders/unlit.vert.glsl?raw';

/**
 * One time uniform shared by *every* material instance. The game loop writes
 * it once per frame; no per-material iteration is needed.
 */
const sharedTime: THREE.IUniform<number> = { value: 0 };

export interface UnlitMaterialParams {
  /** Multiplier applied to vertex colours. Default white (vertex colour as-is). */
  color?: THREE.ColorRepresentation;
  /** Colour added on top of the base colour. Default black (no glow). */
  emissive?: THREE.ColorRepresentation;
  /** Scales the emissive term. 0 disables the glow, 1 is nominal, >1 overdrives. */
  glowIntensity?: number;
  /** Radians per second for the glow pulse. Default 3. */
  pulseSpeed?: number;
  /** Pulse depth, 0..1. Glow oscillates between (1-amount) and (1+amount). Default 0. */
  pulseAmount?: number;
  /** Constant alpha. Set `transparent` too when < 1. Default 1. */
  opacity?: number;
  transparent?: boolean;
  side?: THREE.Side;
  depthWrite?: boolean;
  blending?: THREE.Blending;
  /** Compile the shell (aura-only) variant of the shader. */
  glowShell?: boolean;
}

/**
 * Unlit, vertex-coloured material that bypasses Three.js lighting entirely.
 *
 * Built on `RawShaderMaterial`, so none of the standard lighting, fog, tone
 * mapping or colour-space chunks are injected: what the GLSL says is what the
 * GPU does. This is the closest thing to a fixed-function `glDisable(GL_LIGHTING)`
 * pipeline available in WebGL, and it keeps the shader trivially cheap.
 *
 * Emissive glow ("+7 to +15" aura) is a single additive colour term with a
 * runtime-adjustable `glowIntensity`. Pair a normal instance with a
 * `glowShell: true` instance (see `createGlowShell`) to get the halo.
 */
export class UnlitVertexColorMaterial extends THREE.RawShaderMaterial {
  declare uniforms: {
    uTime: THREE.IUniform<number>;
    uColor: THREE.IUniform<THREE.Color>;
    uEmissive: THREE.IUniform<THREE.Color>;
    uGlowIntensity: THREE.IUniform<number>;
    uPulseSpeed: THREE.IUniform<number>;
    uPulseAmount: THREE.IUniform<number>;
    uOpacity: THREE.IUniform<number>;
  };

  constructor(params: UnlitMaterialParams = {}) {
    super({
      glslVersion: THREE.GLSL3,
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: sharedTime,
        uColor: { value: new THREE.Color(params.color ?? 0xffffff) },
        uEmissive: { value: new THREE.Color(params.emissive ?? 0x000000) },
        uGlowIntensity: { value: params.glowIntensity ?? 1 },
        uPulseSpeed: { value: params.pulseSpeed ?? 3 },
        uPulseAmount: { value: params.pulseAmount ?? 0 },
        uOpacity: { value: params.opacity ?? 1 },
      },
      defines: params.glowShell ? { GLOW_SHELL: '', SHELL_STRENGTH: '0.45' } : {},
      transparent: params.transparent ?? false,
      side: params.side ?? THREE.FrontSide,
      depthWrite: params.depthWrite ?? true,
      blending: params.blending ?? THREE.NormalBlending,
    });
  }

  /** Advance the shared clock. Call exactly once per frame from the game loop. */
  static tick(elapsedSeconds: number): void {
    sharedTime.value = elapsedSeconds;
  }

  get glowIntensity(): number {
    return this.uniforms.uGlowIntensity.value;
  }
  set glowIntensity(v: number) {
    this.uniforms.uGlowIntensity.value = v;
  }

  get emissive(): THREE.Color {
    return this.uniforms.uEmissive.value;
  }

  get color(): THREE.Color {
    return this.uniforms.uColor.value;
  }

  get pulseSpeed(): number {
    return this.uniforms.uPulseSpeed.value;
  }
  set pulseSpeed(v: number) {
    this.uniforms.uPulseSpeed.value = v;
  }

  get pulseAmount(): number {
    return this.uniforms.uPulseAmount.value;
  }
  set pulseAmount(v: number) {
    this.uniforms.uPulseAmount.value = v;
  }
}

/**
 * Build the aura shell for a glowing mesh.
 *
 * Classic fixed-function trick: draw the same geometry again, slightly
 * inflated, back faces only, additive blend, no depth write. The result is a
 * soft coloured rim around the object that reads as "bloom" without any
 * render-to-texture passes. The shell *shares* the geometry buffer, so the
 * only cost is one extra draw call.
 *
 * The shell's `uEmissive`, `uGlowIntensity`, pulse uniforms are linked to the
 * source material's uniform objects, so changing the source updates both.
 */
export function createGlowShell(
  source: THREE.Mesh,
  sourceMaterial: UnlitVertexColorMaterial,
  inflate = 1.08,
): THREE.Mesh<THREE.BufferGeometry, UnlitVertexColorMaterial> {
  const shellMaterial = new UnlitVertexColorMaterial({
    glowShell: true,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  // Share uniform objects (not just values) so updates propagate for free.
  shellMaterial.uniforms.uEmissive = sourceMaterial.uniforms.uEmissive;
  shellMaterial.uniforms.uGlowIntensity = sourceMaterial.uniforms.uGlowIntensity;
  shellMaterial.uniforms.uPulseSpeed = sourceMaterial.uniforms.uPulseSpeed;
  shellMaterial.uniforms.uPulseAmount = sourceMaterial.uniforms.uPulseAmount;

  const shell = new THREE.Mesh(source.geometry, shellMaterial);
  shell.scale.setScalar(inflate);
  shell.renderOrder = 1; // draw after opaque geometry so the additive blend sees it
  shell.matrixAutoUpdate = true;
  source.add(shell);
  return shell;
}
