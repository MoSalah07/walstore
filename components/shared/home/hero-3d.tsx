"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

// Ring of product photos orbiting to the side of the hero copy, with light
// orbit lines and a particle field. Mouse adds a little parallax.
// Pauses off-screen, honours prefers-reduced-motion, falls back to a photo.
export default function Hero3D({
  photos,
  dir,
  fallback,
}: {
  photos: string[];
  dir: "ltr" | "rtl";
  fallback: React.ReactNode;
}) {
  const t = useTranslations("Home");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || photos.length === 0) return;
    let alive = true;
    let raf = 0;
    let cleanup = () => {};

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      pausedRef.current = true;
      setPaused(true);
    }

    import("three").then((THREE) => {
      if (!alive) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      } catch {
        setFailed(true);
        return;
      }
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0.4, 15);

      const stage = new THREE.Group();
      scene.add(stage);

      // Rounded card with 0..1 UVs so the photo fills it.
      const cardGeo = (cw: number, ch: number, r: number) => {
        const x = -cw / 2;
        const y = -ch / 2;
        const s = new THREE.Shape();
        s.moveTo(x + r, y);
        s.lineTo(x + cw - r, y);
        s.quadraticCurveTo(x + cw, y, x + cw, y + r);
        s.lineTo(x + cw, y + ch - r);
        s.quadraticCurveTo(x + cw, y + ch, x + cw - r, y + ch);
        s.lineTo(x + r, y + ch);
        s.quadraticCurveTo(x, y + ch, x, y + ch - r);
        s.lineTo(x, y + r);
        s.quadraticCurveTo(x, y, x + r, y);
        const g = new THREE.ShapeGeometry(s, 10);
        const pos = g.attributes.position;
        const uv: number[] = [];
        for (let i = 0; i < pos.count; i++) uv.push((pos.getX(i) - x) / cw, (pos.getY(i) - y) / ch);
        g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
        return g;
      };

      const R = 4.4;
      const geo = cardGeo(2.3, 2.3, 0.24);
      const loader = new THREE.TextureLoader();
      const ring = new THREE.Group();
      ring.rotation.x = 0.2;
      stage.add(ring);
      const textures: InstanceType<typeof THREE.Texture>[] = [];
      const materials: InstanceType<typeof THREE.Material>[] = [];
      const list = photos.slice(0, 8);
      const cards = list.map((src, i) => {
        const tex = loader.load(src, () => renderOnce());
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        textures.push(tex);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
        materials.push(mat);
        const m = new THREE.Mesh(geo, mat);
        const a = (i / list.length) * Math.PI * 2;
        const y0 = i % 2 ? 0.55 : -0.55;
        m.position.set(Math.cos(a) * R, y0, Math.sin(a) * R);
        m.userData = { y0, phase: i * 0.8 };
        ring.add(m);
        return m;
      });

      const orbit = (radius: number, opacity: number) => {
        const g = new THREE.TorusGeometry(radius, 0.012, 6, 240);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity });
        materials.push(mat);
        const mesh = new THREE.Mesh(g, mat);
        mesh.rotation.x = Math.PI / 2 + 0.2;
        stage.add(mesh);
        return mesh;
      };
      const o1 = orbit(5.4, 0.5);
      const o2 = orbit(3.1, 0.22);

      const N = 900;
      const pts = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const r = 3 + Math.random() * 9;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pts[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pts[i * 3 + 1] = r * Math.cos(ph) * 0.6;
        pts[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      }
      const pg = new THREE.BufferGeometry();
      pg.setAttribute("position", new THREE.BufferAttribute(pts, 3));
      const dustMat = new THREE.PointsMaterial({ color: 0xd0d5dd, size: 0.045, transparent: true, opacity: 0.75, depthWrite: false });
      materials.push(dustMat);
      const dust = new THREE.Points(pg, dustMat);
      stage.add(dust);

      // Keep the ring beside the copy: right in LTR, left in RTL.
      const resize = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const side = w < 1100 ? 2.6 : 3.4;
        stage.position.set(dir === "rtl" ? -side : side, -0.2, 0);
        renderOnce();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);

      let mx = 0;
      let my = 0;
      let tx = 0;
      let ty = 0;
      const onMove = (e: PointerEvent) => {
        const b = canvas.getBoundingClientRect();
        mx = (e.clientX - b.left) / b.width - 0.5;
        my = (e.clientY - b.top) / b.height - 0.5;
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      const v = new THREE.Vector3();
      const clock = new THREE.Clock();
      let time = 0;
      let visible = true;

      const place = () => {
        tx += (mx * 0.35 - tx) * 0.06;
        ty += (my * 0.2 - ty) * 0.06;
        stage.rotation.y = tx;
        stage.rotation.x = ty;
        cards.forEach((c) => {
          c.position.y = c.userData.y0 + Math.sin(time * 0.9 + c.userData.phase) * 0.18;
          c.lookAt(camera.position);
          c.getWorldPosition(v);
          const depth = Math.max(0, Math.min(1, (v.z + R) / (2 * R)));
          (c.material as InstanceType<typeof THREE.MeshBasicMaterial>).opacity = 0.28 + 0.72 * depth;
          const s = 0.82 + 0.26 * depth;
          c.scale.set(s, s, s);
        });
      };
      function renderOnce() {
        place();
        renderer.render(scene, camera);
      }

      const tick = () => {
        if (!alive) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        if (visible && !document.hidden) {
          if (!pausedRef.current) {
            time += dt;
            ring.rotation.y += dt * 0.16;
            dust.rotation.y -= dt * 0.015;
            o1.rotation.z += dt * 0.05;
            o2.rotation.z -= dt * 0.08;
          }
          renderOnce();
        }
        raf = requestAnimationFrame(tick);
      };

      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
      io.observe(canvas);

      resize();
      setReady(true);
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        window.removeEventListener("pointermove", onMove);
        geo.dispose();
        pg.dispose();
        textures.forEach((x) => x.dispose());
        materials.forEach((x) => x.dispose());
        renderer.dispose();
      };
    });

    return () => {
      alive = false;
      cleanup();
    };
  }, [photos, dir]);

  if (failed) return <>{fallback}</>;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={cn(
          "absolute inset-0 size-full transition-opacity duration-slow ease-standard",
          ready ? "opacity-100" : "opacity-0"
        )}
      />
      <div className="absolute bottom-6 end-6 z-10 flex items-center gap-3">
        <span className="hidden text-xs text-[#8B93A1] lg:inline">{t("Move your cursor")}</span>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? t("Play animation") : t("Pause animation")}
          className="flex size-10 items-center justify-center rounded-full bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)] transition-colors duration-fast hover:bg-white/15"
        >
          {paused ? <Play className="size-3.5 fill-current" /> : <Pause className="size-3.5 fill-current" />}
        </button>
      </div>
    </>
  );
}
