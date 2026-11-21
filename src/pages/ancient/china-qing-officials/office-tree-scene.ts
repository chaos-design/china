import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import type { DynastyAtlas } from "./data";
import {
  branchRankSpans,
  OFFICE_TREE_GEOMETRY,
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
  /** 用户拖拽打断自转时回调（false），让 React 侧的「旋转」按钮状态同步。 */
  onAutoRotateChange?: (on: boolean) => void;
  onUnavailable?: () => void;
}

export interface OfficeTreeScene {
  applyPreset: (preset: OfficeTreeCameraPreset) => void;
  /**
   * 把某枚原子补间到视野中央（选中的原子自动进入可视区）。
   * faceFront=true 时同时转到正视，让从属菜单选中的分区正对观众。
   */
  focusNode: (id: string, options?: { faceFront?: boolean }) => void;
  dispose: () => void;
  resetView: () => void;
  setAtlas: (atlas: DynastyAtlas, layout: OfficeTreeLayout) => void;
  /** 按节点 id 高亮子树；null 表示清除筛选、恢复整树。 */
  setFilter: (ids: readonly string[] | null) => void;
  /** 慢速自转开关；用户拖拽会自动关掉并经 onAutoRotateChange 通知。 */
  setAutoRotate: (on: boolean) => void;
}

const FONT_STACK =
  '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
const LABEL_WORLD_PER_PX = 0.02;
/** 新节点 / 新枝干的生长动画时长与逐枚错峰步长。 */
const GROW_MS = 460;
const GROW_STAGGER_MS = 16;

/** 相机距目标超过该距离（折叠总览镜头）时隐藏包围框的跨度标注，左菜单已标注跨度。 */
const BRACKET_LABEL_DISTANCE = 26;
/**
 * 属官名牌只在接近正视时出现：斜视/俯视时环上标签会互相穿插，
 * 只保留 root / 分区 / 荣衔这些骨架名称。滞回区间避免自转经过阈值时闪烁。
 */
const FRONT_LABEL_SHOW_AZIMUTH = 0.3;
const FRONT_LABEL_HIDE_AZIMUTH = 0.46;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
/**
 * 节点体量即尊卑：皇权独占一个数量级的尺度，分区、荣衔、属官依次收小。
 * 旧版 root 0.95 / office 0.44 只差 2 倍，又经 depthFade 抹平，视觉上分不出主次。
 */
const NODE_RADIUS: Record<OfficeNodeKind, number> = {
  branch: 0.68,
  honorary: 0.6,
  office: 0.4,
  root: 2.05,
};

/** 属官视觉球随深度缩到 ~0.37，直接点小球命中率太低：共享一枚不可见的稍大代理球扩大命中区。 */
const OFFICE_PICK_RADIUS = 0.62;

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

/**
 * 每种节点一套几何语言，体量与棱面共同编码尊卑：
 * 皇权 = 八棱宝座（上层叠收，如御座），荣衔 = 双锥晶印，分区 = 四方官印，属官 = 圆珠。
 */
function createNodeGeometry(kind: OfficeNodeKind, radius: number): THREE.BufferGeometry {
  switch (kind) {
    case "root":
      return new THREE.CylinderGeometry(radius * 0.62, radius, radius * 1.15, 8);
    case "honorary":
      return new THREE.OctahedronGeometry(radius, 0);
    case "branch":
      return new THREE.CylinderGeometry(radius * 0.92, radius, radius * 1.1, 4);
    case "office":
      return new THREE.SphereGeometry(radius * 0.85, 12, 8);
  }
}

const NODE_FINISH: Record<OfficeNodeKind, { metalness: number; roughness: number }> = {
  root: { metalness: 0.72, roughness: 0.2 },
  honorary: { metalness: 0.46, roughness: 0.3 },
  branch: { metalness: 0.3, roughness: 0.4 },
  office: { metalness: 0.14, roughness: 0.56 },
};

/**
 * 皇权专属徽记：御座之下的三层须弥台 + 顶上的日轮华盖 + 一圈垂旒。
 * 全部作为子节点挂在皇帝 mesh 上，随节点缩放与主题着色，不进拾取集合。
 * 金色来自 imperialGold，朱色取自 vermillion——尊卑由「独有装饰 + 独有配色」双重表达。
 */
function createImperialRegalia(colors: OfficeTreeColors, radius: number): THREE.Group {
  const group = new THREE.Group();
  const gold = imperialGold(colors);
  const goldMaterial = () => {
    const material = new THREE.MeshStandardMaterial({
      color: gold,
      emissive: gold,
      emissiveIntensity: 0.34,
      metalness: 0.8,
      roughness: 0.22,
      transparent: true,
      opacity: 0.92,
    });
    material.userData.regalia = "gold";
    return material;
  };
  const vermillionMaterial = () => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colors.vermillion),
      transparent: true,
      opacity: 0.9,
    });
    material.userData.regalia = "vermillion";
    return material;
  };

  // 三层须弥台：越往下越宽，御座如从阶上托起。
  for (let tier = 0; tier < 3; tier += 1) {
    const width = radius * (1.5 - tier * 0.16);
    const dais = new THREE.Mesh(
      new THREE.CylinderGeometry(width * 0.94, width, radius * 0.14, 8),
      goldMaterial(),
    );
    dais.position.y = -radius * (0.72 - tier * 0.22);
    dais.renderOrder = -0.5;
    group.add(dais);
  }

  // 日轮华盖：悬于御座顶部的一轮薄金盘 + 外圈朱环，正面朝上，俯视清晰可辨。
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.52, radius * 0.52, radius * 0.06, 24),
    goldMaterial(),
  );
  disc.position.y = radius * 1.0;
  group.add(disc);
  const crownRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.66, radius * 0.045, 8, 32),
    vermillionMaterial(),
  );
  crownRing.rotation.x = Math.PI / 2;
  crownRing.position.y = radius * 1.02;
  group.add(crownRing);

  // 垂旒：自华盖垂下的一圈朱色短珠，强化「冠冕」意象。
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.045, 6, 5),
      vermillionMaterial(),
    );
    bead.position.set(
      Math.cos(angle) * radius * 0.66,
      radius * 0.82,
      Math.sin(angle) * radius * 0.66,
    );
    group.add(bead);
  }
  return group;
}

const PRESET_ANGLES: Record<OfficeTreeCameraPreset, { azimuth: number; polar: number }> = {
  // 更高的俯角让同心深度环呈现为椭圆轨道、y 的下沉与 z 的纵深同时可见；平视会把环压成一条线。
  "three-quarter": { azimuth: 0.5, polar: 0.68 },
  front: { azimuth: 0, polar: 0.38 },
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

/** 带轻微过冲的收尾缓动：新节点「长出来」时有一点弹性，不再硬切。 */
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION).matches;
}

/** 御金：赭石提亮混向暖白，是皇权专用的色阶，与臣属的朱、黛彻底区分。 */
function imperialGold(colors: OfficeTreeColors): THREE.Color {
  return new THREE.Color(colors.ochre).lerp(new THREE.Color(0xfff0c0), 0.42);
}

function nodeKindColor(colors: OfficeTreeColors, kind: OfficeNodeKind): THREE.Color {
  switch (kind) {
    case "root":
      return imperialGold(colors);
    case "honorary":
      return new THREE.Color(colors.ochre).lerp(new THREE.Color(colors.paper), 0.1);
    case "branch":
      return new THREE.Color(colors.vermillion);
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
    // 关闭深度测试：标签永远浮在节点与枝干之上，不被几何体遮挡吞掉；
    // 关闭雾：远处标签保持全对比度，文字永远可读。
    depthTest: false,
    depthWrite: false,
    fog: false,
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.renderOrder = 20;
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

const KIND_NOUN: Record<OfficeNodeKind, string> = {
  branch: "官署分区",
  honorary: "荣衔封号",
  office: "属官衙署",
  root: "权力本源",
};

function describeNode(node: OfficeTreeNode, atlasName: string) {
  const noun = KIND_NOUN[node.kind];
  const detail =
    node.note ??
    (node.rank ? `${node.rank} · ${noun}，点选查看品级实档与从属` : `${noun} · 点选查看职掌与从属`);
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
  let disposed = false;
  let dragging = false;
  let pointerDown: { x: number; y: number } | null = null;
  let colorFrame = 0;
  // 脏标记渲染：静止帧不再全速 render（自转 / 补间 / 生长 / 悬浮 / 相机移动才重画）。
  let needsRender = true;
  // 选中环呼吸的截止时刻：呼吸只持续一阵，之后静息。
  let pulseUntil = 0;
  // 画布 CSS 尺寸缓存（resize 时更新），避免逐帧读 clientWidth/Height 触发布局查询。
  let canvasHeight = 1;
  let canvasWidth = 1;
  let hover: OfficeTreePick | null = null;
  let layoutNodes: readonly OfficeTreeNode[] | null = null;
  let highlighted: ReadonlySet<string> | null = null;
  let nodeMeshes: THREE.Mesh[] = [];
  let nodeLabels: THREE.Sprite[] = [];
  let detailLabelsVisible = true;
  // 标签避让后偏离本体的，用一根细引线连回节点——文字再挪也不至于看着像别的原子的名字。
  let labelLeaders: THREE.LineSegments | null = null;
  // 属官的不可见拾取代理球：与 nodeMeshes 同步过滤，筛选后命中区不缩水。
  let nodeProxies: THREE.Mesh[] = [];
  // 可点选的常驻标签：标签置顶渲染，点击也优先命中标签（点标签 = 点它标注的节点）。
  let labelPickMeshes: THREE.Sprite[] = [];
  // 从属枝干用有体积的圆柱而非 1px 线段：WebGL 下线宽恒为 1px，
  // 层级关系会退化成一层几乎看不见的细丝，这是「信息扁平」的主因。
  let edgeStems: THREE.Mesh[] = [];
  let bracketMaterials: THREE.LineBasicMaterial[] = [];
  // 深度环参考线与落地垂线的材质：主题切换时随 ink 重着色。
  let guideMaterials: THREE.LineBasicMaterial[] = [];
  // 金字塔平台 / 中轴 / 基座：主题切换时随纸墨 token 重着色。
  let platformMaterials: THREE.MeshStandardMaterial[] = [];
  let spineMaterial: THREE.MeshStandardMaterial | null = null;
  let baseMaterial: THREE.MeshBasicMaterial | null = null;
  const hudLabels: THREE.Sprite[] = [];
  // 生长动画：展开 / 切朝代时新出现的节点错峰「长出来」，不再整树硬切。
  let growNodes: { mesh: THREE.Mesh; delay: number }[] = [];
  let growStems: { stem: THREE.Mesh; delay: number }[] = [];
  let growLabels: { label: THREE.Sprite; delay: number }[] = [];
  let growStart = 0;
  let previousIds: ReadonlySet<string> | null = null;
  let previousAtlasId: string | null = null;
  // 悬浮读数的平滑放大与属官浮签、选中呼吸环（三者都挂在 scene 上，重建不销毁）。
  let hoverLerp: { mesh: THREE.Mesh; value: number } | null = null;
  let hoverTag: {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    sprite: THREE.Sprite;
    texture: THREE.CanvasTexture;
  } | null = null;
  let selectionRing: THREE.Mesh | null = null;
  let autoRotate = !prefersReducedMotion();
  // 取景状态：fit 时的纵横比与预设视角。用户手动旋转/缩放后不再自动重取景。
  let userAdjusted = false;
  let fittedAspect = 0;
  let fittedAngles = PRESET_ANGLES["three-quarter"];

  const scene = new THREE.Scene();
  // 雾是纵深线索：远处的节点与枝干渐隐进纸色，旋转时前后排一眼可分。
  // 近远距在 rebuild 里按取景距离重算，保证折叠 / 展开两种规模下都是轻淡的一层。
  const fog = new THREE.Fog(initialColors.paper, 32, 82);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
  const controls = new OrbitControls(camera, renderer.domElement);
  // 慢速自转让画面默认就是活的；用户一拖拽即让位给手动视角。
  controls.autoRotate = autoRotate;
  controls.autoRotateSpeed = 0.5;
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
    if (autoRotate) {
      autoRotate = false;
      controls.autoRotate = false;
      handlers.onAutoRotateChange?.(false);
    }
  });
  // 相机每被动一次（含阻尼收敛与自转）都标记重画；静止时脏标记保持 false，跳过 render。
  controls.addEventListener("change", () => {
    needsRender = true;
  });

  renderer.setClearAlpha(0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;";
  container.appendChild(renderer.domElement);

  // 光比即立体感：环境光压低、主光加重并配冷暖双侧光，四棱柱与棱面才有明暗转折。
  // 旧版环境光 0.92 几乎抹平了几何体的一切棱面，是「贴片感」的主因。
  scene.add(new THREE.AmbientLight(0xffffff, 0.58));
  const keyLight = new THREE.DirectionalLight(0xfff3e0, 1.05);
  keyLight.position.set(10, 18, 11);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xdfe9ff, 0.5);
  rimLight.position.set(-11, 7, -13);
  scene.add(rimLight);
  const fillLight = new THREE.DirectionalLight(0xffe3bd, 0.34);
  fillLight.position.set(-6, 3, 14);
  scene.add(fillLight);

  function contentCenter(): THREE.Vector3 {
    const midX = (bounds.minX + bounds.maxX) / 2;
    const midY = (bounds.minY + bounds.maxY) / 2;
    // 底部有 hover 读出与页级题注条占位：取景中心略向下偏，整树在屏幕上随之抬高，
    // 前排节点不滑进底部覆盖层。偏移随树高缩放，折叠 / 展开两种规模都成立。
    const bias = (bounds.maxY - bounds.minY) * 0.1;
    return new THREE.Vector3(midX, midY - bias, 0);
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
    return Math.max(distanceV, distanceH, distanceD) * 1.3 + 2;
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

  /** 当前相机的方位/俯角：展开 / 收起只补间距离与中心，不把用户转好的视角拽回预设。 */
  function currentAngles(): { azimuth: number; polar: number } {
    const offset = camera.position.clone().sub(controls.target);
    const radius = Math.max(0.001, offset.length());
    return {
      azimuth: Math.atan2(offset.x, offset.z),
      polar: Math.min(
        Math.max(Math.acos(THREE.MathUtils.clamp(offset.y / radius, -1, 1)), 0.09),
        1.46,
      ),
    };
  }

  // —— 属官浮签：属官不挂常驻标签，hover 时在节点正上方浮出名牌（屏幕等比、置顶渲染）——
  function ensureHoverTag() {
    if (hoverTag) {
      return hoverTag;
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({
      depthTest: false,
      depthWrite: false,
      fog: false,
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 22;
    sprite.visible = false;
    scene.add(sprite);
    hoverTag = { canvas, context, sprite, texture };
    return hoverTag;
  }

  function showHoverTag(text: string, x: number, y: number, z: number) {
    const tag = ensureHoverTag();
    if (!tag) {
      return;
    }
    const pixelRatio = 2;
    const padX = 12;
    const padY = 6;
    const size = 15;
    tag.context.font = `700 ${size}px ${FONT_STACK}`;
    const width = tag.context.measureText(text).width + padX * 2;
    const height = size * 1.16 + padY * 2;
    tag.canvas.width = Math.max(1, Math.ceil(width * pixelRatio));
    tag.canvas.height = Math.max(1, Math.ceil(height * pixelRatio));
    tag.context.scale(pixelRatio, pixelRatio);
    tag.context.fillStyle = colorCss(colors.paper, 0.92);
    const corner = 6;
    tag.context.beginPath();
    tag.context.moveTo(corner, 0);
    tag.context.lineTo(width - corner, 0);
    tag.context.quadraticCurveTo(width, 0, width, corner);
    tag.context.lineTo(width, height - corner);
    tag.context.quadraticCurveTo(width, height, width - corner, height);
    tag.context.lineTo(corner, height);
    tag.context.quadraticCurveTo(0, height, 0, height - corner);
    tag.context.lineTo(0, corner);
    tag.context.quadraticCurveTo(0, 0, corner, 0);
    tag.context.closePath();
    tag.context.fill();
    tag.context.strokeStyle = colorCss(colors.ink, 0.24);
    tag.context.lineWidth = 1;
    tag.context.stroke();
    tag.context.fillStyle = colorCss(colors.vermillion, 0.9);
    tag.context.fillRect(0, 0, 3.5, height);
    tag.context.font = `700 ${size}px ${FONT_STACK}`;
    tag.context.textBaseline = "middle";
    tag.context.fillStyle = colorCss(colors.ink, 1);
    tag.context.fillText(text, padX, height / 2);
    tag.texture.needsUpdate = true;
    tag.sprite.userData.px = { h: height, w: width };
    tag.sprite.position.set(x, y, z);
    tag.sprite.visible = true;
    needsRender = true;
  }

  function hideHoverTag() {
    if (hoverTag?.sprite.visible) {
      hoverTag.sprite.visible = false;
      needsRender = true;
    }
  }

  // —— 选中呼吸环：朱色椭圆环在选中节点脚下缓慢呼吸，点选永远有回应 ——
  function ensureSelectionRing() {
    if (selectionRing) {
      return selectionRing;
    }
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.82, 1, 44),
      new THREE.MeshBasicMaterial({
        color: colors.vermillion,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
      }),
    );
    ring.renderOrder = 18;
    ring.visible = false;
    scene.add(ring);
    selectionRing = ring;
    return ring;
  }

  /** 选中的原子补间到视野中央：点画布节点或从菜单聚焦都能立刻看到它，不再留在画外。 */
  function focusNode(id: string, options?: { faceFront?: boolean }) {
    const node =
      layoutNodes?.find((candidate) => candidate.id === id) ??
      (id === "honorary"
        ? layoutNodes?.find((candidate) => candidate.kind === "honorary")
        : undefined);
    if (!node) {
      return;
    }
    const angles = options?.faceFront ? PRESET_ANGLES.front : currentAngles();
    if (options?.faceFront) {
      fittedAngles = angles;
      fittedAspect = camera.aspect;
    }
    const currentDistance = camera.position.distanceTo(controls.target);
    // 只把镜头拉近到够看清这枚原子，不贴脸到看不出层级；
    // 默认保留用户转好的方位 / 俯角，faceFront 时改用正视预设。
    const distance = Math.min(currentDistance, Math.max(fitDistance() * 0.5, 12));
    userAdjusted = true;
    tweenCamera(new THREE.Vector3(node.x, node.y, node.z), distance, angles.azimuth, angles.polar);
  }

  function setSelected(id: string | null) {
    const ring = ensureSelectionRing();
    const node = id ? layoutNodes?.find((candidate) => candidate.id === id) : null;
    if (!id || !node) {
      if (ring) {
        ring.visible = false;
        needsRender = true;
      }
      return;
    }
    const radius = NODE_RADIUS[node.kind] / (1 + node.depth * 0.18);
    ring!.scale.setScalar(radius * 1.9);
    ring!.userData.baseScale = radius * 1.9;
    ring!.position.set(node.x, node.y - radius * 0.8, node.z);
    ring!.rotation.x = -Math.PI / 2;
    ring!.visible = true;
    pulseUntil = performance.now() + 2600;
    needsRender = true;
    focusNode(id);
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
    labelLeaders = null;
    nodeProxies = [];
    labelPickMeshes = [];
    edgeStems = [];
    bracketMaterials = [];
    guideMaterials = [];
    platformMaterials = [];
    spineMaterial = null;
    baseMaterial = null;
    growNodes = [];
    growStems = [];
    growLabels = [];
    hoverLerp = null;
    hideHoverTag();
    setSelected(null);
    // hudLabels 是复用数组：不清空会随每次重建累积，旧朝代的跨度标注泄漏到新树。
    hudLabels.length = 0;
    atlasName = atlas.name;
    const sameTree = previousAtlasId === atlas.id;
    const reducedMotion = prefersReducedMotion();
    const previous = sameTree ? previousIds : null;
    // 首建 / 切朝代视为全部新节点（整树错峰入场）；同树重建只生长真正新增的节点。
    const isNewNode = (id: string) => !(previous?.has(id) ?? false);

    content = new THREE.Group();
    scene.add(content);

    const byId = new Map(layout.nodes.map((node) => [node.id, node]));

    // 属官拾取代理：整棵树共享一枚不可见的稍大球体，挂在属官 mesh 下随其缩放，
    // 小球难点中的问题由更大的命中区解决（visible: false 只跳过渲染，射线照常命中）。
    const pickProxyGeometry = new THREE.SphereGeometry(OFFICE_PICK_RADIUS, 10, 8);
    const pickProxyMaterial = new THREE.MeshBasicMaterial({ visible: false });

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
      // 顶略细于底的圆锥台：枝干有了「从粗到细生长」的方向感，父子链读起来更像枝而非杆。
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 1, 1, 6, 1),
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
      // 绘制分层：平台(-3) → 垂线(-2) → 枝干(-1) → 节点(0)。塔台与垂线先画且不写
      // 深度，节点后画——金字塔只作底座铺垫，绝不盖住任何连线与节点。
      stem.renderOrder = -1;
      // 新挂出的枝干淡入；首建 / 切朝代时整片枝干一起错峰浮现。
      if (!reducedMotion && (isNewNode(edge.from) || isNewNode(edge.to))) {
        (stem.material as THREE.MeshBasicMaterial).opacity = 0.001;
        growStems.push({ delay: growStems.length * GROW_STAGGER_MS, stem });
      }
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
      // 越深的层级节点越小、自发光略弱；配合四种独立造型，层级一眼可辨。
      // 自发光下限不能压太低：属官球体在纸色底上会灰得像没渲染。
      const depthFade = 1 / (1 + node.depth * 0.18);
      const radius = NODE_RADIUS[node.kind] * depthFade;
      const emissiveBase = node.kind === "root" ? 0.5 : Math.max(0.32, 0.44 - node.depth * 0.05);
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
      // 新出现的节点错峰「长出来」（带一点弹性过冲），展开不再是整树硬切。
      if (!reducedMotion && isNewNode(node.id)) {
        mesh.scale.setScalar(0.001);
        growNodes.push({ delay: growNodes.length * GROW_STAGGER_MS, mesh });
      }
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
      if (node.kind === "root") {
        mesh.add(createImperialRegalia(colors, radius));
      }
      mesh.userData.pick = {
        id: node.id,
        kind: node.kind,
        title: node.title,
      } satisfies OfficeTreePick;
      content.add(mesh);
      nodeMeshes.push(mesh);
      pickMeshes.push(mesh);
      if (node.kind === "office") {
        // 属官挂代理球扩大命中区；代理随父 mesh 缩放（生长 / 悬浮），不参与渲染。
        const proxy = new THREE.Mesh(pickProxyGeometry, pickProxyMaterial);
        proxy.userData.pick = mesh.userData.pick;
        mesh.add(proxy);
        nodeProxies.push(proxy);
        pickMeshes.push(proxy);
      }

      // 每一枚节点都挂标注（含属官），满足「每个原子都有标注」；属官字号更小。
      // 屏幕空间的重叠交给定于 tick 的贪心避让处理：按层级与远近择优显示，绝不互相压盖。
      const labelSize =
        node.kind === "root"
          ? 20
          : node.kind === "office"
            ? 12
            : node.kind === "honorary"
              ? 14
              : 16;
      const label = createLabelSprite(
        colors,
        [{ size: labelSize, text: node.title, weight: node.kind === "office" ? 500 : 700 }],
        node.kind === "root"
          ? { accent: colorCss(colors.vermillion, 0.9) }
          : node.kind === "office"
            ? { accent: colorCss(colors.blueprint, 0.7) }
            : { accent: colorCss(colors.ochre, 0.8) },
      );
      // 标签沿椭圆径向朝外挪开，而不是压在节点正上方——这是消除同层重叠的关键。
      const radial = Math.hypot(node.x, node.z);
      const outwardX = radial > 0.01 ? node.x / radial : 0;
      const outwardZ = radial > 0.01 ? node.z / radial : 1;
      const labelOut = node.kind === "office" ? 1.15 : 1.5;
      label.position.set(
        node.x + outwardX * labelOut,
        node.y + radius + (node.kind === "office" ? 0.6 : 0.95),
        node.z + outwardZ * labelOut,
      );
      // 避让用的原位、环切线 / 径向与本体锚点：候选位只在节点近旁微调，
      // 偏离时由引线连回锚点，文字永远认得出属于哪枚原子。
      label.userData.home = label.position.clone();
      label.userData.nodeAnchor = new THREE.Vector3(node.x, node.y, node.z);
      label.userData.radialOut = new THREE.Vector3(outwardX, 0, outwardZ);
      label.userData.tangent = new THREE.Vector3(-outwardZ, 0, outwardX);
      label.userData.nodeId = node.id;
      label.userData.kind = node.kind;
      label.userData.depth = node.depth;
      // 标签同权可点选：点击标签等同点击它标注的节点（展开 / 详情 / 选中一致）。
      label.userData.pick = {
        id: node.id,
        kind: node.kind,
        title: node.title,
      } satisfies OfficeTreePick;
      if (!reducedMotion && isNewNode(node.id)) {
        (label.material as THREE.SpriteMaterial).opacity = 0.001;
        growLabels.push({ delay: growLabels.length * GROW_STAGGER_MS, label });
      }
      content.add(label);
      nodeLabels.push(label);
      labelPickMeshes.push(label);
    }

    // 标签引线：避让挪位后仍有一根极淡的线连回本体，文字不会被误认成邻近原子的名字。
    // 预分配一条线一段、按 drawRange 决定实际画几条；每帧只改 buffer，不重建几何。
    const leaderGeometry = new THREE.BufferGeometry();
    leaderGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(nodeLabels.length * 6), 3),
    );
    leaderGeometry.setDrawRange(0, 0);
    const leaderMaterial = new THREE.LineBasicMaterial({
      color: colors.ink,
      transparent: true,
      opacity: 0.34,
      depthTest: false,
      depthWrite: false,
      fog: false,
    });
    guideMaterials.push(leaderMaterial);
    labelLeaders = new THREE.LineSegments(leaderGeometry, leaderMaterial);
    // 标签 renderOrder 20：引线 19 画在其下、但在塔台与节点之上，线一直看得见又不压字。
    labelLeaders.renderOrder = 19;
    labelLeaders.visible = false;
    content.add(labelLeaders);

    // 金字塔平台：每个可见深度一块半透明椭圆平台，层层叠出阶梯金字塔——
    // 皇帝居塔尖、分区在首层、属官落到更宽的下一层，「层级 = 一层塔」有实体可指。
    // 平台顶缘保留一圈细线（旧轨道参考线的角色），基座是中轴 + 淡墨渐变的落地。
    const depths = [...new Set(layout.nodes.map((node) => node.depth))].sort((a, b) => a - b);
    let maxRingX: number = OFFICE_TREE_GEOMETRY.ringRadiusX;
    let maxRingZ: number = OFFICE_TREE_GEOMETRY.ringRadiusZ;
    for (const depth of depths) {
      if (depth === 0) {
        continue;
      }
      const ring = depth - 1;
      const rx = OFFICE_TREE_GEOMETRY.ringRadiusX + ring * OFFICE_TREE_GEOMETRY.ringStepX;
      const rz = OFFICE_TREE_GEOMETRY.ringRadiusZ + ring * OFFICE_TREE_GEOMETRY.ringStepZ;
      maxRingX = Math.max(maxRingX, rx);
      maxRingZ = Math.max(maxRingZ, rz);
      const y = OFFICE_TREE_GEOMETRY.rootLift - depth * OFFICE_TREE_GEOMETRY.levelGap;
      // 塔层两色材质：顶面淡、侧沿（阶梯立面）略深，「一层塔」的台阶感更实。
      // renderOrder 置底（先于一切内容绘制、不写深度）：节点 / 连线 / 标签永远画在
      // 平台之上，金字塔只作底座铺垫，绝不遮挡任何内容。
      const tintTop = 0.07;
      const tintSide = 0.18;
      const platformTop = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.paper).lerp(new THREE.Color(colors.ink), tintTop),
        metalness: 0.05,
        roughness: 0.9,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      });
      platformTop.userData.tint = tintTop;
      const platformSide = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.paper).lerp(new THREE.Color(colors.ink), tintSide),
        metalness: 0.05,
        roughness: 0.9,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      });
      platformSide.userData.tint = tintSide;
      const platform = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 72), [
        platformSide,
        platformTop,
        platformTop,
      ]);
      platform.renderOrder = -3;
      platform.scale.set(rx + 1.4, 0.16, rz + 1.4);
      platform.position.y = y - 0.42;
      content.add(platform);
      platformMaterials.push(platformTop, platformSide);
      // 平台顶缘细线：一圈即一代的显式刻度。
      const points: number[] = [];
      for (let step = 0; step <= 128; step += 1) {
        const theta = (step / 128) * Math.PI * 2;
        points.push(Math.cos(theta) * (rx + 1.4), y - 0.34, Math.sin(theta) * (rz + 1.4));
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      const material = new THREE.LineBasicMaterial({
        color: colors.ink,
        transparent: true,
        opacity: depth === 1 ? 0.22 : 0.14,
        depthWrite: false,
      });
      guideMaterials.push(material);
      const rim = new THREE.Line(geometry, material);
      rim.renderOrder = -3;
      content.add(rim);
    }

    // 落地垂线：每枚节点向树底平面投一根细线——悬浮的原子有了可锚定的落点，
    // 旋转视角时节点的前后远近由垂线的长短与交点直接给出。
    const groundY = layout.minY - 1.6;
    const dropPoints: number[] = [];
    for (const node of layout.nodes) {
      dropPoints.push(node.x, node.y - 0.15, node.z, node.x, groundY, node.z);
    }
    const dropGeometry = new THREE.BufferGeometry();
    dropGeometry.setAttribute("position", new THREE.Float32BufferAttribute(dropPoints, 3));
    const dropMaterial = new THREE.LineBasicMaterial({
      color: colors.ink,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    guideMaterials.push(dropMaterial);
    const drops = new THREE.LineSegments(dropGeometry, dropMaterial);
    drops.renderOrder = -2;
    content.add(drops);

    // 皇权中轴：一根下粗上细的立柱从基座直通皇帝——金字塔有了可读的中轴，
    // 落地垂线全部收拢到这根轴上，整座塔是从大地里长出来的而不是悬空贴图。
    const spineHeight = OFFICE_TREE_GEOMETRY.rootLift - groundY;
    const spine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.34, 1, 12),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.ink).lerp(new THREE.Color(colors.paper), 0.35),
        metalness: 0.1,
        roughness: 0.75,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      }),
    );
    spine.scale.set(1, spineHeight, 1);
    spine.position.y = groundY + spineHeight / 2;
    spine.renderOrder = -4;
    content.add(spine);
    spineMaterial = spine.material as THREE.MeshStandardMaterial;

    // 基座：淡墨径向渐变（白图 + ink 着色，主题切换只换 color），塔立在地上。
    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = 256;
    baseCanvas.height = 256;
    const baseContext = baseCanvas.getContext("2d");
    if (baseContext) {
      const gradient = baseContext.createRadialGradient(128, 128, 8, 128, 128, 128);
      gradient.addColorStop(0, "rgba(255,255,255,0.18)");
      gradient.addColorStop(0.55, "rgba(255,255,255,0.08)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      baseContext.fillStyle = gradient;
      baseContext.fillRect(0, 0, 256, 256);
      const baseTexture = new THREE.CanvasTexture(baseCanvas);
      const base = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(colors.ink),
          map: baseTexture,
          transparent: true,
          depthWrite: false,
        }),
      );
      base.rotation.x = -Math.PI / 2;
      base.scale.set(maxRingX + 5.5, maxRingZ + 5.5, 1);
      base.position.y = groundY - 0.05;
      base.renderOrder = -5;
      content.add(base);
      baseMaterial = base.material as THREE.MeshBasicMaterial;
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
      // 环形布局下簇是楔形，轴对齐包围框彼此交叠：压得更淡，只作若隐若现的分组提示。
      const material = new THREE.LineBasicMaterial({
        color: colors.ochre,
        transparent: true,
        opacity: 0.28,
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

    // 雾距随取景规模缩放：最近节点保持全彩，最远排渐隐进纸色（纵深线索）。
    const fit = fitDistance();
    fog.near = fit * 1.05;
    fog.far = fit * 2.2;

    // 取景：首建 / 切朝代**立即**落到预设镜头——补间的起点若是原点（rAF 受限的嵌入
    // 环境里 tick 可能迟迟不来），controls.update() 会把半径钳到 minDistance、把镜头
    // 顶到目标正上方贴脸。入场感交给节点生长动画；同树展开 / 收起才走镜头补间，
    // 只动距离与中心、保留用户已转好的方位。
    const angles = sameTree ? currentAngles() : PRESET_ANGLES["three-quarter"];
    fittedAngles = angles;
    fittedAspect = camera.aspect;
    if (sameTree && !reducedMotion) {
      tweenCamera(contentCenter(), fitDistance(), angles.azimuth, angles.polar);
    } else {
      applyCamera(angles.azimuth, angles.polar, fitDistance(), contentCenter());
    }
    previousIds = new Set(layout.nodes.map((node) => node.id));
    previousAtlasId = atlas.id;
    growStart = performance.now();
    // 生长动画兜底：rAF 受限的嵌入环境里 tick 可能长时间不来，用定时器把动画
    // 直接推到终态（正常情况下数组早已清空，这里是空操作）。
    if (!reducedMotion && (growNodes.length > 0 || growStems.length > 0 || growLabels.length > 0)) {
      const maxCount = Math.max(growNodes.length, growStems.length, growLabels.length);
      window.setTimeout(
        () => {
          for (const item of growNodes) {
            item.mesh.scale.setScalar(1);
          }
          for (const item of growStems) {
            (item.stem.material as THREE.MeshBasicMaterial).opacity = 0.82;
          }
          for (const item of growLabels) {
            (item.label.material as THREE.SpriteMaterial).opacity = 1;
          }
          growNodes = [];
          growStems = [];
          growLabels = [];
          needsRender = true;
        },
        GROW_MS + Math.max(0, maxCount - 1) * GROW_STAGGER_MS + 120,
      );
    }
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
      ? [
          ...nodeMeshes.filter((mesh) => active.has((mesh.userData.pick as OfficeTreePick).id)),
          ...nodeProxies.filter((proxy) => active.has((proxy.userData.pick as OfficeTreePick).id)),
        ]
      : [...nodeMeshes, ...nodeProxies];
    labelPickMeshes = active
      ? nodeLabels.filter((label) => active.has(label.userData.nodeId as string))
      : [...nodeLabels];
    if (hover && active && !active.has(hover.id)) {
      setHoverScale(hover.id, 1);
      hover = null;
      handlers.onHover(null);
    }
    needsRender = true;
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
    // 标签永远置顶渲染（depthTest: false），点击也优先命中标签：
    // 指针落在看得见的标签文字上时，选中的一定是标签标注的节点。
    // 只拾取屏幕上真正可见的标签；被避让隐藏的标签不应截获点击。
    const labelHit = raycaster
      .intersectObjects(labelPickMeshes, false)
      .find((hit) => hit.object.visible);
    if (labelHit) {
      return labelHit.object.userData.pick as OfficeTreePick;
    }
    const hits = raycaster.intersectObjects(pickMeshes, false);
    const pick = hits[0]?.object.userData.pick as OfficeTreePick | undefined;
    return pick ?? null;
  }

  function setHoverScale(id: string | null, scale: number) {
    if (!id) {
      return;
    }
    // 只缩放节点本体：标签的 scale 由 tick 按屏幕等比逐帧接管，不能被悬浮缩放污染。
    for (const mesh of nodeMeshes) {
      if (mesh.userData.pick.id === id) {
        mesh.scale.setScalar(scale);
        needsRender = true;
      }
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (pointerDown) {
      const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
      if (moved > 6 && !dragging) {
        dragging = true;
        hoverLerp = null;
        hideHoverTag();
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
    const node = pick ? (layoutNodes?.find((candidate) => candidate.id === pick.id) ?? null) : null;
    if (pick && node) {
      // 悬浮放大改为逐帧插值的平滑凸起；属官没有常驻标签，hover 时浮出一枚名牌补位。
      const mesh = nodeMeshes.find(
        (candidate) => (candidate.userData.pick as OfficeTreePick).id === pick.id,
      ) as THREE.Mesh | undefined;
      hoverLerp = mesh ? { mesh, value: 1 } : null;
      const radius = NODE_RADIUS[node.kind] / (1 + node.depth * 0.18);
      if (node.kind === "office") {
        showHoverTag(node.title, node.x, node.y + radius + 1.15, node.z);
      } else {
        hideHoverTag();
      }
      handlers.onHover(describeNode(node, atlasName));
    } else {
      hoverLerp = null;
      hideHoverTag();
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
    const pick = pickAt(event);
    setSelected(pick?.id ?? null);
    handlers.onPick(pick);
  }

  function onPointerLeave() {
    hoverLerp = null;
    hideHoverTag();
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

  // —— 标注避让：默认全展开后上百枚标签挤在画面里 ——
  // 只做「重叠就隐藏」会让层级最低的属官几乎全军覆没：上级常驻名先占好位，
  // 属官标签一撞上就被藏掉，于是「只有上面的固定名字，下面的看不见」。
  // 改为在节点近旁试几个候选位：原位 → 上方 / 环切线 / 径向微调，
  // 尽量让每枚原子都挂着看得见的文字；只有所有候选都挤满才隐藏，且绝不互相压盖。
  // 候选一律不往下走——标签压进塔台会「穿模」，看着像别的原子的名字；
  // 偏离原位的由一根引线连回本体，文字与原子的归属始终明确。
  const labelProjection = new THREE.Vector3();
  const anchorProjection = new THREE.Vector3();
  interface LabelBox {
    cx: number;
    cy: number;
    halfW: number;
    halfH: number;
  }
  const KIND_PRIORITY: Record<OfficeNodeKind, number> = {
    root: 0,
    branch: 1,
    honorary: 2,
    office: 3,
  };
  /** 候选位相对原位的偏移 [环切线, 上下, 径向外]；纵向一律 ≥ 0，绝不往下穿进塔台。 */
  const LABEL_CANDIDATES: ReadonlyArray<readonly [number, number, number]> = [
    [0, 0, 0],
    [0, 0.9, 0],
    [0, 1.8, 0],
    [-1.3, 0.4, 0],
    [1.3, 0.4, 0],
    [-2.2, 1.0, 0],
    [2.2, 1.0, 0],
    [0, 1.2, 0.8],
    [-1.6, 1.8, 0.6],
    [1.6, 1.8, 0.6],
  ];
  function placeLabel(label: THREE.Sprite, pinned: boolean, placed: LabelBox[], pad: number) {
    const px = label.userData.px as { h: number; w: number } | undefined;
    const halfW = ((px?.w ?? 60) / 2) * 1.02;
    const halfH = ((px?.h ?? 22) / 2) * 1.02;
    const home = label.userData.home as THREE.Vector3 | undefined;
    const radialOut = label.userData.radialOut as THREE.Vector3 | undefined;
    const tangent = label.userData.tangent as THREE.Vector3 | undefined;
    const anchor = label.userData.nodeAnchor as THREE.Vector3 | undefined;
    // 画面外的原子不挂名：既避免「错位的名称」飘在可视区边缘，也把占位名额让给真正看得见的节点。
    if (anchor) {
      anchorProjection.copy(anchor).project(camera);
      if (
        anchorProjection.z > 1 ||
        Math.abs(anchorProjection.x) > 1.02 ||
        Math.abs(anchorProjection.y) > 1.02
      ) {
        label.visible = false;
        return;
      }
    }
    // 极端兜底（canvas 上下文缺失时标签无原位）：沿用当前位置，只做一次碰撞判定。
    const candidates =
      pinned || !home || !radialOut || !tangent ? LABEL_CANDIDATES.slice(0, 1) : LABEL_CANDIDATES;
    for (const [alongTangent, up, alongRadial] of candidates) {
      if (home && radialOut && tangent) {
        label.position.copy(home);
        label.position.addScaledVector(tangent, alongTangent);
        label.position.addScaledVector(radialOut, alongRadial);
        label.position.y += up;
      }
      labelProjection.copy(label.position).project(camera);
      if (labelProjection.z > 1) {
        continue;
      }
      const box: LabelBox = {
        cx: (labelProjection.x * 0.5 + 0.5) * canvasWidth,
        cy: (-labelProjection.y * 0.5 + 0.5) * canvasHeight,
        halfW,
        halfH,
      };
      const collides = placed.some(
        (other) =>
          Math.abs(box.cx - other.cx) < box.halfW + other.halfW + pad &&
          Math.abs(box.cy - other.cy) < box.halfH + other.halfH + pad,
      );
      // 被 hover 的节点标签直接占位；其余取第一个不与已放标签重叠的候选位。
      if (!collides || pinned) {
        label.visible = true;
        placed.push(box);
        return;
      }
    }
    label.visible = false;
  }
  function avoidLabelOverlap() {
    // 转正才展开属官名牌；滞回避免自转经过边界时反复显隐。
    const azimuth = Math.abs(currentAngles().azimuth);
    if (detailLabelsVisible && azimuth > FRONT_LABEL_HIDE_AZIMUTH) {
      detailLabelsVisible = false;
    } else if (!detailLabelsVisible && azimuth < FRONT_LABEL_SHOW_AZIMUTH) {
      detailLabelsVisible = true;
    }
    const placed: LabelBox[] = [];
    const pad = 2;
    // 排序：层级尊者优先、离相机近者优先，保证被让位的是低层远景标签。
    const ranked = [...nodeLabels].sort((a, b) => {
      const kindDelta =
        KIND_PRIORITY[a.userData.kind as OfficeNodeKind] -
        KIND_PRIORITY[b.userData.kind as OfficeNodeKind];
      if (kindDelta !== 0) {
        return kindDelta;
      }
      const aHome = (a.userData.home as THREE.Vector3 | undefined) ?? a.position;
      const bHome = (b.userData.home as THREE.Vector3 | undefined) ?? b.position;
      return camera.position.distanceToSquared(aHome) - camera.position.distanceToSquared(bHome);
    });
    const leaders = labelLeaders;
    const leaderAttr = leaders?.geometry.getAttribute("position") as
      | THREE.BufferAttribute
      | undefined;
    const leaderArray = leaderAttr?.array as Float32Array | undefined;
    let leaderCount = 0;
    for (const label of ranked) {
      const id = label.userData.nodeId as string;
      const depth = label.userData.depth as number | undefined;
      if (!detailLabelsVisible && depth !== undefined && depth >= 2) {
        // 斜视时只留下权力本源 / 分区 / 荣衔骨架，具体属官名称等转正后再出现。
        label.visible = false;
        continue;
      }
      placeLabel(label, hover?.id === id, placed, pad);
      if (!leaders || !leaderAttr || !leaderArray || !label.visible) {
        continue;
      }
      const anchor = label.userData.nodeAnchor as THREE.Vector3 | undefined;
      const home = label.userData.home as THREE.Vector3 | undefined;
      // 只在明显偏离原位时画引线：贴着本体的标签不用画，避免满屏细丝。
      // 两端都取中心：起点是节点球心（anchor），终点是标签 sprite 的中心（position），
      // 不接在光环边缘或文字框外沿——圆点与线从各自中心相连，归属才不会看着错开。
      if (anchor && home && label.position.distanceToSquared(home) > 0.16) {
        const offset = leaderCount * 6;
        leaderArray[offset] = anchor.x;
        leaderArray[offset + 1] = anchor.y;
        leaderArray[offset + 2] = anchor.z;
        leaderArray[offset + 3] = label.position.x;
        leaderArray[offset + 4] = label.position.y;
        leaderArray[offset + 5] = label.position.z;
        leaderCount += 1;
      }
    }
    if (leaders && leaderAttr) {
      leaders.geometry.setDrawRange(0, leaderCount * 2);
      leaderAttr.needsUpdate = true;
      leaders.visible = leaderCount > 0;
    }
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    canvasHeight = height;
    canvasWidth = width;
    needsRender = true;
    // 首次 fit 可能发生在画布布局稳定之前，取景用错纵横比（tree 缩成一角）。
    // 纵横比变化且用户尚未手动操作时自动重新取景；用户一旦交互即不再打扰。
    if (!userAdjusted && fittedAspect > 0 && Math.abs(camera.aspect - fittedAspect) > 0.02) {
      fittedAspect = camera.aspect;
      applyCamera(fittedAngles.azimuth, fittedAngles.polar, fitDistance(), contentCenter());
    }
  }

  function tick() {
    if (disposed) {
      return;
    }
    raf = requestAnimationFrame(tick);
    if (document.hidden) {
      return;
    }
    // 动画时钟用 performance.now() 而不是 rAF 时间戳：部分嵌入环境（IAB iframe 等）
    // 的 rAF 时间戳不推进，所有补间 / 生长动画会永远冻在第一帧。
    const now = performance.now();
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
    // 生长动画：新节点 / 枝干 / 标签按错峰时刻表长到位，展开与入场不再硬切。
    let animating = false;
    const growProgress = (delay: number) =>
      Math.min(1, Math.max(0, (now - growStart - delay) / GROW_MS));
    for (let index = growNodes.length - 1; index >= 0; index -= 1) {
      const item = growNodes[index]!;
      const progress = growProgress(item.delay);
      if (progress <= 0) {
        animating = true;
        continue;
      }
      item.mesh.scale.setScalar(Math.max(0.001, easeOutBack(progress)));
      if (progress >= 1) {
        growNodes.splice(index, 1);
        needsRender = true;
      } else {
        animating = true;
      }
    }
    for (let index = growStems.length - 1; index >= 0; index -= 1) {
      const item = growStems[index]!;
      const progress = growProgress(item.delay);
      if (progress <= 0) {
        animating = true;
        continue;
      }
      (item.stem.material as THREE.MeshBasicMaterial).opacity = 0.82 * progress;
      if (progress >= 1) {
        growStems.splice(index, 1);
        needsRender = true;
      } else {
        animating = true;
      }
    }
    for (let index = growLabels.length - 1; index >= 0; index -= 1) {
      const item = growLabels[index]!;
      const progress = growProgress(item.delay);
      if (progress <= 0) {
        animating = true;
        continue;
      }
      (item.label.material as THREE.SpriteMaterial).opacity = Math.min(1, progress);
      if (progress >= 1) {
        growLabels.splice(index, 1);
        needsRender = true;
      } else {
        animating = true;
      }
    }
    // 悬浮凸起的平滑插值：凸起不是瞬跳，移开由 snap 归位。
    if (hoverLerp) {
      hoverLerp.value += (1.35 - hoverLerp.value) * 0.16;
      hoverLerp.mesh.scale.setScalar(hoverLerp.value);
      if (Math.abs(hoverLerp.value - 1.35) < 0.01) {
        hoverLerp = null;
        needsRender = true;
      } else {
        animating = true;
      }
    }
    // 选中环缓慢呼吸：点选永远有回应；呼吸只持续一阵，之后静息省电。
    if (selectionRing?.visible) {
      if (now < pulseUntil) {
        const base = (selectionRing.userData.baseScale as number) || 1;
        selectionRing.scale.setScalar(base * (1 + Math.sin(now * 0.004) * 0.07));
        animating = true;
      } else {
        const base = (selectionRing.userData.baseScale as number) || 1;
        selectionRing.scale.setScalar(base);
      }
    }
    // 首次 fit 可能发生在画布布局稳定之前（ResizeObserver 在部分嵌入环境不触发）：
    // 纵横比变化且用户尚未手动操作时逐帧兜底重取景；用户一旦交互即不再打扰。
    if (!userAdjusted && fittedAspect > 0 && Math.abs(camera.aspect - fittedAspect) > 0.02) {
      fittedAspect = camera.aspect;
      applyCamera(fittedAngles.azimuth, fittedAngles.polar, fitDistance(), contentCenter());
    }
    // 脏标记渲染：自转 / 补间 / 生长 / 悬浮 / 呼吸 / 相机移动才重画，
    // 静止帧不再全速 render——关掉自转后空闲功耗接近零。
    if (animating) {
      needsRender = true;
    }
    if (needsRender) {
      // 屏幕等比标签：按相机到标签的距离换算世界尺寸，任何缩放下保持恒定屏幕大小；
      // 包围框的跨度标注只在拉近镜头时显示（折叠总览下由左菜单标注跨度，避免压住组标签）。
      const halfTan = Math.tan((camera.fov * Math.PI) / 360);
      const showHudLabels = camera.position.distanceTo(controls.target) <= BRACKET_LABEL_DISTANCE;
      const updateLabel = (label: THREE.Sprite) => {
        const px = label.userData.px as { h: number; w: number } | undefined;
        if (px) {
          const distance = camera.position.distanceTo(label.position);
          const worldPerPx = (2 * halfTan * distance) / canvasHeight;
          label.scale.set(px.w * worldPerPx, px.h * worldPerPx, 1);
        }
        if (label.userData.isHudLabel) {
          label.visible = showHudLabels;
        }
      };
      // 先定好标签的最终位置（避开重叠），再按该位置换算屏幕等比尺寸。
      avoidLabelOverlap();
      for (const label of nodeLabels) {
        updateLabel(label);
      }
      for (const label of hudLabels) {
        updateLabel(label);
      }
      if (hoverTag?.sprite.visible) {
        updateLabel(hoverTag.sprite);
      }
      renderer.render(scene, camera);
      needsRender = false;
    }
  }

  const onContextLost = (event: Event) => {
    event.preventDefault();
    handlers.onUnavailable?.();
  };
  const onVisibility = () => {
    // 只跟标签页可见性走。IntersectionObserver 在部分嵌入环境（IAB）会先报
    // not-intersecting 且不再更新，把整条渲染循环吞成空画布——单屏沉浸页
    // 画布始终在视口内，不做离屏暂停。
    needsRender = true;
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
              // 皇权徽记是一整个 Group，逐层展开其中的材质分别重着色。
              const descendants: THREE.Object3D[] = [child];
              while (descendants.length > 0) {
                const object = descendants.pop()!;
                descendants.push(...object.children);
                const childMaterial = (object as THREE.Mesh).material as
                  | THREE.MeshBasicMaterial
                  | undefined;
                if (!childMaterial) {
                  continue;
                }
                const regalia = childMaterial.userData.regalia as string | undefined;
                if (regalia === "gold") {
                  childMaterial.color = imperialGold(colors);
                  const standard = childMaterial as THREE.Material & { emissive?: THREE.Color };
                  if (standard.emissive) {
                    standard.emissive = imperialGold(colors);
                  }
                } else if (regalia === "vermillion") {
                  childMaterial.color = new THREE.Color(colors.vermillion);
                } else {
                  childMaterial.color = nodeKindColor(colors, node.kind);
                }
              }
            }
          }
        }
      }
      for (const material of bracketMaterials) {
        material.color = new THREE.Color(colors.ochre);
      }
      for (const material of guideMaterials) {
        material.color = new THREE.Color(colors.ink);
      }
      for (const material of platformMaterials) {
        // 顶面 / 侧沿各有深浅：tint 存在材质上，主题切换按各自档位重混纸墨。
        material.color = new THREE.Color(colors.paper).lerp(
          new THREE.Color(colors.ink),
          (material.userData.tint as number) ?? 0.07,
        );
      }
      if (spineMaterial) {
        spineMaterial.color = new THREE.Color(colors.ink).lerp(new THREE.Color(colors.paper), 0.35);
      }
      if (baseMaterial) {
        baseMaterial.color = new THREE.Color(colors.ink);
      }
      if (selectionRing) {
        (selectionRing.material as THREE.MeshBasicMaterial).color = new THREE.Color(
          colors.vermillion,
        );
      }
      fog.color.set(colors.paper);
      for (const stem of edgeStems) {
        const meta = stem.userData.stem as StemMeta;
        meta.baseColor = stemColor(colors, meta.kind);
      }
      // 边的实际颜色由 applyHighlight 按 baseColor × 高亮系数算出，主题切换后需重算一次。
      applyHighlight();
      needsRender = true;
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
    focusNode,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      if (colorFrame) {
        cancelAnimationFrame(colorFrame);
      }
      resizeObserver?.disconnect();
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
      // 浮签与选中环挂在 scene 上（不随 content 重建），销毁时单独释放。
      if (hoverTag) {
        disposeObject(hoverTag.sprite);
        scene.remove(hoverTag.sprite);
        hoverTag = null;
      }
      if (selectionRing) {
        disposeObject(selectionRing);
        scene.remove(selectionRing);
        selectionRing = null;
      }
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      pickMeshes = [];
      nodeMeshes = [];
      nodeLabels = [];
      nodeProxies = [];
      labelPickMeshes = [];
      edgeStems = [];
    },
    resetView,
    setAtlas,
    setAutoRotate(on: boolean) {
      autoRotate = on;
      controls.autoRotate = on;
      needsRender = true;
    },
    setFilter,
  };
}
