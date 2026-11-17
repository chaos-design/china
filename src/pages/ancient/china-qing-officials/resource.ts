import type { PageResourceConfig } from "../../page-resources";

const chinaQingOfficialsResource = {
  homeEntries: [
    {
      path: "/china/qing-officials",
      icon: "crown",
      status: "available",
      title: "清代官制图谱",
      description:
        "两张图谱重绘清代官制：从皇帝到府州县的官职层级，以及九品十八级对应的顶戴、朝服、俸禄与文武补子。",
    },
  ],
} satisfies PageResourceConfig;

export default chinaQingOfficialsResource;
