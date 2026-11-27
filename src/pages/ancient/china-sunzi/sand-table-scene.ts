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
  /** 播放倍速，决定换幕补间的时长；静止时不跑动画循环。 */
  speed: number;
}

export interface SceneHandle {
  update(data: SceneData): void;
  setCamera(view: SceneData["view"], zoom: number): void;
  dispose(): void;
}

/**
 * 确定性沙粒纹理：同一张沙盘每次重建得到同一张沙面，
 * 不用外部图片，也不让切幕时沙纹闪变。
 */
function makeSandTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    let seed = 20261127;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const image = context.createImageData(size, size);
    for (let index = 0; index < image.data.length; index += 4) {
      const grain = 226 + random() * 28;
      image.data[index] = grain;
      image.data[index + 1] = grain - 5;
      image.data[index + 2] = grain - 14;
      image.data[index + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    for (let index = 0; index < 420; index += 1) {
      context.fillStyle = `rgba(118, 92, 58, ${0.05 + random() * 0.12})`;
      context.fillRect(random() * size, random() * size, 1, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 7);
  texture.encoding = THREE.sRGBEncoding;
  return texture;
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
 * 按需动画的 Three.js 沙盘：静止时零渲染；换幕时才启动一段带缓动的补间，
 * 完成后立刻停表。时钟用 performance.now() 并配定时器兜底，
 * 因为嵌入环境的 rAF 时间戳可能冻结，纯 rAF 循环会把动画卡在首帧。
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

  /** 换幕补间状态：只在动画期间非空，静止时没有任何循环在跑。 */
  interface Transition {
    start: number;
    duration: number;
    from: Map<string, { x: number; z: number; scale: number }>;
    targets: Map<string, THREE.Vector3>;
  }
  let transition: Transition | null = null;
  let rafId = 0;
  let fallbackId = 0;
  let lastFrameStamp = -1;
  let currentStepId: string | null = null;
  let currentBattleId: string | null = null;
  // 沙粒纹理只生成一次：换幕重建地形时复用，避免每次阻塞主线程做 65k 像素噪点。
  let sandMap: THREE.CanvasTexture | null = null;
  const getSandMap = () => {
    sandMap ??= makeSandTexture();
    return sandMap;
  };
  const unitGroups = new Map<string, THREE.Group>();
  const flowMarkers: Array<{
    mesh: THREE.Mesh;
    curve: THREE.QuadraticBezierCurve3;
    offset: number;
  }> = [];
  const clashRings: Array<{ mesh: THREE.Mesh; start: number }> = [];
  const reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 正弦缓入缓出：首尾更柔，换幕推进没有 cubic 那种突然加速的顿感。
  const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

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
            const texture = (item as THREE.MeshStandardMaterial).map;
            if (texture && texture !== sandMap) texture.dispose();
            item.dispose();
          });
        else if (material) {
          const texture = (material as THREE.MeshStandardMaterial).map;
          if (texture && texture !== sandMap) texture.dispose();
          material.dispose();
        }
      }
    });
    content.clear();
  }

  function stopAnimation() {
    if (rafId) cancelAnimationFrame(rafId);
    if (fallbackId) window.clearInterval(fallbackId);
    rafId = 0;
    fallbackId = 0;
    transition = null;
  }

  /** 单帧推进：performance.now 计时，rAF 与定时器重复触发时按 12ms 去重。 */
  function tick() {
    const active = transition;
    if (!active || document.hidden) return;
    const now = performance.now();
    if (now - lastFrameStamp < 16) return;
    lastFrameStamp = now;
    const t = Math.min(1, (now - active.start) / active.duration);
    const eased = easeInOut(t);

    for (const unit of data.step.units) {
      const group = unitGroups.get(unit.id);
      const from = active.from.get(unit.id);
      const target = active.targets.get(unit.id);
      if (!group || !from || !target) continue;
      group.position.x = from.x + (target.x - from.x) * eased;
      group.position.z = from.z + (target.z - from.z) * eased;
      group.position.y = target.y + Math.sin(eased * Math.PI * 6) * 0.07 * (1 - t);
      group.scale.setScalar(1.8 * (from.scale + (1 - from.scale) * eased));
      group.rotation.z = Math.sin(eased * Math.PI * 10) * 0.07 * (1 - t);
    }

    for (const flow of flowMarkers) {
      flow.mesh.position.copy(flow.curve.getPoint((t * 1.15 + flow.offset) % 1));
      flow.mesh.scale.setScalar(0.7 + Math.sin(t * Math.PI) * 0.5);
    }

    for (const clash of clashRings) {
      const age = (now - clash.start) / 700;
      const visible = age >= 0 && age < 1;
      clash.mesh.visible = visible;
      if (!visible) continue;
      clash.mesh.scale.setScalar(0.5 + age * 1.5);
      (clash.mesh.material as THREE.MeshBasicMaterial).opacity = 0.65 * (1 - age);
    }

    positionCamera();

    if (t >= 1) {
      for (const [id, group] of unitGroups) {
        const target = active.targets.get(id);
        if (target) group.position.copy(target);
        group.scale.setScalar(1.8);
        group.rotation.z = 0;
      }
      stopAnimation();
      positionCamera();
      return;
    }
    rafId = requestAnimationFrame(tick);
  }

  function startTransition(previous: Map<string, { x: number; z: number; scale: number }>) {
    stopAnimation();
    if (reduceMotion) return;
    const from = new Map<string, { x: number; z: number; scale: number }>();
    const targets = new Map<string, THREE.Vector3>();
    for (const unit of data.step.units) {
      const group = unitGroups.get(unit.id);
      if (!group) continue;
      targets.set(unit.id, group.position.clone());
      const old = previous.get(unit.id);
      if (old) {
        group.position.x = old.x;
        group.position.z = old.z;
        group.scale.setScalar(1.8 * old.scale);
        from.set(unit.id, old);
      } else {
        group.scale.setScalar(0.01);
        from.set(unit.id, { x: group.position.x, z: group.position.z, scale: 0.01 });
      }
    }
    if (from.size === 0) return;
    transition = {
      start: performance.now(),
      duration: 1900 / Math.max(0.5, data.speed),
      from,
      targets,
    };
    lastFrameStamp = -1;
    rafId = requestAnimationFrame(tick);
    // 只在 rAF 被后台节流停摆时兜底；16ms 去重让正常帧率始终由 rAF 决定。
    fallbackId = window.setInterval(tick, 100);
  }

  /** 城池间的驿道：淡色路基 + 赭色虚线 + 中途驿站，比单根细虚线更像沙盘路网。 */
  function buildRoads(current: SceneData, colors: SandPalette) {
    const places = [...current.battle.places].sort((a, b) => a.x - b.x);
    for (let index = 0; index < places.length - 1; index += 1) {
      const from = boardToWorld([places[index].x, places[index].y]);
      const to = boardToWorld([places[index + 1].x, places[index + 1].y]);
      const points: THREE.Vector3[] = [];
      for (let step = 0; step <= 24; step += 1) {
        const ratio = step / 24;
        const x = from.x + (to.x - from.x) * ratio;
        const z = from.z + (to.z - from.z) * ratio + Math.sin(ratio * Math.PI) * 0.62;
        points.push(new THREE.Vector3(x, surfaceHeight(x, z) + 0.06, z));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      content.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(curve, 48, 0.075, 6, false),
          new THREE.MeshStandardMaterial({
            color: colors.ochre.clone().lerp(colors.paper, 0.55),
            transparent: true,
            opacity: 0.58,
            roughness: 0.9,
            depthWrite: false,
          }),
        ),
      );
      const raised = points.map((point) => point.clone().setY(point.y + 0.1));
      const dashes = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(raised),
        new THREE.LineDashedMaterial({
          color: colors.ochre.clone().lerp(colors.ink, 0.28),
          dashSize: 0.38,
          gapSize: 0.24,
          transparent: true,
          opacity: 0.9,
        }),
      );
      dashes.computeLineDistances();
      content.add(dashes);

      const station = raised[12];
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.06, 8),
        new THREE.MeshStandardMaterial({ color: colors.ochre, roughness: 0.7 }),
      );
      post.position.set(station.x, station.y + 0.02, station.z);
      content.add(post);
    }
  }

  /** 双方贴身时亮起交锋环，为「拼杀」给出可见的时机点。 */
  function buildClashes(current: SceneData, colors: SandPalette) {
    if (current.step.moves.length === 0) return;
    for (const first of current.step.units) {
      for (const second of current.step.units) {
        if (first.side === second.side) continue;
        if (Math.hypot(first.x - second.x, first.y - second.y) > 150) continue;
        const a = boardToWorld([first.x, first.y]);
        const b = boardToWorld([second.x, second.y]);
        const x = (a.x + b.x) / 2;
        const z = (a.z + b.z) / 2;
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.32, 0.46, 24),
          new THREE.MeshBasicMaterial({
            color: colors.ochre,
            transparent: true,
            opacity: 0.65,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, surfaceHeight(x, z) + 0.22, z);
        ring.visible = false;
        content.add(ring);
        clashRings.push({ mesh: ring, start: performance.now() + 380 });
      }
    }
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
    const sandTexture = getSandMap();
    const ground = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.93,
        metalness: 0.02,
        flatShading: true,
        map: sandTexture,
        bumpMap: sandTexture,
        bumpScale: 0.08,
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

      const label = labelSprite(place.name, sideColor(placeSide(place), colors), 2);
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
      unitGroups.set(unit.id, soldier);

      // 部队名牌压在脚下，与城池名牌分层，避免斜视镜头下叠成一团。
      const label = labelSprite(unit.label, sideColor(unit.side, colors), 2.1);
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
      const label = labelSprite(moveLabel(move), sideColor(move.side, colors), 1.9);
      label.position.set(midpointX, surfaceHeight(midpointX, midpointZ) + 1.05, midpointZ);
      content.add(label);

      // 沿路线流转的光点，只示意推进方向，不冒充真实行军轨迹。
      const start = new THREE.Vector3(from.x, surfaceHeight(from.x, from.z) + 0.68, from.z);
      const end = new THREE.Vector3(to.x, surfaceHeight(to.x, to.z) + 0.68, to.z);
      const middle = start.clone().lerp(end, 0.5);
      const delta = end.clone().sub(start);
      middle.x += -delta.z * 0.15;
      middle.z += delta.x * 0.15;
      const flow = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 6),
        new THREE.MeshBasicMaterial({
          color: sideColor(move.side, colors),
          transparent: true,
          opacity: 0.85,
        }),
      );
      content.add(flow);
      flowMarkers.push({
        mesh: flow,
        curve: new THREE.QuadraticBezierCurve3(start, middle, end),
        offset: flowMarkers.length * 0.24,
      });
    }
  }

  function renderNext() {
    stopAnimation();
    unitGroups.clear();
    flowMarkers.length = 0;
    clashRings.length = 0;
    disposeContent();
    const colors = readColors();
    buildTray(colors);
    buildTerrain(data, colors);
    buildGraticule(colors);
    buildRegionEdges(data, colors);
    buildRivers(data, colors);
    buildRoads(data, colors);
    buildStrongholds(data, colors);
    buildUnits(data, colors);
    buildMoves(data, colors);
    buildClashes(data, colors);
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
      const previous = new Map<string, { x: number; z: number; scale: number }>();
      for (const [id, group] of unitGroups) {
        previous.set(id, {
          x: group.position.x,
          z: group.position.z,
          scale: group.scale.x / 1.8,
        });
      }
      const changedStep = currentStepId !== null && currentStepId !== next.step.id;
      const changedBattle = currentBattleId !== null && currentBattleId !== next.battle.id;
      data = next;
      renderNext();
      currentStepId = data.step.id;
      currentBattleId = data.battle.id;
      if (changedStep && !changedBattle) startTransition(previous);
    },
    setCamera,
    dispose() {
      stopAnimation();
      observer.disconnect();
      themeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      disposeContent();
      sandMap?.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
