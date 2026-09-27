import * as THREE from "three";

import { CONFIG } from "./config";
import { backgroundFragment, backgroundVertex } from "./shaders";

type SharedUniforms = {
  uTime: THREE.IUniform<number>;
  uGround: THREE.IUniform<THREE.Color>;
  uAccent: THREE.IUniform<THREE.Color>;
  uIntro: THREE.IUniform<number>;
};

// Full-frame aurora plane behind everything. `fit` scales it to exactly
// cover the camera frustum, so its UVs are screen UVs.
export function createBackground(shared: SharedUniforms, side: 1 | -1) {
  const { depth, auroraStrength, grain } = CONFIG.background;
  const material = new THREE.ShaderMaterial({
    vertexShader: backgroundVertex,
    fragmentShader: backgroundFragment,
    uniforms: {
      ...shared,
      uSide: { value: side },
      uStrength: { value: auroraStrength },
      uGrain: { value: grain },
      uAspect: { value: 1 },
    },
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.position.z = depth;
  mesh.renderOrder = -10;

  function fit(camera: THREE.PerspectiveCamera) {
    const distance = camera.position.z - depth;
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
    // A little bleed so parallax never reveals an edge.
    mesh.scale.set(height * camera.aspect * 1.08, height * 1.08, 1);
    material.uniforms.uAspect.value = camera.aspect;
  }

  return { mesh, fit };
}
