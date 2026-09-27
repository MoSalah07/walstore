// GLSL for the hero backdrop. Colours arrive as uniforms read from the design
// tokens (`--inverse`, `--inverse-accent`), so every brand and mode restyles
// the scene without new shaders.

export const backgroundVertex = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Aurora: domain-warped fbm ribbons pooled around the 3D side, plus grain.
export const backgroundFragment = /* glsl */ `
uniform vec3 uGround;
uniform vec3 uAccent;
uniform float uTime;
uniform float uSide;      // +1 scene on the right (LTR), -1 on the left (RTL)
uniform float uIntro;     // 0 → 1 while the hero fades in
uniform float uStrength;
uniform float uGrain;
uniform float uAspect;

varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(17.0, 9.0);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y) * 2.2;
  float t = uTime * 0.035;

  // Warp the domain twice for slow, silky ribbons.
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
  float ribbons = fbm(p + 1.8 * q + vec2(t * 1.5, 0.0));
  ribbons = smoothstep(0.35, 0.85, ribbons);

  // Pool the light behind the 3D group, away from the copy.
  vec2 center = vec2(0.5 + uSide * 0.2, 0.52);
  vec2 d = (vUv - center) * vec2(uAspect * 0.55, 1.0);
  float pool = exp(-dot(d, d) * 5.5);

  vec3 color = uGround + uAccent * (pool * (0.25 + 0.75 * ribbons)) * uStrength * uIntro;
  color += (hash(vUv * 900.0 + fract(uTime)) - 0.5) * uGrain;

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

// Product card: photo contain-fitted onto paper, so transparent cutouts and
// photos of any aspect ratio sit cleanly on the card. Supports scene fog.
export const cardVertex = /* glsl */ `
#include <fog_pars_vertex>

varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

export const cardFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uPaper;
uniform vec2 uFitScale;
uniform vec2 uFitOffset;
uniform float uDim;
uniform float uReady;     // 0 until the photo has loaded: blank paper

varying vec2 vUv;

#include <fog_pars_fragment>

void main() {
  vec2 uv = (vUv - uFitOffset) / uFitScale;
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  vec4 texel = texture2D(uMap, clamp(uv, 0.0, 1.0));
  vec3 color = mix(uPaper, texel.rgb, texel.a * inside * uReady) * uDim;

  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;
