import type { PageResourceConfig } from "../page-resources";

const geographyResource = {
  homeEntries: [
    {
      icon: "map",
      path: "/china/atlas",
      status: "available",
      title: "历史地理图谱",
      description:
        "疆域变迁、民族迁徙与边疆治理三谱同图：真实省界底图上按朝代切换断面，看边界、人群与治所的变化。",
    },
  ],
  aboutItems: [
    {
      title: "民族与边疆",
      text: "疆域变迁、民族迁徙与边疆治理三张图谱已开放：都城与治所锚在真实省界上，按朝代逐项填充，面积与数字一律写明估算口径。",
    },
  ],
  readingGuides: [
    {
      icon: "map",
      title: "追问疆域变化",
      text: "遇到迁都、征伐与和亲节点时，可在疆域变迁图谱沿时间轴切换断面，再看边疆治理里对应的制度。",
    },
  ],
} satisfies PageResourceConfig;

export default geographyResource;
