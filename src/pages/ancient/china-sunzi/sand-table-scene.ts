import * as THREE from "three";

import type { BoardPoint } from "./board-geometry";
import type { BattleStep, MapScene, Unit } from "./types";

export interface SceneData {
  battle: MapScene;
  playing: boolean;
  step: BattleStep;
  view: "sand" | "top";
  zoom: number;
}

export interface SceneHandle {
  update(data: SceneData): void;
  setCamera(view: SceneData["view"], zoom: number): void;
  dispose(): void;
}

const SCALE = 0.04;

function world(point: BoardPoint): THREE.Vector3 {
  return new THREE.Vector3((point[0] - 500) * SCALE, 0, (point[1] - 320) * SCALE);
}

function readColors() {
  const styles = getComputedStyle(document.documentElement);
  // three r128 parses comma-separated hsl() only; the design tokens are channel triples.
  const read = (name: string) => {
    const [hue, saturation, lightness] = styles.getPropertyValue(name).trim().split(/\s+/);
    return new THREE.Color(`hsl(${hue}, ${saturation}, ${lightness})`);
  };

  return {
    ink: read("--ink"),
    paper: read("--paper"),
    a: read("--vermillion"),
    b: read("--blueprint"),
    ochre: read("--ochre"),
  };
}

/**
 * Imperative Three.js sand table. Geometry is rebuilt from the current step only
 * (four steps per board), never per frame. No rAF loop: the renderer draws on
 * change and on camera interaction, so an embedded/throttled tab cannot freeze it.
 */
export function createSandTableScene(
  container: HTMLElement,
  initial: SceneData,
): SceneHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(readColors().paper, 0);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
  const target = new THREE.Vector3(0, 0, 0);
  let yaw = 0;
  let pitch = 0.78;
  let distance = 42;
  let data = initial;

  const lightColor = readColors().paper;
  const lights = [
    new THREE.AmbientLight(lightColor, 0.72),
    new THREE.DirectionalLight(lightColor, 0.9),
  ];
  lights[1].position.set(12, 24, 18);
  for (const light of lights) scene.add(light);

  const content = new THREE.Group();
  scene.add(content);

  function positionCamera() {
    camera.position.set(
      target.x + distance * Math.sin(yaw) * Math.cos(pitch),
      target.y + distance * Math.sin(pitch),
      target.z + distance * Math.cos(yaw) * Math.cos(pitch),
    );
    camera.lookAt(target);
    renderer.render(scene, camera);
  }

  function resize() {
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    positionCamera();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const canvas = renderer.domElement;
  const onDown = (event: PointerEvent) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent) => {
    if (!dragging) return;
    yaw += (event.clientX - lastX) * 0.006;
    pitch = THREE.MathUtils.clamp(pitch + (event.clientY - lastY) * 0.004, 0.22, 1.32);
    lastX = event.clientX;
    lastY = event.clientY;
    positionCamera();
  };
  const onUp = () => {
    dragging = false;
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  function disposeContent() {
    content.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) {
        material.forEach((item) => {
          item.dispose();
        });
      } else material?.dispose?.();
    });
    content.clear();
  }

  function buildTerrain(colors: ReturnType<typeof readColors>) {
    const geometry = new THREE.PlaneGeometry(42, 28, 48, 32);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position;
    const vertexColors: number[] = [];
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const z = positions.getZ(index);
      const height =
        Math.sin(x * 0.42) * Math.cos(z * 0.35) * 0.24 + Math.sin(z * 0.91 + x * 0.2) * 0.1;
      positions.setY(index, height);
      const shade = colors.paper.clone().lerp(colors.ochre, 0.06 + Math.max(0, height) * 0.32);
      vertexColors.push(shade.r, shade.g, shade.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(vertexColors, 3));
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0,
    });
    content.add(new THREE.Mesh(geometry, material));

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(42.4, 1.1, 28.4),
      new THREE.MeshStandardMaterial({
        color: colors.paper.clone().multiplyScalar(0.82),
        roughness: 1,
      }),
    );
    base.position.y = -0.72;
    content.add(base);
  }

  function buildRegions(data: SceneData, colors: ReturnType<typeof readColors>) {
    for (const region of data.battle.regions) {
      const shape = new THREE.Shape();
      region.points.forEach(([x, y], index) => {
        const point = world([x, y]);
        if (index === 0) shape.moveTo(point.x, -point.z);
        else shape.lineTo(point.x, -point.z);
      });
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false });
      geometry.rotateX(-Math.PI / 2);
      const held = data.step.held.includes(region.id);
      const material = new THREE.MeshStandardMaterial({
        color: held ? colors.a : colors.b,
        transparent: true,
        opacity: held ? 0.22 : 0.12,
        roughness: 0.8,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = 0.16;
      content.add(mesh);
    }
  }

  function buildRivers(data: SceneData, colors: ReturnType<typeof readColors>) {
    for (const river of data.battle.rivers) {
      if (river.points.length < 2) continue;
      const points = river.points.map((point) => world(point).setY(0.28));
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 40, 0.07, 6, false);
      content.add(
        new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({ color: colors.b, roughness: 0.7 }),
        ),
      );
    }
  }

  function buildPlaces(data: SceneData, colors: ReturnType<typeof readColors>) {
    for (const place of data.battle.places) {
      const point = world([place.x, place.y]);
      const radius = place.kind === "capital" ? 0.28 : 0.2;
      const geometry = new THREE.CylinderGeometry(radius, radius, 0.42, 12);
      const material = new THREE.MeshStandardMaterial({
        color: place.kind === "capital" ? colors.a : colors.ink,
        roughness: 0.6,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(point.x, 0.38, point.z);
      content.add(mesh);
    }
  }

  function buildUnit(unit: Unit, colors: ReturnType<typeof readColors>) {
    const group = new THREE.Group();
    const point = world([unit.x, unit.y]);
    group.position.set(point.x, 0.34, point.z);
    group.scale.setScalar(1.3);
    const tone = unit.side === "a" ? colors.a : colors.b;
    const material = new THREE.MeshStandardMaterial({ color: tone, roughness: 0.55 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.72, 10), material);
    body.position.y = 0.48;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), material);
    head.position.y = 1.03;
    group.add(head);

    if (unit.branch === "crossbow" || unit.branch === "infantry") {
      const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.25, 6), material);
      spear.position.set(0.3, 0.72, 0);
      spear.rotation.z = -0.2;
      group.add(spear);
    }
    if (unit.branch === "cavalry") {
      const horse = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.4, 0.42), material);
      horse.position.set(0, 0.12, 0);
      group.add(horse);
    }
    if (unit.branch === "chariot") {
      const cart = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.34, 0.7), material);
      cart.position.y = 0.12;
      group.add(cart);
    }
    if (unit.branch === "navy") {
      const boat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.52), material);
      boat.position.y = 0.02;
      group.add(boat);
    }
    content.add(group);
  }

  function buildMoves(data: SceneData, colors: ReturnType<typeof readColors>) {
    for (const move of data.step.moves) {
      const from = world(move.from).setY(0.7);
      const to = world(move.to).setY(0.7);
      const middle = from.clone().lerp(to, 0.5);
      const delta = to.clone().sub(from);
      middle.x += -delta.z * 0.16;
      middle.z += delta.x * 0.16;
      const curve = new THREE.QuadraticBezierCurve3(from, middle, to);
      const tone = move.side === "a" ? colors.a : colors.b;
      content.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(curve, 24, 0.055, 6, false),
          new THREE.MeshStandardMaterial({ color: tone, roughness: 0.6 }),
        ),
      );
      const head = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.55, 8),
        new THREE.MeshStandardMaterial({ color: tone }),
      );
      head.position.copy(to);
      head.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        curve.getTangent(1).normalize(),
      );
      content.add(head);
    }
  }

  function renderNext() {
    disposeContent();
    const colors = readColors();
    buildTerrain(colors);
    buildRegions(data, colors);
    buildRivers(data, colors);
    buildPlaces(data, colors);
    for (const unit of data.step.units) buildUnit(unit, colors);
    buildMoves(data, colors);

    setCamera(data.view, data.zoom);
  }

  function setCamera(view: SceneData["view"], zoom: number) {
    pitch = view === "top" ? 1.3 : 0.78;
    distance = 42 / Math.max(0.7, Math.min(2.2, zoom));
    positionCamera();
  }

  renderNext();
  resize();

  return {
    update(next) {
      data = next;
      renderNext();
    },
    setCamera,
    dispose() {
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      disposeContent();
      renderer.dispose();
      canvas.remove();
    },
  };
}
