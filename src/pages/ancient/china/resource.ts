import type { PageResourceConfig } from "../../page-resources";

const ancientChinaResource = {
  showInHome: true,
  homeEntries: [
    {
      path: "/china/timeline",
      dimensions: ["历史"],
      icon: "landmark",
      status: "available",
      title: "历代编年长河",
      description: "以 3D 浮岛和时间轴呈现中国朝代、更替节点与少数民族线索。",
      screenshot: "timeline.jpg",
      note: "截图按编年纵轴排列朝代浮岛与并行的民族、战争线索；滚轮缩放、点击节点可查看该朝代详情。",
    },
  ],
  aboutItems: [
    {
      title: "朝代全景",
      text: "以时间长河呈现中国古代主要朝代、历史节点与少数民族线索，适合先建立整体脉络。",
    },
  ],
  readingGuides: [
    {
      icon: "landmark",
      title: "先定朝代坐标",
      text: "推荐先进入时间长河，按朝代、更替节点与民族线索建立纵向时间感。",
    },
  ],
} satisfies PageResourceConfig;

export default ancientChinaResource;
