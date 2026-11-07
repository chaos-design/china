import { AtlasExplorer } from "./atlas-explorer";

/**
 * /china/atlas/frontier 的兼容入口。
 * 三张图谱已整合为同一个功能页：这里只预设初始图层，页内可随时切到「全部图谱」。
 */
export function FrontierAtlasPage() {
  return <AtlasExplorer initialLayer="frontier" />;
}
