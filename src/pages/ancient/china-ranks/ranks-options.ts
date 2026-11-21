import type { RankTreeSpan, RankTreeSplit } from "./rank-tree-layout";
import type { RankTreeCameraPreset } from "./rank-tree-scene";

/** 左侧「对照 · 视图」面板的单选选项定义：id 与提示语集中管理，面板只负责渲染。 */
export const SPAN_OPTIONS: readonly { id: RankTreeSpan; hint: string; label: string }[] = [
  { id: "band", hint: "按品序对齐，两朝同一高度即同一品", label: "品序对齐" },
  { id: "even", hint: "每级等距，看这一朝自己的层级结构", label: "层级等距" },
];

export const SPLIT_OPTIONS: readonly { id: RankTreeSplit; hint: string; label: string }[] = [
  { id: "branch", hint: "皇权分出文武两大枝，文官居左、武官居右", label: "文武分列" },
  { id: "merged", hint: "文武同环，按数据顺序排布", label: "合列" },
];

export const PRESET_OPTIONS: readonly { id: RankTreeCameraPreset; label: string }[] = [
  { id: "three-quarter", label: "斜侧" },
  { id: "front", label: "正视" },
];
