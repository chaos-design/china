import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import type { RankTreeLayout, RankTreeSpan } from "./rank-tree-layout";
import { formatBandLabel, RANK_RULER, TREE_GEOMETRY } from "./rank-tree-layout";
import type { RankDynasty, RankDynastyId } from "./types";

/**
 * 立体品级树的 Three.js 场景层。
 *
 * 这一层只负责「把布局画出来 + 拾取 + 镜头」，不做任何布局决策：
 * 层级坐标来自 rank-tree-layout.ts，业务选中态由 React 持有。
 * 因此这里不参与单测（jsdom 无 WebGL），纯几何逻辑全部下沉到布局模块。
 */

export type RankTreeCameraPreset = "three-quarter" | "front";

export interface RankTreeColors {
  blueprint: string;
  ink: string;
  ochre: string;
  paper: string;
  vermillion: string;
}

export interface RankTreeSceneEntry {
  dynasty: RankDynasty;
  layout: RankTreeLayout;
}

export type RankTreePick =
  | {
      dynastyId: RankDynastyId;
      kind: "office";
      levelIndex: number;
      officeTitle: string;
    }
  | {
      dynastyId: RankDynastyId;
      kind: "tier";
      levelIndex: number;
    };

export type RankTreeHover = RankTreePick & {
  /** 职能一句话（官职）或本级设官（层级）。 */
  detail: string;
  /** 品秩或「N 官」。 */
  subtitle: string;
  title: string;
};

export interface RankTreeSceneHandlers {
  onHover: (hover: RankTreeHover | null) => void;
  onPick: (pick: RankTreePick | null) => void;
  onUnavailable?: () => void;
}

export interface RankTreeScene {
  applyPreset: (preset: RankTreeCameraPreset) => void;
  dispose: () => void;
  focusTier: (dynastyId: RankDynastyId, levelIndex: number) => void;
  resize: () => void;
  resetView: () => void;
  setAutoRotate: (enabled: boolean) => void;
  setFocus: (focus: RankTreePick | null, mirror: RankTreePick | null) => void;
  setSelection: (selection: RankTreePick | null) => void;
  setTrees: (entries: RankTreeSceneEntry[], options: { span: RankTreeSpan }) => void;
}

const LABEL_WORLD_PER_PX = 0.023;
const NODE_RADIUS = 0.4;
const FONT_STACK =
  '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const PRESET_ANGLES: Record<RankTreeCameraPreset, { azimuth: number; polar: number }> = {
  "three-quarter": { azimuth: 0.3, polar: 0.3 },
  front: { azimuth: 0, polar: 0.28 },
};

/** 读取页面主题 token，让 3D 配色跟随水墨纸色与朱砂强调色。 */
export function readRankTreeColors(container: HTMLElement): RankTreeColors {
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

interface LabelLine {
  text: string;
  size: number;
  weight?: number;
  muted?: boolean;
}

interface LabelOptions {
  accent?: string;
  background?: boolean;
}

function createLabelSprite(
  colors: RankTreeColors,
  lines: LabelLine[],
  options: LabelOptions = {},
): THREE.Sprite {
  const pixelRatio = 2;
  const padX = 16;
  const padY = 9;
  const lineGap = 4;
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
    context.fillStyle = colorCss(colors.paper, 0.92);
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
  return sprite;
}

function createPlateShadowTexture(): THREE.Texture | null {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }
  const gradient = context.createRadialGradient(64, 64, 6, 64, 64, 62);
  gradient.addColorStop(0, "rgba(0,0,0,0.55)");
  gradient.addColorStop(0.6, "rgba(0,0,0,0.25)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
    const material = (mesh as THREE.Mesh).material;
    const materials = Array.isArray(material) ? material : material ? [material] : [];
    for (const entry of materials) {
      const map = (entry as THREE.MeshStandardMaterial).map;
      map?.dispose();
      entry.dispose();
    }
  });
}

interface TierVisual {
  edge: THREE.LineSegments;
  plate: THREE.Mesh;
}

interface TreeRuntime {
  entry: RankTreeSceneEntry;
  offsetX: number;
  tierVisuals: Map<number, TierVisual>;
  nodeVisuals: Map<string, THREE.Mesh>;
}

export function createRankTreeScene(
  container: HTMLElement,
  initialColors: RankTreeColors,
  handlers: RankTreeSceneHandlers,
): RankTreeScene | null {
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
  let trees: TreeRuntime[] = [];
  let span: RankTreeSpan = "band";
  let focus: RankTreePick | null = null;
  let mirror: RankTreePick | null = null;
  let selection: RankTreePick | null = null;
  let hover: RankTreePick | null = null;
  let selectionLabel: THREE.Group | null = null;
  let rulerGroup: THREE.Group | null = null;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotateSpeed = 1.2;
  controls.dampingFactor = 0.075;
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.maxDistance = 120;
  controls.maxPolarAngle = 1.47;
  controls.minDistance = 7;
  controls.minPolarAngle = 0.08;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.8;

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

  let bounds = { maxX: 6, maxY: 10, minX: -6, minY: 0 };
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
  let aspect = 1;

  const pickMeshes: THREE.Object3D[] = [];

  function contentCenter(): THREE.Vector3 {
    return new THREE.Vector3((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2, 0);
  }

  function fitDistance(): number {
    const height = Math.max(1, bounds.maxY - bounds.minY);
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const halfFov = (camera.fov * Math.PI) / 360;
    const distanceV = height / 2 / Math.tan(halfFov);
    const distanceH = width / 2 / (Math.tan(halfFov) * Math.max(0.4, camera.aspect));
    return Math.max(distanceV, distanceH) * 1.16 + 2;
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

  function currentAngles(): { azimuth: number; polar: number } {
    const offset = camera.position.clone().sub(controls.target);
    const distance = Math.max(0.001, offset.length());
    return {
      azimuth: Math.atan2(offset.x, offset.z),
      polar: Math.asin(THREE.MathUtils.clamp(offset.y / distance, -1, 1)),
    };
  }

  function applyPreset(preset: RankTreeCameraPreset) {
    const angles = PRESET_ANGLES[preset];
    tweenCamera(contentCenter(), fitDistance(), angles.azimuth, angles.polar);
  }

  function resetView() {
    applyPreset("three-quarter");
  }

  function ensureVisible() {
    const required = fitDistance();
    const distance = camera.position.distanceTo(controls.target);
    if (distance < required * 0.98) {
      const angles = currentAngles();
      applyCamera(angles.azimuth, angles.polar, required, controls.target.clone());
    }
  }

  function rebuild() {
    if (disposed) {
      return;
    }
    if (content) {
      scene.remove(content);
      disposeObject(content);
    }
    pickMeshes.length = 0;
    trees = [];
    selectionLabel = null;
    rulerGroup = null;

    content = new THREE.Group();
    scene.add(content);

    const layouts = treesLayoutsForBuild();
    const offsets = computeOffsets(layouts);

    if (span === "band") {
      bounds = computeBounds(layouts, offsets, 2.4);
      buildRuler();
    } else {
      bounds = computeBounds(layouts, offsets, 0.8);
    }

    layouts.forEach((entry, index) => {
      buildTree(entry, offsets[index] ?? 0);
    });

    buildGround();

    applyFocus();
    applySelection();
    rebuildSelectionLabel();
    applyHover();
  }

  // 重建期间需要 layouts：从 setTrees 存下的待建列表取，避免重复计算。
  let pendingLayouts: RankTreeSceneEntry[] = [];
  function treesLayoutsForBuild(): RankTreeSceneEntry[] {
    return pendingLayouts;
  }

  function computeOffsets(layouts: RankTreeSceneEntry[]): number[] {
    if (layouts.length <= 1) {
      return [0];
    }
    const [main, compare] = layouts;
    if (!main || !compare) {
      return [0];
    }
    const half = (main.layout.maxRadius + compare.layout.maxRadius + TREE_GEOMETRY.columnGap) / 2;
    return [-half, half];
  }

  function computeBounds(
    layouts: RankTreeSceneEntry[],
    offsets: number[],
    extraX: number,
  ): { maxX: number; maxY: number; minX: number; minY: number } {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    layouts.forEach((entry, index) => {
      const offset = offsets[index] ?? 0;
      minX = Math.min(minX, offset - entry.layout.maxRadius);
      maxX = Math.max(maxX, offset + entry.layout.maxRadius);
      minY = Math.min(minY, entry.layout.minY);
      maxY = Math.max(maxY, entry.layout.root.y + 4.5);
    });

    if (!Number.isFinite(minX)) {
      return { maxX: 6, maxY: 10, minX: -6, minY: 0 };
    }
    return { maxX: maxX + extraX, maxY, minX: minX - extraX, minY };
  }

  function buildRuler() {
    if (!content) {
      return;
    }
    const left = bounds.minX;
    const right = bounds.maxX;
    const positions: number[] = [];
    rulerGroup = new THREE.Group();

    for (const tick of RANK_RULER) {
      const y = (10 - tick.band) * TREE_GEOMETRY.bandGap;
      positions.push(left, y + 0.08, 0, right, y + 0.08, 0);

      for (const x of [left + 0.75, right - 0.75]) {
        const label = createLabelSprite(colors, [{ muted: true, size: 30, text: tick.label }], {
          background: false,
        });
        label.position.set(x, y + 0.1, 0);
        rulerGroup.add(label);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(colors.ink),
      opacity: 0.12,
      transparent: true,
    });
    rulerGroup.add(new THREE.LineSegments(geometry, material));
    content.add(rulerGroup);
  }

  function buildGround() {
    if (!content) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 126);
    gradient.addColorStop(0, colorCss(colors.ink, 0.16));
    gradient.addColorStop(0.55, colorCss(colors.vermillion, 0.1));
    gradient.addColorStop(1, colorCss(colors.vermillion, 0));
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    const size = Math.max(30, (bounds.maxX - bounds.minX) * 1.7);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size * 0.62),
      new THREE.MeshBasicMaterial({
        depthWrite: false,
        map: texture,
        opacity: 0.55,
        transparent: true,
      }),
    );
    plane.position.set((bounds.minX + bounds.maxX) / 2, bounds.minY - 0.6, 0);
    plane.rotation.x = -Math.PI / 2;
    content.add(plane);
  }

  function buildTree(entry: RankTreeSceneEntry, offsetX: number) {
    if (!content) {
      return;
    }
    const { layout, dynasty } = entry;
    const group = new THREE.Group();
    group.position.x = offsetX;
    content.add(group);

    const tierVisuals = new Map<number, TierVisual>();
    const nodeVisuals = new Map<string, THREE.Mesh>();

    const trunkHeight = Math.max(0.4, layout.trunk.top - layout.trunk.bottom);
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.26, trunkHeight, 8),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.ink),
        flatShading: true,
        metalness: 0.1,
        opacity: 0.38,
        roughness: 0.7,
        transparent: true,
      }),
    );
    trunk.position.set(0, (layout.trunk.top + layout.trunk.bottom) / 2, 0);
    group.add(trunk);

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.08, trunkHeight, 6),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.vermillion),
        opacity: 0.55,
        transparent: true,
      }),
    );
    core.position.copy(trunk.position);
    group.add(core);

    const rootMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.52, 0),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.ochre),
        emissive: new THREE.Color(colors.vermillion),
        emissiveIntensity: 0.35,
        flatShading: true,
        metalness: 0.2,
        roughness: 0.45,
      }),
    );
    rootMesh.position.set(layout.root.x, layout.root.y, layout.root.z);
    group.add(rootMesh);
    rootMesh.rotation.y = Math.PI / 4;

    const rootLabel = createLabelSprite(colors, [{ size: 24, text: "皇权" }], {
      accent: colorCss(colors.vermillion, 0.9),
      background: false,
    });
    rootLabel.position.set(0, layout.root.y + 0.78, 0);
    group.add(rootLabel);

    const branchPositions: number[] = [];
    const branchColors: number[] = [];
    const civilColor = new THREE.Color(colors.vermillion);
    const militaryColor = new THREE.Color(colors.blueprint);

    for (const tier of layout.tiers) {
      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(tier.plateRadius, tier.plateRadius * 0.94, 0.14, 6),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(colors.paper).lerp(new THREE.Color(colors.ink), 0.2),
          emissive: new THREE.Color(colors.vermillion),
          emissiveIntensity: 0.04,
          flatShading: true,
          metalness: 0.05,
          roughness: 0.8,
        }),
      );
      plate.position.set(0, tier.y, 0);
      plate.userData.pick = {
        dynastyId: dynasty.id,
        kind: "tier",
        levelIndex: tier.levelIndex,
      } satisfies RankTreePick;
      group.add(plate);
      pickMeshes.push(plate);

      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(plate.geometry as THREE.BufferGeometry, 20),
        new THREE.LineBasicMaterial({
          color: new THREE.Color(colors.ink),
          opacity: 0.32,
          transparent: true,
        }),
      );
      edge.position.copy(plate.position);
      group.add(edge);

      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(tier.plateRadius * 2.1, tier.plateRadius * 2.1),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(colors.ink),
          depthWrite: false,
          map: createPlateShadowTexture(),
          opacity: 0.24,
          transparent: true,
        }),
      );
      shadow.position.set(0, tier.y - 0.2, 0);
      shadow.rotation.x = -Math.PI / 2;
      group.add(shadow);

      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(tier.plateRadius * 0.98, tier.plateRadius * 0.92, 0.16, 6),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(colors.paper).lerp(new THREE.Color(colors.ink), 0.42),
          flatShading: true,
          metalness: 0.05,
          roughness: 0.85,
        }),
      );
      rim.position.set(0, tier.y - 0.1, 0);
      group.add(rim);

      tierVisuals.set(tier.levelIndex, { edge, plate });

      const plaque = createLabelSprite(
        colors,
        [
          {
            size: 30,
            text:
              tier.level.approxGrade !== undefined
                ? `${tier.grade} · 约${formatBandLabel(tier.band)}`
                : tier.grade,
            weight: 600,
          },
        ],
        { accent: colorCss(colors.vermillion, 0.72) },
      );
      plaque.position.set(0, tier.y + 0.24, tier.plateRadius + 0.45);
      group.add(plaque);

      for (const node of layout.nodes.filter(
        (candidate) => candidate.levelIndex === tier.levelIndex,
      )) {
        const officeColor = node.office.branch === "civil" ? civilColor : militaryColor;
        const mesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(NODE_RADIUS, 0),
          new THREE.MeshStandardMaterial({
            color: officeColor,
            emissive: officeColor,
            emissiveIntensity: 0.3,
            flatShading: true,
            metalness: 0.2,
            roughness: 0.4,
          }),
        );
        mesh.position.set(node.x, node.y, node.z);
        mesh.userData.baseScale = 1;
        mesh.userData.pick = {
          dynastyId: dynasty.id,
          kind: "office",
          levelIndex: node.levelIndex,
          officeTitle: node.office.title,
        } satisfies RankTreePick;
        group.add(mesh);
        pickMeshes.push(mesh);
        nodeVisuals.set(node.id, mesh);

        branchPositions.push(0, tier.y + 0.1, 0, node.x, node.y, node.z);
        branchColors.push(
          officeColor.r,
          officeColor.g,
          officeColor.b,
          officeColor.r,
          officeColor.g,
          officeColor.b,
        );
      }
    }

    const branchGeometry = new THREE.BufferGeometry();
    branchGeometry.setAttribute("position", new THREE.Float32BufferAttribute(branchPositions, 3));
    branchGeometry.setAttribute("color", new THREE.Float32BufferAttribute(branchColors, 3));
    const branchMaterial = new THREE.LineBasicMaterial({
      opacity: 0.72,
      transparent: true,
      vertexColors: true,
    });
    group.add(new THREE.LineSegments(branchGeometry, branchMaterial));

    const banner = createLabelSprite(
      colors,
      [
        { size: 52, text: dynasty.name, weight: 700 },
        { muted: true, size: 24, text: dynasty.period },
      ],
      { accent: colorCss(colors.vermillion, 0.9) },
    );
    banner.position.set(0, layout.root.y + 2.95, 0);
    group.add(banner);

    trees.push({ entry, nodeVisuals, offsetX, tierVisuals });
  }

  function nodeStateScale(pick: RankTreePick): number {
    if (selection && samePick(selection, pick)) {
      return 1.55;
    }
    if (hover && samePick(hover, pick)) {
      return 1.28;
    }
    return 1;
  }

  function samePick(a: RankTreePick | null, b: RankTreePick | null): boolean {
    if (!a || !b) {
      return false;
    }
    if (a.kind !== b.kind || a.dynastyId !== b.dynastyId || a.levelIndex !== b.levelIndex) {
      return false;
    }
    return a.kind === "tier" || a.officeTitle === (b as { officeTitle: string }).officeTitle;
  }

  function isFocused(dynastyId: RankDynastyId, levelIndex: number): boolean {
    for (const key of [focus, mirror]) {
      if (
        key &&
        key.kind === "tier" &&
        key.dynastyId === dynastyId &&
        key.levelIndex === levelIndex
      ) {
        return true;
      }
    }
    return false;
  }

  function applyFocus() {
    for (const tree of trees) {
      for (const [levelIndex, visual] of tree.tierVisuals) {
        const active = isFocused(tree.entry.dynasty.id, levelIndex);
        const material = visual.plate.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = active ? 0.05 : 0.03;
        const edgeMaterial = visual.edge.material as THREE.LineBasicMaterial;
        edgeMaterial.opacity = active ? 0.95 : 0.32;
        edgeMaterial.color.set(active ? colors.vermillion : colors.ink);
      }
    }
  }

  function applySelection() {
    for (const tree of trees) {
      for (const node of tree.entry.layout.nodes) {
        const mesh = tree.nodeVisuals.get(node.id);
        if (!mesh) {
          continue;
        }
        const pick: RankTreePick = {
          dynastyId: tree.entry.dynasty.id,
          kind: "office",
          levelIndex: node.levelIndex,
          officeTitle: node.office.title,
        };
        const selected = samePick(selection, pick);
        const scale = nodeStateScale(pick) * (selected ? 1.12 : 1);
        mesh.scale.setScalar(scale);
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = selected ? 0.95 : 0.3;
      }
    }
  }

  function rebuildSelectionLabel() {
    if (selectionLabel) {
      if (content) {
        content.remove(selectionLabel);
      }
      disposeObject(selectionLabel);
      selectionLabel = null;
    }
    if (!content || selection?.kind !== "office") {
      return;
    }
    const pick = selection;
    const tree = trees.find((candidate) => candidate.entry.dynasty.id === pick.dynastyId);
    const node = tree?.entry.layout.nodes.find(
      (candidate) =>
        candidate.levelIndex === pick.levelIndex && candidate.office.title === pick.officeTitle,
    );
    if (!tree || !node) {
      return;
    }
    const label = createLabelSprite(colors, [{ size: 28, text: node.office.title, weight: 600 }]);
    label.position.set(tree.offsetX + node.x * 1.2, node.y + 0.62, node.z * 1.2);
    selectionLabel = new THREE.Group();
    selectionLabel.add(label);
    content.add(selectionLabel);
  }

  function applyHover() {
    applySelection();
  }

  function describePick(pick: RankTreePick): { detail: string; subtitle: string; title: string } {
    const tree = trees.find((candidate) => candidate.entry.dynasty.id === pick.dynastyId);
    if (!tree) {
      return { detail: "", subtitle: "", title: "" };
    }
    const level = tree.entry.dynasty.levels[pick.levelIndex];
    if (!level) {
      return { detail: "", subtitle: "", title: "" };
    }

    if (pick.kind === "tier") {
      const civil = level.offices.filter((office) => office.branch === "civil").length;
      const military = level.offices.length - civil;
      return {
        detail: `本级设官：${level.offices.map((office) => office.title).join("、")}`,
        subtitle: `${tree.entry.dynasty.name} · ${level.offices.length} 官 · 文 ${civil} / 武 ${military}`,
        title: level.grade,
      };
    }

    const office = level.offices.find((candidate) => candidate.title === pick.officeTitle);
    if (!office) {
      return { detail: "", subtitle: "", title: "" };
    }
    return {
      detail: office.duty,
      subtitle: `${tree.entry.dynasty.name} · ${office.rank}`,
      title: office.title,
    };
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function pickAt(event: PointerEvent): RankTreePick | null {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickMeshes, false);
    return (hits[0]?.object.userData.pick as RankTreePick | undefined) ?? null;
  }

  function onPointerMove(event: PointerEvent) {
    if (pointerDown) {
      const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
      if (moved > 6 && !dragging) {
        dragging = true;
        if (hover) {
          hover = null;
          applyHover();
          handlers.onHover(null);
        }
      }
    }
    if (dragging) {
      return;
    }
    const pick = pickAt(event);
    renderer.domElement.style.cursor = pick ? "pointer" : "grab";
    if (samePick(pick, hover)) {
      return;
    }
    hover = pick;
    applyHover();
    handlers.onHover(pick ? { ...pick, ...describePick(pick) } : null);
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
    handlers.onPick(pick);
    if (pick?.kind === "tier") {
      focusTier(pick.dynastyId, pick.levelIndex);
    }
  }

  function onPointerLeave() {
    if (hover) {
      hover = null;
      applyHover();
      handlers.onHover(null);
    }
    renderer.domElement.style.cursor = "grab";
  }

  function focusTier(dynastyId: RankDynastyId, levelIndex: number) {
    const tree = trees.find((candidate) => candidate.entry.dynasty.id === dynastyId);
    const tier = tree?.entry.layout.tiers.find((candidate) => candidate.levelIndex === levelIndex);
    if (!tree || !tier) {
      return;
    }
    const angles = currentAngles();
    const distance = Math.max(20, fitDistance() * 0.94);
    const halfVisible = distance * Math.tan((camera.fov * Math.PI) / 360);
    const minTargetY = bounds.minY + halfVisible * 0.86;
    const maxTargetY = bounds.maxY - halfVisible * 0.86;
    const targetY =
      minTargetY <= maxTargetY
        ? THREE.MathUtils.clamp(tier.y, minTargetY, maxTargetY)
        : (bounds.minY + bounds.maxY) / 2;
    tweenCamera(
      new THREE.Vector3(tree.offsetX, targetY, 0),
      distance,
      angles.azimuth,
      angles.polar,
    );
  }

  function setFocus(next: RankTreePick | null, nextMirror: RankTreePick | null) {
    focus = next;
    mirror = nextMirror;
    applyFocus();
  }

  function setSelection(next: RankTreePick | null) {
    selection = next;
    applySelection();
    rebuildSelectionLabel();
  }

  function setAutoRotate(enabled: boolean) {
    controls.autoRotate = enabled;
  }

  function setTrees(entries: RankTreeSceneEntry[], options: { span: RankTreeSpan }) {
    pendingLayouts = entries;
    span = options.span;
    if (hover) {
      hover = null;
      handlers.onHover(null);
    }
    rebuild();
    const angles = PRESET_ANGLES["three-quarter"];
    applyCamera(angles.azimuth, angles.polar, fitDistance(), contentCenter());
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (trees.length > 0) {
      ensureVisible();
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
    const azimuth = Math.atan2(
      camera.position.x - controls.target.x,
      camera.position.z - controls.target.z,
    );
    if (rulerGroup) {
      rulerGroup.visible = Math.abs(Math.atan2(Math.sin(azimuth), Math.cos(azimuth))) < 0.72;
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

  // 主题 / 强调色切换时重读 token：重绘材质与标签，保留选中态。
  const themeObserver = new MutationObserver(() => {
    if (colorFrame) {
      return;
    }
    colorFrame = requestAnimationFrame(() => {
      colorFrame = 0;
      colors = readRankTreeColors(container);
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
        disposeObject(content);
        scene.remove(content);
        content = null;
      }
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      pickMeshes.length = 0;
      trees = [];
      rulerGroup = null;
    },
    focusTier,
    resize,
    resetView,
    setAutoRotate,
    setFocus,
    setSelection,
    setTrees,
  };
}
