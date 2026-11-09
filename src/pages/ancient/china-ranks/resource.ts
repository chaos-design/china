import type { PageResourceConfig } from "../../page-resources";

const chinaRanksResource = {
  homeEntries: [
    {
      path: "/china/ranks",
      icon: "scale",
      status: "available",
      title: "品级纵横",
      description: "八朝官位品级立体对照：单朝与双朝阶梯、六条职系追踪、同一品序八朝断面。",
    },
  ],
} satisfies PageResourceConfig;

export default chinaRanksResource;
