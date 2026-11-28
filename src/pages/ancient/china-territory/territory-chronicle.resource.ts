import type { PageResourceConfig } from "../../page-resources";

/**
 * 历代疆域编年沙盘的首页入口声明。
 * 截图为真实页面实拍（public/home-screenshots/territory-chronicle.jpg）。
 */
const territoryChronicleResource = {
  homeEntries: [
    {
      path: "/china/territory-chronicle",
      dimensions: ["历史", "军事"],
      icon: "swords",
      status: "available",
      title: "历代疆域编年",
      description:
        "夏至清二十期的疆域编年沙盘：卫星影像底图上逐朝绘制疆域范围、历史都城、郡州府区划、长城边防与代表战争，可自动播放逐期推演。",
      screenshot: "territory-chronicle.jpg",
      note: "截图为战国七雄一帧：分裂期按政权分色绘制疆域，战争点击后地图聚焦战场并绘出行军箭头；统一王朝期（如秦汉唐清）另见页内切换，全部边界为示意口径。",
    },
  ],
} satisfies PageResourceConfig;

export default territoryChronicleResource;
