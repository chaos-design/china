import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import type { DynastyAtlas } from "./data";
import type { OfficeNodeKind, OfficeTreeLayout, OfficeTreeNode } from "./office-tree-layout";

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
}

const FONT_STACK =
  '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
const LABEL_WORLD_PER_PX = 0.02;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const NODE_RADIUS: Record<OfficeNodeKind, number> = {
  branch: 0.4,
  honorary: 0.46,
  office: 0.3,
  root: 0.62,
};

const PRESET_ANGLES: Record<OfficeTreeCameraPreset, { azimuth: number; polar: number }> = {
  "three-quarter": { azimuth: 0.32, polar: 0.32 },
  front: { azimuth: 0, polar: 0.3 },
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
      return new THREE.Color(colors.ochre).lerp(new THREE.Color(colors.paper), 0.4);
    case "office":
      return new THREE.Color(colors.blueprint);
  }
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
    context.fillStyle = colorCss(colors.paper, 0.9);
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
  let bounds = { maxX: 6, maxY: 10, minX: -6, minY: -10 };
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
    const halfFov = (camera.fov * Math.PI) / 360;
    const distanceV = height / 2 / Math.tan(halfFov);
    const distanceH = width / 2 / (Math.tan(halfFov) * Math.max(0.4, camera.aspect));
    return Math.max(distanceV, distanceH) * 1.18 + 2;
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
    atlasName = atlas.name;

    content = new THREE.Group();
    scene.add(content);

    const byId = new Map(layout.nodes.map((node) => [node.id, node]));

    const positions: number[] = [];
    const edgeColors: number[] = [];
    const branchColor = new THREE.Color(colors.vermillion);
    const officeColor = new THREE.Color(colors.blueprint);

    // 先画父子连线（枝干），再画节点，保证节点盖在线上。
    for (const edge of layout.edges) {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to) {
        continue;
      }
      const color = edge.kind === "branch" ? branchColor : officeColor;
      positions.push(from.x, from.y, from.z, to.x, to.y, to.z);
      edgeColors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    }

    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    edgeGeometry.setAttribute("color", new THREE.Float32BufferAttribute(edgeColors, 3));
    const edgeMaterial = new THREE.LineBasicMaterial({
      opacity: 0.55,
      transparent: true,
      vertexColors: true,
    });
    content.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));

    for (const node of layout.nodes) {
      const radius = NODE_RADIUS[node.kind];
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(radius, 0),
        new THREE.MeshStandardMaterial({
          color: nodeKindColor(colors, node.kind),
          emissive: nodeKindColor(colors, node.kind),
          emissiveIntensity: node.kind === "root" ? 0.45 : 0.3,
          flatShading: true,
          metalness: 0.18,
          roughness: 0.45,
        }),
      );
      mesh.position.set(node.x, node.y, node.z);
      if (node.kind === "root" || node.kind === "branch") {
        mesh.rotation.y = Math.PI / 4;
      }
      mesh.userData.pick = {
        id: node.id,
        kind: node.kind,
        title: node.title,
      } satisfies OfficeTreePick;
      content.add(mesh);
      pickMeshes.push(mesh);

      const lines: { muted?: boolean; size: number; text: string; weight?: number }[] = [];
      const labelSize = node.kind === "root" ? 30 : node.kind === "branch" ? 26 : 20;
      lines.push({ size: labelSize, text: node.title, weight: node.kind === "office" ? 500 : 700 });
      if (node.rank) {
        lines.push({ muted: true, size: 15, text: node.rank });
      }
      const label = createLabelSprite(
        colors,
        lines,
        node.kind === "root"
          ? { accent: colorCss(colors.vermillion, 0.9) }
          : node.kind === "branch"
            ? { accent: colorCss(colors.ochre, 0.8) }
            : undefined,
      );
      label.position.set(node.x, node.y + radius + 0.5, node.z);
      content.add(label);
    }

    bounds = {
      maxX: layout.maxX + 4,
      maxY: layout.maxY + 4,
      minX: layout.minX - 4,
      minY: layout.minY - 4,
    };

    const angles = PRESET_ANGLES["three-quarter"];
    applyCamera(angles.azimuth, angles.polar, fitDistance(), contentCenter());
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
          }
        }
      }
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
    },
    resetView,
    setAtlas,
  };
}
