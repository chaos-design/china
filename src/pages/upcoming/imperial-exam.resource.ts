import type { PageResourceConfig } from "../page-resources";

const imperialExamResource = {
  homeEntries: [
    {
      path: "/china/imperial-exam",
      dimensions: ["chronology"],
      icon: "scroll-text",
      status: "available",
      title: "科举之路",
      description:
        "明清登科全阶与历代官途：从童生到状元要走几场考试，从郎官到宰相靠什么迁转，八朝各配一份真实官员的履历样本。",
      screenshot: "imperial-exam.jpg",
      note: "截图为登科之阶的七站链；从童试到铨选逐级读，右栏晋身漏斗给出对应层级。",
    },
  ],
  aboutItems: [
    {
      title: "仕途之门",
      text: "科举之路把明清登科全程与八朝入仕途径、晋升机制放进同一版式，观察王朝如何分配做官的机会。",
    },
  ],
  readingGuides: [
    {
      icon: "scroll-text",
      title: "追问晋升规则",
      text: "对照登科之阶与历代官途：考中的功名只是资格，真正的晋升要看各朝的考课、磨勘与铨选。",
    },
  ],
} satisfies PageResourceConfig;

export default imperialExamResource;
