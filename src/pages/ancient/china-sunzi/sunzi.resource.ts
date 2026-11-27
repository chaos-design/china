import type { PageResourceConfig } from "../../page-resources";

const sunziResource = {
  homeEntries: [
    {
      path: "/china/sunzi-bingfa",
      dimensions: ["军事", "历史"],
      icon: "swords",
      status: "available",
      title: "孙子兵法沙盘",
      description:
        "柏举、桂陵、马陵三役各拆四幕：在倾斜沙盘上逐幕看兵力移动、控区翻转与关键决策，旁栏用兵法原文与白话讲清每一步背后的判断。",
      screenshot: "sunzi-bingfa.jpg",
      note: "截图为柏举之战的沙盘视角；切换四幕看朱色与青色控制区如何对调，右侧「读这一幕」同步给出决策与兵法出处。",
    },
  ],
} satisfies PageResourceConfig;

export default sunziResource;
