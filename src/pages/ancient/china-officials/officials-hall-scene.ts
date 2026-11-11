import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import type { OfficialGrade, OfficialsDynasty } from "./officials-data";
import { branchCounts } from "./officials-data";
import type { GradeProjection } from "./officials-hud";

/**
 * 品秩全景的 Three.js 场景层。
 *
 * 立体结构里**只有品级节点**：每一枚六棱台是一级品阶，官职不生成任何立体节点，
 * 而是由 React 的 HUD 名录（按文 / 武分组）标注；名录行与本帧的节点投影同高。
 * 这一层只负责绘制、投影、拾取与镜头，历史与官职数据全在 officials-data.ts。
 * jsdom 无 WebGL，故该文件按仓库惯例排除出覆盖率统计。
 */

export type HallPreset = "three-quarter" | "front" | "overlook";
export type HallSpacing = "compact" | "roomy";

export interface HallColors {
  blueprint: string;
  ink: string;
  ochre: string;
  paper: string;
  vermillion: string;
}

export interface HallSceneHandlers {
  onFrame: (projections: GradeProjection[]) => void;
  onGradeHover: (gradeId: string | null) => void;
  onGradePick: (gradeId: string | null) => void;
  onUnavailable?: () => void;
}

export interface HallScene {
  applyPreset: (preset: HallPreset) => void;
  dispose: () => void;
  focusGrade: (gradeId: string) => void;
  resetView: () => void;
  resize: () => void;
  setActiveGrade: (gradeId: string | null) => void;
  setAutoRotate: (enabled: boolean) => void;
  setDynasty: (dynasty: OfficialsDynasty, options: { spacing: HallSpacing }) => void;
  setSpacing: (spacing: HallSpacing) => void;
}

const PRESET_ANGLES: Record<HallPreset, { azimuth: number; polar: number }> = {
  "three-quarter": { azimuth: 0.34, polar: 0.25 },
  front: { azimuth: 0, polar: 0.16 },
  overlook: { azimuth: 0.24, polar: 0.68 },
};

const FONT_STACK =
  '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
const LABEL_WORLD_PER_PX = 0.017;

export function readHallColors(container: HTMLElement): HallColors {
  const styles = getComputedStyle(container);
  const read = (name: string, fallback: string) => {
    const value = styles.getPropertyValue(name).trim();
    return value ? `hsl(${value.replace(/\s+/g, ", ")})` : fallback;
  };

  return {
    blueprint: read("--blueprint", "hsl(210, 16%, 40%)"),
    ink: read("--ink", "hsl(220, 14%, 13%)"),
    ochre: read("--ochre", "hsl(38, 30%, 55%)"),
    paper: read("--paper", "hsl(40, 18%, 90%)"),
    vermillion: read("--vermillion", "hsl(200, 28%, 30%)"),
  };
}

function colorCss(value: string, alpha = 1): string {
  const color = new THREE.Color(value);
  const red = Math.round(color.r * 255);
  const green = Math.round(color.g * 255);
  const blue = Math.round(color.b * 255);
  return alpha >= 1
    ? `rgb(${red}, ${green}, ${blue})`
    : `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function makePlaque(colors: HallColors, title: string, subtitle: string): THREE.Sprite {
  const pixelRatio = 2;
  const titleSize = 32;
  const subtitleSize = 20;
  const padX = 20;
  const padY = 10;
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) {
    return new THREE.Sprite();
  }
  measure.font = `600 ${titleSize}px ${FONT_STACK}`;
  let width = measure.measureText(title).width;
  measure.font = `500 ${subtitleSize}px ${FONT_STACK}`;
  width = Math.max(width, measure.measureText(subtitle).width) + padX * 2;
  const height = titleSize * 1.15 + subtitleSize * 1.1 + padY * 2 + 4;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width * pixelRatio));
  canvas.height = Math.max(1, Math.ceil(height * pixelRatio));
  const context = canvas.getContext("2d");
  if (!context) {
    return new THREE.Sprite();
  }
  context.scale(pixelRatio, pixelRatio);

  context.fillStyle = colorCss(colors.paper, 0.9);
  context.strokeStyle = colorCss(colors.ink, 0.28);
  context.lineWidth = 1;
  const radius = 7;
  context.beginPath();
  context.moveTo(radius, 0);
  context.lineTo(width - radius, 0);
  context.quadraticCurveTo(width, 0, width, radius);
  context.lineTo(width, height - radius);
  context.quadraticCurveTo(width, height, width - radius, height);
  context.lineTo(radius, height);
  context.quadraticCurveTo(0, height, 0, height - radius);
  context.lineTo(0, radius);
  context.quadraticCurveTo(0, 0, radius, 0);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = colorCss(colors.vermillion, 0.85);
  context.fillRect(0, 0, 4, height);

  context.fillStyle = colorCss(colors.ink, 1);
  context.font = `600 ${titleSize}px ${FONT_STACK}`;
  context.textBaseline = "middle";
  context.fillText(title, padX, padY + titleSize * 0.6);
  context.fillStyle = colorCss(colors.ink, 0.68);
  context.font = `500 ${subtitleSize}px ${FONT_STACK}`;
  context.fillText(subtitle, padX, padY + titleSize * 1.15 + subtitleSize * 0.55 + 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      depthTest: true,
      depthWrite: false,
      map: texture,
      transparent: true,
    }),
  );
  sprite.scale.set(width * LABEL_WORLD_PER_PX, height * LABEL_WORLD_PER_PX, 1);
  return sprite;
}

function hexagonLoop(radius: number, color: THREE.Color, opacity: number): THREE.LineLoop {
  const points: number[] = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2 + Math.PI / 6;
    points.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  return new THREE.LineLoop(
    geometry,
    new THREE.LineBasicMaterial({ color, opacity, transparent: true }),
  );
}

function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
    const material = mesh.material;
    const materials = Array.isArray(material) ? material : material ? [material] : [];
    for (const entry of materials) {
      const map = (entry as THREE.MeshStandardMaterial).map;
      map?.dispose();
      entry.dispose();
    }
  });
}

interface GradeNode {
  activeRing: THREE.LineLoop;
  disc: THREE.Mesh;
  grade: OfficialGrade;
  group: THREE.Group;
  radius: number;
  ring: THREE.LineLoop;
  y: number;
}

export function createHallScene(
  container: HTMLElement,
  initialColors: HallColors,
  handlers: HallSceneHandlers,
): HallScene | null {
  if (typeof window === "undefined" || typeof window.WebGLRenderingContext === "undefined") {
    return null;
  }

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }

  let colors = initialColors;
  let dynasty: OfficialsDynasty | null = null;
  let spacing: HallSpacing = "roomy";
  let content: THREE.Group | null = null;
  let motes: THREE.Points | null = null;
  let nodes = new Map<string, GradeNode>();
  let activeGradeId: string | null = null;
  let hoveredId: string | null = null;
  let appearStart = 0;
  let bounds = { height: 24, radius: 7 };
  let disposed = false;
  let hasBuilt = false;
  let visible = true;
  let dragging = false;
  let pointerDown: { x: number; y: number } | null = null;
  let colorFrame = 0;
  let raf = 0;
  let targetX = 0;
  let tween: {
    duration: number;
    fromPosition: THREE.Vector3;
    fromTarget: THREE.Vector3;
    start: number;
    toPosition: THREE.Vector3;
    toTarget: THREE.Vector3;
  } | null = null;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotateSpeed = 0.9;
  controls.dampingFactor = 0.08;
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.maxDistance = 130;
  controls.maxPolarAngle = 1.42;
  controls.minDistance = 12;
  controls.minPolarAngle = 0.12;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.8;

  renderer.setClearAlpha(0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;";
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const keyLight = new THREE.DirectionalLight(0xfff4e6, 0.68);
  keyLight.position.set(10, 20, 14);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xe2ecff, 0.35);
  rimLight.position.set(-12, 8, -12);
  scene.add(rimLight);
  const topLight = new THREE.PointLight(new THREE.Color(colors.vermillion), 0.6, 70);
  topLight.position.set(0, 16, 0);
  scene.add(topLight);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pickMeshes: THREE.Object3D[] = [];

  function fitDistance(): number {
    const halfFov = (camera.fov * Math.PI) / 360;
    const distanceV = bounds.height / 2 / Math.tan(halfFov);
    const distanceH = bounds.radius / (Math.tan(halfFov) * Math.max(0.5, camera.aspect));
    return Math.max(distanceV, distanceH) * 1.15 + 3;
  }

  function applyCamera(azimuth: number, polar: number, distance: number, targetY: number) {
    const horizontal = Math.cos(polar) * distance;
    camera.position.set(
      targetX + Math.sin(azimuth) * horizontal,
      targetY + Math.sin(polar) * distance,
      Math.cos(azimuth) * horizontal,
    );
    controls.target.set(targetX, targetY, 0);
    controls.update();
  }

  function currentAngles() {
    const offset = camera.position.clone().sub(controls.target);
    const distance = Math.max(0.001, offset.length());
    return {
      azimuth: Math.atan2(offset.x, offset.z),
      polar: Math.asin(THREE.MathUtils.clamp(offset.y / distance, -1, 1)),
    };
  }

  function tweenCamera(azimuth: number, polar: number, distance: number, targetY: number) {
    const horizontal = Math.cos(polar) * distance;
    const toPosition = new THREE.Vector3(
      targetX + Math.sin(azimuth) * horizontal,
      targetY + Math.sin(polar) * distance,
      Math.cos(azimuth) * horizontal,
    );
    const toTarget = new THREE.Vector3(targetX, targetY, 0);
    if (prefersReducedMotion()) {
      camera.position.copy(toPosition);
      controls.target.copy(toTarget);
      controls.update();
      tween = null;
      return;
    }
    tween = {
      duration: 620,
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      start: performance.now(),
      toPosition,
      toTarget,
    };
  }

  function applyPreset(preset: HallPreset) {
    const angles = PRESET_ANGLES[preset];
    tweenCamera(angles.azimuth, angles.polar, fitDistance(), 0);
  }

  function buildGround(group: THREE.Group, bottomY: number) {
    const wash = document.createElement("canvas");
    wash.width = 256;
    wash.height = 256;
    const context = wash.getContext("2d");
    if (context) {
      const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 126);
      gradient.addColorStop(0, colorCss(colors.ink, 0.2));
      gradient.addColorStop(0.55, colorCss(colors.vermillion, 0.12));
      gradient.addColorStop(1, colorCss(colors.vermillion, 0));
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 256);
      const texture = new THREE.CanvasTexture(wash);
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(34, 34),
        new THREE.MeshBasicMaterial({
          depthWrite: false,
          map: texture,
          opacity: 0.6,
          transparent: true,
        }),
      );
      plane.position.set(0, bottomY - 1.1, 0);
      plane.rotation.x = -Math.PI / 2;
      group.add(plane);
    }

    for (const [index, radius] of [7, 9.5, 12].entries()) {
      const ring = hexagonLoop(radius, new THREE.Color(colors.ink), 0.16 - index * 0.03);
      ring.position.y = bottomY - 1;
      group.add(ring);
    }
  }

  function buildMotes(group: THREE.Group, height: number) {
    const positions: number[] = [];
    for (let index = 0; index < 190; index += 1) {
      const angle = (index / 190) * Math.PI * 2 * 7;
      const radius = 4 + (((index * 37) % 100) / 100) * 8;
      positions.push(
        Math.cos(angle) * radius,
        -height / 2 + (((index * 61) % 100) / 100) * height,
        Math.sin(angle) * radius,
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    motes = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: new THREE.Color(colors.ink),
        opacity: 0.42,
        size: 0.075,
        sizeAttenuation: true,
        transparent: true,
      }),
    );
    group.add(motes);
  }

  function buildGradeNode(
    grade: OfficialGrade,
    index: number,
    count: number,
    gap: number,
  ): GradeNode {
    const group = new THREE.Group();
    const y = ((count - 1) / 2) * gap - index * gap;
    const radius = Math.min(6.3, 2.9 + index * 0.52);
    group.position.y = y;

    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 0.92, 0.36, 6),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.paper).lerp(new THREE.Color(colors.ink), 0.18),
        emissive: new THREE.Color(colors.vermillion),
        emissiveIntensity: 0.04,
        flatShading: true,
        metalness: 0.08,
        roughness: 0.78,
      }),
    );
    disc.userData.gradeId = grade.id;
    group.add(disc);
    pickMeshes.push(disc);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(disc.geometry as THREE.BufferGeometry, 20),
      new THREE.LineBasicMaterial({
        color: new THREE.Color(colors.ink),
        opacity: 0.34,
        transparent: true,
      }),
    );
    group.add(edges);

    const inner = new THREE.Mesh(
      new THREE.CircleGeometry(radius * 0.7, 6),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.vermillion),
        opacity: 0.09,
        transparent: true,
      }),
    );
    inner.position.y = 0.19;
    inner.rotation.x = -Math.PI / 2;
    inner.userData.gradeId = grade.id;
    group.add(inner);
    pickMeshes.push(inner);

    const ring = hexagonLoop(radius * 0.86, new THREE.Color(colors.ink), 0.4);
    ring.position.y = 0.2;
    group.add(ring);

    const activeRing = hexagonLoop(radius * 1.06, new THREE.Color(colors.vermillion), 0.95);
    activeRing.position.y = 0.3;
    activeRing.visible = false;
    group.add(activeRing);

    const counts = branchCounts(grade);
    const subtitle = `${grade.posts.length} 官 · 文 ${counts.civil} / 武 ${counts.military}${
      grade.approx ? ` · ${grade.approx}` : ""
    }`;
    const label = makePlaque(colors, grade.label, subtitle);
    label.position.set(0, 0.35, radius + 0.6);
    group.add(label);

    return { activeRing, disc, grade, group, radius, ring, y };
  }

  function rebuild() {
    if (disposed) {
      return;
    }
    tween = null;
    if (content) {
      scene.remove(content);
      disposeObject(content);
    }
    pickMeshes.length = 0;
    nodes = new Map();
    motes = null;

    content = new THREE.Group();
    scene.add(content);

    const grades = dynasty?.grades ?? [];
    const count = grades.length;
    const gap = spacing === "roomy" ? 3.3 : 2.6;
    const height = Math.max(12, (count - 1) * gap + 9);
    const maxRadius = Math.min(6.3, 2.9 + Math.max(0, count - 1) * 0.52);
    bounds = { height, radius: maxRadius + 2 };

    // 皇权脊轴：贯穿所有品级，强调「品级出自朝廷」的从属关系。
    const spine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.2, height - 4, 8),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.ink),
        flatShading: true,
        opacity: 0.3,
        roughness: 0.8,
        transparent: true,
      }),
    );
    spine.position.y = 0;
    content.add(spine);
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.07, height - 4, 6),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.vermillion),
        opacity: 0.6,
        transparent: true,
      }),
    );
    content.add(core);

    const crown = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.62, 0),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.ochre),
        emissive: new THREE.Color(colors.vermillion),
        emissiveIntensity: 0.4,
        flatShading: true,
        metalness: 0.2,
        roughness: 0.45,
      }),
    );
    crown.position.y = height / 2 - 1.4;
    crown.rotation.y = Math.PI / 4;
    content.add(crown);

    grades.forEach((grade, index) => {
      const node = buildGradeNode(grade, index, count, gap);
      node.group.userData.appearDelay = index * 55;
      content?.add(node.group);
      nodes.set(grade.id, node);
    });

    buildGround(content, -height / 2 + 1.6);
    buildMotes(content, height);
    applyActiveStyle();
    appearStart = performance.now();

    // 首次进入用斜侧全景；之后换朝代 / 层距保留用户已转到的角度，只重新取景。
    const angles = hasBuilt ? currentAngles() : PRESET_ANGLES["three-quarter"];
    applyCamera(angles.azimuth, angles.polar, fitDistance(), 0);
    hasBuilt = true;
  }

  function applyActiveStyle() {
    for (const [id, node] of nodes) {
      const active = id === activeGradeId;
      const hovered = id === hoveredId;
      node.activeRing.visible = active;
      const material = node.disc.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = active ? 0.16 : hovered ? 0.1 : 0.04;
      (node.ring.material as THREE.LineBasicMaterial).opacity = active ? 0.85 : 0.4;
    }
  }

  function pickAt(event: PointerEvent): string | null {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickMeshes, false);
    return (hits[0]?.object.userData.gradeId as string | undefined) ?? null;
  }

  function emitFrame() {
    const rect = renderer.domElement.getBoundingClientRect();
    const projections: GradeProjection[] = [];
    for (const [id, node] of nodes) {
      const projected = new THREE.Vector3(0, node.y, 0).project(camera);
      projections.push({
        id,
        x: (projected.x * 0.5 + 0.5) * rect.width,
        y: (-projected.y * 0.5 + 0.5) * rect.height,
      });
    }
    handlers.onFrame(projections);
  }

  function onPointerMove(event: PointerEvent) {
    if (pointerDown) {
      const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
      if (moved > 6 && !dragging) {
        dragging = true;
        if (hoveredId) {
          hoveredId = null;
          applyActiveStyle();
          handlers.onGradeHover(null);
        }
      }
    }
    if (dragging) {
      return;
    }
    const gradeId = pickAt(event);
    renderer.domElement.style.cursor = gradeId ? "pointer" : "grab";
    if (gradeId === hoveredId) {
      return;
    }
    hoveredId = gradeId;
    applyActiveStyle();
    handlers.onGradeHover(gradeId);
  }

  function onPointerDown(event: PointerEvent) {
    pointerDown = { x: event.clientX, y: event.clientY };
    dragging = false;
    tween = null;
    renderer.domElement.style.cursor = "grabbing";
  }

  function onPointerUp(event: PointerEvent) {
    const start = pointerDown;
    pointerDown = null;
    renderer.domElement.style.cursor = hoveredId ? "pointer" : "grab";
    if (!start) {
      return;
    }
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) {
      return;
    }
    handlers.onGradePick(pickAt(event));
  }

  function onPointerLeave() {
    if (hoveredId) {
      hoveredId = null;
      applyActiveStyle();
      handlers.onGradeHover(null);
    }
    renderer.domElement.style.cursor = "grab";
  }

  function focusGrade(gradeId: string) {
    const node = nodes.get(gradeId);
    if (!node) {
      return;
    }
    const angles = currentAngles();
    const distance = Math.max(18, fitDistance() * 0.92);
    const targetY = THREE.MathUtils.clamp(node.y, -bounds.height / 3, bounds.height / 3);
    tweenCamera(angles.azimuth, angles.polar, distance, targetY);
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);

    const previousTargetX = controls.target.x;
    targetX = width >= 1024 ? 1.6 : 0;
    const shift = targetX - previousTargetX;
    if (shift !== 0) {
      camera.position.x += shift;
      controls.target.x = targetX;
    }

    if (nodes.size > 0) {
      const required = fitDistance();
      const distance = camera.position.distanceTo(controls.target);
      if (distance < required * 0.96) {
        const angles = currentAngles();
        applyCamera(angles.azimuth, angles.polar, required, controls.target.y);
      }
    }
  }

  function tick(now: number) {
    if (disposed) {
      return;
    }
    raf = requestAnimationFrame(tick);
    if (!visible || document.hidden) {
      return;
    }

    if (tween) {
      const progress = Math.min(1, (now - tween.start) / tween.duration);
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased);
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased);
      if (progress >= 1) {
        tween = null;
      }
    }

    if (motes) {
      motes.rotation.y += 0.0006;
    }
    for (const node of nodes.values()) {
      node.activeRing.rotation.y += 0.004;
      const delay = (node.group.userData.appearDelay as number | undefined) ?? 0;
      const progress = Math.max(0, Math.min(1, (now - appearStart - delay) / 460));
      node.group.scale.setScalar(prefersReducedMotion() ? 1 : easeOutCubic(progress));
    }

    controls.update();
    emitFrame();
    renderer.render(scene, camera);
  }

  const onContextLost = (event: Event) => {
    event.preventDefault();
    handlers.onUnavailable?.();
  };
  const onVisibility = () => {
    visible = !document.hidden;
  };

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointerleave", onPointerLeave);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("webglcontextlost", onContextLost);
  document.addEventListener("visibilitychange", onVisibility);

  const resizeObserver =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          resize();
        });
  resizeObserver?.observe(container);

  let intersectionObserver: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== "undefined") {
    intersectionObserver = new IntersectionObserver((records) => {
      visible = records.some((record) => record.isIntersecting);
    });
    intersectionObserver.observe(container);
  }

  const themeObserver = new MutationObserver(() => {
    if (colorFrame) {
      return;
    }
    colorFrame = requestAnimationFrame(() => {
      colorFrame = 0;
      colors = readHallColors(container);
      topLight.color.set(colors.vermillion);
      rebuild();
    });
  });
  themeObserver.observe(document.documentElement, {
    attributeFilter: ["class", "style"],
    attributes: true,
  });

  resize();
  raf = requestAnimationFrame(tick);

  return {
    applyPreset,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      if (colorFrame) {
        cancelAnimationFrame(colorFrame);
      }
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      controls.dispose();
      if (content) {
        scene.remove(content);
        disposeObject(content);
        content = null;
      }
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      nodes = new Map();
      pickMeshes.length = 0;
    },
    focusGrade,
    resetView() {
      applyPreset("three-quarter");
    },
    resize,
    setActiveGrade(gradeId) {
      activeGradeId = gradeId;
      applyActiveStyle();
    },
    setAutoRotate(enabled) {
      controls.autoRotate = enabled;
    },
    setDynasty(nextDynasty, options) {
      dynasty = nextDynasty;
      spacing = options.spacing;
      rebuild();
    },
    setSpacing(nextSpacing) {
      if (spacing === nextSpacing) {
        return;
      }
      spacing = nextSpacing;
      rebuild();
    },
  };
}
