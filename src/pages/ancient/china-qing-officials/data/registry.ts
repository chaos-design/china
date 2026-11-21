import { beiwei } from "./dynasties/beiwei";
import { liaojin } from "./dynasties/liao-jin";
import { ming } from "./dynasties/ming";
import { han, qin } from "./dynasties/qin-han";
import { qing } from "./dynasties/qing";
import { song, yuan } from "./dynasties/song-yuan";
import { suitang, weijin } from "./dynasties/weijin-suitang";
import { wudai } from "./dynasties/wudai";
import { zhou } from "./dynasties/zhou";
import type { AtlasDynastyId, DynastyAtlas } from "./types";

/**
 * 十二朝官制图谱：先按历史顺序排入与全站共用的八朝，再补入周、北魏、五代、辽金西夏。
 * 顺序即页头朝代按钮的排列顺序。
 */
export const DYNASTY_ATLASES: readonly DynastyAtlas[] = [
  zhou,
  qin,
  han,
  weijin,
  beiwei,
  suitang,
  song,
  wudai,
  yuan,
  liaojin,
  ming,
  qing,
];

export const DEFAULT_DYNASTY_ID: AtlasDynastyId = "qing";

const ATLAS_BY_ID = new Map<AtlasDynastyId, DynastyAtlas>(
  DYNASTY_ATLASES.map((atlas) => [atlas.id, atlas]),
);

/** 按 id 取朝代数据；未知 id 返回 undefined，由调用方降级到默认朝代。 */
export function getDynastyAtlas(id: string): DynastyAtlas | undefined {
  return ATLAS_BY_ID.get(id as AtlasDynastyId);
}

/** 取可安全使用的朝代数据，未知 id 回落到默认朝（清）。 */
export function resolveDynastyAtlas(id: string | null | undefined): DynastyAtlas {
  return (id ? getDynastyAtlas(id) : undefined) ?? ATLAS_BY_ID.get(DEFAULT_DYNASTY_ID)!;
}
