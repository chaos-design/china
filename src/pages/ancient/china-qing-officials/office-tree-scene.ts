import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import type { DynastyAtlas } from "./data";
import {
  branchRankSpans,
  type OfficeNodeKind,
  type OfficeTreeEdge,
  type OfficeTreeLayout,
  type OfficeTreeNode,
} from "./office-tree-layout";

/**
 * 官制图谱立体树的 Three.js 场景层。
 *
 * 与 rank-tree-scene 同构但更轻：节点是「从属树」的顶点（皇权 / 荣衔 / 官署 / 属官），
 * 边是父子连线。这一层只负责把布局画出来 + 拾取 + 镜头，不做布局决策——
 * 坐标来自 office-tree-layout.ts，业务选中态由 React 持有。
 * 因此不参与 jsdom 单测（无 WebGL），纯几何逻辑全部下沉到布局模块。
 */

export type OfficeTreeCameraPreset = "three-quarter" | "front";

export interface OfficeTreeColors {
  blueprint: string;
  ink: string;
  ochre: string;
  paper: string;
  vermillion: string;
}

export interface OfficeTreeHover {
  detail: string;
  subtitle: string;
  title: string;
}

export interface OfficeTreePick {
  id: string;
  kind: OfficeNodeKind;
  title: string;
}

export interface OfficeTreeSceneHandlers {
  onHover: (hover: OfficeTreeHover | null) => void;
  onPick: (pick: OfficeTreePick | null) => void;
  onUnavailable?: () => void;
}

export interface OfficeTreeScene {
  applyPreset: (preset: OfficeTreeCameraPreset) => void;
  dispose: () => void;
  resetView: () => void;
  setAtlas: (atlas: DynastyAtlas, layout: OfficeTreeLayout) => void;
  /** 按节点 id 高亮子树；null 表示清除筛选、恢复整树。 */
  setFilter: (ids: readonly string[] | null) => void;
}

const FONT_STACK =
  '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
const LABEL_WORLD_PER_PX = 0.02;

/** 相机距目标超过该距离（折叠总览镜头）时隐藏包围框的跨度标注，左菜单已标注跨度。 */
const BRACKET_LABEL_DISTANCE = 18;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const NODE_RADIUS: Record<OfficeNodeKind, number> = {
  branch: 0.55,
  honorary: 0.6,
  office: 0.38,
  root: 0.95,
};

/** 从属枝干的粗细：皇权直出的分区最粗，逐级收细，粗细本身就是层级编码。 */
const STEM_RADIUS: Record<OfficeTreeEdge["kind"], number> = {
  branch: 0.17,
  honorary: 0.13,
  office: 0.085,
};

interface StemMeta {
  from: string;
  to: string;
  kind: OfficeTreeEdge["kind"];
  baseColor: THREE.Color;
}

function stemColor(colors: OfficeTreeColors, kind: OfficeTreeEdge["kind"]): THREE.Color {
  switch (kind) {
    case "branch":
      return new THREE.Color(colors.vermillion);
    case "honorary":
      return new THREE.Color(colors.ochre);
    case "office":
      return new THREE.Color(colors.blueprint);
  }
}

/** 每种节点一套几何语言：本源六棱宝座、荣衔菱形印、分区四方官印、属官圆珠。 */
function createNodeGeometry(kind: OfficeNodeKind, radius: number): THREE.BufferGeometry {
  switch (kind) {
    case "root":
      return new THREE.CylinderGeometry(radius * 0.72, radius, radius * 0.85, 6);
    case "honorary":
      return new THREE.OctahedronGeometry(radius, 0);
    case "branch":
      return new THREE.CylinderGeometry(radius * 0.92, radius * 0.92, radius, 4);
    case "office":
      return new THREE.SphereGeometry(radius * 0.85, 12, 8);
  }
}

const NODE_FINISH: Record<OfficeNodeKind, { metalness: number; roughness: number }> = {
  root: { metalness: 0.42, roughness: 0.28 },
  honorary: { metalness: 0.3, roughness: 0.36 },
  branch: { metalness: 0.22, roughness: 0.42 },
  office: { metalness: 0.12, roughness: 0.55 },
};

const PRESET_ANGLES: Record<OfficeTreeCameraPreset, { azimuth: number; polar: number }> = {
  // 略高的俯角才看得见 y 的分层与 z 的纵深；平视会把树压成一条标签带。
  "three-quarter": { azimuth: 0.42, polar: 0.6 },
  front: { azimuth: 0, polar: 0.5 },
};

/** 读取页面主题 token，让 3D 配色跟随水墨纸色与朱砂强调色。 */
export function readOfficeTreeColors(container: HTMLElement): OfficeTreeColors {
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

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION).matches;
}

function nodeKindColor(colors: OfficeTreeColors, kind: OfficeNodeKind): THREE.Color {
  switch (kind) {
    case "root":
      return new THREE.Color(colors.ochre);
    case "branch":
      return new THREE.Color(colors.vermillion);
    case "honorary":
      return new THREE.Color(colors.ochre).lerp(new THREE.Color(colors.paper), 0.12);
    case "office":
      return new THREE.Color(colors.blueprint);
  }
}

/** 收集布局里一组根节点的可见后代（折叠视图中子节点可能不在布局里）。 */
function collectClusterNodes(layout: OfficeTreeLayout, roots: readonly string[]): OfficeTreeNode[] {
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  const found: OfficeTreeNode[] = [];
  const seen = new Set<string>();
  const stack = [...roots];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (seen.has(id)) {
      continue;
    }
    const node = byId.get(id);
    if (!node) {
      continue;
    }
    seen.add(id);
    found.push(node);
    stack.push(...node.children);
  }
  return found;
}

function createLabelSprite(
  colors: OfficeTreeColors,
  lines: { muted?: boolean; size: number; text: string; weight?: number }[],
  options: { accent?: string; background?: boolean } = {},
): THREE.Sprite {
  const pixelRatio = 2;
  const padX = 14;
  const padY = 8;
  const lineGap = 3;
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) {
    return new THREE.Sprite();
  }

  let width = 0;
  let height = padY * 2;
  for (const line of lines) {
    measure.font = `${line.weight ?? 600} ${line.size}px ${FONT_STACK}`;
    width = Math.max(width, measure.measureText(line.text).width);
    height += line.size * 1.16 + (lines.length > 1 ? lineGap : 0);
  }
  width += padX * 2;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width * pixelRatio));
  canvas.height = Math.max(1, Math.ceil(height * pixelRatio));
  const context = canvas.getContext("2d");
  if (!context) {
    return new THREE.Sprite();
  }
  context.scale(pixelRatio, pixelRatio);

  if (options.background !== false) {
    context.fillStyle = colorCss(colors.paper, 0.84);
    const radius = 6;
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
    context.strokeStyle = colorCss(colors.ink, 0.2);
    context.lineWidth = 1;
    context.stroke();
    if (options.accent) {
      context.fillStyle = options.accent;
      context.fillRect(0, 0, 3.5, height);
    }
  }

  let cursorY = padY;
  for (const line of lines) {
    const size = line.size * 1.16;
    context.font = `${line.weight ?? 600} ${line.size}px ${FONT_STACK}`;
    context.textBaseline = "middle";
    context.fillStyle = colorCss(colors.ink, line.muted ? 0.72 : 1);
    context.fillText(line.text, padX, cursorY + size / 2);
    cursorY += size + (lines.length > 1 ? lineGap : 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    depthTest: true,
    depthWrite: false,
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width * LABEL_WORLD_PER_PX, height * LABEL_WORLD_PER_PX, 1);
  // 屏幕等比标注：tick 每帧按相机到标签的距离换算世界尺寸，缩放时保持恒定屏幕大小。
  sprite.userData.px = { h: height, w: width };
  return sprite;
}

function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
    const material = (mesh as THREE.Mesh).material;
    const materials = Array.isArray(material) ? material : material ? [material] : [];
    for (const entry of materials) {
      (entry as THREE.MeshStandardMaterial).map?.dispose();
      entry.dispose();
    }
  });
}

function describeNode(node: OfficeTreeNode, atlasName: string) {
  const detail = node.note ?? node.title;
  const subtitle = node.rank
    ? `${atlasName} · ${node.title} · ${node.rank}`
    : `${atlasName} · ${node.title}`;
  return { detail, subtitle, title: node.title };
}

export function createOfficeTreeScene(
  container: HTMLElement,
  initialColors: OfficeTreeColors,
  handlers: OfficeTreeSceneHandlers,
): OfficeTreeScene | null {
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
  let content: THREE.Group | null = null;
  let atlasName = "";
  let bounds = { maxX: 6, maxY: 10, minX: -6, minY: -10, minZ: -6, maxZ: 6 };
  let pickMeshes: THREE.Object3D[] = [];
  let tween: {
    duration: number;
    fromPosition: THREE.Vector3;
    fromTarget: THREE.Vector3;
    start: number;
    toPosition: THREE.Vector3;
    toTarget: THREE.Vector3;
  } | null = null;
  let raf = 0;
  let visible = true;
  let disposed = false;
  let dragging = false;
  let pointerDown: { x: number; y: number } | null = null;
  let colorFrame = 0;
  let hover: OfficeTreePick | null = null;
  let layoutNodes: readonly OfficeTreeNode[] | null = null;
  let highlighted: ReadonlySet<string> | null = null;
  let nodeMeshes: THREE.Mesh[] = [];
  let nodeLabels: THREE.Sprite[] = [];
  // 从属枝干用有体积的圆柱而非 1px 线段：WebGL 下线宽恒为 1px，
  // 层级关系会退化成一层几乎看不见的细丝，这是「信息扁平」的主因。
  let edgeStems: THREE.Mesh[] = [];
  let bracketMaterials: THREE.LineBasicMaterial[] = [];
  const hudLabels: THREE.Sprite[] = [];
  // 取景状态：fit 时的纵横比与预设视角。用户手动旋转/缩放后不再自动重取景。
  let userAdjusted = false;
  let fittedAspect = 0;
  let fittedAngles = PRESET_ANGLES["three-quarter"];

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotateSpeed = 1.2;
  controls.dampingFactor = 0.075;
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.maxDistance = 160;
  controls.maxPolarAngle = 1.47;
  controls.minDistance = 8;
  controls.minPolarAngle = 0.08;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.8;
  controls.addEventListener("start", () => {
    userAdjusted = true;
  });

  renderer.setClearAlpha(0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;";
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.92));
  const keyLight = new THREE.DirectionalLight(0xfff6e8, 0.62);
  keyLight.position.set(9, 18, 12);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xdfe9ff, 0.3);
  rimLight.position.set(-10, 8, -12);
  scene.add(rimLight);

  function contentCenter(): THREE.Vector3 {
    const midX = (bounds.minX + bounds.maxX) / 2;
    const midY = (bounds.minY + bounds.maxY) / 2;
    return new THREE.Vector3(midX, midY, 0);
  }

  function fitDistance(): number {
    const height = Math.max(1, bounds.maxY - bounds.minY);
    const width = Math.max(1, bounds.maxX - bounds.minX);
    // 环形布局的 z 纵深会投影到屏幕，取景必须把它算进去，否则前后排节点出画。
    const depth = Math.max(1, bounds.maxZ - bounds.minZ);
    const halfFov = (camera.fov * Math.PI) / 360;
    const distanceV = height / 2 / Math.tan(halfFov);
    const distanceH = width / 2 / (Math.tan(halfFov) * Math.max(0.4, camera.aspect));
    const distanceD = (depth / 2 / Math.tan(halfFov)) * 0.75;
    return Math.max(distanceV, distanceH, distanceD) * 1.14 + 2;
  }

  function applyCamera(azimuth: number, polar: number, distance: number, target: THREE.Vector3) {
    const horizontal = Math.cos(polar) * distance;
    camera.position.set(
      target.x + Math.sin(azimuth) * horizontal,
      target.y + Math.sin(polar) * distance,
      target.z + Math.cos(azimuth) * horizontal,
    );
    controls.target.copy(target);
    controls.update();
  }

  function tweenCamera(target: THREE.Vector3, distance: number, azimuth: number, polar: number) {
    const position = new THREE.Vector3(
      target.x + Math.sin(azimuth) * Math.cos(polar) * distance,
      target.y + Math.sin(polar) * distance,
      target.z + Math.cos(azimuth) * Math.cos(polar) * distance,
    );
    if (prefersReducedMotion()) {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      tween = null;
      return;
    }
    tween = {
      duration: 620,
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      start: performance.now(),
      toPosition: position,
      toTarget: target.clone(),
    };
  }

  function applyPreset(preset: OfficeTreeCameraPreset) {
    const angles = PRESET_ANGLES[preset];
    fittedAngles = angles;
    fittedAspect = camera.aspect;
    tweenCamera(contentCenter(), fitDistance(), angles.azimuth, angles.polar);
  }

  function resetView() {
    applyPreset("three-quarter");
  }

  function rebuild(layout: OfficeTreeLayout, atlas: DynastyAtlas) {
    if (disposed) {
      return;
    }
    if (content) {
      scene.remove(content);
      disposeObject(content);
    }
    pickMeshes = [];
    nodeMeshes = [];
    nodeLabels = [];
    edgeStems = [];
    bracketMaterials = [];
    // hudLabels 是复用数组：不清空会随每次重建累积，旧朝代的跨度标注泄漏到新树。
    hudLabels.length = 0;
    atlasName = atlas.name;

    content = new THREE.Group();
    scene.add(content);

    const byId = new Map(layout.nodes.map((node) => [node.id, node]));

    const up = new THREE.Vector3(0, 1, 0);
    const fromVec = new THREE.Vector3();
    const toVec = new THREE.Vector3();
    const direction = new THREE.Vector3();

    // 先画从属枝干，再画节点，保证节点盖在枝干端点上。每条边是一根有体积的圆柱：
    // 皇权直出最粗、属官最细，父子链在旋转视角下也读得出「谁生谁」。
    for (const edge of layout.edges) {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to) {
        continue;
      }
      fromVec.set(from.x, from.y, from.z);
      toVec.set(to.x, to.y, to.z);
      direction.subVectors(toVec, fromVec);
      const length = direction.length();
      if (length < 1e-4) {
        continue;
      }
      const baseColor = stemColor(colors, edge.kind);
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 1, 6, 1),
        new THREE.MeshBasicMaterial({
          color: baseColor.clone(),
          transparent: true,
          opacity: 0.82,
          depthWrite: false,
        }),
      );
      stem.position.copy(fromVec).add(toVec).multiplyScalar(0.5);
      stem.quaternion.setFromUnitVectors(up, direction.divideScalar(length));
      stem.scale.set(STEM_RADIUS[edge.kind], length, STEM_RADIUS[edge.kind]);
      stem.userData.stem = {
        from: edge.from,
        to: edge.to,
        kind: edge.kind,
        baseColor,
      } satisfies StemMeta;
      content.add(stem);
      edgeStems.push(stem);
    }

    for (const node of layout.nodes) {
      // 越深的层级节点越小、自发光越弱；配合四种独立造型，层级一眼可辨。
      const depthFade = 1 / (1 + node.depth * 0.18);
      const radius = NODE_RADIUS[node.kind] * depthFade;
      const emissiveBase = node.kind === "root" ? 0.5 : Math.max(0.12, 0.34 - node.depth * 0.06);
      const finish = NODE_FINISH[node.kind];
      const mesh = new THREE.Mesh(
        createNodeGeometry(node.kind, radius),
        new THREE.MeshStandardMaterial({
          color: nodeKindColor(colors, node.kind),
          emissive: nodeKindColor(colors, node.kind),
          emissiveIntensity: emissiveBase,
          flatShading: node.kind !== "office",
          metalness: finish.metalness,
          roughness: finish.roughness,
          transparent: true,
        }),
      );
      mesh.userData.emissiveBase = emissiveBase;
      mesh.position.set(node.x, node.y, node.z);
      if (node.kind === "branch") {
        mesh.rotation.y = Math.PI / 4; // 四棱柱转 45° 成菱形俯视，像一枚官印
      }
      // 底座光环：平放的一圈淡色，给每枚「原子」一个落点，强化空间定位。
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(radius * 1.3, radius * 1.75, 28),
        new THREE.MeshBasicMaterial({
          color: nodeKindColor(colors, node.kind),
          transparent: true,
          opacity: node.kind === "office" ? 0.16 : 0.28,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = -radius * 0.85;
      mesh.add(halo);
      mesh.userData.pick = {
        id: node.id,
        kind: node.kind,
        title: node.title,
      } satisfies OfficeTreePick;
      content.add(mesh);
      nodeMeshes.push(mesh);
      pickMeshes.push(mesh);

      // 只有皇帝 / 荣衔组 / 官署分区挂常驻标签（屏幕等比）；属官不挂牌，
      // 名字经底部 hover 读出与右侧详情面板呈现，避免 96 个标签互相覆盖。
      if (node.kind === "office") {
        continue;
      }
      const labelSize = node.kind === "root" ? 20 : node.kind === "honorary" ? 14 : 16;
      const label = createLabelSprite(
        colors,
        [{ size: labelSize, text: node.title, weight: 700 }],
        node.kind === "root"
          ? { accent: colorCss(colors.vermillion, 0.9) }
          : { accent: colorCss(colors.ochre, 0.8) },
      );
      // 标签沿椭圆径向朝外挪开，而不是压在节点正上方——这是消除同层重叠的关键。
      const radial = Math.hypot(node.x, node.z);
      const outwardX = radial > 0.01 ? node.x / radial : 0;
      const outwardZ = radial > 0.01 ? node.z / radial : 1;
      label.position.set(node.x + outwardX * 1.15, node.y + radius + 0.7, node.z + outwardZ * 1.15);
      label.userData.nodeId = node.id;
      content.add(label);
      nodeLabels.push(label);
    }

    // 分区包围框：可见节点 ≥ 2 的官署分区（与荣衔簇）画一圈包围矩形，
    // 框顶标注该区品级跨度（「哪一层是哪个品级」）。框只作视觉分组，不进拾取集合。
    const rankSpans = branchRankSpans(atlas);
    const honoraryGroupIds = layout.nodes
      .filter((node) => node.kind === "honorary" && node.parent === layout.rootId)
      .map((node) => node.id);
    const clusters: { id: string; roots: string[]; title?: string }[] = [];
    if (honoraryGroupIds.length > 0) {
      clusters.push({ id: "honorary", roots: honoraryGroupIds, title: "荣衔封号" });
    }
    for (const node of layout.nodes) {
      if (node.kind === "branch") {
        clusters.push({ id: node.id, roots: [node.id] });
      }
    }
    for (const cluster of clusters) {
      const members = collectClusterNodes(layout, cluster.roots);
      if (members.length < 2) {
        continue;
      }
      const padX = 1.3;
      const minX = Math.min(...members.map((member) => member.x)) - padX;
      const maxX = Math.max(...members.map((member) => member.x)) + padX;
      const minY = Math.min(...members.map((member) => member.y)) - 1.1;
      const maxY = Math.max(...members.map((member) => member.y)) + 2.2;
      // 环形布局下同一分区的成员 z 相近但不等；取均值让包围框贴住这一簇而不是飘在后方。
      const z = members.reduce((sum, member) => sum + member.z, 0) / members.length;
      const corners: [number, number][] = [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
      ];
      const segmentPoints: number[] = [];
      for (let index = 0; index < corners.length; index += 1) {
        const [ax, ay] = corners[index]!;
        const [bx, by] = corners[(index + 1) % corners.length]!;
        segmentPoints.push(ax, ay, z, bx, by, z);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(segmentPoints, 3));
      const material = new THREE.LineBasicMaterial({
        color: colors.ochre,
        transparent: true,
        opacity: 0.5,
      });
      bracketMaterials.push(material);
      content.add(new THREE.LineSegments(geometry, material));

      const span = rankSpans.get(cluster.id);
      if (span) {
        const bracketLabel = createLabelSprite(colors, [
          { muted: true, size: 14, text: cluster.title ? `${cluster.title} · ${span}` : span },
        ]);
        bracketLabel.position.set(minX + 2.2, maxY - 0.55, z);
        bracketLabel.userData.isHudLabel = true;
        content.add(bracketLabel);
        hudLabels.push(bracketLabel);
      }
    }

    bounds = {
      maxX: layout.maxX + 3,
      maxY: layout.maxY + 3,
      minX: layout.minX - 3,
      minY: layout.minY - 3,
      minZ: layout.minZ - 3,
      maxZ: layout.maxZ + 3,
    };

    const angles = PRESET_ANGLES["three-quarter"];
    fittedAngles = angles;
    fittedAspect = camera.aspect;
    applyCamera(angles.azimuth, angles.polar, fitDistance(), contentCenter());
    applyHighlight();
  }

  /**
   * 从属筛选只改视觉权重与拾取集合，不重建几何、不重置镜头：
   * 命中子树保持原样，其余节点/标签/连线淡化，让完整树仍在视野里作为背景。
   */
  function applyHighlight() {
    const active = highlighted;
    const isOn = (id: string) => !active || active.has(id);
    for (const mesh of nodeMeshes) {
      const pick = mesh.userData.pick as OfficeTreePick;
      const on = isOn(pick.id);
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.opacity = on ? 1 : 0.12;
      material.emissiveIntensity = on ? ((mesh.userData.emissiveBase as number) ?? 0.3) : 0.03;
    }
    for (const label of nodeLabels) {
      (label.material as THREE.SpriteMaterial).opacity = isOn(label.userData.nodeId as string)
        ? 1
        : 0.16;
    }
    for (const stem of edgeStems) {
      const { from, to, baseColor } = stem.userData.stem as StemMeta;
      const factor = isOn(from) && isOn(to) ? 1 : isOn(from) || isOn(to) ? 0.4 : 0.1;
      const material = stem.material as THREE.MeshBasicMaterial;
      material.color.copy(baseColor).multiplyScalar(factor);
      material.opacity = 0.82 * factor;
    }
    pickMeshes = active
      ? nodeMeshes.filter((mesh) => active.has((mesh.userData.pick as OfficeTreePick).id))
      : [...nodeMeshes];
    if (hover && active && !active.has(hover.id)) {
      setHoverScale(hover.id, 1);
      hover = null;
      handlers.onHover(null);
    }
  }

  function setFilter(ids: readonly string[] | null) {
    highlighted = ids && ids.length > 0 ? new Set(ids) : null;
    applyHighlight();
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function pickAt(event: PointerEvent): OfficeTreePick | null {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickMeshes, false);
    const pick = hits[0]?.object.userData.pick as OfficeTreePick | undefined;
    return pick ?? null;
  }

  function setHoverScale(id: string | null, scale: number) {
    if (!id) {
      return;
    }
    for (const mesh of pickMeshes) {
      if (mesh.userData.pick.id === id) {
        mesh.scale.setScalar(scale);
      }
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (pointerDown) {
      const moved = Math.hypot(event.clientX - pointerDown.x, pointerDown.y - pointerDown.y);
      if (moved > 6 && !dragging) {
        dragging = true;
        if (hover) {
          setHoverScale(hover.id, 1);
          hover = null;
          handlers.onHover(null);
        }
      }
    }
    if (dragging) {
      return;
    }
    const pick = pickAt(event);
    renderer.domElement.style.cursor = pick ? "pointer" : "grab";
    if (pick?.id === hover?.id) {
      return;
    }
    setHoverScale(hover?.id ?? null, 1);
    hover = pick;
    if (pick) {
      setHoverScale(pick.id, 1.35);
      const node = layoutNodes?.find((candidate) => candidate.id === pick.id);
      handlers.onHover(node ? describeNode(node, atlasName) : null);
    } else {
      handlers.onHover(null);
    }
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
    renderer.domElement.style.cursor = hover ? "pointer" : "grab";
    if (!start) {
      return;
    }
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) {
      return;
    }
    handlers.onPick(pickAt(event));
  }

  function onPointerLeave() {
    if (hover) {
      setHoverScale(hover.id, 1);
      hover = null;
      handlers.onHover(null);
    }
    renderer.domElement.style.cursor = "grab";
  }

  function setAtlas(atlas: DynastyAtlas, layout: OfficeTreeLayout) {
    layoutNodes = layout.nodes;
    rebuild(layout, atlas);
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    // 首次 fit 可能发生在画布布局稳定之前，取景用错纵横比（tree 缩成一角）。
    // 纵横比变化且用户尚未手动操作时自动重新取景；用户一旦交互即不再打扰。
    if (!userAdjusted && fittedAspect > 0 && Math.abs(camera.aspect - fittedAspect) > 0.02) {
      fittedAspect = camera.aspect;
      applyCamera(fittedAngles.azimuth, fittedAngles.polar, fitDistance(), contentCenter());
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
      const elapsed = now - tween.start;
      const progress = Math.min(1, elapsed / tween.duration);
      const eased = easeInOutCubic(progress);
      camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased);
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased);
      if (progress >= 1) {
        tween = null;
      }
    }
    controls.update();
    // 屏幕等比标签：按相机到标签的距离换算世界尺寸，任何缩放下保持恒定屏幕大小；
    // 包围框的跨度标注只在拉近镜头时显示（折叠总览下由左菜单标注跨度，避免压住组标签）。
    const canvasHeight = renderer.domElement.clientHeight || 1;
    const halfTan = Math.tan((camera.fov * Math.PI) / 360);
    const showHudLabels = camera.position.distanceTo(controls.target) <= BRACKET_LABEL_DISTANCE;
    for (const label of [...nodeLabels, ...hudLabels]) {
      const px = label.userData.px as { h: number; w: number } | undefined;
      if (px) {
        const distance = camera.position.distanceTo(label.position);
        const worldPerPx = (2 * halfTan * distance) / canvasHeight;
        label.scale.set(px.w * worldPerPx, px.h * worldPerPx, 1);
      }
      if (label.userData.isHudLabel) {
        label.visible = showHudLabels;
      }
    }
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
    typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => resize());
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
      colors = readOfficeTreeColors(container);
      if (layoutNodes) {
        for (const mesh of pickMeshes) {
          const pick = mesh.userData.pick as OfficeTreePick;
          const node = layoutNodes.find((candidate) => candidate.id === pick.id);
          if (node) {
            const material = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
            material.color = nodeKindColor(colors, node.kind);
            material.emissive = nodeKindColor(colors, node.kind);
            for (const child of mesh.children) {
              const childMaterial = (child as THREE.Mesh).material as
                | THREE.MeshBasicMaterial
                | undefined;
              if (childMaterial) {
                childMaterial.color = nodeKindColor(colors, node.kind);
              }
            }
          }
        }
      }
      for (const material of bracketMaterials) {
        material.color = new THREE.Color(colors.ochre);
      }
      for (const stem of edgeStems) {
        const meta = stem.userData.stem as StemMeta;
        meta.baseColor = stemColor(colors, meta.kind);
      }
      // 边的实际颜色由 applyHighlight 按 baseColor × 高亮系数算出，主题切换后需重算一次。
      applyHighlight();
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
        disposeObject(content);
        scene.remove(content);
        content = null;
      }
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      pickMeshes = [];
      nodeMeshes = [];
      nodeLabels = [];
      edgeStems = [];
    },
    resetView,
    setAtlas,
    setFilter,
  };
}
