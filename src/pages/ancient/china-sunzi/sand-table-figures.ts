import * as THREE from "three";

import { boardToWorld, facingAngle, sideFacingAngle, terrainHeight } from "./sand-table-terrain";
import type { Move, Place, Side, Unit } from "./types";

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

function standard(color: THREE.Color, roughness = 0.62, metalness = 0.08) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });
}

function add(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material | THREE.Color,
  position: readonly [number, number, number],
  rotation?: readonly [number, number, number],
) {
  const mesh = new THREE.Mesh(
    geometry,
    material instanceof THREE.Color ? standard(material) : material,
  );
  mesh.position.set(position[0], position[1], position[2]);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  group.add(mesh);
  return mesh;
}

/** 拟人化人形骨架：盔、面、颈、肩、躯干、双臂、双腿、靴，默认朝 +z。 */
function human(tone: THREE.Color, palette: SandPalette): THREE.Group {
  const figure = new THREE.Group();
  const armor = tone.clone().lerp(palette.ink, 0.18);
  const dark = tone.clone().lerp(palette.ink, 0.42);

  add(figure, new THREE.CylinderGeometry(0.045, 0.05, 0.34, 6), dark, [-0.1, 0.22, 0]);
  add(figure, new THREE.CylinderGeometry(0.045, 0.05, 0.34, 6), dark, [0.1, 0.22, 0]);
  add(figure, new THREE.BoxGeometry(0.12, 0.07, 0.18), palette.ink, [-0.1, 0.06, 0.03]);
  add(figure, new THREE.BoxGeometry(0.12, 0.07, 0.18), palette.ink, [0.1, 0.06, 0.03]);

  add(figure, new THREE.CylinderGeometry(0.16, 0.2, 0.42, 8), tone, [0, 0.58, 0]);
  add(figure, new THREE.CylinderGeometry(0.175, 0.175, 0.16, 8), armor, [0, 0.66, 0.01]);
  add(figure, new THREE.SphereGeometry(0.09, 8, 6), armor, [-0.19, 0.76, 0]);
  add(figure, new THREE.SphereGeometry(0.09, 8, 6), armor, [0.19, 0.76, 0]);
  add(
    figure,
    new THREE.CylinderGeometry(0.042, 0.042, 0.36, 6),
    tone,
    [-0.24, 0.58, 0.03],
    [0, 0, 0.22],
  );
  add(
    figure,
    new THREE.CylinderGeometry(0.042, 0.042, 0.36, 6),
    tone,
    [0.24, 0.58, 0.03],
    [0, 0, -0.22],
  );
  add(figure, new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8), palette.paper, [0, 0.83, 0]);
  add(figure, new THREE.SphereGeometry(0.13, 12, 10), palette.paper, [0, 0.95, 0]);
  add(
    figure,
    new THREE.SphereGeometry(0.152, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    armor,
    [0, 0.97, 0],
  );
  add(figure, new THREE.ConeGeometry(0.045, 0.19, 6), tone, [0, 1.15, 0]);
  // 面向 +z 的两点墨色眼纹，让小人在斜视镜头下也能读出朝向。
  add(figure, new THREE.SphereGeometry(0.018, 6, 5), palette.ink, [-0.05, 0.96, 0.116]);
  add(figure, new THREE.SphereGeometry(0.018, 6, 5), palette.ink, [0.05, 0.96, 0.116]);
  return figure;
}

function banner(tone: THREE.Color, palette: SandPalette): THREE.Group {
  const flag = new THREE.Group();
  add(flag, new THREE.CylinderGeometry(0.016, 0.016, 0.96, 5), palette.ink, [-0.3, 0.62, -0.08]);
  add(
    flag,
    new THREE.BoxGeometry(0.34, 0.24, 0.012),
    standard(tone, 0.8, 0.02),
    [-0.13, 0.94, -0.08],
  );
  add(flag, new THREE.ConeGeometry(0.03, 0.1, 4), palette.ochre, [-0.3, 1.14, -0.08]);
  return flag;
}

function mount(tone: THREE.Color, palette: SandPalette): THREE.Group {
  const horse = new THREE.Group();
  const coat = tone.clone().lerp(palette.ink, 0.32);
  const body = add(horse, new THREE.SphereGeometry(0.4, 10, 8), standard(coat, 0.78), [0, 0.44, 0]);
  body.scale.set(1.24, 0.66, 0.78);
  add(
    horse,
    new THREE.CylinderGeometry(0.1, 0.16, 0.44, 7),
    standard(coat, 0.78),
    [0, 0.62, 0.3],
    [-0.48, 0, 0],
  );
  add(horse, new THREE.BoxGeometry(0.2, 0.17, 0.3), standard(coat, 0.78), [0, 0.76, 0.5]);
  // 鬃毛、鞍鞯与缰绳：斜视镜头下也要读得出是一匹披甲战马。
  for (const offset of [0.02, 0.12, 0.22]) {
    add(
      horse,
      new THREE.ConeGeometry(0.055, 0.22, 5),
      standard(tone.clone().lerp(palette.ink, 0.5), 0.8),
      [0, 0.78 - offset, 0.24 + offset * 0.6],
      [-0.6, 0, 0],
    );
  }
  add(
    horse,
    new THREE.BoxGeometry(0.36, 0.06, 0.42),
    standard(palette.ink, 0.72),
    [0, 0.66, -0.04],
  );
  add(horse, new THREE.BoxGeometry(0.4, 0.04, 0.1), standard(tone, 0.72), [0, 0.6, -0.24]);
  add(
    horse,
    new THREE.CylinderGeometry(0.008, 0.008, 0.5, 4),
    standard(palette.ochre),
    [0.06, 0.68, 0.32],
    [-0.6, 0, 0.3],
  );
  add(horse, new THREE.SphereGeometry(0.025, 6, 5), palette.ink, [-0.08, 0.78, 0.62]);
  add(horse, new THREE.SphereGeometry(0.025, 6, 5), palette.ink, [0.08, 0.78, 0.62]);
  for (const x of [-0.22, 0.22]) {
    for (const z of [-0.21, 0.21]) {
      add(horse, new THREE.CylinderGeometry(0.045, 0.045, 0.4, 6), standard(coat, 0.8), [
        x,
        0.2,
        z,
      ]);
    }
  }
  add(
    horse,
    new THREE.ConeGeometry(0.075, 0.34, 6),
    standard(coat, 0.8),
    [0, 0.5, -0.42],
    [-0.5, 0, 0],
  );
  const rider = human(tone, palette);
  rider.scale.setScalar(0.58);
  rider.position.set(0, 0.58, -0.04);
  horse.add(rider);
  return horse;
}

function chariot(tone: THREE.Color, palette: SandPalette): THREE.Group {
  const car = new THREE.Group();
  add(car, new THREE.BoxGeometry(0.68, 0.32, 0.6), standard(tone, 0.7), [0, 0.38, 0]);
  add(
    car,
    new THREE.BoxGeometry(0.7, 0.18, 0.05),
    standard(tone.clone().lerp(palette.ink, 0.25)),
    [0, 0.58, 0.28],
  );
  for (const x of [-0.4, 0.4]) {
    add(
      car,
      new THREE.CylinderGeometry(0.29, 0.29, 0.06, 12),
      standard(palette.ink, 0.8),
      [x, 0.3, 0],
      [0, 0, Math.PI / 2],
    );
    add(
      car,
      new THREE.CylinderGeometry(0.035, 0.035, 0.5, 5),
      standard(palette.ochre),
      [x, 0.3, 0],
      [Math.PI / 2, 0, 0],
    );
  }
  add(
    car,
    new THREE.CylinderGeometry(0.03, 0.03, 0.86, 6),
    standard(palette.ochre),
    [0, 0.3, 0.55],
    [Math.PI / 2, 0, 0],
  );
  const driver = human(tone, palette);
  driver.scale.setScalar(0.62);
  driver.position.set(0, 0.38, -0.02);
  car.add(driver);
  return car;
}

function boat(tone: THREE.Color, palette: SandPalette): THREE.Group {
  const vessel = new THREE.Group();
  add(
    vessel,
    new THREE.BoxGeometry(0.56, 0.16, 0.94),
    standard(tone.clone().lerp(palette.ink, 0.3), 0.78),
    [0, 0.14, 0],
  );
  add(
    vessel,
    new THREE.ConeGeometry(0.28, 0.42, 4),
    standard(tone.clone().lerp(palette.ink, 0.3), 0.78),
    [0, 0.14, 0.64],
    [Math.PI / 2, 0, Math.PI / 4],
  );
  add(vessel, new THREE.BoxGeometry(0.5, 0.2, 0.1), standard(palette.ochre), [0, 0.22, -0.48]);
  add(
    vessel,
    new THREE.CylinderGeometry(0.024, 0.024, 0.88, 6),
    standard(palette.ink),
    [0, 0.56, 0],
  );
  const sail = add(
    vessel,
    new THREE.PlaneGeometry(0.5, 0.52),
    new THREE.MeshStandardMaterial({
      color: tone.clone().lerp(palette.paper, 0.5),
      roughness: 0.9,
      side: THREE.DoubleSide,
    }),
    [0, 0.68, 0.02],
  );
  sail.castShadow = true;
  const rower = human(tone, palette);
  rower.scale.setScalar(0.52);
  rower.position.set(0, 0.2, -0.2);
  vessel.add(rower);
  return vessel;
}

/** 单个战斗员与坐具，不含旗号，便于复制成队列。 */
function formationUnit(unit: Unit, tone: THREE.Color, palette: SandPalette): THREE.Group {
  const figure = new THREE.Group();
  if (unit.branch === "infantry" || unit.branch === "crossbow") {
    figure.add(human(tone, palette));
  } else if (unit.branch === "cavalry") {
    figure.add(mount(tone, palette));
  } else if (unit.branch === "chariot") {
    figure.add(chariot(tone, palette));
  } else {
    figure.add(boat(tone, palette));
  }

  if (unit.branch === "infantry") {
    add(
      figure,
      new THREE.CylinderGeometry(0.022, 0.022, 1.18, 6),
      standard(palette.ink, 0.8),
      [0.3, 0.72, 0.06],
      [0, 0, -0.18],
    );
    add(figure, new THREE.ConeGeometry(0.07, 0.22, 6), standard(tone), [0.41, 1.3, 0.06]);
    add(
      figure,
      new THREE.BoxGeometry(0.24, 0.05, 0.05),
      standard(tone),
      [0.32, 1.18, 0.06],
      [0, 0, 0.35],
    );
  }
  if (unit.branch === "crossbow") {
    add(
      figure,
      new THREE.BoxGeometry(0.34, 0.12, 0.12),
      standard(palette.ink, 0.7),
      [0.28, 0.62, 0.14],
    );
    add(
      figure,
      new THREE.CylinderGeometry(0.016, 0.016, 0.6, 6),
      standard(tone),
      [0.28, 0.62, 0.14],
      [0, 0, Math.PI / 2],
    );
    add(
      figure,
      new THREE.CylinderGeometry(0.01, 0.01, 0.46, 5),
      standard(palette.ochre),
      [0.28, 0.62, 0.34],
      [Math.PI / 2, 0, 0],
    );
  }
  return figure;
}

/** 一支部队 = 阵营地台 + 三人为伍的拟人队列 + 一面旗号。 */
export function buildSoldier(unit: Unit, palette: SandPalette, facing: number): THREE.Group {
  const group = new THREE.Group();
  const tone = sideColor(unit.side, palette);

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.045, 20),
    new THREE.MeshStandardMaterial({
      color: tone,
      transparent: true,
      opacity: 0.42,
      roughness: 0.9,
      depthWrite: false,
    }),
  );
  disc.position.y = 0.03;
  group.add(disc);
  const rim = add(
    group,
    new THREE.TorusGeometry(0.35, 0.018, 6, 20),
    standard(tone, 0.5, 0.2),
    [0, 0.045, 0],
    [Math.PI / 2, 0, 0],
  );
  rim.castShadow = false;

  const lead = formationUnit(unit, tone, palette);
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
  if (unit.branch !== "navy") group.add(banner(tone, palette));
  group.rotation.y = facing;
  return group;
}

/** 营垒：都邑有城楼与角楼，要道为小城，隘口是双塔关夆。 */
export function buildStronghold(place: Place, palette: SandPalette): THREE.Group {
  const group = new THREE.Group();
  const tone = sideColor(placeSide(place), palette);
  const stone = palette.paper.clone().lerp(palette.ink, 0.24);

  if (place.kind === "pass") {
    for (const x of [-0.3, 0.3]) {
      add(group, new THREE.BoxGeometry(0.18, 0.5, 0.18), standard(stone, 0.9), [x, 0.25, 0]);
    }
    add(group, new THREE.BoxGeometry(0.78, 0.11, 0.16), standard(tone, 0.7), [0, 0.53, 0]);
  } else {
    const big = place.kind === "capital";
    const size = big ? 0.82 : 0.62;
    add(group, new THREE.BoxGeometry(size, 0.14, size), standard(stone, 0.95), [0, 0.07, 0]);
    add(
      group,
      new THREE.BoxGeometry(size * 0.8, big ? 0.38 : 0.28, size * 0.8),
      standard(stone.clone().lerp(tone, 0.28), 0.88),
      [0, big ? 0.32 : 0.27, 0],
    );
    if (big) {
      for (const x of [-0.29, 0.29]) {
        for (const z of [-0.29, 0.29]) {
          add(group, new THREE.BoxGeometry(0.15, 0.22, 0.15), standard(tone, 0.72), [x, 0.62, z]);
        }
      }
      add(
        group,
        new THREE.BoxGeometry(0.3, 0.2, 0.3),
        standard(tone.clone().lerp(palette.ink, 0.2)),
        [0, 0.62, 0],
      );
    }
    group.add(banner(tone, palette));
  }
  return group;
}

/**
 * 军事标图式行动线：实线为主攻 / 追击，虚线为佯动；带倒刺与锥头，
 * 弧线中点上方挂行动性质牌，便于读图而不是靠猜颜色。
 */
export function buildMove(move: Move, palette: SandPalette): THREE.Group {
  const group = new THREE.Group();
  const tone = sideColor(move.side, palette);
  const from = boardToWorld(move.from);
  const to = boardToWorld(move.to);
  const start = new THREE.Vector3(from.x, terrainHeight(from.x, from.z) + 0.62, from.z);
  const end = new THREE.Vector3(to.x, terrainHeight(to.x, to.z) + 0.62, to.z);
  const middle = start.clone().lerp(end, 0.5);
  const delta = end.clone().sub(start);
  middle.x += -delta.z * 0.15;
  middle.z += delta.x * 0.15;
  const curve = new THREE.QuadraticBezierCurve3(start, middle, end);

  if (move.kind === "feint") {
    for (let index = 0; index < 7; index += 1) {
      const t0 = index / 9;
      const t1 = t0 + 0.07;
      const segment = new THREE.CatmullRomCurve3([
        curve.getPoint(t0),
        curve.getPoint((t0 + t1) / 2),
        curve.getPoint(t1),
      ]);
      add(
        group,
        new THREE.TubeGeometry(segment, 4, 0.045, 5, false),
        standard(tone, 0.6, 0.16),
        [0, 0, 0],
      );
    }
  } else {
    add(
      group,
      new THREE.TubeGeometry(curve, 28, 0.055, 6, false),
      standard(tone, 0.55, 0.18),
      [0, 0, 0],
    );
    if (move.kind === "pursuit") {
      const shadow = curve
        .getPoints(28)
        .map((point) => point.clone().add(new THREE.Vector3(0, -0.12, 0)));
      add(
        group,
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(shadow), 28, 0.026, 5, false),
        standard(tone.clone().lerp(palette.paper, 0.4)),
        [0, 0, 0],
      );
    }
  }

  const head = add(group, new THREE.ConeGeometry(0.19, 0.52, 8), standard(tone, 0.5, 0.2), [
    end.x,
    end.y,
    end.z,
  ]);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangent(1).normalize());
  const barbLeft = add(group, new THREE.ConeGeometry(0.075, 0.26, 5), standard(tone), [
    end.x,
    end.y,
    end.z,
  ]);
  barbLeft.quaternion.copy(head.quaternion);
  barbLeft.translateX(-0.16);
  const barbRight = add(group, new THREE.ConeGeometry(0.075, 0.26, 5), standard(tone), [
    end.x,
    end.y,
    end.z,
  ]);
  barbRight.quaternion.copy(head.quaternion);
  barbRight.translateX(0.16);
  return group;
}

const MOVE_LABEL: Record<Move["kind"], string> = {
  advance: "进攻",
  flank: "迂回",
  feint: "佯动",
  pursuit: "追击",
};

/** 纸底阵营色标签，屏幕外仍可读；文字牌统一置顶，不被地形挡住。 */
export function labelSprite(text: string, tone: THREE.Color, width = 2.3): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "rgba(244, 241, 234, 0.93)";
    context.beginPath();
    if (typeof context.roundRect === "function") context.roundRect(5, 9, 374, 78, 12);
    else context.rect(5, 9, 374, 78);
    context.fill();
    context.fillStyle = `#${tone.getHexString()}`;
    context.fillRect(5, 9, 11, 78);
    context.strokeStyle = "rgba(30, 30, 30, 0.28)";
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = "#20201d";
    context.font = '600 46px "Songti SC", "Noto Serif CJK SC", serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, 196, 49, 342);
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
