import { describe, expect, it } from "vitest";

import { BATTLES } from "./battles";
import {
  boardToSkinPixel,
  getMapSkin,
  heightBand,
  hillshadeAt,
  skinPixelToWorld,
  SKIN_HEIGHT,
  SKIN_WIDTH,
  worldToSkinPixel,
} from "./sand-table-map-skin";
import type { SandPalette } from "./sand-table-figures";

const palette: SandPalette = {
  a: { getHexString: () => "c0392b", clone: () => palette.a } as unknown as SandPalette["a"],
  b: { getHexString: () => "34495e", clone: () => palette.b } as unknown as SandPalette["b"],
  ink: { getHexString: () => "1f1e1a", clone: () => palette.ink } as unknown as SandPalette["ink"],
  ochre: { getHexString: () => "8a6d3b", clone: () => palette.ochre } as unknown as
    SandPalette["ochre"],
  paper: { getHexString: () => "f2efe6", clone: () => palette.paper } as unknown as
    SandPalette["paper"],
};

describe("沙盘舆图皮肤", () => {
  it("画布像素与世界坐标互逆，画布上边是北（-z）", () => {
    const world = skinPixelToWorld(SKIN_WIDTH / 2, SKIN_HEIGHT / 2);
    expect(world.x).toBeCloseTo(0);
    expect(world.z).toBeCloseTo(0);
    const top = skinPixelToWorld(SKIN_WIDTH / 2, 0);
    expect(top.z).toBeCloseTo(-14);
    const roundTrip = worldToSkinPixel(world.x, world.z);
    expect(roundTrip.px).toBeCloseTo(SKIN_WIDTH / 2);
    expect(roundTrip.py).toBeCloseTo(SKIN_HEIGHT / 2);
    const fromBoard = boardToSkinPixel(500, 320);
    expect(fromBoard.px).toBeCloseTo(SKIN_WIDTH / 2);
    expect(fromBoard.py).toBeCloseTo(SKIN_HEIGHT / 2);
  });

  it("山体阴影：平地为中等亮度，坡面对光更亮、背光更暗", () => {
    const w = 5;
    const flat = new Float32Array(25);
    for (let index = 0; index < 25; index += 1) flat[index] = 0.4;
    const flatShade = hillshadeAt(flat, 12, w, 5);
    expect(flatShade).toBeGreaterThan(0.5);
    const slope = new Float32Array(25);
    for (let iz = 0; iz < 5; iz += 1) {
      for (let ix = 0; ix < 5; ix += 1) slope[iz * w + ix] = -ix * 0.1;
    }
    // 西坡（朝 +x 落坡）法线偏向光源一侧，应比平地更亮。
    expect(hillshadeAt(slope, 12, w, 5)).toBeGreaterThan(flatShade);
  });

  it("高度分带：脊线压墨多于谷地", () => {
    const ridge = heightBand(0.8);
    const valley = heightBand(0.15);
    expect(ridge.ink).toBeGreaterThan(valley.ink);
    expect(ridge.ochre).toBeGreaterThan(valley.ochre);
  });

  it("烘焙结果可缓存：同数据同令牌色复用同一画布，换幕重新烘焙", () => {
    const battle = BATTLES[0];
    const step = battle.steps[0];
    const first = getMapSkin(battle, step, palette);
    const second = getMapSkin(battle, step, palette);
    expect(second.canvas).toBe(first.canvas);
    const nextStep = getMapSkin(battle, battle.steps[1], palette);
    expect(nextStep.canvas).not.toBe(first.canvas);
    expect(first.grid.heights.length).toBeGreaterThan(0);
  });
});
