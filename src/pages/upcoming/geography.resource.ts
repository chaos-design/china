import type { PageResourceConfig } from "../page-resources";

const geographyResource = {
  homeEntries: [
    {
      icon: "map",
      path: "/china/atlas/territory",
      status: "available",
      title: "疆域变迁",
      description: "六幅疆域快照锚在真实省界上：都城与控制节点随时间轴切换，面积估算写明分歧。",
    },
    {
      icon: "users",
      path: "/china/atlas/migration",
      status: "available",
      title: "民族迁徙",
      description: "八条迁徙路线在真实底图上流动：从漠北到江南，看人群如何改写疆域。",
    },
    {
      icon: "shield",
      path: "/china/atlas/frontier",
      status: "available",
      title: "边疆治理",
      description: "八项边疆制度的治所地图：从西域都护府到宣政院，看边界怎么管。",
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
