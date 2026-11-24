import { beiwei } from "./dynasties/beiwei";
import { jin } from "./dynasties/jin";
import { liao } from "./dynasties/liao";
import { ming } from "./dynasties/ming";
import { han, qin } from "./dynasties/qin-han";
import { qing } from "./dynasties/qing";
import { song, yuan } from "./dynasties/song-yuan";
import { sui } from "./dynasties/sui";
import { tang } from "./dynasties/tang";
import { weijin } from "./dynasties/weijin";
import { wudai } from "./dynasties/wudai";
import { xixia } from "./dynasties/xixia";
import { zhou } from "./dynasties/zhou";
import type { AtlasDynastyId, DynastyAtlas } from "./types";

/**
 * 十五朝官制图谱，按历史顺序排列，即页头朝代按钮的排列顺序。
 * 原本合并的「隋唐」「辽金西夏」已拆为隋/唐与辽/金/西夏各自独立的数据。
 */
export const DYNASTY_ATLASES: readonly DynastyAtlas[] = [
  zhou,
  qin,
  han,
  weijin,
  beiwei,
  sui,
  tang,
  wudai,
  song,
  liao,
  jin,
  xixia,
  yuan,
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
