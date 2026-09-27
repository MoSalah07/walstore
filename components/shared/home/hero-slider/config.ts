// Every tunable number of the hero slider scene. Units are world units unless
// noted; the camera looks down -z from `camera.z`.

export const CONFIG = {
  maxPixelRatio: 2,
  camera: { fov: 28, z: 17 },

  // Portrait 2:3 cards, like the editorial photos.
  card: { width: 3.2, height: 4.8, radius: 0.045, segments: 40 },

  // Upcoming slides queue along a convex arc on the far side from the copy.
  arc: {
    radius: 6,
    spacing: 0.5, // radians between neighbours
    shrink: 0.12, // scale lost by the first neighbour; later ones lose half that
    dim: 0.5, // brightness of queued cards
    fade: [1.7, 2.45] as const, // offset range over which the far card fades out
  },

  // The outgoing card flies past the camera on the copy side.
  exit: { x: -3.6, y: 0.5, z: 5.2, yaw: -0.55, grow: 0.18 },

  // Where the stack sits: beside the copy on wide screens, above it on phones.
  stage: {
    wide: { x: 2.9, y: 0.45, scale: 1.1 },
    narrow: { x: 0.35, y: 1.85, scale: 0.66 },
    wideAspect: 1.05,
  },

  motion: {
    lambda: 5.2, // how fast the carousel catches up with its target (per second)
    bend: 0.55, // curl of a card per slide/second of speed
    bendMax: 0.75,
    shift: 0.01, // RGB split per slide/second of speed
    shiftMax: 0.012,
    float: 0.07, // idle bob of the active card
  },

  reflection: { gap: 0.08, strength: 0.22, height: 0.42 },
  intro: { duration: 1.4 }, // seconds
  pointer: { lambda: 3, yaw: 0.14, pitch: 0.07 },

  // Dragging one slide = this fraction of the canvas width.
  drag: { widthPerSlide: 0.32, clickSlop: 6, flick: 0.35 },

  background: { depth: -14, auroraStrength: 0.36, grain: 0.008 },

  // Weak GPUs: after `sampleFrames`, drop to 1x pixels if under `minFps`.
  quality: { sampleFrames: 90, minFps: 40 },
} as const;
