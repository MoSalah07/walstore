import * as THREE from "three";

import { CONFIG } from "./config";

// The hero piece: a glass ring that refracts the product wall behind it,
// with a few glass beads floating at different depths for parallax.
export function createGlass() {
  const { ring, spheres, material: settings } = CONFIG.glass;
  const material = new THREE.MeshPhysicalMaterial({
    ...settings,
    color: 0xffffff,
    metalness: 0,
    attenuationColor: new THREE.Color(0xffffff),
    fog: false, // the glass sits in front of the fogged product wall
  });

  const group = new THREE.Group();

  const ringMesh = new THREE.Mesh(
    new THREE.TorusGeometry(ring.radius, ring.tube, ring.radialSegments, ring.tubularSegments),
    material
  );
  group.add(ringMesh);

  const beads = spheres.map(({ radius, position, depth }) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), material);
    mesh.position.fromArray(position);
    group.add(mesh);
    return { mesh, home: new THREE.Vector3().fromArray(position), depth };
  });

  // Glass is tinted by the brand accent, lightly, so photos stay true.
  function setTint(accent: THREE.Color) {
    material.attenuationColor.copy(accent).lerp(new THREE.Color(0xffffff), 0.45);
  }

  return { group, ring: ringMesh, beads, material, setTint };
}
