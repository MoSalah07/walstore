import * as THREE from "three";

import type { Rgb } from "@/lib/theme-tokens";
import { CONFIG } from "./config";
import { backgroundFragment, backgroundVertex, cardFragment, cardVertex } from "./shaders";

// Hero slider stage: editorial photo cards on a curved rail. The active card
// stands in front with its reflection; upcoming slides queue along an arc;
// the outgoing card flies past the camera. Cards curl and split RGB with
// speed. Framework-free — the React wrapper owns the lifecycle, the slide
// index and the palette.

export type SliderPalette = {
  /** Section background (`--inverse`). */
  ground: Rgb;
  /** Light for regular slides (`--inverse-accent`). */
  accent: Rgb;
  /** Light for the deals slide (`--deal`). */
  deal: Rgb;
};

export type SliderSlide = { image: string; tone: "accent" | "deal" };

export type SliderSceneOptions = {
  canvas: HTMLCanvasElement;
  slides: SliderSlide[];
  index: number;
  dir: "ltr" | "rtl";
  palette: SliderPalette | null;
  reducedMotion: boolean;
  /** The visitor picked a slide by dragging or clicking a card. */
  onSelect: (index: number) => void;
};

export type SliderScene = {
  goTo: (index: number) => void;
  setPalette: (palette: SliderPalette) => void;
  dispose: () => void;
};

const toColor = ([r, g, b]: Rgb) => new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
const smoothstep = THREE.MathUtils.smoothstep;
const clamp = THREE.MathUtils.clamp;
const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
const wrap = (value: number, size: number) => THREE.MathUtils.euclideanModulo(value + size / 2, size) - size / 2;

type Layout = { x: number; y: number; z: number; yaw: number; scale: number; opacity: number; dim: number };

// Where a card sits `offset` slides away from the front (LTR space).
function layout(offset: number): Layout {
  const { arc, exit } = CONFIG;
  if (offset < 0) {
    const t = Math.min(-offset, 1);
    const e = t * t * (3 - 2 * t);
    return {
      x: exit.x * e,
      y: exit.y * e,
      z: exit.z * e,
      yaw: exit.yaw * e,
      scale: 1 + exit.grow * e,
      opacity: 1 - smoothstep(t, 0.15, 0.85),
      dim: 1,
    };
  }
  const angle = offset * arc.spacing;
  return {
    x: arc.radius * Math.sin(angle),
    y: 0,
    z: arc.radius * (Math.cos(angle) - 1),
    yaw: angle,
    scale: 1 - arc.shrink * Math.min(offset, 1) - arc.shrink * 0.5 * Math.max(offset - 1, 0),
    opacity: 1 - smoothstep(offset, arc.fade[0], arc.fade[1]),
    dim: THREE.MathUtils.lerp(1, arc.dim, Math.min(offset, 1)),
  };
}

/** Throws if WebGL is unavailable; the caller shows its fallback. */
export function createSliderScene({
  canvas,
  slides,
  index: startIndex,
  dir,
  palette,
  reducedMotion,
  onSelect,
}: SliderSceneOptions): SliderScene {
  const side = dir === "rtl" ? -1 : 1;
  const count = slides.length;
  // At least five cards so a card never jumps from one end to the other in view.
  const cardCount = count * Math.ceil(5 / count);
  const { card: size, motion } = CONFIG;

  // ── Renderer, camera ───────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CONFIG.maxPixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, 0.1, 100);
  camera.position.z = CONFIG.camera.z;

  // Shared uniforms: one palette update restyles every shader.
  const shared = {
    uTime: { value: 0 },
    uIntro: { value: reducedMotion ? 1 : 0 },
    uGround: { value: new THREE.Color(0x0b0d12) },
    uTint: { value: new THREE.Color(0xffffff) },
    uBend: { value: 0 },
    uShift: { value: 0 },
    uSheen: { value: 0.5 },
  };
  const tones = { accent: new THREE.Color(0xffffff), deal: new THREE.Color(0xc2410c) };

  // ── Background ─────────────────────────────────────────────────────
  const backgroundMaterial = new THREE.ShaderMaterial({
    vertexShader: backgroundVertex,
    fragmentShader: backgroundFragment,
    uniforms: {
      uGround: shared.uGround,
      uTint: shared.uTint,
      uTime: shared.uTime,
      uIntro: shared.uIntro,
      uStrength: { value: CONFIG.background.auroraStrength },
      uGrain: { value: CONFIG.background.grain },
      uAspect: { value: 1 },
      uCenter: { value: new THREE.Vector2(0.7, 0.55) },
      uFloor: { value: 0.2 },
    },
    depthWrite: false,
  });
  const background = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), backgroundMaterial);
  background.position.z = CONFIG.background.depth;
  background.renderOrder = -10;
  scene.add(background);

  // ── Cards ──────────────────────────────────────────────────────────
  const stage = new THREE.Group();
  scene.add(stage);

  const geometry = new THREE.PlaneGeometry(size.width, size.height, size.segments, 1);
  const loader = new THREE.TextureLoader();
  const textures = slides.map((slide) => {
    const fitScale = new THREE.Vector2(1, 1);
    const fitOffset = new THREE.Vector2(0, 0);
    const ready = { value: 0 };
    const texture = loader.load(slide.image, (loaded) => {
      // object-fit: cover
      const { width, height } = loaded.image as { width: number; height: number };
      const imageAspect = width / height;
      const cardAspect = size.width / size.height;
      if (imageAspect > cardAspect) fitScale.set(cardAspect / imageAspect, 1);
      else fitScale.set(1, imageAspect / cardAspect);
      fitOffset.set((1 - fitScale.x) / 2, (1 - fitScale.y) / 2);
      ready.value = 1;
      kick();
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return { texture, fitScale, fitOffset, ready };
  });

  function cardMaterial(slide: number, reflect: boolean, opacity: THREE.IUniform<number>, dim: THREE.IUniform<number>) {
    const t = textures[slide];
    return new THREE.ShaderMaterial({
      vertexShader: cardVertex,
      fragmentShader: cardFragment,
      uniforms: {
        uMap: { value: t.texture },
        uFitScale: { value: t.fitScale },
        uFitOffset: { value: t.fitOffset },
        uReady: t.ready,
        uOpacity: opacity,
        uDim: dim,
        uBend: shared.uBend,
        uShift: shared.uShift,
        uSheen: shared.uSheen,
        uGround: shared.uGround,
        uHalfWidth: { value: size.width / 2 },
        uAspect: { value: size.width / size.height },
        uRadius: { value: size.radius },
        uReflect: { value: reflect ? 1 : 0 },
        uReflectStrength: { value: CONFIG.reflection.strength },
        uReflectHeight: { value: CONFIG.reflection.height },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  // Each card stands on the floor: the group origin is the floor point under
  // it, so scaling keeps every card (and its reflection) on the same floor.
  const lift = size.height / 2 + CONFIG.reflection.gap;
  const cards = Array.from({ length: cardCount }, (_, k) => {
    const slide = k % count;
    const opacity = { value: 0 };
    const dim = { value: 1 };
    const group = new THREE.Group();
    const face = new THREE.Mesh(geometry, cardMaterial(slide, false, opacity, dim));
    face.position.y = lift;
    face.userData.card = k;
    const reflection = new THREE.Mesh(geometry, cardMaterial(slide, true, opacity, dim));
    reflection.position.y = -lift;
    reflection.scale.y = -1;
    group.add(face, reflection);
    stage.add(group);
    return { k, slide, group, face, opacity, dim };
  });
  const faces = cards.map((c) => c.face);

  // ── State ──────────────────────────────────────────────────────────
  // `target` and `current` count slides without wrapping; card k sits at
  // wrap(k - current), so the rail loops forever.
  let target = startIndex;
  let current = startIndex;
  let velocity = 0;
  let time = 0;
  let introElapsed = reducedMotion ? CONFIG.intro.duration : 0;
  let visible = true;
  let running = false;
  let dirty = true;
  let frameId = 0;
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  const stagePose = { x: 0, y: 0, scale: 1 };
  const timer = new THREE.Timer();
  const frameStats = { count: 0, seconds: 0, settled: false };
  const drag = { active: false, id: -1, startX: 0, startTarget: 0, lastX: 0, lastT: 0, speed: 0, moved: 0 };

  function measureQuality(delta: number) {
    if (frameStats.settled) return;
    frameStats.count += 1;
    frameStats.seconds += delta;
    if (frameStats.count < CONFIG.quality.sampleFrames) return;
    frameStats.settled = true;
    if (frameStats.count / frameStats.seconds < CONFIG.quality.minFps) {
      renderer.setPixelRatio(1);
      resize();
    }
  }

  const slideAt = (value: number) => THREE.MathUtils.euclideanModulo(Math.round(value), count);

  function update(dt: number) {
    time += dt;
    shared.uTime.value = time;
    introElapsed = Math.min(introElapsed + dt, CONFIG.intro.duration);
    const intro = 1 - Math.pow(1 - introElapsed / CONFIG.intro.duration, 3);
    shared.uIntro.value = intro;

    // Carousel position: springs towards the target unless a finger holds it.
    const previous = current;
    current = reducedMotion && !drag.active ? target : damp(current, target, motion.lambda, dt);
    if (Math.abs(current - target) < 1e-4) current = target;
    const speed = dt > 0 ? (current - previous) / dt : 0;
    velocity = damp(velocity, speed, 10, dt);
    const fast = reducedMotion ? 0 : Math.abs(velocity);
    shared.uBend.value = Math.min(fast * motion.bend, motion.bendMax);
    shared.uShift.value = Math.min(fast * motion.shift, motion.shiftMax);

    const { lambda, yaw, pitch } = CONFIG.pointer;
    eased.x = damp(eased.x, reducedMotion ? 0 : pointer.x, lambda, dt);
    eased.y = damp(eased.y, reducedMotion ? 0 : pointer.y, lambda, dt);
    stage.rotation.set(eased.y * pitch, eased.x * yaw, 0);
    shared.uSheen.value = 0.55 + eased.x * 0.5;

    stage.position.set(stagePose.x, stagePose.y - (1 - intro) * 1.2, 0);
    stage.scale.setScalar(stagePose.scale);

    const tone = slides[slideAt(current)].tone;
    shared.uTint.value.lerp(tones[tone], 1 - Math.exp(-4 * dt));

    const bob = reducedMotion ? 0 : Math.sin(time * 1.1) * motion.float;
    for (const card of cards) {
      const offset = wrap(card.k - current, cardCount);
      const pose = layout(offset);
      const shown = pose.opacity > 0.001 && offset > -1;
      card.group.visible = shown;
      if (!shown) continue;
      card.group.position.set(pose.x * side, pose.y, pose.z);
      card.group.rotation.y = pose.yaw * side;
      card.group.scale.setScalar(pose.scale);
      card.opacity.value = pose.opacity * intro;
      card.dim.value = pose.dim;
      // Only the front card breathes.
      const front = 1 - Math.min(Math.abs(offset), 1);
      card.face.position.y = lift + bob * front;
    }
  }

  const settled = () =>
    current === target && Math.abs(velocity) < 1e-3 && introElapsed >= CONFIG.intro.duration && !drag.active;
  const shouldRun = () => visible && !document.hidden;

  function loop() {
    if (!shouldRun()) {
      running = false;
      return;
    }
    timer.update();
    const delta = Math.max(timer.getDelta(), 0);
    measureQuality(delta);
    update(Math.min(delta, 0.05));
    renderer.render(scene, camera);
    // With reduced motion nothing idles, so stop once the view has settled.
    if (reducedMotion && settled() && !dirty) {
      running = false;
      return;
    }
    dirty = false;
    frameId = requestAnimationFrame(loop);
  }

  function kick() {
    dirty = true;
    if (running || !shouldRun()) return;
    running = true;
    timer.reset();
    frameId = requestAnimationFrame(loop);
  }

  // ── Layout ─────────────────────────────────────────────────────────
  function resize() {
    const { clientWidth: width, clientHeight: height } = canvas;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const distance = camera.position.z - CONFIG.background.depth;
    const frustumHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
    background.scale.set(frustumHeight * camera.aspect * 1.08, frustumHeight * 1.08, 1);
    backgroundMaterial.uniforms.uAspect.value = camera.aspect;

    const pose = camera.aspect >= CONFIG.stage.wideAspect ? CONFIG.stage.wide : CONFIG.stage.narrow;
    // The floor sits half a card below the stage centre.
    stagePose.x = pose.x * side;
    stagePose.y = pose.y - (size.height / 2) * pose.scale;
    stagePose.scale = pose.scale;

    // Light pools behind the front card; the horizon runs along the floor.
    const centre = new THREE.Vector3(stagePose.x, stagePose.y + lift * pose.scale, 0).project(camera);
    const floor = new THREE.Vector3(stagePose.x, stagePose.y, 0).project(camera);
    backgroundMaterial.uniforms.uCenter.value.set(centre.x * 0.5 + 0.5, centre.y * 0.5 + 0.5);
    backgroundMaterial.uniforms.uFloor.value = floor.y * 0.5 + 0.5;
    kick();
  }

  // ── Input ──────────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  function cardUnder(e: PointerEvent) {
    const box = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(faces, false).find((h) => cards[h.object.userData.card].opacity.value > 0.4);
    return hit ? cards[hit.object.userData.card] : null;
  }

  function goToNearest(slide: number) {
    const base = Math.round(target);
    let diff = THREE.MathUtils.euclideanModulo(slide - base, count);
    if (diff > count / 2) diff -= count;
    target = base + diff;
    kick();
  }

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    drag.active = true;
    drag.id = e.pointerId;
    drag.startX = drag.lastX = e.clientX;
    drag.startTarget = target;
    drag.lastT = performance.now();
    drag.speed = 0;
    drag.moved = 0;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
    kick();
  }

  function onPointerMove(e: PointerEvent) {
    const box = canvas.getBoundingClientRect();
    pointer.x = clamp(((e.clientX - box.left) / box.width) * 2 - 1, -1, 1);
    pointer.y = clamp(((e.clientY - box.top) / box.height) * 2 - 1, -1, 1);

    if (drag.active && e.pointerId === drag.id) {
      const now = performance.now();
      const perSlide = box.width * CONFIG.drag.widthPerSlide;
      // Dragging towards the copy pulls the next card forward.
      target = drag.startTarget - ((e.clientX - drag.startX) * side) / perSlide;
      drag.speed = ((e.clientX - drag.lastX) * side) / perSlide / Math.max((now - drag.lastT) / 1000, 1e-3);
      drag.lastX = e.clientX;
      drag.lastT = now;
      drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.startX));
      kick();
      return;
    }
    if (e.pointerType === "mouse" && e.target === canvas) {
      const card = cardUnder(e);
      canvas.style.cursor = card && !isFront(card) ? "pointer" : "grab";
    }
  }

  const isFront = (card: (typeof cards)[number] | null) =>
    !!card && Math.abs(wrap(card.k - current, cardCount)) < 0.5;

  function onPointerUp(e: PointerEvent) {
    if (!drag.active || e.pointerId !== drag.id) return;
    drag.active = false;
    canvas.style.cursor = "grab";
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);

    if (drag.moved < CONFIG.drag.clickSlop) {
      // A tap on a queued card brings it forward.
      target = drag.startTarget;
      const card = cardUnder(e);
      if (card && !isFront(card)) {
        goToNearest(card.slide);
        onSelect(card.slide);
      }
      kick();
      return;
    }
    // A flick carries on to the next slide in its direction.
    const fling = clamp(-drag.speed * 0.12, -CONFIG.drag.flick * 2, CONFIG.drag.flick * 2);
    target = Math.round(target + fling);
    kick();
    onSelect(slideAt(target));
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    kick();
  });
  visibilityObserver.observe(canvas);
  canvas.style.cursor = "grab";
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("visibilitychange", kick);

  // ── API ────────────────────────────────────────────────────────────
  function goTo(slide: number) {
    if (drag.active || slideAt(target) === slide) return;
    goToNearest(slide);
  }

  function setPalette({ ground, accent, deal }: SliderPalette) {
    shared.uGround.value.copy(toColor(ground));
    tones.accent.copy(toColor(accent));
    tones.deal.copy(toColor(deal));
    shared.uTint.value.copy(tones[slides[slideAt(target)].tone]);
    kick();
  }

  function dispose() {
    cancelAnimationFrame(frameId);
    running = false;
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    window.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("visibilitychange", kick);
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) (object.material as THREE.Material).dispose();
    });
    geometry.dispose();
    background.geometry.dispose();
    textures.forEach((t) => t.texture.dispose());
    timer.dispose();
    renderer.dispose();
  }

  if (palette) setPalette(palette);
  resize();
  kick();

  return { goTo, setPalette, dispose };
}
