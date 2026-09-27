import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

import type { Rgb } from "@/lib/theme-tokens";
import { createBackground } from "./background";
import { CONFIG } from "./config";
import { damp, easeOutExpo } from "./geometry";
import { createGlass } from "./glass";
import { createProductWall } from "./product-wall";

// "Glass portal" hero: a glass ring refracting a tilted marquee of product
// cards over an aurora backdrop. Framework-free — the React wrapper owns
// the lifecycle and feeds in the palette from the design tokens.

export type HeroPalette = {
  /** Section background (`--inverse`): backdrop, fog. */
  ground: Rgb;
  /** Light in the scene (`--inverse-accent`): aurora, glass tint. */
  accent: Rgb;
  /** Product card stock (`--media-paper`). */
  paper: Rgb;
};

export type HeroSceneOptions = {
  canvas: HTMLCanvasElement;
  photos: string[];
  dir: "ltr" | "rtl";
  palette: HeroPalette | null;
  paused: boolean;
};

export type HeroScene = {
  setPaused: (paused: boolean) => void;
  setPalette: (palette: HeroPalette) => void;
  dispose: () => void;
};

const toColor = ([r, g, b]: Rgb) => new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);

/** Throws if WebGL is unavailable; the caller shows its fallback. */
export function createHeroScene({ canvas, photos, dir, palette, paused: startPaused }: HeroSceneOptions): HeroScene {
  const side = dir === "rtl" ? -1 : 1;

  // ── Renderer, camera, environment ──────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CONFIG.maxPixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = CONFIG.toneMappingExposure;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, 0.1, 100);
  camera.position.z = CONFIG.camera.z;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04).texture;
  scene.environment = environment;
  room.dispose();
  pmrem.dispose();

  const { fog: fogRange } = CONFIG.wall;
  const fog = new THREE.Fog(0x000000, fogRange.near, fogRange.far);
  scene.fog = fog;

  // Shared uniforms: one palette update restyles every shader.
  const uniforms = {
    uTime: { value: 0 },
    uIntro: { value: 0 },
    uGround: { value: new THREE.Color(0x000000) },
    uAccent: { value: new THREE.Color(0xffffff) },
  };

  // ── Objects ────────────────────────────────────────────────────────
  const background = createBackground(uniforms, side);
  scene.add(background.mesh);

  const stage = new THREE.Group();
  scene.add(stage);

  const wall = createProductWall(photos, side, () => requestRender());
  stage.add(wall.group);

  const glass = createGlass();
  stage.add(glass.group);

  // ── Post-processing: MSAA target → bloom on glass highlights → output ─
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(1, 1),
    CONFIG.bloom.strength,
    CONFIG.bloom.radius,
    CONFIG.bloom.threshold
  );
  const output = new OutputPass();
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(bloom);
  composer.addPass(output);

  // ── State ──────────────────────────────────────────────────────────
  let paused = startPaused;
  let visible = true;
  let running = false;
  let frameId = 0;
  let time = 0;
  // Reduced motion starts on the finished intro instead of animating it.
  let introElapsed = startPaused ? CONFIG.intro.duration : 0;
  let travel = 0;
  let lastScrollY = window.scrollY;
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  const timer = new THREE.Timer();
  const frameStats = { count: 0, seconds: 0, settled: false };

  function measureQuality(delta: number) {
    if (frameStats.settled) return;
    frameStats.count += 1;
    frameStats.seconds += delta;
    if (frameStats.count < CONFIG.quality.sampleFrames) return;
    frameStats.settled = true;
    if (frameStats.count / frameStats.seconds >= CONFIG.quality.minFps) return;
    renderer.setPixelRatio(1);
    bloom.enabled = false;
    resize();
  }

  function update(dt: number) {
    time += dt;
    uniforms.uTime.value = time;

    introElapsed = Math.min(introElapsed + dt, CONFIG.intro.duration);
    const intro = easeOutExpo(introElapsed / CONFIG.intro.duration);
    uniforms.uIntro.value = intro;

    // Scroll: 0 while the hero is in view, 1 once it has scrolled past.
    const box = canvas.getBoundingClientRect();
    const scroll = THREE.MathUtils.clamp(-box.top / box.height, 0, 1);
    const scrollDelta = Math.abs(window.scrollY - lastScrollY);
    lastScrollY = window.scrollY;

    const { lambda, ringTilt, stageYaw, stagePitch } = CONFIG.pointer;
    eased.x = damp(eased.x, pointer.x, lambda, dt);
    eased.y = damp(eased.y, pointer.y, lambda, dt);
    stage.rotation.y = eased.x * stageYaw;
    stage.rotation.x = eased.y * stagePitch;

    // Product wall: steady drift, nudged along by scrolling; emerges from fog.
    travel += dt * CONFIG.wall.speed + scrollDelta * CONFIG.wall.scrollBoost;
    wall.update(travel);
    fog.far = THREE.MathUtils.lerp(fogRange.near + 0.5, fogRange.far, intro);

    // Glass ring: settles in on load, leans towards the pointer, turns on scroll.
    const { ring, group, beads } = glass;
    group.scale.setScalar(0.7 + 0.3 * intro);
    group.position.y = scroll * CONFIG.scroll.lift;
    ring.rotation.set(
      0.38 + eased.y * ringTilt + Math.sin(time * 0.35) * 0.06 + scroll * CONFIG.scroll.ringSpin,
      side * (-0.5 + (1 - intro) * 1.6) + eased.x * ringTilt,
      time * 0.06
    );

    // Beads: nearer ones move more with the pointer; drift in on load.
    const spread = 1 + (1 - intro) * 0.8;
    beads.forEach(({ mesh, home, depth }, i) => {
      mesh.position.set(
        home.x * spread + eased.x * depth * 0.5,
        home.y * spread - eased.y * depth * 0.4 + Math.sin(time * 0.7 + i * 2.1) * 0.12,
        home.z
      );
    });
  }

  const render = () => composer.render();
  const shouldRun = () => !paused && visible && !document.hidden;

  function loop() {
    if (!shouldRun()) {
      running = false;
      return;
    }
    // One clock (performance.now) for update and reset, so deltas are never
    // negative; the cap keeps a stalled tab from jumping the animation.
    timer.update();
    const delta = Math.max(timer.getDelta(), 0);
    measureQuality(delta);
    update(Math.min(delta, 0.05));
    render();
    frameId = requestAnimationFrame(loop);
  }

  function start() {
    if (running || !shouldRun()) return;
    running = true;
    timer.reset(); // drop the time spent paused
    frameId = requestAnimationFrame(loop);
  }

  // Draws one still frame when the loop isn't running (paused, off-screen).
  function requestRender() {
    if (running) return;
    update(0);
    render();
  }

  // ── Events ─────────────────────────────────────────────────────────
  function resize() {
    const { clientWidth: width, clientHeight: height } = canvas;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    background.fit(camera);
    const { offsetNarrow, offsetWide, breakpoint } = CONFIG.stage;
    stage.position.x = side * (width < breakpoint ? offsetNarrow : offsetWide);
    requestRender();
  }

  function onPointerMove(e: PointerEvent) {
    const box = canvas.getBoundingClientRect();
    pointer.x = THREE.MathUtils.clamp(((e.clientX - box.left) / box.width) * 2 - 1, -1, 1);
    pointer.y = THREE.MathUtils.clamp(((e.clientY - box.top) / box.height) * 2 - 1, -1, 1);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    start();
  });
  visibilityObserver.observe(canvas);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("visibilitychange", start);

  // ── API ────────────────────────────────────────────────────────────
  function setPalette({ ground, accent, paper }: HeroPalette) {
    uniforms.uGround.value.copy(toColor(ground));
    uniforms.uAccent.value.copy(toColor(accent));
    fog.color.copy(uniforms.uGround.value);
    glass.setTint(uniforms.uAccent.value);
    wall.setPaper(toColor(paper));
    requestRender();
  }

  function setPaused(next: boolean) {
    paused = next;
    if (paused) requestRender();
    else start();
  }

  function dispose() {
    cancelAnimationFrame(frameId);
    running = false;
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    window.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("visibilitychange", start);
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        (object.material as THREE.Material).dispose();
      }
    });
    wall.textures.forEach((texture) => texture.dispose());
    environment.dispose();
    bloom.dispose();
    output.dispose();
    composer.dispose();
    timer.dispose();
    renderer.dispose();
  }

  if (palette) setPalette(palette);
  resize();
  start();

  return { setPaused, setPalette, dispose };
}
