import type { PageResourceConfig } from "../../page-resources";

const chinaQingOfficialsResource = {
  homeEntries: [
    {
      path: "/china/officials/structure",
      dimensions: ["历史"],
      icon: "crown",
      status: "available",
      title: "历代职官图谱",
      description:
        "秦汉至明清八朝官制对照：每朝的官署层级、品秩阶梯与章服礼制，清代部分按《清朝官职制度》《九品十八级》两图重绘。",
      screenshot: "officials.jpg",
      note: "截图为清代官职制度的三维从属树；点带属官的分区可展开，右侧详情给出品级实档与衙署名录。",
    },
  ],
} satisfies PageResourceConfig;

export default chinaQingOfficialsResource;
