import * as THREE from "three";

// Rounded rectangle with 0..1 UVs so a photo fills it edge to edge.
export function roundedRect(width: number, height: number, radius: number) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape()
    .moveTo(x + radius, y)
    .lineTo(x + width - radius, y)
    .quadraticCurveTo(x + width, y, x + width, y + radius)
    .lineTo(x + width, y + height - radius)
    .quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    .lineTo(x + radius, y + height)
    .quadraticCurveTo(x, y + height, x, y + height - radius)
    .lineTo(x, y + radius)
    .quadraticCurveTo(x, y, x + radius, y);
  const geometry = new THREE.ShapeGeometry(shape, 10);
  const position = geometry.attributes.position;
  const uv: number[] = [];
  for (let i = 0; i < position.count; i++) {
    uv.push((position.getX(i) - x) / width, (position.getY(i) - y) / height);
  }
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return geometry;
}

// Ease-out used by the intro: fast start, long soft landing.
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : t <= 0 ? 0 : 1 - Math.pow(2, -10 * t));

// Frame-rate independent exponential smoothing towards a target.
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
