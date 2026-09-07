// Retro unlit fragment shader (GLSL ES 3.00).
//
// Output = vertexColor * materialColor + emissive * glow
//
// There is intentionally no gamma / tone mapping stage: values are written
// straight to the framebuffer exactly like a fixed-function pipeline would.
//
// When compiled with GLOW_SHELL defined, the shader instead renders only the
// emissive term. That variant is drawn on an inflated, back-face-only copy of
// the mesh with additive blending to fake the "+7 and above" item aura
// without a post-processing bloom pass.

precision mediump float;

uniform vec3 uColor;
uniform vec3 uEmissive;
uniform float uOpacity;

in vec3 vColor;
in float vGlow;

out vec4 outColor;

void main() {
#ifdef GLOW_SHELL
  // Additive blend: alpha is irrelevant, brightness carries the effect.
  outColor = vec4(uEmissive * vGlow * SHELL_STRENGTH, 1.0);
#else
  vec3 base = vColor * uColor;
  outColor = vec4(base + uEmissive * vGlow, uOpacity);
#endif
}
