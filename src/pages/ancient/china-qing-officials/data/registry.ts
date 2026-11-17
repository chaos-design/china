import type { OfficialsDynastyId } from "../../china-officials/officials-data";
import { ming } from "./dynasties/ming";
import { han, qin } from "./dynasties/qin-han";
import { qing } from "./dynasties/qing";
import { song, yuan } from "./dynasties/song-yuan";
import { suitang, weijin } from "./dynasties/weijin-suitang";
import type { DynastyAtlas } from "./types";

/** 八朝官制图谱，顺序与全站朝代口径一致。 */
export const DYNASTY_ATLASES: readonly DynastyAtlas[] = [
  qin,
  han,
  weijin,
  suitang,
  song,
  yuan,
  ming,
  qing,
];

export const DEFAULT_DYNASTY_ID: OfficialsDynastyId = "qing";

const ATLAS_BY_ID = new Map<OfficialsDynastyId, DynastyAtlas>(
  DYNASTY_ATLASES.map((atlas) => [atlas.id, atlas]),
);

/** 按 id 取朝代数据；未知 id 返回 undefined，由调用方降级到默认朝代。 */
export function getDynastyAtlas(id: string): DynastyAtlas | undefined {
  return ATLAS_BY_ID.get(id as OfficialsDynastyId);
}

/** 取可安全使用的朝代数据，未知 id 回落到默认朝（清）。 */
export function resolveDynastyAtlas(id: string | null | undefined): DynastyAtlas {
  return (id ? getDynastyAtlas(id) : undefined) ?? ATLAS_BY_ID.get(DEFAULT_DYNASTY_ID)!;
}
