import type { PageResourceConfig } from "../../page-resources";

const chinaOfficialsResource = {
  homeEntries: [
    {
      path: "/china/officials",
      icon: "crown",
      status: "available",
      title: "品秩全景",
      description:
        "全屏立体官职体系：以品级为节点，文武分列标注具体官职，点职位在原层级展开详情与名臣名将。",
    },
  ],
} satisfies PageResourceConfig;

export default chinaOfficialsResource;
