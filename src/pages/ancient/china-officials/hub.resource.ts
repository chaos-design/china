import type { PageResourceConfig } from "../../page-resources";

const officialsHubResource = {
  homeEntries: [
    {
      path: "/china/officials",
      dimensions: ["历史"],
      icon: "landmark",
      status: "available",
      title: "职官制度",
      description: "职官制度的两个读法：立体职官图谱与八朝品级对照，从同一总目进入。",
      screenshot: "officials.jpg",
      note: "总目把近似名称的入口收敛到一处；读沿革可转往制度沿革的官制专题。",
    },
  ],
} satisfies PageResourceConfig;

export default officialsHubResource;
