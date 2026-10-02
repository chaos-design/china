import type { PageResourceConfig } from "../page-resources";

const geographyResource = {
  homeEntries: [
    {
      icon: "map",
      status: "preview",
      title: "疆域与民族图谱",
      description: "预留疆域变迁、民族迁徙与边疆治理的图谱入口，后续可按朝代展开。",
    },
  ],
  aboutItems: [
    {
      title: "民族与边疆",
      text: "后续将补充民族关系、边疆治理与文化交流内容，让朝代叙事不只停留在中原王朝。",
    },
  ],
  readingGuides: [
    {
      icon: "map",
      title: "追问疆域变化",
      text: "遇到迁都、征伐与和亲节点时，可把边疆治理作为后续专题线索继续追踪。",
    },
  ],
} satisfies PageResourceConfig;

export default geographyResource;
