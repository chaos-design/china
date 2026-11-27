import * as THREE from "three";

import {
  buildMove,
  buildSoldier,
  buildStronghold,
  labelSprite,
  moveLabel,
  placeSide,
  type SandPalette,
  sideColor,
  unitFacing,
} from "./sand-table-figures";
import {
  BOARD_DEPTH,
  BOARD_WIDTH,
  boardToWorld,
  pointInPolygon,
  surfaceHeight,
} from "./sand-table-terrain";
import type { BattleStep, MapScene } from "./types";

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

function readColors(): SandPalette {
  const styles = getComputedStyle(document.documentElement);
  // three r128 only parses comma-separated hsl(); the design tokens are channel triples.
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
 * 事件驱动的 Three.js 沙盘：一幕一张静态图，地形与兵力只在数据变化时重建，
 * 不跑 rAF 循环——嵌入 iframe 的后台标签会节流计时器，动画循环会把画面冻在首帧。
 */
export function createSandTableScene(
  container: HTMLElement,
  initial: SceneData,
): SceneHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(readColors().paper, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.touchAction = "none";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
  const target = new THREE.Vector3(0, 0.15, 0);
  let yaw = 0;
  let pitch = 0.78;
  let distance = 42;
  let data = initial;

  // 暖白主光是物理光，不随明暗主题换色；地形与兵力才由 CSS 令牌重着色。
  const hemi = new THREE.HemisphereLight(new THREE.Color(0xfff6e8), new THREE.Color(0xece6da), 0.7);
  const ambient = new THREE.AmbientLight(new THREE.Color(0xfff6e8), 0.46);
  const key = new THREE.DirectionalLight(new THREE.Color(0xfff4df), 0.78);
  key.position.set(14, 24, 12);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -26;
  key.shadow.camera.right = 26;
  key.shadow.camera.top = 20;
  key.shadow.camera.bottom = -20;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 80;
  key.shadow.bias = -0.0009;
  const fill = new THREE.DirectionalLight(new THREE.Color(0xd4e0f0), 0.3);
  fill.position.set(-16, 11, -14);
  scene.add(hemi, ambient, key, fill);

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
      if (object instanceof THREE.Sprite) {
        object.material.map?.dispose();
        object.material.dispose();
        return;
      }
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        object.geometry?.dispose();
        const material = object.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material))
          material.forEach((item) => {
            item.dispose();
          });
        else material?.dispose();
      }
    });
    content.clear();
  }

  function buildTray(colors: SandPalette) {
    const tray = new THREE.Mesh(
      new THREE.BoxGeometry(BOARD_WIDTH + 0.9, 1.04, BOARD_DEPTH + 0.9),
      new THREE.MeshStandardMaterial({
        color: colors.ink.clone().lerp(colors.paper, 0.14),
        roughness: 0.86,
        metalness: 0.08,
      }),
    );
    tray.position.y = -0.55;
    tray.receiveShadow = true;
    content.add(tray);

    const liner = new THREE.Mesh(
      new THREE.BoxGeometry(BOARD_WIDTH + 0.16, 0.12, BOARD_DEPTH + 0.16),
      new THREE.MeshStandardMaterial({
        color: colors.paper.clone().lerp(colors.ochre, 0.22),
        roughness: 0.94,
      }),
    );
    liner.position.y = -0.17;
    liner.receiveShadow = true;
    content.add(liner);

    for (const x of [-BOARD_WIDTH / 2 - 0.28, BOARD_WIDTH / 2 + 0.28]) {
      for (const z of [-BOARD_DEPTH / 2 - 0.28, BOARD_DEPTH / 2 + 0.28]) {
        const corner = new THREE.Mesh(
          new THREE.BoxGeometry(0.62, 0.18, 0.62),
          new THREE.MeshStandardMaterial({ color: colors.ochre, roughness: 0.42, metalness: 0.55 }),
        );
        corner.position.set(x, -0.05, z);
        corner.castShadow = true;
        content.add(corner);
      }
    }
  }

  function buildTerrain(current: SceneData, colors: SandPalette) {
    const geometry = new THREE.PlaneGeometry(BOARD_WIDTH, BOARD_DEPTH, 64, 42);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position;
    const vertexColors: number[] = [];
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const z = positions.getZ(index);
      const height = surfaceHeight(x, z);
      positions.setY(index, height);
      // 低地留纸、缓坡薄赭即可：ochre 令牌本身偏灰，压墨会把山脊变成污斑。
      const t = THREE.MathUtils.clamp((height + 0.13) / 0.52, 0, 1);
      const shade = colors.paper.clone().lerp(colors.ochre, 0.07 + t * 0.24);
      const a = current.battle.regions.some(
        (region) => current.step.held.includes(region.id) && pointInPolygon(x, z, region.points),
      );
      const b = current.battle.regions.some(
        (region) => !current.step.held.includes(region.id) && pointInPolygon(x, z, region.points),
      );
      if (a) shade.lerp(colors.a, 0.5);
      else if (b) shade.lerp(colors.b, 0.42);
      vertexColors.push(shade.r, shade.g, shade.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(vertexColors, 3));
    geometry.computeVertexNormals();
    const ground = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.93,
        metalness: 0.02,
        flatShading: true,
      }),
    );
    // 地形法线明暗已经够立体；接收投影会在山脊上留下大块灰色阴影斑。
    ground.receiveShadow = false;
    content.add(ground);
  }

  /** 贴合地表的经纬网：沙盘的量度感来自细线，而不是浮在上面的装饰。 */
  function buildGraticule(colors: SandPalette) {
    const line = (points: THREE.Vector3[]) =>
      content.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({ color: colors.ink, transparent: true, opacity: 0.13 }),
        ),
      );
    for (let x = -BOARD_WIDTH / 2 + 7; x < BOARD_WIDTH / 2; x += 7) {
      const points: THREE.Vector3[] = [];
      for (let z = -BOARD_DEPTH / 2; z <= BOARD_DEPTH / 2; z += 1) {
        points.push(new THREE.Vector3(x, surfaceHeight(x, z) + 0.03, z));
      }
      line(points);
    }
    for (let z = -BOARD_DEPTH / 2 + 7; z < BOARD_DEPTH / 2; z += 7) {
      const points: THREE.Vector3[] = [];
      for (let x = -BOARD_WIDTH / 2; x <= BOARD_WIDTH / 2; x += 1) {
        points.push(new THREE.Vector3(x, surfaceHeight(x, z) + 0.03, z));
      }
      line(points);
    }
  }

  function buildRegionEdges(current: SceneData, colors: SandPalette) {
    for (const region of current.battle.regions) {
      const tone = current.step.held.includes(region.id) ? colors.a : colors.b;
      const points = region.points.map((point) => {
        const world = boardToWorld(point);
        return new THREE.Vector3(world.x, surfaceHeight(world.x, world.z) + 0.04, world.z);
      });
      points.push(points[0].clone());
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: tone, transparent: true, opacity: 0.82 }),
      );
      content.add(line);
    }
  }

  function buildRivers(current: SceneData, colors: SandPalette) {
    for (const river of current.battle.rivers) {
      if (river.points.length < 2) continue;
      const points = river.points.map((point) => {
        const world = boardToWorld(point);
        return new THREE.Vector3(world.x, surfaceHeight(world.x, world.z) + 0.08, world.z);
      });
      const curve = new THREE.CatmullRomCurve3(points);
      content.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(curve, 56, 0.105, 7, false),
          new THREE.MeshStandardMaterial({
            color: colors.b.clone().lerp(colors.paper, 0.28),
            roughness: 0.34,
            metalness: 0.12,
          }),
        ),
      );
    }
  }

  function buildStrongholds(current: SceneData, colors: SandPalette) {
    for (const place of current.battle.places) {
      const world = boardToWorld([place.x, place.y]);
      const height = surfaceHeight(world.x, world.z);
      const stronghold = buildStronghold(place, colors);
      stronghold.position.set(world.x, height + 0.02, world.z);
      content.add(stronghold);

      const label = labelSprite(place.name, sideColor(placeSide(place), colors), 1.3);
      label.position.set(world.x, height + 1.25, world.z);
      content.add(label);
    }
  }

  function buildUnits(current: SceneData, colors: SandPalette) {
    for (const unit of current.step.units) {
      const world = boardToWorld([unit.x, unit.y]);
      const height = surfaceHeight(world.x, world.z);
      const soldier = buildSoldier(unit, colors, unitFacing(unit, current.step.moves));
      soldier.position.set(world.x, height + 0.02, world.z);
      soldier.scale.setScalar(1.8);
      content.add(soldier);

      // 部队名牌压在脚下，与城池名牌分层，避免斜视镜头下叠成一团。
      const label = labelSprite(unit.label, sideColor(unit.side, colors), 1.35);
      label.position.set(world.x, height + 0.55, world.z);
      content.add(label);
    }
  }

  function buildMoves(current: SceneData, colors: SandPalette) {
    for (const move of current.step.moves) {
      content.add(buildMove(move, colors));
      const from = boardToWorld(move.from);
      const to = boardToWorld(move.to);
      const deltaX = to.x - from.x;
      const deltaZ = to.z - from.z;
      const midpointX = (from.x + to.x) / 2 - deltaZ * 0.075;
      const midpointZ = (from.z + to.z) / 2 + deltaX * 0.075;
      const label = labelSprite(moveLabel(move), sideColor(move.side, colors), 1.25);
      label.position.set(midpointX, surfaceHeight(midpointX, midpointZ) + 1.05, midpointZ);
      content.add(label);
    }
  }

  function renderNext() {
    disposeContent();
    const colors = readColors();
    buildTray(colors);
    buildTerrain(data, colors);
    buildGraticule(colors);
    buildRegionEdges(data, colors);
    buildRivers(data, colors);
    buildStrongholds(data, colors);
    buildUnits(data, colors);
    buildMoves(data, colors);
    setCamera(data.view, data.zoom);
  }

  let appliedView: SceneData["view"] | null = null;
  function setCamera(view: SceneData["view"], zoom: number) {
    // 只有切换视角预设才重置俯角；缩放与换幕保留用户拖拽出的观察姿态。
    if (view !== appliedView) {
      pitch = view === "top" ? 1.32 : 0.78;
      appliedView = view;
    }
    distance = 42 / THREE.MathUtils.clamp(zoom, 0.7, 2.2);
    positionCamera();
  }

  // 切换明暗主题时重读令牌重着色；无需页面显式通知。
  const themeObserver = new MutationObserver(() => renderNext());
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style"],
  });

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
      themeObserver.disconnect();
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
