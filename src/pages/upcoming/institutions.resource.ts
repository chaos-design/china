import type { PageResourceConfig } from "../page-resources";

const institutionsResource = {
  homeEntries: [
    {
      path: "/china/institutions",
      dimensions: ["chronology"],
      icon: "book-open",
      status: "available",
      title: "典章制度",
      description: "官制、赋役、律令、科举与礼制五大专题：编年时间轴呈现制度沿革，附关键条目表。",
      screenshot: "institutions.jpg",
      note: "截图为典章制度某专题的编年卡片轴；沿时间顺序读，可对照同一制度在不同朝代的变形。",
    },
  ],
  aboutItems: [
    {
      title: "制度与日常",
      text: "官制、赋役、律令、科举与礼制五大专题以编年时间轴展开，观察制度如何进入社会生活。",
    },
  ],
  readingGuides: [
    {
      icon: "book-open",
      title: "对照制度变形",
      text: "把官制、赋役、律令与科举放回具体朝代，观察政策如何落到社会秩序。",
    },
  ],
} satisfies PageResourceConfig;

export default institutionsResource;
