import type { PageResourceConfig } from "../../page-resources";

const officialsHubResource = {
  homeEntries: [
    {
      path: "/china/officials",
      dimensions: ["历史"],
      icon: "landmark",
      status: "available",
      title: "职官制度",
      description: "职官制度的三个读法：编年沿革、立体职官图谱与八朝品级对照，从同一总目进入。",
      screenshot: "officials.jpg",
      note: "总目把三个近似名称的入口收敛到一处；先读沿革建立时序，再看图谱与品级对照。",
    },
    {
      path: "/china/officials/evolution",
      dimensions: ["历史"],
      icon: "scroll-text",
      status: "available",
      title: "职官沿革",
      description: "从世卿世禄到三公九卿、三省六部与内阁军机处，按朝代梳理职官设置与央地权力结构。",
      screenshot: "institutions.jpg",
      note: "截图为编年卡片轴；沿时间顺序读，可对照同一机构在不同朝代的变形。",
    },
  ],
} satisfies PageResourceConfig;

export default officialsHubResource;
