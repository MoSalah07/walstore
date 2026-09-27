import * as THREE from "three";

import { CONFIG } from "./config";
import { roundedRect } from "./geometry";
import { cardFragment, cardVertex } from "./shaders";

// Scale/offset that fits an image inside the card (object-fit: contain)
// with a margin of paper around it.
function containFit(image: { width: number; height: number }) {
  const { cardWidth, cardHeight, padding } = CONFIG.wall;
  const available = 1 - padding * 2;
  const imageAspect = image.width / image.height;
  const cardAspect = cardWidth / cardHeight;
  const scale =
    imageAspect > cardAspect
      ? new THREE.Vector2(available, (available * cardAspect) / imageAspect)
      : new THREE.Vector2((available * imageAspect) / cardAspect, available);
  const offset = new THREE.Vector2((1 - scale.x) / 2, (1 - scale.y) / 2);
  return { scale, offset };
}

// A tilted marquee: columns of product cards scrolling in alternating
// directions forever. Cards are opaque (the glass can only refract opaque
// objects); scene fog fades the far ones into the backdrop.
// `side` mirrors the tilt for RTL so the wall always leans away from the copy.
export function createProductWall(photos: string[], side: 1 | -1, onTextureLoad: () => void) {
  const { columns, rows, cardWidth, cardHeight, cardRadius, gap, rotation, position, dim } = CONFIG.wall;
  const columnPitch = cardWidth + gap;
  const rowPitch = cardHeight + gap;
  const columnHeight = rows * rowPitch;

  const group = new THREE.Group();
  const [rx, ry, rz] = rotation;
  const [px, py, pz] = position;
  group.rotation.set(rx, ry * side, rz * side);
  group.position.set(px * side, py, pz);

  // Shared by every card; `paper` follows the `--media-paper` token.
  const paper = { value: new THREE.Color(0xffffff) };
  const dimming = { value: dim };

  const loader = new THREE.TextureLoader();
  const textures: THREE.Texture[] = [];
  const materials = photos.map((src) => {
    const fitScale = { value: new THREE.Vector2(1, 1) };
    const fitOffset = { value: new THREE.Vector2(0, 0) };
    const ready = { value: 0 };
    const texture = loader.load(src, (loaded) => {
      const fit = containFit(loaded.image as { width: number; height: number });
      fitScale.value.copy(fit.scale);
      fitOffset.value.copy(fit.offset);
      ready.value = 1;
      onTextureLoad();
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    textures.push(texture);
    return new THREE.ShaderMaterial({
      vertexShader: cardVertex,
      fragmentShader: cardFragment,
      uniforms: {
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
        uMap: { value: texture },
        uPaper: paper,
        uDim: dimming,
        uFitScale: fitScale,
        uFitOffset: fitOffset,
        uReady: ready,
      },
      fog: true,
    });
  });
  const geometry = roundedRect(cardWidth, cardHeight, cardRadius);

  const cards = materials.length
    ? Array.from({ length: columns * rows }, (_, i) => {
        const column = i % columns;
        const row = Math.floor(i / columns);
        // Offset each column's photo sequence so neighbours never repeat.
        const mesh = new THREE.Mesh(geometry, materials[(row * 3 + column * 5) % materials.length]);
        mesh.position.x = (column - (columns - 1) / 2) * columnPitch;
        group.add(mesh);
        return { mesh, column, base: row * rowPitch + (column % 2) * rowPitch * 0.5 };
      })
    : [];

  // `travel` is the distance scrolled so far; odd columns run the other way.
  function update(travel: number) {
    for (const { mesh, column, base } of cards) {
      const direction = column % 2 ? -1 : 1;
      const y = THREE.MathUtils.euclideanModulo(base + travel * direction, columnHeight);
      mesh.position.y = y - columnHeight / 2;
    }
  }

  function setPaper(color: THREE.Color) {
    paper.value.copy(color);
  }

  return { group, textures, update, setPaper };
}
