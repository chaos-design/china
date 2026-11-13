import type { PageResourceConfig } from "../../page-resources";

const chinaRanksResource = {
  homeEntries: [
    {
      path: "/china/ranks",
      icon: "scale",
      status: "available",
      title: "品级纵横",
      description:
        "八朝官位品级立体树：3D 层级从属、双朝同品并置，辅以阶梯、六条职系追踪与同品断面。",
    },
  ],
} satisfies PageResourceConfig;

export default chinaRanksResource;
