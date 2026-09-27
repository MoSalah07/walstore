// Every tunable number of the hero scene in one place. Units are world units
// unless noted; the camera looks down -z from `camera.z`.

export const CONFIG = {
  maxPixelRatio: 1.75,
  camera: { fov: 30, z: 16 },

  // The 3D group sits beside the copy: right in LTR, left in RTL.
  stage: { offsetNarrow: 2.4, offsetWide: 3.2, breakpoint: 1100 },

  intro: { duration: 2.2 }, // seconds

  background: { depth: -16, width: 90, height: 44, auroraStrength: 0.42, grain: 0.018 },

  // Tilted marquee of product cards behind the glass.
  wall: {
    columns: 5,
    rows: 6,
    cardWidth: 1.35, // 3:4 portrait, like the product photos
    cardHeight: 1.8,
    cardRadius: 0.14,
    padding: 0.05, // paper margin around each photo, as a fraction of the card
    gap: 0.26,
    speed: 0.35, // units per second; columns alternate direction
    scrollBoost: 0.012, // extra speed per px of scroll
    rotation: [-0.42, -0.5, 0.28] as const,
    position: [0.9, 0, -4.5] as const,
    dim: 0.9, // keeps photo whites under the bloom threshold
    fog: { near: 14, far: 30 },
  },

  glass: {
    ring: { radius: 2.05, tube: 0.52, radialSegments: 64, tubularSegments: 220 },
    spheres: [
      { radius: 0.55, position: [-2.6, 1.9, 1.2] as const, depth: 1.6 },
      { radius: 0.32, position: [2.5, -1.8, 2.0] as const, depth: 2.2 },
      { radius: 0.2, position: [-1.4, -2.3, 3.0] as const, depth: 2.8 },
    ],
    material: {
      transmission: 1,
      thickness: 1.4,
      roughness: 0.06,
      ior: 1.45,
      dispersion: 5,
      iridescence: 0.55,
      iridescenceIOR: 1.35,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.35,
      attenuationDistance: 3.2,
    },
  },

  bloom: { strength: 0.45, radius: 0.55, threshold: 0.92 },
  // Weak GPUs: after `sampleFrames`, drop to 1x pixels and no bloom if the
  // average frame rate is under `minFps`.
  quality: { sampleFrames: 90, minFps: 40 },
  toneMappingExposure: 1.05,

  // lambda: how quickly motion catches up with the pointer (per second).
  pointer: { lambda: 3.2, ringTilt: 0.45, stageYaw: 0.12, stagePitch: 0.08 },
  scroll: { ringSpin: 1.1, lift: 1.4 },
} as const;
