// GLSL for the hero slider. Colours arrive as uniforms read from the design
// tokens, so every brand and colour mode restyles the scene without new shaders.

const noise = /* glsl */ `
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
`;

export const backgroundVertex = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Aurora: domain-warped fbm ribbons pooled behind the active card, tinted by
// the current slide, plus a floor glow under the cards and film grain.
export const backgroundFragment = /* glsl */ `
uniform vec3 uGround;
uniform vec3 uTint;
uniform float uTime;
uniform float uIntro;
uniform float uStrength;
uniform float uGrain;
uniform float uAspect;
uniform vec2 uCenter;     // screen UV behind the active card
uniform float uFloor;     // screen V of the reflection floor

varying vec2 vUv;

${noise}

void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y) * 2.2;
  float t = uTime * 0.035;

  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
  float ribbons = smoothstep(0.35, 0.85, fbm(p + 1.8 * q + vec2(t * 1.5, 0.0)));

  vec2 d = (vUv - uCenter) * vec2(uAspect * 0.6, 1.0);
  float pool = exp(-dot(d, d) * 4.5);

  // A thin horizon of light where the cards meet their reflections.
  float horizon = exp(-pow((vUv.y - uFloor) * 18.0, 2.0)) * exp(-pow((vUv.x - uCenter.x) * uAspect * 1.6, 2.0));

  vec3 color = uGround;
  color += uTint * (pool * (0.22 + 0.78 * ribbons)) * uStrength * uIntro;
  color += uTint * horizon * 0.18 * uIntro;
  color += (hash(vUv * 900.0 + fract(uTime)) - 0.5) * uGrain;

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

// Card: bends back at the edges while the carousel moves.
export const cardVertex = /* glsl */ `
uniform float uBend;
uniform float uHalfWidth;

varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 p = position;
  float nx = p.x / uHalfWidth;
  p.z -= uBend * nx * nx;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

// Photo cover-fitted into a rounded card with a hairline edge and a soft
// sheen that follows the pointer. The same shader draws the floor reflection
// (uReflect = 1): darker, and fading out away from the floor.
export const cardFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uFitScale;
uniform vec2 uFitOffset;
uniform float uReady;
uniform float uOpacity;
uniform float uDim;
uniform float uShift;
uniform float uSheen;
uniform float uAspect;
uniform float uRadius;
uniform float uReflect;
uniform float uReflectStrength;
uniform float uReflectHeight;
uniform vec3 uGround;

varying vec2 vUv;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float d = roundedBox(p, vec2(uAspect, 1.0) * 0.5, uRadius);
  float aa = fwidth(d);
  float mask = 1.0 - smoothstep(-aa, aa, d);

  vec2 uv = vUv * uFitScale + uFitOffset;
  vec3 photo = vec3(
    texture2D(uMap, uv + vec2(uShift, 0.0)).r,
    texture2D(uMap, uv).g,
    texture2D(uMap, uv - vec2(uShift, 0.0)).b
  );
  // Until the photo loads the card is a slightly raised panel.
  vec3 color = mix(uGround + 0.06, photo, uReady) * uDim;

  // Glossy print: a broad diagonal highlight.
  float band = (vUv.x + (1.0 - vUv.y) * 0.45) - uSheen;
  color += smoothstep(0.32, 0.0, abs(band)) * 0.07 * uReady;

  // Hairline edge catches the light.
  color += smoothstep(aa * 2.0, 0.0, abs(d + aa * 1.5)) * 0.18;

  float alpha = mask * uOpacity;
  if (uReflect > 0.5) {
    color = mix(uGround, color, 0.55);
    alpha *= uReflectStrength * smoothstep(uReflectHeight, 0.0, vUv.y);
  }

  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
`;
