// Retro unlit vertex shader (GLSL ES 3.00; Three.js prepends the #version line).
//
// Mimics OpenGL 1.x fixed-function rendering with lighting disabled:
// the only inputs that affect colour are the per-vertex colour and a handful
// of material constants. No normals, no lights, no shadows.

precision highp float;

// Supplied by Three.js for every RawShaderMaterial.
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

// Shared across all materials, advanced once per frame.
uniform float uTime;

// Glow animation parameters (see UnlitVertexColorMaterial).
uniform float uGlowIntensity;
uniform float uPulseSpeed;
uniform float uPulseAmount;

in vec3 position;
in vec3 color;

out vec3 vColor;
out float vGlow;

void main() {
  vColor = color;

  // Glow strength is evaluated per vertex (cheaper than per fragment) and
  // interpolated. The pulse is a plain sine like the old client's item aura.
  float pulse = 1.0 + uPulseAmount * sin(uTime * uPulseSpeed);
  vGlow = uGlowIntensity * pulse;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
