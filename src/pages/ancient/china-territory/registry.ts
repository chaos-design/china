import { EXTRA_PERIOD_FIGURES } from "./chronicle-figures-extra";
import { MORE_PERIOD_FIGURES } from "./chronicle-figures-more";
import { PERIOD_ANNALS, PERIOD_FIGURES } from "./chronicle-people";
import { MING_QING_PERIODS } from "./era-ming-qing";
import { PRE_QIN_PERIODS } from "./era-pre-qin";
import { QIN_HAN_PERIODS } from "./era-qin-han";
import { SONG_YUAN_PERIODS } from "./era-song-yuan";
import { SUI_TANG_PERIODS } from "./era-sui-tang";
import { WEI_JIN_PERIODS } from "./era-wei-jin";
import type { ChronicleEra, ChronicleFigure, ChroniclePeriod } from "./types";
import { WAR_STATS } from "./war-stats";

/**
 * 历代疆域编年总注册表：20 期按编年排序（startYear 升序）。
 * 各时代文件按上述顺序拼接，测试锁定编年有序性，因此这里的顺序就是时间轴顺序。
 * 编年速报与人物志按期的 id 从 chronicle-people 并入，数据文件本身保持
 * 「一期一文件」的几何/政区职责，不重复粘贴叙事文本。
 */
const BASE_PERIODS: readonly ChroniclePeriod[] = [
  ...PRE_QIN_PERIODS,
  ...QIN_HAN_PERIODS,
  ...WEI_JIN_PERIODS,
  ...SUI_TANG_PERIODS,
  ...SONG_YUAN_PERIODS,
  ...MING_QING_PERIODS,
];

export const CHRONICLE_PERIODS: readonly ChroniclePeriod[] = BASE_PERIODS.map((period) => ({
  ...period,
  annals: period.annals ?? PERIOD_ANNALS[period.id] ?? [],
  // 主档案 + 朝堂 / 王室 / 意难平 + 将领文官第二批；同期内同名以先出现者为准。
  figures: (() => {
    const result: ChronicleFigure[] = [];
    const names = new Set<string>();
    for (const source of [
      PERIOD_FIGURES[period.id] ?? [],
      EXTRA_PERIOD_FIGURES[period.id] ?? [],
      MORE_PERIOD_FIGURES[period.id] ?? [],
    ]) {
      for (const figure of source) {
        if (names.has(figure.name)) continue;
        names.add(figure.name);
        result.push(figure);
      }
    }
    return result;
  })(),
  wars: period.wars.map((war) => ({
    ...war,
    scale: war.scale ?? WAR_STATS[war.id]?.scale,
    losses: war.losses ?? WAR_STATS[war.id]?.losses,
  })),
}));

/** 按时代分组（左侧编年目录的分组结构，组内保持编年顺序）。 */
export const CHRONICLE_ERAS: readonly ChronicleEra[] = [
  "pre-qin",
  "qin-han",
  "wei-jin",
  "sui-tang",
  "song-yuan",
  "ming-qing",
];

export function periodsOfEra(era: ChronicleEra): ChroniclePeriod[] {
  return CHRONICLE_PERIODS.filter((period) => period.era === era);
}

export function getChroniclePeriod(id: string): ChroniclePeriod {
  const period = CHRONICLE_PERIODS.find((entry) => entry.id === id);
  if (!period) {
    throw new Error(`未知编年时期: ${id}`);
  }
  return period;
}
