// @ts-nocheck
// biome-ignore-all lint: converted legacy runtime keeps browser-script shape while removing dynamic source execution.
import * as Three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import {
  ANNEXATIONS,
  DYNASTIES,
  MINORITIES,
  PEOPLE,
  PERSON_ALIAS,
  PINYIN,
  PINYIN_PHRASE,
  TRIBE_TYPE,
  TYPE_COLOR,
} from "./data/runtime-data";

type LegacyThreeRuntime = typeof Three & {
  OrbitControls: typeof OrbitControls;
};

declare global {
  interface Window {
    THREE?: LegacyThreeRuntime;
    __ancientChinaRuntimeDisposed?: boolean;
  }
}

function ensureThreeRuntime() {
  window.THREE = Object.assign({}, Three, { OrbitControls });
}

export function formatRuntimeYear(y: number) {
  return y < 0 ? `前${-y}` : String(y);
}

export function formatRuntimeYearSpan(start: number, end: number) {
  const duration = Math.max(0, end - start);
  return `${formatRuntimeYear(start)}-${formatRuntimeYear(end)}(${duration}年)`;
}

const MINORITY_LABEL_INSET = 1.2;

export function getMinorityLabelX(startX: number) {
  return startX + MINORITY_LABEL_INSET;
}

export function resetDynastyFilterButtons(container: HTMLElement | null) {
  container?.replaceChildren();
}

const MINORITY_ROW_YEAR_GAP = 64;
const MINORITY_TRACK_BASE_Z = 40;
const MINORITY_TRACK_STEP_Z = 6;
const DYNASTY_SIDE_BRANCH_Z = 13;
const FIVE_TEN_BRANCH_STEP_Z = 8;
const FIVE_TEN_MIN_READABLE_LENGTH = 10.4;
const FIVE_TEN_LENGTH_PER_CHAR = 4.2;
const DYNASTY_BLOCK_GAP = 0.4;
const FIVE_TEN_BLOCK_WIDTH = 3.4;
const FIVE_TEN_MIN_Z_GAP = 3.6;
const FIVE_TEN_MAX_LAYOUT_Z = 36;
const FIVE_TEN_LAYOUT_X_GAP = 0.6;
const FLOW_ROUTE_TUBE_SEGMENTS = 28;
const FLOW_ROUTE_RADIAL_SEGMENTS = 8;
const FLOW_ROUTE_HIGHLIGHT_COUNT = 2;

export function computeMinorityRows(minorities, gap = MINORITY_ROW_YEAR_GAP) {
  const rowByIndex = new Map();
  ["top", "bottom"].forEach((side) => {
    const list = minorities
      .map((minority, index) => ({ minority, index }))
      .filter(({ minority }) => minority.side === side)
      .sort((a, b) => a.minority.life[0] - b.minority.life[0]);
    const laneEnd = [];
    list.forEach(({ minority, index }) => {
      let placed = -1;
      for (let k = 0; k < laneEnd.length; k++) {
        if (minority.life[0] >= laneEnd[k] + gap) {
          placed = k;
          break;
        }
      }
      if (placed === -1) {
        placed = laneEnd.length;
        laneEnd.push(0);
      }
      laneEnd[placed] = minority.life[1];
      rowByIndex.set(index, placed);
    });
  });
  return minorities.map((_, index) => rowByIndex.get(index) ?? 0);
}

export function getMinorityTrackZ(side: string, row: number) {
  const sign = side === "top" ? -1 : 1;
  return sign * (MINORITY_TRACK_BASE_Z + row * MINORITY_TRACK_STEP_Z);
}

export function getDynastyBranchZ(branch: string | number | undefined) {
  if (typeof branch === "number") return (branch / 8) * FIVE_TEN_BRANCH_STEP_Z;
  if (branch === "south") return DYNASTY_SIDE_BRANCH_Z;
  if (branch === "north") return -DYNASTY_SIDE_BRANCH_Z;
  return 0;
}

export function getDynastyBlockLength(rawLength: number, name: string, isCompactBranch: boolean) {
  const baseLength = Math.max(5, rawLength);
  const readableLength = isCompactBranch
    ? Math.max(FIVE_TEN_MIN_READABLE_LENGTH, name.length * FIVE_TEN_LENGTH_PER_CHAR)
    : 5;
  return Math.max(baseLength, readableLength) - DYNASTY_BLOCK_GAP;
}

function getCompactDynastyZCandidates(desiredZ: number) {
  const candidates = [];
  const slotCount = Math.floor((FIVE_TEN_MAX_LAYOUT_Z * 2) / FIVE_TEN_MIN_Z_GAP);
  for (let slot = 0; slot <= slotCount; slot++) {
    const z = -FIVE_TEN_MAX_LAYOUT_Z + slot * FIVE_TEN_MIN_Z_GAP;
    candidates.push(Number(z.toFixed(4)));
  }

  return candidates.sort(
    (a, b) => Math.abs(a - desiredZ) - Math.abs(b - desiredZ) || Math.abs(a) - Math.abs(b),
  );
}

function compactDynastySpansOverlap(a, b) {
  return a.xStart < b.xEnd + FIVE_TEN_LAYOUT_X_GAP && a.xEnd > b.xStart - FIVE_TEN_LAYOUT_X_GAP;
}

export function computeCompactDynastyLayouts(dynasties, yearToX: (year: number) => number) {
  const layouts = new Map();
  const placed = [];
  const compactDynasties = dynasties
    .map((dynasty, index) => ({ dynasty, index }))
    .filter(({ dynasty }) => typeof dynasty.branch === "number")
    .sort(
      (a, b) =>
        a.dynasty.start - b.dynasty.start ||
        getDynastyBranchZ(a.dynasty.branch) - getDynastyBranchZ(b.dynasty.branch),
    );

  compactDynasties.forEach(({ dynasty, index }) => {
    const xStartRaw = yearToX(dynasty.start);
    const xEndRaw = yearToX(dynasty.end);
    const centerX = (xStartRaw + xEndRaw) / 2;
    const length = getDynastyBlockLength(xEndRaw - xStartRaw, dynasty.name, true);
    const span = {
      xStart: centerX - length / 2,
      xEnd: centerX + length / 2,
    };
    const desiredZ = getDynastyBranchZ(dynasty.branch);
    const z =
      getCompactDynastyZCandidates(desiredZ).find((candidateZ) =>
        placed.every(
          (placedSpan) =>
            !compactDynastySpansOverlap(span, placedSpan) ||
            Math.abs(candidateZ - placedSpan.z) >= FIVE_TEN_MIN_Z_GAP,
        ),
      ) ?? desiredZ;

    const layout = { centerX, length, z, xStart: span.xStart, xEnd: span.xEnd, name: dynasty.name };
    placed.push(layout);
    layouts.set(index, layout);
  });

  return layouts;
}

export function getDynastyLabelFontSize(isCompactBranch: boolean) {
  return isCompactBranch ? 20 : 30;
}

type AncientChinaRuntimeData = {
  PEOPLE: typeof PEOPLE;
  PERSON_ALIAS: typeof PERSON_ALIAS;
  DYNASTIES: typeof DYNASTIES;
  TRIBE_TYPE: typeof TRIBE_TYPE;
  TYPE_COLOR: typeof TYPE_COLOR;
  MINORITIES: typeof MINORITIES;
  ANNEXATIONS: typeof ANNEXATIONS;
  PINYIN: typeof PINYIN;
  PINYIN_PHRASE: typeof PINYIN_PHRASE;
};

function executeAncientChinaRuntime({
  PEOPLE,
  PERSON_ALIAS,
  DYNASTIES,
  TRIBE_TYPE,
  TYPE_COLOR,
  MINORITIES,
  ANNEXATIONS,
  PINYIN,
  PINYIN_PHRASE,
}: AncientChinaRuntimeData) {
  /* 数据层已抽取到 dynasty_data.js (PEOPLE / DYNASTIES / MINORITIES / ANNEXATIONS / TYPE_COLOR) */

  /* ===================== Three.js 场景 ===================== */
  let scene, camera, renderer, controls, raycaster, mouse;
  let starGroup,
    riverMesh,
    islands = [],
    tribeFlags = [],
    tribeDecorations = [],
    warBeams = [];
  const allPickable = [];
  let currentTab = "all",
    activeDynastyIdx = -1;
  let showRiver = true,
    showWars = true,
    showTribes = true,
    tourMode = false;
  let tourAngle = 0;

  const T_MIN = -280,
    T_MAX = 1950;
  // 旧坐标遗留:仅保留 yearToT/yearToPos (会被后面的 yearToX/yearToPos 覆盖),不再重复声明 RIVER_LEN
  function yearToT(y) {
    return (y - T_MIN) / (T_MAX - T_MIN);
  }
  /* (旧代码已清理) */

  /* 时间→3D 坐标:横向时间轴(直线),Y/Z 由"轨道"决定 */
  const RIVER_LEN = 360;
  function yearToX(y) {
    const t = (y - T_MIN) / (T_MAX - T_MIN);
    return -RIVER_LEN / 2 + RIVER_LEN * t;
  }
  function formatYear(y) {
    return formatRuntimeYear(y);
  }
  function formatYearSpan(start, end) {
    return formatRuntimeYearSpan(start, end);
  }
  // 主线汉族居中(z=0,y=0), 北族在 z<0 (远), 南族在 z>0 (近);上下分行
  /* 贪心动态分轨:对每个 side 内的族群按 start 升序遍历,
   找到第一条"上一条已结束 + 间隙"的轨道放进去;放不下再开新轨道。
   保证时间重叠的族群一定不共用 z。结果写回 m._row。 */
  function assignMinorityRows() {
    const rows = computeMinorityRows(MINORITIES);
    MINORITIES.forEach((m, index) => {
      m._row = rows[index]; // 覆盖原 row,确保不重叠
    });
  }
  function minorityZ(side, row) {
    // side: 'top' (北族,z<0), 'bottom' (南族,z>0); row 越大离主线越远。
    // 第一条副线也要避开五代十国等主线分支块,避免区块互相覆盖。
    return getMinorityTrackZ(side, row);
  }
  function yearToPos(y) {
    return new THREE.Vector3(yearToX(y), 0, 0);
  }

  function init() {
    try {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x04060d);
      scene.fog = new THREE.FogExp2(0x04060d, 0.0022);

      camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 2000);
      // 默认俯视:相机在正上方,屏幕"上方"对应 -X(秦/先),屏幕"下方"对应 +X(清/后)
      camera.up.set(-1, 0, 0);
      camera.position.set(0, 260, 0.01); // y 高位俯视,z 给极小值避免 lookAt 退化

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(devicePixelRatio);
      renderer.setSize(innerWidth, innerHeight);
      document.getElementById("cv").appendChild(renderer.domElement);

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 30;
      controls.maxDistance = 600;
      // 允许从俯视一直旋转到接近水平
      controls.maxPolarAngle = Math.PI * 0.49;
      controls.minPolarAngle = 0;
      controls.target.set(0, 0, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 0.65));
      const d1 = new THREE.DirectionalLight(0xfff4d8, 0.8);
      d1.position.set(80, 120, 60);
      scene.add(d1);
      const d2 = new THREE.DirectionalLight(0x6fa8ff, 0.4);
      d2.position.set(-60, 80, -80);
      scene.add(d2);

      buildStars();
      buildRiver();
      buildIslands();
      buildMinorityBands();
      buildWarBeams();
      buildAnnexArrows();
      buildTimeAxis();

      raycaster = new THREE.Raycaster();
      raycaster.params.Line.threshold = 2.2;
      mouse = new THREE.Vector2();
      addEventListener("resize", onResize);
      renderer.domElement.addEventListener("pointermove", onPointerMove);
      renderer.domElement.addEventListener("click", onClick);

      bindUI();
      document.getElementById("loading").classList.add("hidden");
      animate();
      // 默认保持俯视视角(秦在上、清在下),不再自动飞向唐朝
    } catch (err) {
      console.error("init() crashed:", err);
      const el = document.getElementById("loading");
      if (el) {
        el.classList.remove("hidden");
        el.style.flexDirection = "column";
        el.style.padding = "20px";
        el.style.textAlign = "left";
        el.innerHTML =
          '<div style="color:#ff6b6b;font-size:18px;margin-bottom:10px">页面初始化失败</div>' +
          '<div style="color:#aaa;font-size:13px;max-width:80vw;word-break:break-all;white-space:pre-wrap">' +
          (err && err.stack ? err.stack : String(err)) +
          "</div>";
      }
    }
  }

  function buildStars() {
    const N = 1800;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 400 + Math.random() * 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.5 + 50;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    starGroup = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.9,
        transparent: true,
        opacity: 0.65,
        sizeAttenuation: true,
      }),
    );
    scene.add(starGroup);
  }

  /* 主线时间长河:中央直线管状 */
  function buildRiver() {
    const curve = new THREE.LineCurve3(
      new THREE.Vector3(-RIVER_LEN / 2, 0, 0),
      new THREE.Vector3(RIVER_LEN / 2, 0, 0),
    );
    const tube = new THREE.TubeGeometry(curve, 80, 4, 12, false);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xc99a3a,
      emissive: 0xf3d28a,
      emissiveIntensity: 0.45,
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.65,
    });
    riverMesh = new THREE.Mesh(tube, mat);
    riverMesh.position.y = -2;
    scene.add(riverMesh);

    // 中线粒子
    const PN = 400;
    const g2 = new THREE.BufferGeometry();
    const p2 = new Float32Array(PN * 3);
    for (let i = 0; i < PN; i++) {
      p2[i * 3] = -RIVER_LEN / 2 + Math.random() * RIVER_LEN;
      p2[i * 3 + 1] = 0.3 + Math.random() * 1.2;
      p2[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    g2.setAttribute("position", new THREE.BufferAttribute(p2, 3));
    const riverPoints = new THREE.Points(
      g2,
      new THREE.PointsMaterial({
        color: 0xfff060,
        size: 0.55,
        transparent: true,
        opacity: 0.9,
      }),
    );
    riverPoints.userData.kind = "river_dust";
    scene.add(riverPoints);
  }

  /* 汉族浮岛:沿主线居中,高度=国祚
   南北朝/三国/五代十国(branch=='south'/'north' 或数字 z)错位到主线两侧。
   branch 字段支持两种格式:
   - 字符串: 'south' = +9, 'north' = -9, 'center' = 0
   - 数字  : 直接作为 z 偏移量,适合需要密集错开的多政权场景(五代十国 15 国)
*/
  function buildIslands() {
    const compactLayouts = computeCompactDynastyLayouts(DYNASTIES, yearToX);
    DYNASTIES.forEach((d, idx) => {
      const xS = yearToX(d.start);
      const xE = yearToX(d.end);
      // 五代十国 (branch 为数字) 用更瘦的岛屿,避免在 z 方向互相穿插
      const isFiveTen = typeof d.branch === "number";
      const compactLayout = compactLayouts.get(idx);
      const cx = compactLayout?.centerX ?? (xS + xE) / 2;
      // 朝代间留 0.4 单位间隙,避免相邻 island 边面 z-fight 抖动;短命政权给足可读宽度
      const len = compactLayout?.length ?? getDynastyBlockLength(xE - xS, d.name, isFiveTen);
      const w = isFiveTen ? FIVE_TEN_BLOCK_WIDTH : Math.min(13, len * 0.5 + 5);
      // 汉族朝代统一高度,不再按时长高低不同(用户要求"不需要高低之分")
      // 五代十国仍保留略低高度,以与主线区分
      const h = isFiveTen ? 10 : 12;
      const cz = compactLayout?.z ?? getDynastyBranchZ(d.branch);
      const geo = new THREE.BoxGeometry(len, h, w * 0.9);
      const c = d.colorKey && TYPE_COLOR[d.colorKey] ? TYPE_COLOR[d.colorKey] : TYPE_COLOR.han;
      const mat = new THREE.MeshStandardMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: 0.22,
        metalness: 0.5,
        roughness: 0.45,
        flatShading: true,
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
      });
      const island = new THREE.Mesh(geo, mat);
      island.position.set(cx, h / 2 + 1, cz);
      island.userData = {
        kind: "island",
        idx,
        name: d.name,
        group: d.group || null,
        top: h + 1,
        y0: d.start,
        y1: d.end,
      };
      scene.add(island);
      islands.push(island);
      allPickable.push(island);
      // 该朝代附属装饰物(旗杆/标签/年代/环带)用一个 Group 持有,
      // 便于 applyFilter 时随 island 一起隐藏
      const deco = new THREE.Group();
      deco.userData = { kind: "island_deco", idx };
      scene.add(deco);
      island.userData.deco = deco;

      // 朝代名(适中字号),颜色随分支着色;带半透明深色底,防止与背景文字混读
      // 相机俯视 up=(-1,0,0): -x 在屏幕上方,+x 在屏幕下方
      // 朝代名居中略向"屏幕上方"(即 -x 方向)偏移,年代条放在"屏幕下方"(+x),二者上下不重叠
      const labColor = "#" + c.toString(16).padStart(6, "0");
      const lab = makeTextSprite(d.name, labColor, getDynastyLabelFontSize(isFiveTen), {
        bg: true,
        depthTest: !isFiveTen,
      });
      lab.position.set(cx - Math.max(2.5, w * 0.55), h + 9, cz);
      if (isFiveTen) lab.renderOrder = 1001;
      deco.add(lab);

      // 年代:放在岛屿"屏幕下方",并把高度抬高让它压在朝代名之上的 z-buffer 顺序里不冲突
      // 已移除 3D 常驻年代标签:朝代时间与国祚长度改在 hover/点击面板中展示,降低主视图区文字密度。

      // (已移除岛屿环带 TorusGeometry — 用户反馈不需要)

      d._cx = cx;
      d._cz = cz;
      d._top = h + 1;
      d._w = w;
      d._len = len;
      d._center = new THREE.Vector3(cx, h / 2 + 1, cz);
    });
  }

  /* 少数民族副线:每个族群一根独立的横条 (BoxGeometry),
   长度=存续期, 颜色=类型, 上方北族 / 下方南族 */
  const minorityIndex = new Map(); // name -> minority mesh
  function buildMinorityBands() {
    assignMinorityRows();
    MINORITIES.forEach((m, i) => {
      const xS = yearToX(m.life[0]);
      const xE = yearToX(m.life[1]);
      const cx = (xS + xE) / 2;
      const z = minorityZ(m.side, m._row);
      const len = Math.max(2, xE - xS);
      const c = TYPE_COLOR[m.type] || 0xffffff;
      const h = 2.6;
      const w = 2.8;
      const geo = new THREE.BoxGeometry(len, h, w);
      const mat = new THREE.MeshStandardMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: 0.7,
        metalness: 0.3,
        roughness: 0.45,
      });
      const band = new THREE.Mesh(geo, mat);
      band.position.set(cx, h / 2, z);
      band.userData = {
        kind: "minority",
        name: m.name,
        desc: m.desc,
        life: m.life,
        side: m.side,
        type: m.type,
      };
      scene.add(band);
      tribeFlags.push(band);
      allPickable.push(band);
      minorityIndex.set(m.name, band);

      // 顶部一根细线(描边)让条带在远处也可辨
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(len, 0.18, w * 0.6),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85 }),
      );
      edge.position.set(cx, h + 0.1, z);
      edge.userData = { kind: "minority_deco", name: m.name, life: m.life };
      scene.add(edge);
      tribeDecorations.push(edge);

      // 名称标签
      const lab = makeTextSprite(m.name, "#" + c.toString(16).padStart(6, "0"), 22, {
        bg: true,
        depthTest: false,
      });
      lab.position.set(getMinorityLabelX(xS), h + 1.5, z);
      lab.center.set(1, 0.5);
      lab.renderOrder = 1001;
      lab.userData = { kind: "minority_deco", name: m.name, life: m.life };
      scene.add(lab);
      tribeDecorations.push(lab);

      // 两端发光点
      [xS, xE].forEach((xx) => {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.45, 12, 8),
          new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.95 }),
        );
        dot.position.set(xx, h / 2, z);
        dot.userData = { kind: "minority_deco", name: m.name, life: m.life };
        scene.add(dot);
        tribeDecorations.push(dot);
      });
    });
  }

  function makeArrowRoute(startRaw, endRaw, arrowHeight, lift = 14) {
    const directDir = new THREE.Vector3().subVectors(endRaw, startRaw);
    if (directDir.lengthSq() === 0) directDir.set(1, 0, 0);
    directDir.normalize();

    const surface = 1.4;
    const start = startRaw.clone().addScaledVector(directDir, surface);
    const tipPoint = endRaw.clone().addScaledVector(directDir, -surface);
    let tubeEnd = tipPoint.clone().addScaledVector(directDir, -arrowHeight);
    let curve = null;
    let tipDir = directDir.clone();

    for (let i = 0; i < 3; i++) {
      const peakY = Math.max(start.y, tubeEnd.y, tipPoint.y) + lift;
      const mid = new THREE.Vector3((start.x + tubeEnd.x) / 2, peakY, (start.z + tubeEnd.z) / 2);
      curve = new THREE.QuadraticBezierCurve3(start, mid, tubeEnd);
      tipDir = new THREE.Vector3().subVectors(curve.getPoint(1), curve.getPoint(0.96));
      if (tipDir.lengthSq() === 0) tipDir.copy(directDir);
      tipDir.normalize();
      tubeEnd = tipPoint.clone().addScaledVector(tipDir, -arrowHeight);
    }

    const peakY = Math.max(start.y, tubeEnd.y, tipPoint.y) + lift;
    const mid = new THREE.Vector3((start.x + tubeEnd.x) / 2, peakY, (start.z + tubeEnd.z) / 2);
    curve = new THREE.QuadraticBezierCurve3(start, mid, tubeEnd);
    tipDir = new THREE.Vector3().subVectors(curve.getPoint(1), curve.getPoint(0.96));
    if (tipDir.lengthSq() === 0) tipDir.copy(directDir);
    tipDir.normalize();

    return { curve, start, mid, tipPoint, tipDir };
  }

  function makeFlowSegmentGeometry(curve, start, span, radius) {
    const pts = [];
    for (let i = 0; i <= 5; i++) {
      pts.push(curve.getPoint(Math.min(1, start + span * (i / 5))));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, radius, 8, false);
  }

  function addFlowRoute(
    route,
    { color, haloColor, userData, collection, year, flowRadius = 0.28 },
  ) {
    const halo = new THREE.Mesh(
      new THREE.TubeGeometry(
        route.curve,
        FLOW_ROUTE_TUBE_SEGMENTS,
        0.54,
        FLOW_ROUTE_RADIAL_SEGMENTS,
        false,
      ),
      new THREE.MeshBasicMaterial({
        color: haloColor,
        transparent: true,
        opacity: 0.36,
        depthTest: false,
        depthWrite: false,
      }),
    );
    halo.userData = userData;
    halo.renderOrder = 996;
    scene.add(halo);
    allPickable.push(halo);
    collection.push({ mesh: halo, year });

    const line = new THREE.Mesh(
      new THREE.TubeGeometry(
        route.curve,
        FLOW_ROUTE_TUBE_SEGMENTS,
        0.24,
        FLOW_ROUTE_RADIAL_SEGMENTS,
        false,
      ),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
        depthWrite: false,
      }),
    );
    line.userData = userData;
    line.renderOrder = 997;
    scene.add(line);
    allPickable.push(line);
    collection.push({ mesh: line, year });

    for (let i = 0; i < FLOW_ROUTE_HIGHLIGHT_COUNT; i++) {
      const segment = new THREE.Mesh(
        makeFlowSegmentGeometry(route.curve, (i + 1) / 5, 0.055, flowRadius),
        new THREE.MeshBasicMaterial({
          color: 0xe8fbff,
          transparent: true,
          opacity: 0.72,
          depthTest: false,
          depthWrite: false,
        }),
      );
      segment.userData = userData;
      segment.renderOrder = 998;
      scene.add(segment);
      allPickable.push(segment);
      collection.push({
        mesh: segment,
        year,
        flow: true,
        curve: route.curve,
        offset: i / FLOW_ROUTE_HIGHLIGHT_COUNT,
        speed: 0.2,
        span: 0.055,
        radius: flowRadius,
      });
    }
  }

  /* 战争连线:从汉族浮岛顶部 → 对应少数民族条带 (加粗+描边+实心箭头) */
  function buildWarBeams() {
    DYNASTIES.forEach((d) => {
      d.wars.forEach((w) => {
        const facs = w.factions || [];
        if (facs.length < 2) return;
        const dynName = d.name;
        const opps = facs.filter((f) => f !== dynName);
        opps.forEach((opp) => {
          const band = minorityIndex.get(opp);
          if (!band) return;
          let xW = yearToX(w.y);
          const dz = d._cz || 0; // 南北朝主线错位 z
          // 把起点夹紧到 island 的水平范围内,避免箭头从岛外悬空冒出
          if (typeof d._cx === "number" && typeof d._len === "number") {
            const half = d._len / 2;
            const xMin = d._cx - half + 0.4;
            const xMax = d._cx + half - 0.4;
            xW = Math.max(xMin, Math.min(xMax, xW));
          }
          // 起点设在 island 顶部外侧 (避免管线穿入 island 体内)
          const startRaw = new THREE.Vector3(xW, (d._top || 10) + 1.5, dz);
          const rawEnd = new THREE.Vector3(yearToX(w.y), band.position.y, band.position.z);
          const color = 0xff3030;
          const haloColor = 0xff8a8a;
          // 流向线留出末端空隙，避免线段插入目标条带。
          const TIP_H = 2.6;
          const route = makeArrowRoute(startRaw, rawEnd, TIP_H, 14);
          const userData = {
            kind: "war",
            year: w.y,
            from: dynName,
            to: opp,
            desc: w.t,
            dynasty: dynName,
            isHan: true,
          };
          addFlowRoute(route, {
            color,
            haloColor,
            userData,
            collection: warBeams,
            year: w.y,
            flowRadius: 0.26,
          });

          // 起点也加个小六边形发光块,强化"从汉族出发"的视觉
          const origin = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.7, 0),
            new THREE.MeshBasicMaterial({ color: 0xfff2a0 }),
          );
          origin.position.copy(route.start);
          origin.userData = userData;
          scene.add(origin);
          warBeams.push({ mesh: origin, year: w.y, isHan: true });
        });
      });
    });
  }

  /* 少数民族吞并箭头: 副线 A → 副线 B (加粗描边+大箭头+背板年份) */
  const annexArrows = [];
  function buildAnnexArrows() {
    ANNEXATIONS.forEach((a) => {
      const A = minorityIndex.get(a.by);
      const B = minorityIndex.get(a.target);
      const xW = yearToX(a.y);

      // 起点
      let startRaw;
      if (A) {
        startRaw = new THREE.Vector3(xW, A.position.y, A.position.z);
      } else {
        const d = DYNASTIES.find((d) => d.name === a.by);
        if (d) {
          let xClamped = xW;
          if (typeof d._cx === "number" && typeof d._len === "number") {
            const half = d._len / 2;
            xClamped = Math.max(d._cx - half + 0.4, Math.min(d._cx + half - 0.4, xW));
          }
          startRaw = new THREE.Vector3(xClamped, (d._top || 10) + 1.5, d._cz || 0);
        } else {
          startRaw = new THREE.Vector3(xW, 12, 0);
        }
      }

      // 终点: B 为少数民族 band -> 用 band 位置; 否则尝试找朝代 (target 为汉族王朝时)
      let end_raw,
        targetIsDyn = false,
        targetDyn = null;
      if (B) {
        end_raw = new THREE.Vector3(xW, B.position.y, B.position.z);
      } else {
        targetDyn = DYNASTIES.find((d) => d.name === a.target);
        if (targetDyn) {
          targetIsDyn = true;
          let xC = xW;
          if (typeof targetDyn._cx === "number" && typeof targetDyn._len === "number") {
            const half = targetDyn._len / 2;
            xC = Math.max(targetDyn._cx - half + 0.4, Math.min(targetDyn._cx + half - 0.4, xW));
          }
          // 终点设在岛屿"顶部表面"上方 1.5,而不是岛屿内部
          end_raw = new THREE.Vector3(xC, (targetDyn._top || 10) + 1.5, targetDyn._cz || 0);
        } else {
          return; // 真找不到目标
        }
      }

      const color = A ? 0xff9020 : 0xff3030; // 少→少 鲜橙;汉灭少 鲜红
      const haloCol = A ? 0xffd080 : 0xff8a8a;
      const ARR_H = 3.0;
      const route = makeArrowRoute(startRaw, end_raw, ARR_H, 14);

      const userData = {
        kind: "annex",
        year: a.y,
        by: a.by,
        target: a.target,
        desc: a.desc,
        isAnnex: true,
      };
      addFlowRoute(route, {
        color,
        haloColor: haloCol,
        userData,
        collection: annexArrows,
        year: a.y,
        flowRadius: targetIsDyn ? 0.34 : 0.3,
      });

      // 指向汉族岛屿时,在岛屿顶部再加一个 ✕ / 圆环标记,作为命中点的清晰提示
      if (targetIsDyn) {
        // 命中圆环
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xff3030,
          transparent: true,
          opacity: 0.9,
          depthTest: false,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.9, 24), ringMat);
        ring.position.copy(end_raw);
        ring.position.y -= 0.3;
        ring.lookAt(end_raw.x, end_raw.y + 10, end_raw.z); // 朝上
        ring.renderOrder = 998;
        ring.userData = userData;
        scene.add(ring);
        allPickable.push(ring);
        annexArrows.push({ mesh: ring, year: a.y, pulse: true });

        // 中心十字标记
        const dotMat = new THREE.MeshBasicMaterial({
          color: 0xfff0c0,
          depthTest: false,
          depthWrite: false,
        });
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), dotMat);
        dot.position.copy(end_raw);
        dot.renderOrder = 999;
        dot.userData = userData;
        scene.add(dot);
        allPickable.push(dot);
        annexArrows.push({ mesh: dot, year: a.y });
      }

      // 起点小标识(被动方那侧不显示)
      if (A) {
        const tag = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 10, 8),
          new THREE.MeshBasicMaterial({ color }),
        );
        tag.position.copy(route.start);
        tag.userData = userData;
        scene.add(tag);
        annexArrows.push({ mesh: tag, year: a.y });
      }
    });
  }

  /* 时间刻度:沿主线下方 */
  function buildTimeAxis() {
    for (let y = -200; y <= 1900; y += 200) {
      const x = yearToX(y);
      const lbl = y < 0 ? "前" + -y : "" + y;
      const s = makeTextSprite(lbl, "#f3d28a", 20);
      s.position.set(x, -4, 4);
      scene.add(s);
      const tick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 1.5, 4),
        new THREE.MeshBasicMaterial({ color: 0xf3d28a, transparent: true, opacity: 0.7 }),
      );
      tick.position.set(x, -1.5, 0);
      scene.add(tick);
    }
    // 100年小刻度
    for (let y = -200; y <= 1900; y += 100) {
      if (y % 200 === 0) continue;
      const x = yearToX(y);
      const tick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.8, 4),
        new THREE.MeshBasicMaterial({ color: 0xf3d28a, transparent: true, opacity: 0.35 }),
      );
      tick.position.set(x, -1.5, 0);
      scene.add(tick);
    }
  }

  function makeTextSprite(text, color = "#fff", fontSize = 22, opts = {}) {
    const c = document.createElement("canvas");
    const pad = 10;
    const ctx = c.getContext("2d");
    ctx.font = `bold ${fontSize}px "PingFang SC","Microsoft YaHei",sans-serif`;
    const m = ctx.measureText(text);
    c.width = Math.ceil(m.width) + pad * 2;
    c.height = fontSize + pad * 2;
    ctx.font = `bold ${fontSize}px "PingFang SC","Microsoft YaHei",sans-serif`;
    // 如果调用方需要"被挡住才不可见",绘制一层半透明深色底,把文字本身的描边和背景一起做出来,
    // 这样即便 depthTest 开启,文字也保持高对比、易读
    if (opts.bg) {
      ctx.fillStyle = "rgba(8,12,22,0.78)";
      // 圆角矩形底
      const r = 6;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(c.width - r, 0);
      ctx.quadraticCurveTo(c.width, 0, c.width, r);
      ctx.lineTo(c.width, c.height - r);
      ctx.quadraticCurveTo(c.width, c.height, c.width - r, c.height);
      ctx.lineTo(r, c.height);
      ctx.quadraticCurveTo(0, c.height, 0, c.height - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = color;
    // ctx.fillStyle = '#fff';
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,.95)";
    ctx.shadowBlur = 8;
    ctx.fillText(text, pad, c.height / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    // depthTest 默认开启:被前面的岛屿挡住时文字不再"透显",防止视觉错位看错朝代
    const depthTest = opts.depthTest !== false;
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest, depthWrite: false }),
    );
    const sc = 0.06;
    sp.scale.set(c.width * sc, c.height * sc, 1);
    return sp;
  }

  /* ===================== 交互 ===================== */
  function onResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }
  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(allPickable);
    const tip = document.getElementById("tip");
    const war = hits.find((h) => h.object.userData.kind === "war");
    const annex = hits.find((h) => h.object.userData.kind === "annex");
    const minority = hits.find((h) => h.object.userData.kind === "minority");
    const island = hits.find((h) => h.object.userData.kind === "island");
    if (war) {
      const u = war.object.userData;
      const yr = formatYear(u.year);
      tip.innerHTML = `<span class="y">${yr} 年</span><span class="f">${u.from}</span> ⚔ <span class="f">${u.to}</span><br/><span style="color:#cbd2e2;font-size:11px">${u.desc || ""}</span>`;
      tip.style.display = "block";
      tip.style.left = e.clientX + 14 + "px";
      tip.style.top = e.clientY + 14 + "px";
    } else if (annex) {
      const u = annex.object.userData;
      const yr = formatYear(u.year);
      tip.innerHTML = `<span class="y">${yr} 年 吞并</span><span class="f">${u.by}</span> → <span class="f">${u.target}</span><br/><span style="color:#cbd2e2;font-size:11px">${u.desc || ""}</span>`;
      tip.style.display = "block";
      tip.style.left = e.clientX + 14 + "px";
      tip.style.top = e.clientY + 14 + "px";
    } else if (minority) {
      const u = minority.object.userData;
      const life = formatYearSpan(u.life[0], u.life[1]);
      tip.innerHTML = `<span class="y">少数民族</span> ${u.name}<br/><span style="color:#9aa3b8;font-size:11px">${life} · 点击查看详情</span>`;
      tip.style.display = "block";
      tip.style.left = e.clientX + 14 + "px";
      tip.style.top = e.clientY + 14 + "px";
    } else if (island) {
      const u = island.object.userData;
      const years = formatYearSpan(u.y0, u.y1);
      tip.innerHTML = `<span class="y">朝代</span> ${u.name}<br/><span style="color:#9aa3b8;font-size:11px">${years} · 点击查看详情</span>`;
      tip.style.display = "block";
      tip.style.left = e.clientX + 14 + "px";
      tip.style.top = e.clientY + 14 + "px";
    } else {
      tip.style.display = "none";
    }
  }
  function onClick() {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(allPickable);
    if (!hits.length) return;
    const u = hits[0].object.userData;
    if (u.kind === "island") showDynasty(u.idx);
    else if (u.kind === "war") {
      const dIdx = DYNASTIES.findIndex((d) => d.name === u.dynasty);
      if (dIdx >= 0) {
        showDynasty(dIdx);
        currentTab = "war";
        setActiveTab("war");
        renderTimeline(DYNASTIES[dIdx], "war");
      }
    } else if (u.kind === "minority") {
      showMinority(u.name);
    } else if (u.kind === "annex") {
      showMinority(u.target);
    }
  }

  /* ===================== 面板与人物徽章 ===================== */

  /* 少数民族详情面板 */
  function showMinority(name) {
    const m = MINORITIES.find((x) => x.name === name);
    if (!m) return;
    // 关闭汉族面板
    document.getElementById("panel").classList.remove("show");
    const mp = document.getElementById("minority-panel");
    document.getElementById("mp-title").innerHTML = withRuby(m.name);
    const lifeStr = `${m.life[0] < 0 ? "前" + (-m.life[0]) : m.life[0]} ~ ${m.life[1]}`;
    const typeLabel =
      {
        north: "北方游牧",
        northeast: "东北渔猎",
        west: "西部政权",
        south: "南方政权",
        mixed: "综合",
      }[m.type] || m.type;
    document.getElementById("mp-meta").textContent = `${typeLabel}  ·  ${lifeStr}`;
    document.getElementById("mp-desc").textContent = m.desc || "暂无详细描述。";

    // 相关战争:从所有朝代 wars 中筛选与本族相关的
    const warsDiv = document.getElementById("mp-wars");
    warsDiv.innerHTML = "";
    DYNASTIES.forEach((d) => {
      d.wars.forEach((w) => {
        const facs = w.factions || [];
        if (facs.includes(m.name)) {
          const yr = w.y < 0 ? "前" + -w.y : "" + w.y;
          const others = facs.filter((f) => f !== m.name).join("、");
          const el = document.createElement("div");
          el.className = "mp-item";
          el.innerHTML = `<span class="yr">${yr}年</span> <span class="parties">${m.name} ⚔ ${others}</span> <span style="color:#9aa3b8">[${d.name}]</span><br/><span style="color:#aeb8cc">${annotatePeople(w.t)}</span>`;
          warsDiv.appendChild(el);
        }
      });
    });
    if (!warsDiv.children.length)
      warsDiv.innerHTML = '<div class="mp-item" style="color:#666">暂无记录</div>';

    // 相关吞并
    const annexDiv = document.getElementById("mp-annex");
    annexDiv.innerHTML = "";
    ANNEXATIONS.forEach((a) => {
      if (a.by === m.name || a.target === m.name) {
        const yr = a.y < 0 ? "前" + -a.y : "" + a.y;
        const role =
          a.by === m.name
            ? '<span style="color:#ff9a5a">吞并方</span>'
            : '<span style="color:#7ad0ff">被吞并方</span>';
        const el = document.createElement("div");
        el.className = "mp-item";
        el.innerHTML = `<span class="yr">${yr}年</span> <span class="parties">${a.by} 吞并 ${a.target}</span> ${role}<br/><span style="color:#aeb8cc">${annotatePeople(a.desc)}</span>`;
        annexDiv.appendChild(el);
      }
    });
    if (!annexDiv.children.length)
      annexDiv.innerHTML = '<div class="mp-item" style="color:#666">暂无记录</div>';

    mp.classList.add("show");

    // 镜头平移到该族条带(保持当前角度,不旋转)
    const band = minorityIndex.get(m.name);
    if (band) {
      const pos = band.position;
      panToTarget({ x: pos.x, y: pos.y, z: pos.z });
    }
  }

  function showDynasty(i) {
    document.getElementById("minority-panel").classList.remove("show");
    activeDynastyIdx = i;
    const d = DYNASTIES[i];
    document.getElementById("p-title").innerHTML = withRuby(d.name);
    document.getElementById("p-meta").textContent = formatYearSpan(d.start, d.end);
    const tb = document.getElementById("p-tribes");
    tb.innerHTML = "";
    (d.tribes || []).forEach((t) => {
      const tp = TRIBE_TYPE[t] || "west";
      const c = TYPE_COLOR[tp] || 0xffffff;
      const sp = document.createElement("span");
      sp.className = "tag";
      sp.innerHTML = withRuby(t);
      sp.style.color = "#" + c.toString(16).padStart(6, "0");
      tb.appendChild(sp);
    });
    renderTimeline(d, currentTab);
    document.getElementById("panel").classList.add("show");

    // 镜头平移+放大到该朝代,并高亮岛
    const dst = d._center.clone();
    const zd = Math.max(70, (d._len || 60) * 1.4);
    panAndZoomToTarget({ x: dst.x, y: dst.y, z: dst.z }, zd);
    highlightDynasty(i);
  }

  function setActiveTab(tab) {
    document
      .querySelectorAll("#panel .tab")
      .forEach((x) => x.classList.toggle("active", x.dataset.tab === tab));
  }

  /* 把文本中所有匹配到 PEOPLE 主名或别名的子串包裹成人物徽章 */
  const ROLE_ICON = { emperor: "♕", general: "⚔", advisor: "✦", envoy: "✉", tribe: "⚑" };
  const ROLE_LABEL = {
    emperor: "帝王",
    general: "主将",
    advisor: "谋臣",
    envoy: "使节",
    tribe: "少数民族首领",
  };
  function annotatePeople(text) {
    let html = escapeHtml(text);
    const cands = [...Object.keys(PEOPLE), ...Object.keys(PERSON_ALIAS)].sort(
      (a, b) => b.length - a.length,
    );
    // 记录已经被包裹过的区间,避免别名是主名子串导致嵌套标记
    const marks = []; // [start, end]
    cands.forEach((name) => {
      if (!name) return;
      const target = PERSON_ALIAS[name] || name;
      const info = PEOPLE[target];
      if (!info) return;
      // 用循环扫描,跳过已落在标记内的位置
      let result = "";
      let i = 0;
      const len = html.length;
      const nlen = name.length;
      while (i < len) {
        // 检查当前位置是否已在标记区间内
        let inMark = false;
        for (const [s, e] of marks) {
          if (i >= s && i < e) {
            inMark = true;
            break;
          }
        }
        if (!inMark && html.substr(i, nlen) === name) {
          const wrapped = `\x01${target}\x02${name}\x03`;
          const newStart = result.length;
          result += wrapped;
          // 更新已有 marks 的偏移?这里 marks 基于旧 html 索引,改为基于新 result 重建
          i += nlen;
          marks.push([newStart, newStart + wrapped.length]);
        } else {
          result += html[i];
          i++;
        }
      }
      // 重建 marks 索引,使其指向新 html 中的位置
      // 简化:每轮重新扫描整个新串收集所有 \x01...\x03 区间
      html = result;
      marks.length = 0;
      let p = 0;
      while (p < html.length) {
        const a = html.indexOf("\x01", p);
        if (a < 0) break;
        const b = html.indexOf("\x03", a);
        if (b < 0) break;
        marks.push([a, b + 1]);
        p = b + 1;
      }
    });
    html = html.replace(/\x01([^\x02\x01]+)\x02([^\x03\x01]+)\x03/g, (m, target, label) => {
      const info = PEOPLE[target];
      if (!info) return label; // 防御性回退
      const icon = ROLE_ICON[info.role] || "·";
      return `<span class="person ${info.role}" data-person="${target}" data-icon="${icon}">${withRuby(label)}</span>`;
    });
    // 清理任何残留的控制字符,避免脏字符显示
    html = html.replace(/[\x01\x02\x03]/g, "");
    return html;
  }

  function renderTimeline(d, tab) {
    const items = [];
    if (tab === "all" || tab === "relation")
      d.relations.forEach((r) => items.push({ y: r.y, _y: parseY(r.y), t: r.t, type: "relation" }));
    if (tab === "all" || tab === "event")
      d.events.forEach((r) => items.push({ y: r.y, _y: parseY(r.y), t: r.t, type: "event" }));
    if (tab === "all" || tab === "war")
      d.wars.forEach((r) => {
        const ny = parseY(r.y);
        items.push({
          y: ny < 0 ? "前" + -ny : "" + ny,
          _y: ny,
          t: r.t,
          type: "war",
          factions: r.factions,
        });
      });
    if (tab === "people") {
      // 抽取所有出现在该朝代事件文本中的人物
      const found = new Set();
      const allText = [...d.relations, ...d.events, ...d.wars].map((x) => x.t).join(" ");
      [...Object.keys(PEOPLE), ...Object.keys(PERSON_ALIAS)].forEach((n) => {
        if (allText.indexOf(n) >= 0) found.add(PERSON_ALIAS[n] || n);
      });
      const box = document.getElementById("p-timeline");
      box.innerHTML = "";
      [...found].forEach((name) => {
        const p = PEOPLE[name];
        if (!p) return;
        const div = document.createElement("div");
        div.className =
          "tl-item " + (p.role === "emperor" ? "event" : p.role === "general" ? "war" : "relation");
        div.innerHTML = `<span class="yr">${escapeHtml(p.life)}</span><span class="person ${p.role}" data-person="${name}" data-icon="${ROLE_ICON[p.role] || "·"}">${withRuby(name)}</span>
        <div class="factions" style="margin-top:6px;color:#cbd2e2">${escapeHtml(p.desc)}</div>`;
        box.appendChild(div);
      });
      if (!found.size)
        box.innerHTML = '<div style="color:#9aa3b8;font-size:12px;padding:6px 0">未识别人物</div>';
      return;
    }
    items.sort((a, b) => a._y - b._y);
    const box = document.getElementById("p-timeline");
    box.innerHTML = "";
    items.forEach((it) => {
      const div = document.createElement("div");
      div.className = "tl-item " + it.type;
      let html = `<span class="yr">${escapeHtml(it.y)}</span><span class="txt">${annotatePeople(it.t)}</span>`;
      if (it.type === "war" && it.factions) {
        const fac = it.factions.map((f) => `<span class="f">${escapeHtml(f)}</span>`).join(" ⚔ ");
        html += `<div class="factions">参战：${fac}</div>`;
      }
      div.innerHTML = html;
      box.appendChild(div);
    });
    if (!items.length)
      box.innerHTML =
        '<div style="color:#9aa3b8;font-size:12px;padding:6px 0">暂无该类型内容</div>';
  }

  function parseY(s) {
    const m = String(s).match(/前?(\d+)/);
    if (!m) return 0;
    const n = parseInt(m[1]);
    return String(s).startsWith("前") ? -n : n;
  }
  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  }

  /* 拼音注音工具 - 词组优先匹配,回退逐字 */
  function hasPinyin(text) {
    if (!text) return false;
    const s = String(text);
    if (typeof PINYIN_PHRASE !== "undefined" && PINYIN_PHRASE[s]) return true;
    if (typeof PINYIN === "undefined") return false;
    for (const ch of s) {
      if (PINYIN[ch]) return true;
    }
    return false;
  }
  function getPinyin(text) {
    if (!text) return "";
    const s = String(text);
    if (typeof PINYIN_PHRASE !== "undefined" && PINYIN_PHRASE[s]) return PINYIN_PHRASE[s];
    if (typeof PINYIN === "undefined") return "";
    const parts = [];
    for (const ch of s) {
      if (PINYIN[ch]) parts.push(PINYIN[ch]);
    }
    return parts.join(" ");
  }
  /*
   * withRuby(text):
   * 1. 若整个 text 在 PINYIN_PHRASE 里命中 -> 按空格分割拼音,逐字配对生成 ruby
   * 2. 否则尝试贪心最长匹配 PINYIN_PHRASE 子串 -> 匹配段按词组注音,非匹配段逐字查 PINYIN
   * 3. 未命中的字原样输出(转义)
   */
  function withRuby(text) {
    if (!text) return "";
    const s = String(text);
    if (typeof PINYIN === "undefined" && typeof PINYIN_PHRASE === "undefined") return escapeHtml(s);

    // 构建词组列表,按长度降序(贪心最长匹配)
    const phrases =
      typeof PINYIN_PHRASE !== "undefined"
        ? Object.keys(PINYIN_PHRASE).sort((a, b) => b.length - a.length)
        : [];

    let out = "";
    let i = 0;
    while (i < s.length) {
      // 尝试最长词组匹配
      let matched = false;
      for (const ph of phrases) {
        if (s.substr(i, ph.length) === ph) {
          // 匹配到词组,按空格分割拼音逐字配对
          const pys = PINYIN_PHRASE[ph].split(/\s+/);
          const chars = [...ph]; // 支持多字节
          for (let j = 0; j < chars.length; j++) {
            const py = pys[j] || "";
            if (py) {
              out += "<ruby>" + escapeHtml(chars[j]) + "<rt>" + py + "</rt></ruby>";
            } else {
              out += escapeHtml(chars[j]);
            }
          }
          i += ph.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        const ch = s[i];
        if (typeof PINYIN !== "undefined" && PINYIN[ch]) {
          out += "<ruby>" + escapeHtml(ch) + "<rt>" + PINYIN[ch] + "</rt></ruby>";
        } else {
          out += escapeHtml(ch);
        }
        i++;
      }
    }
    return out;
  }

  /* 人物词卡 hover - 增强版:补 相关事件 / 同朝代相关人物 */
  const pcEl = document.getElementById("person-card");

  // 查找该人物出现在哪些朝代的 wars/events/relations
  function findPersonEvents(name, p) {
    const alias = Object.keys(PERSON_ALIAS).filter((a) => (PERSON_ALIAS[a] || a) === name);
    const keys = [name, ...alias];
    const out = [];
    DYNASTIES.forEach((d) => {
      const buckets = [
        { arr: d.relations || [], type: "关系" },
        { arr: d.events || [], type: "事件" },
        { arr: d.wars || [], type: "战争" },
      ];
      buckets.forEach((b) => {
        b.arr.forEach((it) => {
          if (keys.some((k) => String(it.t).indexOf(k) >= 0)) {
            out.push({ y: it.y, t: it.t, type: b.type, dyn: d.name });
          }
        });
      });
    });
    // 去重 + 按年份
    const seen = new Set();
    return out
      .filter((o) => {
        const k = o.y + "|" + o.t;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => {
        const pa = String(a.y)
          .replace("前", "-")
          .replace(/[^\-\d]/g, "");
        const pb = String(b.y)
          .replace("前", "-")
          .replace(/[^\-\d]/g, "");
        return (parseInt(pa) || 0) - (parseInt(pb) || 0);
      });
  }

  // 查找同朝代的其他人物(同角色优先)
  function findRelatedPeople(name, p) {
    const peers = Object.entries(PEOPLE)
      .filter(([n, info]) => n !== name && info.dyn === p.dyn)
      .map(([n, info]) => ({ n, info }));
    // 同 role 优先
    peers.sort((a, b) => {
      const sa = a.info.role === p.role ? 0 : 1;
      const sb = b.info.role === p.role ? 0 : 1;
      return sa - sb;
    });
    return peers.slice(0, 6);
  }

  document.addEventListener("mouseover", (e) => {
    // 在浮卡内部不触发隐藏(也不重新渲染)
    if (e.target.closest("#person-card")) return;
    const t = e.target.closest(".person");
    if (!t) return;
    const name = t.dataset.person;
    const p = PEOPLE[name];
    if (!p) return;
    const roleLabel = ROLE_LABEL[p.role] || p.role;
    const icon = ROLE_ICON[p.role] || "·";

    // 相关事件 (最多 4 条)
    const evts = findPersonEvents(name, p).slice(0, 4);
    let evtHtml = "";
    if (evts.length) {
      evtHtml =
        '<div class="pc-sec">相关事件 · ' +
        evts.length +
        "</div>" +
        evts
          .map((o) => {
            const yr = typeof o.y === "number" && o.y < 0 ? "前" + -o.y : o.y;
            return `<div class="pc-evt"><span class="y">${yr}</span><span style="color:#7ad0ff">[${o.type}]</span> ${escapeHtml(String(o.t).slice(0, 50))}${String(o.t).length > 50 ? "…" : ""}</div>`;
          })
          .join("");
    }

    // 同朝代相关人物
    const peers = findRelatedPeople(name, p);
    let relHtml = "";
    if (peers.length) {
      relHtml =
        '<div class="pc-sec">同代人物</div><div class="pc-rel">' +
        peers
          .map((x) => {
            const ic = ROLE_ICON[x.info.role] || "·";
            return `<span class="r" style="background:rgba(255,255,255,.04);color:#cbd2e2;border:1px solid rgba(255,255,255,.1);padding:1px 6px;border-radius:3px;font-size:10.5px">${ic} ${x.n}</span>`;
          })
          .join("") +
        "</div>";
    }

    pcEl.innerHTML = `<div class="pc-head">
      <span class="pc-name">${icon} ${withRuby(name)}</span>
      <span class="pc-role person ${p.role}" data-icon="${icon}">${roleLabel}</span>
    </div>
    <div class="pc-meta">生卒 <span style="color:#cbd2e2">${p.life}</span> <span class="pc-dyn">${p.dyn}</span></div>
    <div class="pc-desc" style="background:transparent;border:none;padding:0">${escapeHtml(p.desc)}</div>
    ${evtHtml}
    ${relHtml}`;
    pcEl.style.display = "block";
    const r = t.getBoundingClientRect();
    let left = r.left;
    let top = r.bottom + 6;
    // 避免溢出
    const cardW = 330,
      cardH = pcEl.offsetHeight || 200;
    if (left + cardW > innerWidth) left = innerWidth - cardW - 8;
    if (left < 8) left = 8;
    if (top + cardH > innerHeight) top = Math.max(8, r.top - cardH - 6);
    pcEl.style.left = left + "px";
    pcEl.style.top = top + "px";
  });
  document.addEventListener("mouseout", (e) => {
    const fromPerson = e.target.closest(".person");
    if (!fromPerson) return;
    // 如果 relatedTarget 仍在徽章或卡内,不隐藏
    const to = e.relatedTarget;
    if (to && to.closest && (to.closest(".person") || to.closest("#person-card"))) return;
    pcEl.style.display = "none";
  });
  // 离开浮卡本身时也隐藏
  pcEl.addEventListener("mouseleave", () => {
    pcEl.style.display = "none";
  });

  function bindUI() {
    document.getElementById("close-btn").onclick = () =>
      document.getElementById("panel").classList.remove("show");
    document.getElementById("mp-close").onclick = () =>
      document.getElementById("minority-panel").classList.remove("show");
    document.querySelectorAll("#panel .tab").forEach((t) => {
      t.onclick = () => {
        document.querySelectorAll("#panel .tab").forEach((x) => x.classList.remove("active"));
        t.classList.add("active");
        currentTab = t.dataset.tab;
        if (activeDynastyIdx >= 0) renderTimeline(DYNASTIES[activeDynastyIdx], currentTab);
      };
    });
    document.getElementById("btn-river").onclick = function () {
      showRiver = !showRiver;
      this.classList.toggle("active", showRiver);
      if (riverMesh) riverMesh.visible = showRiver;
    };
    document.getElementById("btn-wars").onclick = function () {
      showWars = !showWars;
      this.classList.toggle("active", showWars);
      applyFilter();
    };
    document.getElementById("btn-tribes").onclick = function () {
      showTribes = !showTribes;
      this.classList.toggle("active", showTribes);
      applyFilter();
    };
    let showAnnex = true;
    const btnAnnex = document.getElementById("btn-annex");
    if (btnAnnex) {
      btnAnnex.onclick = function () {
        showAnnex = !showAnnex;
        this.classList.toggle("active", showAnnex);
        annexArrows.forEach((a) => (a.mesh.visible = showAnnex));
        if (showAnnex) applyFilter();
      };
    }
    document.getElementById("btn-tour").onclick = function () {
      tourMode = !tourMode;
      this.classList.toggle("active", tourMode);
    };
    document.getElementById("btn-reset").onclick = () => {
      tourMode = false;
      document.getElementById("btn-tour").classList.remove("active");
      // 复位为俯视
      camera.up.set(-1, 0, 0);
      tweenCamera({ x: 0, y: 260, z: 0.01 }, { x: 0, y: 0, z: 0 });
    };

    /* ===== 朝代按钮组 + 时间滑块筛选 ===== */
    const dynBtnGroup = document.getElementById("dyn-buttons");
    resetDynastyFilterButtons(dynBtnGroup);
    let activeDynFilter = -1; // -1 = 全部 ; 单朝代的索引
    let activeGroupFilter = null; // 例如 'wudai_shiguo' 代表筛选整个组
    // 收集分组成员的索引集合,便于隐藏判断
    const GROUP_MEMBERS = {}; // {wudai_shiguo: Set([idx,...])}
    DYNASTIES.forEach((d, i) => {
      if (d.group) {
        (GROUP_MEMBERS[d.group] = GROUP_MEMBERS[d.group] || new Set()).add(i);
      }
    });

    // 清空所有 active 视觉态(单按钮 + 组按钮 + 子项 + 3D 高亮)
    function clearAllActiveBtn() {
      dynBtnGroup.querySelectorAll(".dyn-btn").forEach((x) => {
        x.classList.remove("active");
        if (x.dataset.themeColor) {
          x.style.background = "";
          x.style.color = x.dataset.themeColor;
        }
      });
      dynBtnGroup.querySelectorAll(".dyn-sub").forEach((x) => x.classList.remove("active"));
      if (typeof clearHighlight === "function") clearHighlight();
    }
    function paintBtnActive(b) {
      b.classList.add("active");
      if (b.dataset.themeColor) {
        b.style.background = b.dataset.themeColor;
        b.style.color = "#0b1020";
      }
    }

    const renderedGroups = new Set();
    DYNASTIES.forEach((d, i) => {
      // 分组成员:跳过单独按钮,统一渲染一次分组按钮
      if (d.group) {
        if (renderedGroups.has(d.group)) return;
        renderedGroups.add(d.group);
        // —— 分组按钮(五代十国 ▾) ——
        const wrap = document.createElement("span");
        wrap.className = "dyn-group-wrap";
        const gb = document.createElement("button");
        gb.className = "dyn-btn dyn-group-btn";
        const GROUP_LABELS = { wudai: "五代", shiguo: "十国", wudai_shiguo: "五代十国" };
        const groupName = GROUP_LABELS[d.group] || d.group;
        gb.textContent = groupName;
        gb.title = "点击展开：" + groupName + " 各政权";
        gb.dataset.group = d.group;
        const pop = document.createElement("div");
        pop.className = "dyn-popover";
        // 子项:"全部 五代十国"
        const subAll = document.createElement("button");
        subAll.className = "dyn-sub";
        subAll.textContent = "全部 （" + GROUP_MEMBERS[d.group].size + ")";
        subAll.onclick = (ev) => {
          ev.stopPropagation();
          const already = activeGroupFilter === d.group && activeDynFilter === -1;
          clearAllActiveBtn();
          if (already) {
            activeGroupFilter = null;
          } else {
            activeGroupFilter = d.group;
            activeDynFilter = -1;
            paintBtnActive(gb);
            subAll.classList.add("active");
          }
          pop.classList.remove("show");
          applyFilter();
        };
        pop.appendChild(subAll);
        // 子项:每个政权
        DYNASTIES.forEach((dd, ii) => {
          if (dd.group !== d.group) return;
          const sb = document.createElement("button");
          sb.className = "dyn-sub";
          sb.textContent = dd.name;
          sb.title = dd.yearLabel;
          if (dd.colorKey && TYPE_COLOR[dd.colorKey]) {
            const hex = "#" + TYPE_COLOR[dd.colorKey].toString(16).padStart(6, "0");
            sb.style.color = hex;
            sb.style.borderColor = hex + "80";
          }
          sb.onclick = (ev) => {
            ev.stopPropagation();
            const already = activeDynFilter === ii;
            clearAllActiveBtn();
            if (already) {
              activeDynFilter = -1;
              activeGroupFilter = null;
              document.getElementById("panel").classList.remove("show");
            } else {
              activeDynFilter = ii;
              activeGroupFilter = null;
              paintBtnActive(gb);
              sb.classList.add("active");
              if (dd._center) {
                // showDynasty 内部统一处理:面板内容刷新 + 居中放大 + 高亮
                showDynasty(ii);
              }
            }
            pop.classList.remove("show");
            applyFilter();
          };
          pop.appendChild(sb);
        });
        gb.onclick = (ev) => {
          ev.stopPropagation();
          // 关闭其它 popover
          dynBtnGroup.querySelectorAll(".dyn-popover.show").forEach((p) => {
            if (p !== pop) p.classList.remove("show");
          });
          pop.classList.toggle("show");
        };
        wrap.appendChild(gb);
        wrap.appendChild(pop);
        dynBtnGroup.appendChild(wrap);
        return;
      }
      // —— 普通单朝代按钮 ——
      const b = document.createElement("button");
      b.className = "dyn-btn";
      b.textContent = d.name;
      b.title = d.yearLabel;
      b.dataset.idx = i;
      if (d.colorKey && TYPE_COLOR[d.colorKey]) {
        const hex = "#" + TYPE_COLOR[d.colorKey].toString(16).padStart(6, "0");
        b.style.color = hex;
        b.style.borderColor = hex + "80";
        b.dataset.themeColor = hex;
      }
      b.onclick = () => {
        const already = activeDynFilter === i && !activeGroupFilter;
        clearAllActiveBtn();
        if (already) {
          activeDynFilter = -1;
          activeGroupFilter = null;
          document.getElementById("panel").classList.remove("show");
        } else {
          activeDynFilter = i;
          activeGroupFilter = null;
          paintBtnActive(b);
          if (d._center) {
            showDynasty(i);
          }
        }
        applyFilter();
      };
      dynBtnGroup.appendChild(b);
    });
    // 点击页面其它处关闭 popover
    document.addEventListener("click", (e) => {
      if (!dynBtnGroup.contains(e.target)) {
        dynBtnGroup
          .querySelectorAll(".dyn-popover.show")
          .forEach((p) => p.classList.remove("show"));
      }
    });
    const yrMin = document.getElementById("yr-min");
    const yrMax = document.getElementById("yr-max");
    const yrDisplay = document.getElementById("yr-display");
    function fmtYr(y) {
      return y < 0 ? "前" + -y : "" + y;
    }
    function refreshYrDisplay() {
      let a = parseInt(yrMin.value),
        b = parseInt(yrMax.value);
      if (a > b) {
        [a, b] = [b, a];
      }
      yrDisplay.textContent = `${fmtYr(a)} ~ ${fmtYr(b)}`;
    }
    function applyFilter() {
      let yMin = parseInt(yrMin.value),
        yMax = parseInt(yrMax.value);
      if (yMin > yMax) [yMin, yMax] = [yMax, yMin];
      const dynIdx = activeDynFilter;
      const grp = activeGroupFilter;
      const selDyn = dynIdx >= 0 ? DYNASTIES[dynIdx] : null;

      // 选中朝代集合(支持分组):被选中视为"相关朝代"
      const selectedIdxSet = new Set();
      const selectedNameSet = new Set();
      if (grp && GROUP_MEMBERS[grp]) {
        GROUP_MEMBERS[grp].forEach((ix) => {
          selectedIdxSet.add(ix);
          selectedNameSet.add(DYNASTIES[ix].name);
        });
      } else if (selDyn) {
        selectedIdxSet.add(dynIdx);
        selectedNameSet.add(selDyn.name);
      }
      const hasSel = selectedIdxSet.size > 0;

      // 该筛选范围相关的派系集合(用于决定少数民族/箭头是否显示)
      const facs = new Set();
      selectedIdxSet.forEach((ix) => {
        const d = DYNASTIES[ix];
        facs.add(d.name);
        (d.wars || []).forEach((w) => (w.factions || []).forEach((f) => facs.add(f)));
        (d.tribes || []).forEach((t) => facs.add(t));
      });

      // 主线汉族浮岛(+ 装饰组)
      islands.forEach((isl) => {
        const u = isl.userData;
        const inYear = !(u.y1 < yMin || u.y0 > yMax);
        const inDyn = !hasSel || selectedIdxSet.has(u.idx);
        const vis = inYear && inDyn;
        isl.visible = vis;
        if (u.deco) u.deco.visible = vis;
      });
      // 少数民族副线
      tribeFlags.forEach((b) => {
        const u = b.userData;
        if (u.kind !== "minority") return;
        const inYear = !(u.life[1] < yMin || u.life[0] > yMax);
        const inDyn = !hasSel || facs.has(u.name);
        b.visible = showTribes && inYear && inDyn;
      });
      tribeDecorations.forEach((b) => {
        const u = b.userData;
        const inYear = !(u.life[1] < yMin || u.life[0] > yMax);
        const inDyn = !hasSel || facs.has(u.name);
        b.visible = showTribes && inYear && inDyn;
      });
      // 战争连线
      warBeams.forEach((wb) => {
        const u = wb.mesh.userData || {};
        const yr = wb.year;
        const inYear = yr >= yMin && yr <= yMax;
        const inDyn = !hasSel || (u.dynasty && selectedNameSet.has(u.dynasty));
        wb.mesh.visible = showWars && inYear && inDyn;
      });
      // 吞并箭头
      annexArrows.forEach((ab) => {
        const u = ab.mesh.userData || {};
        const yr = ab.year;
        const inYear = yr >= yMin && yr <= yMax;
        let inDyn = true;
        if (hasSel) {
          inDyn = (u.by && facs.has(u.by)) || (u.target && facs.has(u.target));
        }
        ab.mesh.visible = showAnnex && inYear && inDyn;
      });
    }
    yrMin.oninput = yrMax.oninput = () => {
      refreshYrDisplay();
      applyFilter();
    };
    document.getElementById("btn-clear-filter").onclick = () => {
      activeDynFilter = -1;
      activeGroupFilter = null;
      clearAllActiveBtn();
      yrMin.value = -280;
      yrMax.value = 1912;
      refreshYrDisplay();
      applyFilter();
    };
    refreshYrDisplay();
  }

  function tweenCamera(toPos, toTarget, dur = 900) {
    const sP = camera.position.clone(),
      sT = controls.target.clone();
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      camera.position.lerpVectors(sP, new THREE.Vector3(toPos.x, toPos.y, toPos.z), e);
      controls.target.lerpVectors(sT, new THREE.Vector3(toTarget.x, toTarget.y, toTarget.z), e);
      controls.update();
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* 仅平移视角:保持当前相机相对 target 的偏移(角度/距离不变),把 target 平移到 toTarget。
   用于点击朝代按钮时只居中,不旋转。 */
  function panToTarget(toTarget, dur = 700) {
    const sT = controls.target.clone();
    const sP = camera.position.clone();
    const dest = new THREE.Vector3(toTarget.x, toTarget.y, toTarget.z);
    const delta = dest.clone().sub(sT);
    const destP = sP.clone().add(delta);
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      camera.position.lerpVectors(sP, destP, e);
      controls.target.lerpVectors(sT, dest, e);
      controls.update();
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* 居中 + 放大:方向不变,按目标尺寸把相机距离收到 zoomDist。 */
  function panAndZoomToTarget(toTarget, zoomDist = 70, dur = 750) {
    const sT = controls.target.clone();
    const sP = camera.position.clone();
    const dest = new THREE.Vector3(toTarget.x, toTarget.y, toTarget.z);
    // 保持方向:取当前 camera→target 的单位向量,反向乘 zoomDist 得到 destP
    const dir = sP.clone().sub(sT);
    if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0.0001); // 退化时给一个默认俯视
    dir.normalize();
    const destP = dest.clone().addScaledVector(dir, zoomDist);
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      camera.position.lerpVectors(sP, destP, e);
      controls.target.lerpVectors(sT, dest, e);
      controls.update();
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* 朝代浮岛高亮:目标朝代 emissive 调亮,其它复原。 */
  const HL_BASE_EI = 0.22; // 原始自发光强度
  const HL_PEAK_EI = 0.55; // 高亮自发光强度(温和,不刺眼)
  function highlightDynasty(idx) {
    islands.forEach((isl) => {
      if (!isl.material || !isl.material.emissive) return;
      const isSel = idx >= 0 && isl.userData.idx === idx;
      isl.material.emissiveIntensity = isSel ? HL_PEAK_EI : HL_BASE_EI;
      if (isl.userData.deco) {
        // 旗杆/环带轻微亮一点;标签 sprite 不变
        isl.userData.deco.children.forEach((ch) => {
          if (ch.material && ch.material.color && !ch.isSprite) {
            if (isSel) {
              ch.material.opacity = Math.min(1, (ch.material.opacity || 1) * 1.0);
            }
          }
        });
      }
    });
  }
  function clearHighlight() {
    highlightDynasty(-1);
  }

  function updateFlowMarkers(items, t) {
    items.forEach((item) => {
      if (!item.flow || !item.curve) return;
      const p = (item.offset + t * item.speed) % (1 - item.span);
      item.mesh.geometry.dispose();
      item.mesh.geometry = makeFlowSegmentGeometry(item.curve, p, item.span, item.radius);
      if (item.mesh.material) {
        item.mesh.material.opacity = 0.42 + 0.36 * Math.sin(p * Math.PI);
      }
    });
  }

  function animate() {
    if (window.__ancientChinaRuntimeDisposed) return;
    requestAnimationFrame(animate);
    const t = performance.now() * 0.001;
    if (starGroup) starGroup.rotation.y += 0.00015;
    // 副线条带轻微呼吸
    tribeFlags.forEach((g, i) => {
      if (!g.material || (!g.material.emissiveIntensity && g.material.emissiveIntensity !== 0))
        return;
      g.material.emissiveIntensity = 0.45 + 0.18 * Math.sin(t * 1.2 + i * 0.7);
    });
    // 战争流线脉冲
    warBeams.forEach((b) => {
      if (b.pulse && b.mesh.scale) {
        const s = 1 + 0.3 * Math.sin(t * 3 + b.year);
        b.mesh.scale.setScalar(s);
      }
    });
    updateFlowMarkers(warBeams, t);
    // 吞并流线脉冲
    annexArrows.forEach((b) => {
      if (b.pulse && b.mesh.scale) {
        const s = 1 + 0.25 * Math.sin(t * 2.5 + b.year * 0.01);
        b.mesh.scale.setScalar(s);
      }
    });
    updateFlowMarkers(annexArrows, t);
    // 河面荧光偏移(简单旋转)
    scene.children.forEach((c) => {
      if (c.userData && c.userData.kind === "river_dust") {
        c.rotation.y += 0.0005;
      }
    });
    // 巡游模式:镜头绕场景缓慢转
    if (tourMode) {
      tourAngle += 0.002;
      const r = 160;
      camera.position.x = Math.cos(tourAngle) * r;
      camera.position.z = Math.sin(tourAngle) * r;
      camera.position.y = 70 + Math.sin(tourAngle * 0.5) * 20;
      controls.target.set(0, 5, 0);
    }
    controls.update();
    renderer.render(scene, camera);
  }

  (() => {
    if (typeof THREE === "undefined" || !THREE.OrbitControls) {
      document.getElementById("loading").textContent = "Three.js 加载失败，请检查网络后刷新";
      return;
    }
    if (typeof DYNASTIES === "undefined") {
      document.getElementById("loading").textContent =
        "数据文件加载失败 (DYNASTIES 未定义），请确认 dynasty_data.js 与 HTML 在同一目录";
      return;
    }
    init();
  })();
  window.addEventListener("error", (e) => {
    const el = document.getElementById("loading");
    if (el && !el.classList.contains("hidden")) {
      el.style.flexDirection = "column";
      el.style.padding = "20px";
      el.style.textAlign = "left";
      el.innerHTML =
        '<div style="color:#ff6b6b;font-size:16px;margin-bottom:8px">JS 错误</div>' +
        '<div style="color:#aaa;font-size:12px;max-width:80vw;word-break:break-all">' +
        (e.message || "unknown") +
        " @ " +
        (e.filename || "") +
        ":" +
        (e.lineno || "") +
        "</div>";
    }
  });
}

export function startAncientChinaRuntime() {
  window.__ancientChinaRuntimeDisposed = false;
  const canvasHost = document.getElementById("cv");
  if (canvasHost) {
    canvasHost.replaceChildren();
  }

  ensureThreeRuntime();
  if (window.__ancientChinaRuntimeDisposed) return;

  executeAncientChinaRuntime({
    PEOPLE,
    PERSON_ALIAS,
    DYNASTIES,
    TRIBE_TYPE,
    TYPE_COLOR,
    MINORITIES,
    ANNEXATIONS,
    PINYIN,
    PINYIN_PHRASE,
  });
}

export function stopAncientChinaRuntime() {
  window.__ancientChinaRuntimeDisposed = true;
}
