import * as THREE from "three";

import { boardToWorld, facingAngle, sideFacingAngle, terrainHeight } from "./sand-table-terrain";
import type { Move, Place, Side, Unit, UnitBranch } from "./types";

export interface SandPalette {
  ink: THREE.Color;
  paper: THREE.Color;
  a: THREE.Color;
  b: THREE.Color;
  ochre: THREE.Color;
}

export function sideColor(side: Side, palette: SandPalette): THREE.Color {
  return side === "a" ? palette.a : palette.b;
}

/** 营垒按棋盘左右归属阵营：西路为本营，东路为敌营，与主攻方向一致。 */
export function placeSide(place: Place): Side {
  return place.x < 500 ? "a" : "b";
}

/* ------------------------------------------------------------------ */
/* 几何与材质缓存：换幕重建高频发生，同参数的原件全场景共享一份。       */
/* 共享原件打 shared 标记，场景销毁时跳过 dispose，避免复用已被释放的资源。 */
/* ------------------------------------------------------------------ */

const geometryCache = new Map<string, THREE.BufferGeometry>();

function sharedGeometry(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let geometry = geometryCache.get(key);
  if (!geometry) {
    geometry = make();
    geometry.userData.shared = true;
    geometryCache.set(key, geometry);
  }
  return geometry;
}

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

/** 缓存式标准材质：按颜色/粗糙度/金属度复用，场景 dispose 时跳过 shared 件。 */
export function standard(color: THREE.Color, roughness = 0.62, metalness = 0.08) {
  const key = `${color.getHexString()}-${roughness}-${metalness}`;
  let material = materialCache.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color: color.clone(),
      roughness,
      metalness,
      flatShading: true,
    });
    material.userData.shared = true;
    materialCache.set(key, material);
  }
  return material;
}

function add(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material | THREE.Color,
  position: readonly [number, number, number],
  rotation?: readonly [number, number, number],
  scale?: readonly [number, number, number],
) {
  const mesh = new THREE.Mesh(
    geometry,
    material instanceof THREE.Color ? standard(material) : material,
  );
  mesh.position.set(position[0], position[1], position[2]);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  group.add(mesh);
  return mesh;
}

const box = (w: number, h: number, d: number) =>
  sharedGeometry(`box${w}-${h}-${d}`, () => new THREE.BoxGeometry(w, h, d));
const cyl = (rt: number, rb: number, h: number, seg = 8) =>
  sharedGeometry(`cyl${rt}-${rb}-${h}-${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
const ball = (r: number, w = 10, h = 8, thetaLength?: number) =>
  sharedGeometry(
    `sph${r}-${w}-${h}-${thetaLength ?? Math.PI}`,
    () => new THREE.SphereGeometry(r, w, h, 0, Math.PI * 2, 0, thetaLength ?? Math.PI),
  );
const cone = (r: number, h: number, seg = 6) =>
  sharedGeometry(`cone${r}-${h}-${seg}`, () => new THREE.ConeGeometry(r, h, seg));
const torus = (r: number, t: number, arc = Math.PI * 2) =>
  sharedGeometry(`tor${r}-${t}-${arc}`, () => new THREE.TorusGeometry(r, t, 6, 18, arc));

/** 由部队 id 派生的确定性微扰：同一次布阵每次重建完全一致。 */
export function unitJitter(id: string): number {
  let seed = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    seed = (seed ^ id.charCodeAt(index)) >>> 0;
    seed = (seed * 16777619) >>> 0;
  }
  return ((seed >>> 8) % 1000) / 1000;
}

/**
 * 拟人化士兵：盔、面、颈、肩甲、胸甲两层、束腰、战裙、双臂两段、双腿、靴。
 * 默认朝 +z，全 身高约 1.15 世界单位；持械由兵种单独挂载。
 */
function human(tone: THREE.Color, palette: SandPalette): THREE.Group {
  const figure = new THREE.Group();
  const armor = tone.clone().lerp(palette.ink, 0.3);
  const dark = tone.clone().lerp(palette.ink, 0.52);
  const skin = palette.paper.clone().lerp(palette.ochre, 0.28);

  // 双腿微外八 + 靴
  add(figure, cyl(0.03, 0.042, 0.24), dark, [-0.075, 0.17, 0], [0.03, 0, 0.06]);
  add(figure, cyl(0.03, 0.042, 0.24), dark, [0.075, 0.17, 0], [0.03, 0, -0.06]);
  add(figure, box(0.09, 0.06, 0.17), palette.ink, [-0.08, 0.045, 0.02]);
  add(figure, box(0.09, 0.06, 0.17), palette.ink, [0.08, 0.045, 0.02]);
  // 战裙与束腰
  add(figure, cyl(0.13, 0.175, 0.2), tone.clone().lerp(palette.ink, 0.4), [0, 0.31, 0]);
  add(figure, cyl(0.14, 0.14, 0.055), armor, [0, 0.42, 0]);
  // 躯干与两层甲片
  add(figure, cyl(0.115, 0.15, 0.3), tone, [0, 0.58, 0]);
  add(figure, cyl(0.15, 0.155, 0.09), armor, [0, 0.64, 0]);
  add(figure, cyl(0.155, 0.16, 0.07), armor, [0, 0.72, 0]);
  for (const y of [0.62, 0.72]) {
    add(figure, box(0.05, 0.02, 0.02), palette.ochre, [0, y, 0.155]);
  }
  // 护肩
  add(figure, ball(0.07, 8, 6, Math.PI / 2), armor, [-0.17, 0.72, 0]);
  add(figure, ball(0.07, 8, 6, Math.PI / 2), armor, [0.17, 0.72, 0]);
  // 双臂：上臂外张、小臂下垂持械
  add(figure, cyl(0.03, 0.033, 0.17), tone, [-0.21, 0.63, 0.01], [0, 0, 0.5]);
  add(figure, cyl(0.026, 0.03, 0.16), tone, [-0.285, 0.5, 0.03], [0.12, 0, 0.14]);
  add(figure, cyl(0.03, 0.033, 0.17), tone, [0.21, 0.63, 0.01], [0, 0, -0.5]);
  add(figure, cyl(0.026, 0.03, 0.16), tone, [0.285, 0.5, 0.03], [0.12, 0, -0.14]);
  add(figure, ball(0.034, 6, 5), skin, [-0.29, 0.41, 0.06]);
  add(figure, ball(0.034, 6, 5), skin, [0.29, 0.41, 0.06]);
  // 颈、头、面纹
  add(figure, cyl(0.04, 0.048, 0.07), skin, [0, 0.775, 0]);
  add(figure, ball(0.082, 10, 8), skin, [0, 0.87, 0]);
  add(figure, ball(0.016, 5, 4), palette.ink, [-0.032, 0.89, 0.072]);
  add(figure, ball(0.016, 5, 4), palette.ink, [0.032, 0.89, 0.072]);
  // 盔：半圆盔体 + 盔檐 + 盔缨
  add(figure, ball(0.092, 10, 6, Math.PI / 2), armor, [0, 0.885, 0]);
  add(figure, torus(0.088, 0.014), dark, [0, 0.855, 0], [Math.PI / 2, 0, 0]);
  add(figure, cone(0.024, 0.14, 5), tone, [0, 1.02, -0.01]);
  add(figure, ball(0.026, 6, 5), palette.ochre, [0, 0.945, -0.01]);
  return figure;
}

/** 旗号：我军三角令旗 + 矛头旗杆顶，敌军燕尾方旗 + 铜环，剪影即可辨敌我。 */
function banner(tone: THREE.Color, palette: SandPalette, side: Side): THREE.Group {
  const flag = new THREE.Group();
  add(flag, cyl(0.015, 0.018, 1.0, 5), palette.ink, [-0.3, 0.62, -0.08]);
  if (side === "a") {
    add(flag, cone(0.055, 0.16, 4), standard(palette.ochre, 0.5, 0.4), [-0.3, 1.2, -0.08]);
    add(flag, box(0.3, 0.2, 0.012), standard(tone, 0.8, 0.02), [-0.17, 0.92, -0.08]);
    add(
      flag,
      cone(0.1, 0.26, 3),
      standard(tone, 0.8, 0.02),
      [-0.02, 0.92, -0.08],
      [0, 0, -Math.PI / 2],
    );
    add(
      flag,
      box(0.02, 0.22, 0.008),
      standard(tone.clone().lerp(palette.paper, 0.4), 0.9),
      [-0.16, 0.78, -0.075],
    );
  } else {
    add(flag, torus(0.045, 0.014), standard(palette.ochre, 0.5, 0.4), [-0.3, 1.18, -0.08]);
    add(flag, box(0.34, 0.2, 0.012), standard(tone, 0.8, 0.02), [-0.15, 0.93, -0.08]);
    add(flag, box(0.08, 0.2, 0.013), standard(palette.paper, 0.85, 0.02), [-0.04, 0.93, -0.08]);
    add(
      flag,
      box(0.34, 0.03, 0.01),
      standard(tone.clone().lerp(palette.ink, 0.35), 0.9),
      [-0.15, 0.83, -0.08],
    );
  }
  return flag;
}

/** 战马：胸腹臀三段躯干、弯颈昂头、双耳双目、鬃毛、鞍鞯、束腹、四足带蹄、缰绳与尾。 */
function mount(tone: THREE.Color, palette: SandPalette, jitter: number): THREE.Group {
  const horse = new THREE.Group();
  const coat = tone.clone().lerp(palette.ink, 0.34);
  const coatAlt = coat.clone().offsetHSL(0, 0, (jitter - 0.5) * 0.05);
  const mane = tone.clone().lerp(palette.ink, 0.55);

  add(
    horse,
    ball(0.26, 10, 8),
    standard(coatAlt, 0.78),
    [0.02, 0.46, 0.1],
    undefined,
    [1.15, 0.82, 1.0],
  );
  add(
    horse,
    ball(0.24, 10, 8),
    standard(coatAlt, 0.78),
    [-0.02, 0.45, -0.2],
    undefined,
    [1.05, 0.86, 1.05],
  );
  add(
    horse,
    cyl(0.19, 0.21, 0.34, 8),
    standard(coatAlt, 0.78),
    [0, 0.44, -0.03],
    [Math.PI / 2, 0, 0],
  );
  // 昂起的颈与头
  add(horse, cyl(0.09, 0.13, 0.34, 7), standard(coatAlt, 0.78), [0, 0.72, 0.24], [-0.52, 0, 0]);
  add(horse, box(0.14, 0.13, 0.2), standard(coatAlt, 0.78), [0, 0.88, 0.4], [-0.15, 0, 0]);
  add(
    horse,
    box(0.1, 0.08, 0.12),
    standard(coat.clone().lerp(palette.ink, 0.2), 0.8),
    [0, 0.82, 0.53],
    [-0.15, 0, 0],
  );
  add(horse, cone(0.035, 0.09, 4), standard(coatAlt, 0.8), [-0.055, 0.97, 0.36], [-0.2, 0, 0.15]);
  add(horse, cone(0.035, 0.09, 4), standard(coatAlt, 0.8), [0.055, 0.97, 0.36], [-0.2, 0, -0.15]);
  add(horse, ball(0.02, 5, 4), palette.ink, [-0.055, 0.9, 0.49]);
  add(horse, ball(0.02, 5, 4), palette.ink, [0.055, 0.9, 0.49]);
  // 鬃毛与尾
  for (let index = 0; index < 4; index += 1) {
    add(
      horse,
      cone(0.045, 0.17, 4),
      standard(mane, 0.82),
      [0, 0.9 - index * 0.035, 0.28 - index * 0.075],
      [-0.85, 0, 0],
    );
  }
  add(horse, cone(0.05, 0.28, 5), standard(mane, 0.82), [0, 0.5, -0.36], [0.85, 0, 0]);
  add(horse, cone(0.03, 0.16, 4), standard(mane, 0.82), [0, 0.3, -0.42], [0.5, 0, 0]);
  // 鞍鞯、鞍桥与束腹
  add(horse, box(0.3, 0.045, 0.34), standard(palette.ink, 0.7), [0, 0.63, -0.05]);
  add(horse, box(0.34, 0.06, 0.4), standard(tone, 0.72), [0, 0.67, -0.05]);
  add(
    horse,
    box(0.36, 0.05, 0.03),
    standard(tone.clone().lerp(palette.ochre, 0.4), 0.8),
    [0, 0.56, 0.08],
  );
  add(
    horse,
    cyl(0.21, 0.21, 0.05, 10),
    standard(palette.ochre, 0.7, 0.2),
    [0, 0.44, -0.03],
    [Math.PI / 2, 0, 0],
  );
  // 四足带蹄
  for (const x of [-0.13, 0.13]) {
    for (const z of [-0.17, 0.2]) {
      add(horse, cyl(0.035, 0.048, 0.3, 6), standard(coat, 0.8), [x, 0.18, z]);
      add(horse, cyl(0.05, 0.05, 0.05, 6), standard(palette.ink, 0.85), [x, 0.03, z]);
    }
  }
  // 缰绳、辔头
  add(
    horse,
    cyl(0.008, 0.008, 0.4, 4),
    standard(palette.ochre, 0.6),
    [-0.06, 0.72, 0.42],
    [-0.9, 0, 0.2],
  );
  add(
    horse,
    cyl(0.008, 0.008, 0.4, 4),
    standard(palette.ochre, 0.6),
    [0.06, 0.72, 0.42],
    [-0.9, 0, -0.2],
  );
  add(
    horse,
    torus(0.06, 0.01),
    standard(palette.ochre, 0.55, 0.3),
    [0, 0.8, 0.44],
    [Math.PI / 2, 0, 0],
  );

  const rider = human(tone, palette);
  rider.scale.setScalar(0.56);
  rider.position.set(0, 0.6, -0.06);
  rider.rotation.x = -0.08;
  horse.add(rider);
  add(
    horse,
    cyl(0.014, 0.014, 0.62, 5),
    standard(palette.ink, 0.7),
    [0.22, 0.85, 0.18],
    [-0.3, 0, 0],
  );
  add(horse, cone(0.05, 0.14, 5), standard(tone, 0.5, 0.3), [0.22, 1.15, 0.09], [-0.3, 0, 0]);
  return horse;
}

/** 战车：双轮带辐条、车厢围栏、曲辀、双兵执戈。 */
function chariot(tone: THREE.Color, palette: SandPalette, jitter: number): THREE.Group {
  const car = new THREE.Group();
  const wood = palette.ochre.clone().lerp(palette.ink, 0.22 + jitter * 0.08);
  const woodDark = palette.ochre.clone().lerp(palette.ink, 0.45);

  add(car, box(0.62, 0.1, 0.5), standard(wood, 0.72), [0, 0.36, 0]);
  // 车厢围栏：立柱 + 顶横
  for (const x of [-0.29, 0, 0.29]) {
    add(car, box(0.03, 0.2, 0.03), standard(woodDark, 0.75), [x, 0.5, 0.23]);
    add(car, box(0.03, 0.2, 0.03), standard(woodDark, 0.75), [x, 0.5, -0.23]);
  }
  for (const z of [-0.29, 0.23]) {
    add(car, box(0.64, 0.035, 0.03), standard(woodDark, 0.75), [0, 0.59, z]);
    add(car, box(0.03, 0.035, 0.5), standard(woodDark, 0.75), [-0.31, 0.59, z]);
    add(car, box(0.03, 0.035, 0.5), standard(woodDark, 0.75), [0.31, 0.59, z]);
  }
  // 双轮：辋 + 六辐 + 毂（轮面在 yz 平面，轴向沿 x）
  for (const x of [-0.36, 0.36]) {
    add(car, torus(0.26, 0.03), standard(palette.ink, 0.8), [x, 0.26, 0], [0, Math.PI / 2, 0]);
    for (let index = 0; index < 3; index += 1) {
      add(
        car,
        box(0.02, 0.5, 0.02),
        standard(woodDark, 0.8),
        [x, 0.26, 0],
        [(index * Math.PI) / 3, 0, 0],
      );
    }
    add(
      car,
      cyl(0.05, 0.05, 0.08, 8),
      standard(palette.ochre, 0.6, 0.25),
      [x, 0.26, 0],
      [0, 0, Math.PI / 2],
    );
  }
  // 曲辀（单辕）与衡
  add(
    car,
    cyl(0.028, 0.032, 0.62, 6),
    standard(woodDark, 0.8),
    [0, 0.28, 0.48],
    [Math.PI / 2 - 0.12, 0, 0],
  );
  add(car, cyl(0.02, 0.02, 0.5, 5), standard(woodDark, 0.8), [0, 0.4, 0.72], [0, 0, Math.PI / 2]);
  // 两名甲士：御者居中，戎右执戈
  const driver = human(tone, palette);
  driver.scale.setScalar(0.56);
  driver.position.set(-0.12, 0.4, -0.02);
  car.add(driver);
  const halberdier = human(tone, palette);
  halberdier.scale.setScalar(0.56);
  halberdier.position.set(0.14, 0.4, -0.05);
  car.add(halberdier);
  add(
    car,
    cyl(0.013, 0.013, 0.78, 5),
    standard(palette.ink, 0.7),
    [0.28, 0.75, -0.05],
    [0, 0, -0.12],
  );
  add(car, cone(0.05, 0.13, 5), standard(tone, 0.5, 0.3), [0.335, 1.14, -0.05], [0, 0, -0.12]);
  return car;
}

/** 战船：船体带舷缘与船尾楼、桅杆挂硬帆、双桨、艏尖。 */
function boat(tone: THREE.Color, palette: SandPalette, jitter: number): THREE.Group {
  const vessel = new THREE.Group();
  const hull = tone.clone().lerp(palette.ink, 0.32 + jitter * 0.06);

  add(vessel, box(0.5, 0.14, 0.8), standard(hull, 0.78), [0, 0.14, 0]);
  add(vessel, box(0.44, 0.12, 0.3), standard(hull, 0.78), [0, 0.16, -0.32], undefined, [1, 1, 1.2]);
  add(
    vessel,
    cone(0.24, 0.34, 4),
    standard(hull, 0.78),
    [0, 0.15, 0.52],
    [Math.PI / 2, 0, Math.PI / 4],
  );
  add(vessel, box(0.52, 0.03, 0.84), standard(palette.ochre, 0.7), [0, 0.22, 0]);
  add(vessel, box(0.5, 0.05, 0.03), standard(palette.ochre, 0.7), [0, 0.25, 0.4]);
  add(vessel, box(0.5, 0.05, 0.03), standard(palette.ochre, 0.7), [0, 0.25, -0.4]);
  // 船尾楼
  add(
    vessel,
    box(0.34, 0.14, 0.18),
    standard(tone.clone().lerp(palette.ink, 0.15), 0.75),
    [0, 0.3, -0.3],
  );
  add(vessel, box(0.38, 0.03, 0.22), standard(palette.ochre, 0.7), [0, 0.39, -0.3]);
  // 桅杆 + 硬帆（斜杠四道）+ 帆桁
  add(vessel, cyl(0.02, 0.026, 0.85, 6), standard(palette.ink, 0.72), [0, 0.62, 0.02]);
  const sail = add(
    vessel,
    sharedGeometry("boat-sail", () => new THREE.PlaneGeometry(0.44, 0.5)),
    new THREE.MeshStandardMaterial({
      color: tone.clone().lerp(palette.paper, 0.45),
      roughness: 0.9,
      side: THREE.DoubleSide,
    }),
    [0, 0.72, 0.06],
    [0, 0, 0],
  );
  sail.castShadow = true;
  for (let index = 0; index < 3; index += 1) {
    add(vessel, box(0.44, 0.015, 0.01), standard(palette.ochre, 0.85), [
      0,
      0.58 + index * 0.14,
      0.07,
    ]);
  }
  add(
    vessel,
    cyl(0.012, 0.012, 0.5, 5),
    standard(palette.ink, 0.72),
    [0, 0.95, 0.06],
    [0, 0, Math.PI / 2],
  );
  // 双桨与桨手
  add(
    vessel,
    cyl(0.012, 0.012, 0.42, 5),
    standard(palette.ink, 0.75),
    [-0.26, 0.12, -0.02],
    [0.4, 0.3, 0.9],
  );
  add(
    vessel,
    cyl(0.012, 0.012, 0.42, 5),
    standard(palette.ink, 0.75),
    [0.26, 0.12, -0.02],
    [0.4, -0.3, 0.9],
  );
  const rower = human(tone, palette);
  rower.scale.setScalar(0.5);
  rower.position.set(0, 0.26, -0.06);
  vessel.add(rower);
  return vessel;
}

/** 单个战斗员与坐具，不含旗号，便于复制成队列。 */
function formationUnit(
  unit: Unit,
  tone: THREE.Color,
  palette: SandPalette,
  jitter: number,
): THREE.Group {
  const figure = new THREE.Group();
  if (unit.branch === "infantry" || unit.branch === "crossbow") {
    figure.add(human(tone, palette));
  } else if (unit.branch === "cavalry") {
    figure.add(mount(tone, palette, jitter));
  } else if (unit.branch === "chariot") {
    figure.add(chariot(tone, palette, jitter));
  } else {
    figure.add(boat(tone, palette, jitter));
  }

  if (unit.branch === "infantry") {
    // 戈：长柲 + 内刃 + 援锋
    add(
      figure,
      cyl(0.014, 0.016, 1.05, 5),
      standard(palette.ink, 0.72),
      [0.32, 0.62, 0.08],
      [0, 0, -0.1],
    );
    add(figure, box(0.03, 0.1, 0.2), standard(tone, 0.45, 0.35), [0.35, 1.06, 0.08], [0.25, 0, 0]);
    add(figure, cone(0.045, 0.16, 5), standard(tone, 0.45, 0.35), [0.35, 1.16, 0.08]);
    add(figure, cyl(0.02, 0.02, 0.12, 5), standard(palette.ochre, 0.5, 0.3), [0.32, 1.02, 0.08]);
  }
  if (unit.branch === "crossbow") {
    // 弩：臂 + 弓弓 + 弦 + 箭
    add(figure, box(0.3, 0.05, 0.07), standard(palette.ink, 0.66), [0.3, 0.6, 0.16], [0, -0.35, 0]);
    add(
      figure,
      torus(0.17, 0.016, Math.PI),
      standard(tone, 0.45, 0.3),
      [0.3, 0.6, 0.16],
      [0, 0, Math.PI / 2],
    );
    add(
      figure,
      cyl(0.008, 0.008, 0.34, 4),
      standard(palette.paper, 0.85),
      [0.3, 0.6, 0.0],
      [0, 0, Math.PI / 2],
    );
    add(
      figure,
      cyl(0.009, 0.009, 0.3, 4),
      standard(palette.ochre, 0.7),
      [0.3, 0.6, 0.14],
      [Math.PI / 2, 0, 0],
    );
  }
  return figure;
}

/** 一支部队 = 阵营地台 + 三人为伍的拟人队列 + 本阵营旗号。 */
export function buildSoldier(unit: Unit, palette: SandPalette, facing: number): THREE.Group {
  const group = new THREE.Group();
  const tone = sideColor(unit.side, palette);
  const jitter = unitJitter(unit.id);

  const disc = new THREE.Mesh(
    sharedGeometry("unit-disc", () => new THREE.CylinderGeometry(0.34, 0.36, 0.05, 22)),
    new THREE.MeshStandardMaterial({
      color: tone.clone(),
      transparent: true,
      opacity: 0.4,
      roughness: 0.9,
      depthWrite: false,
    }),
  );
  disc.position.y = 0.03;
  group.add(disc);
  const rim = add(
    group,
    torus(0.35, 0.02),
    standard(tone, 0.5, 0.25),
    [0, 0.05, 0],
    [Math.PI / 2, 0, 0],
  );
  rim.castShadow = false;

  const lead = formationUnit(unit, tone, palette, jitter);
  group.add(lead);
  const mate = lead.clone(true);
  mate.scale.setScalar(0.78);
  mate.position.set(-0.32, 0, -0.26);
  group.add(mate);
  if (unit.branch !== "chariot" && unit.branch !== "navy") {
    const trailing = lead.clone(true);
    trailing.scale.setScalar(0.72);
    trailing.position.set(0.34, 0, -0.32);
    group.add(trailing);
  }
  if (unit.branch !== "navy") group.add(banner(tone, palette, unit.side));
  group.rotation.y = facing;
  return group;
}

/** 城楼屋顶：四棱攒尖 + 正脊，墨色压顶。 */
function roof(group: THREE.Group, width: number, y: number, palette: SandPalette) {
  add(
    group,
    cone(width * 0.78, width * 0.44, 4),
    standard(palette.ink, 0.55),
    [0, y + width * 0.22, 0],
    [0, Math.PI / 4, 0],
  );
  add(group, box(width * 0.36, 0.03, 0.05), standard(palette.ochre, 0.6, 0.2), [
    0,
    y + width * 0.43,
    0,
  ]);
}

/** 营垒：都邑两层城楼带角楼，城邑单层门楼，隘口双塔关墙，均带城门墨门洞。 */
export function buildStronghold(place: Place, palette: SandPalette): THREE.Group {
  const group = new THREE.Group();
  const tone = sideColor(placeSide(place), palette);
  const stone = palette.paper.clone().lerp(palette.ink, 0.22);
  const stoneDark = palette.paper.clone().lerp(palette.ink, 0.4);
  const gate = palette.ink.clone().lerp(palette.ochre, 0.18);

  if (place.kind === "pass") {
    for (const x of [-0.32, 0.32]) {
      add(group, box(0.24, 0.56, 0.2), standard(stone, 0.9), [x, 0.28, 0]);
      roof(group, 0.3, 0.56, palette);
      add(group, box(0.07, 0.05, 0.03), standard(tone, 0.6), [x, 0.62, 0.1]);
    }
    add(group, box(0.5, 0.16, 0.14), standard(stoneDark, 0.92), [0, 0.1, 0]);
    add(group, box(0.16, 0.12, 0.05), standard(gate, 0.85), [0, 0.09, 0.06]);
    add(group, box(0.78, 0.05, 0.14), standard(stoneDark, 0.9), [0, 0.2, 0]);
    add(group, box(0.1, 0.1, 0.03), standard(tone, 0.6), [-0.18, 0.27, 0.05]);
    add(group, box(0.1, 0.1, 0.03), standard(tone, 0.6), [0.18, 0.27, 0.05]);
    return group;
  }

  const big = place.kind === "capital";
  const size = big ? 0.86 : 0.64;
  const wallHeight = big ? 0.2 : 0.15;
  add(group, box(size, wallHeight, size), standard(stone, 0.94), [0, wallHeight / 2, 0]);
  add(group, box(size + 0.06, 0.045, size + 0.06), standard(stoneDark, 0.92), [
    0,
    wallHeight + 0.02,
    0,
  ]);
  // 城门墨门洞
  add(group, box(0.16, wallHeight * 0.72, 0.05), standard(gate, 0.85), [
    0,
    wallHeight * 0.36,
    size / 2 - 0.01,
  ]);
  // 角楼与垛口
  const corner = size / 2 - 0.08;
  for (const x of [-corner, corner]) {
    for (const z of [-corner, corner]) {
      add(group, box(0.13, wallHeight + 0.14, 0.13), standard(stoneDark, 0.9), [
        x,
        (wallHeight + 0.14) / 2,
        z,
      ]);
    }
  }
  const merlons = big ? 5 : 3;
  for (let index = 0; index < merlons; index += 1) {
    const offset = (index - (merlons - 1) / 2) * (size / (merlons + 1));
    add(group, box(0.06, 0.07, 0.03), standard(stoneDark, 0.9), [
      offset,
      wallHeight + 0.06,
      size / 2,
    ]);
    add(group, box(0.03, 0.07, 0.06), standard(stoneDark, 0.9), [
      size / 2,
      wallHeight + 0.06,
      offset,
    ]);
  }
  // 中央城楼（都邑双层）
  const towerSize = big ? 0.4 : 0.32;
  const towerHeight = big ? 0.34 : 0.26;
  add(
    group,
    box(towerSize, towerHeight, towerSize),
    standard(stone.clone().lerp(tone, 0.2), 0.88),
    [0, wallHeight + towerHeight / 2 + 0.03, 0],
  );
  add(group, box(towerSize * 0.4, towerHeight * 0.5, 0.04), standard(gate, 0.85), [
    0,
    wallHeight + towerHeight * 0.28,
    towerSize / 2,
  ]);
  roof(group, towerSize * 1.15, wallHeight + towerHeight + 0.03, palette);
  if (big) {
    const upperSize = towerSize * 0.72;
    add(
      group,
      box(upperSize, towerHeight * 0.62, upperSize),
      standard(stone.clone().lerp(tone, 0.28), 0.88),
      [0, wallHeight + towerHeight + 0.24, 0],
    );
    roof(group, upperSize * 1.2, wallHeight + towerHeight + 0.47, palette);
  }
  group.add(banner(tone, palette, placeSide(place)));
  return group;
}

/**
 * 参谋标图作业式行动箭：贴地平铺的渐宽锥形箭体（尾部宽、沿机动轴收窄），
 * 前端带倒刺扫后翼的箭头——现代军事标图的攻击箭画法。
 * 主攻近乎直出，迂回大幅弯钩，佯动虚线分段，追击双线并列；
 * 弧线中点上方挂行动性质牌，便于读图而不是靠猜颜色。
 */
const ARROW_LIFT = 0.12;

interface ArrowSpec {
  /** 尾部宽度（起始端最宽，代表出发队形正面）。 */
  widthTail: number;
  /** 箭身收窄后的宽度。 */
  widthBody: number;
  /** 箭头长度（世界单位）。 */
  headLength: number;
  /** 箭头半宽系数（相对箭身宽）。 */
  headSpread: number;
}

const ARROW_SPECS: Record<Move["kind"], ArrowSpec> = {
  advance: { headLength: 0.62, headSpread: 2.2, widthBody: 0.17, widthTail: 0.5 },
  flank: { headLength: 0.62, headSpread: 2.2, widthBody: 0.17, widthTail: 0.5 },
  feint: { headLength: 0.5, headSpread: 2.0, widthBody: 0.13, widthTail: 0.24 },
  pursuit: { headLength: 0.58, headSpread: 2.1, widthBody: 0.14, widthTail: 0.3 },
};

/** 各机动的轴线弯度：迂回要看出钩形。 */
const CURVE_BEND: Record<Move["kind"], number> = {
  advance: 0.08,
  feint: 0.22,
  flank: 0.34,
  pursuit: 0.12,
};

function arrowPointAt(curve: THREE.QuadraticBezierCurve3, t: number, lift: number): THREE.Vector3 {
  const point = curve.getPoint(t);
  point.y = terrainHeight(point.x, point.z) + lift;
  return point;
}

/**
 * 一段贴地箭体：tStart→tEnd 之间按宽度插值展开成三角带，
 * 带箭头（主三角 + 两片扫后翼）。非索引三角形几何，flatShading 出硬朗翼面。
 */
function arrowSegmentGeometry(
  arrowCurve: THREE.QuadraticBezierCurve3,
  tStart: number,
  tEnd: number,
  spec: ArrowSpec,
): THREE.BufferGeometry {
  const steps = 22;
  const positions: number[] = [];
  const pushTriangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  const rows: Array<{ left: THREE.Vector3; right: THREE.Vector3 }> = [];
  // tStart≈tEnd 的纯箭头段没有箭体，只留头部三角。
  const bodySteps = tEnd - tStart < 0.01 ? 0 : steps;
  for (let index = 0; index <= bodySteps; index += 1) {
    const t = tStart + ((tEnd - tStart) * index) / steps;
    const point = arrowPointAt(arrowCurve, t, ARROW_LIFT);
    const tangent = arrowCurve.getTangent(t).setY(0).normalize();
    const perp = new THREE.Vector3(-tangent.z, 0, tangent.x);
    // 尾宽 → 身宽的插值，缓入让尾部呈喇叭口（出发正面）。
    const k = (index / steps) ** 1.6;
    const width = THREE.MathUtils.lerp(spec.widthTail, spec.widthBody, k);
    rows.push({
      left: point.clone().addScaledVector(perp, width / 2),
      right: point.clone().addScaledVector(perp, -width / 2),
    });
  }
  for (let index = 0; index < bodySteps; index += 1) {
    const { left, right } = rows[index];
    const next = rows[index + 1];
    pushTriangle(left, next.left, right);
    pushTriangle(right, next.left, next.right);
  }
  // 箭头：主三角 + 两翼倒刺
  const end = arrowPointAt(arrowCurve, tEnd, ARROW_LIFT);
  const tangent = arrowCurve.getTangent(tEnd).setY(0).normalize();
  const perp = new THREE.Vector3(-tangent.z, 0, tangent.x);
  const tip = end.clone().addScaledVector(tangent, spec.headLength);
  const baseL = end.clone().addScaledVector(perp, (spec.widthBody * spec.headSpread) / 2);
  const baseR = end.clone().addScaledVector(perp, (-spec.widthBody * spec.headSpread) / 2);
  const wingL = end
    .clone()
    .addScaledVector(perp, spec.widthBody * spec.headSpread * 1.12)
    .addScaledVector(tangent, -spec.headLength * 0.4);
  const wingR = end
    .clone()
    .addScaledVector(perp, -spec.widthBody * spec.headSpread * 1.12)
    .addScaledVector(tangent, -spec.headLength * 0.4);
  pushTriangle(baseL, tip, baseR);
  pushTriangle(baseL, wingL, tip);
  pushTriangle(baseR, tip, wingR);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function buildMove(move: Move, palette: SandPalette): THREE.Group {
  const group = new THREE.Group();
  const tone = sideColor(move.side, palette);
  const spec = ARROW_SPECS[move.kind];
  const from = boardToWorld(move.from);
  const to = boardToWorld(move.to);
  const start = new THREE.Vector3(from.x, 0, from.z);
  const end = new THREE.Vector3(to.x, 0, to.z);
  const middle = start.clone().lerp(end, 0.5);
  const delta = end.clone().sub(start);
  const bend = CURVE_BEND[move.kind];
  middle.x += -delta.z * bend;
  middle.z += delta.x * bend;
  const curve = new THREE.QuadraticBezierCurve3(start, middle, end);
  const material = standard(tone, 0.55, 0.16);

  const appendArrow = (arrowCurve: THREE.QuadraticBezierCurve3, tStart: number, tEnd: number) => {
    const geometry = arrowSegmentGeometry(arrowCurve, tStart, tEnd, spec);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    group.add(mesh);
  };

  if (move.kind === "feint") {
    // 佯动：六段虚段，末段带小箭头，参谋图的虚线攻击箭。
    const dashes = 6;
    for (let index = 0; index < dashes; index += 1) {
      const t0 = 0.02 + (index * 0.78) / dashes;
      const t1 = t0 + 0.075;
      appendArrow(curve, t0, Math.min(t1, 0.86));
    }
    appendArrow(curve, 0.88, 0.88);
  } else if (move.kind === "pursuit") {
    // 追击：双线并列，共用主箭头。
    const offsetCurve = (offset: number) => {
      const shift = new THREE.Vector3(-delta.z, 0, delta.x).normalize().multiplyScalar(offset);
      return new THREE.QuadraticBezierCurve3(
        start.clone().add(shift),
        middle.clone().add(shift),
        end.clone().add(shift),
      );
    };
    appendArrow(offsetCurve(0.1), 0.02, 0.9);
    appendArrow(offsetCurve(-0.1), 0.02, 0.9);
    appendArrow(offsetCurve(0), 0.9, 0.9);
  } else {
    appendArrow(curve, 0.02, 0.92);
  }
  return group;
}

const MOVE_LABEL: Record<Move["kind"], string> = {
  advance: "进攻",
  flank: "迂回",
  feint: "佯动",
  pursuit: "追击",
};

type PlaqueGlyph = "place" | "unit" | "move";

/** 参谋标图的兵种符号：方框内按军种加注（步卒双斜线、弩手圆点、骑兵单斜线等）。 */
function drawBranchMark(
  context: CanvasRenderingContext2D,
  branch: UnitBranch,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  context.save();
  context.strokeStyle = "rgba(30, 30, 30, 0.78)";
  context.lineWidth = 3;
  context.strokeRect(x, y, w, h);
  context.beginPath();
  switch (branch) {
    case "infantry":
      // 步卒：框内交叉线（参谋图步兵符号）。
      context.moveTo(x, y);
      context.lineTo(x + w, y + h);
      context.moveTo(x + w, y);
      context.lineTo(x, y + h);
      break;
    case "crossbow":
      // 弩手：框内圆点（远射兵种）。
      context.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.18, 0, Math.PI * 2);
      break;
    case "cavalry":
      // 骑兵：单斜线。
      context.moveTo(x, y + h);
      context.lineTo(x + w, y);
      break;
    case "chariot":
      // 车兵：两条竖辙。
      context.moveTo(x + w * 0.35, y);
      context.lineTo(x + w * 0.35, y + h);
      context.moveTo(x + w * 0.65, y);
      context.lineTo(x + w * 0.65, y + h);
      break;
    case "navy":
      // 水师：船底弧。
      context.moveTo(x, y + h * 0.42);
      context.quadraticCurveTo(x + w / 2, y + h * 1.25, x + w, y + h * 0.42);
      break;
  }
  context.stroke();
  context.restore();
}

/** 纸底参谋名牌：直角军标框 + 阵营色条 + 兵种符号 / 城郭 / 行动箭图元。 */
export function labelSprite(
  text: string,
  tone: THREE.Color,
  width = 2.3,
  glyph: PlaqueGlyph = "place",
  branch?: UnitBranch,
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 448;
  canvas.height = 112;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "rgba(244, 241, 234, 0.94)";
    context.beginPath();
    if (typeof context.roundRect === "function") context.roundRect(4, 8, 440, 96, 10);
    else context.rect(4, 8, 440, 96);
    context.fill();
    // 双线框：军事要图惯用的内外双框。
    context.strokeStyle = "rgba(30, 30, 30, 0.55)";
    context.lineWidth = 4;
    if (typeof context.roundRect === "function") context.roundRect(4, 8, 440, 96, 10);
    else context.rect(4, 8, 440, 96);
    context.stroke();
    context.strokeStyle = "rgba(30, 30, 30, 0.22)";
    context.lineWidth = 2;
    if (typeof context.roundRect === "function") context.roundRect(12, 16, 424, 80, 6);
    else context.rect(12, 16, 424, 80);
    context.stroke();
    // 阵营色条
    context.fillStyle = `#${tone.getHexString()}`;
    context.fillRect(8, 14, 10, 84);
    // 前置图元：参谋标图口径——地名城郭、部队兵种框、行动箭头。
    context.fillStyle = "rgba(30, 30, 30, 0.78)";
    if (glyph === "place") {
      context.fillRect(34, 40, 28, 30);
      context.fillRect(40, 34, 16, 8);
      context.fillRect(46, 46, 6, 20);
    } else if (glyph === "unit" && branch) {
      drawBranchMark(context, branch, 32, 38, 32, 34);
    } else {
      context.beginPath();
      context.moveTo(30, 55);
      context.lineTo(64, 40);
      context.lineTo(58, 55);
      context.lineTo(64, 70);
      context.closePath();
      context.fill();
    }
    context.fillStyle = "#20201d";
    context.font = '600 52px "Songti SC", "Noto Serif CJK SC", serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, 258, 58, 326);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  sprite.scale.set(width, width / 4, 1);
  sprite.renderOrder = 20;
  return sprite;
}

export function unitFacing(unit: Unit, moves: readonly Move[]): number {
  const related = moves.find((move) => move.side === unit.side);
  if (related) return facingAngle([unit.x, unit.y], related.to);
  return sideFacingAngle(unit.side);
}

export function moveLabel(move: Move): string {
  return MOVE_LABEL[move.kind];
}
