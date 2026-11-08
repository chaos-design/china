import type { PageResourceConfig } from "../page-resources";

const institutionsResource = {
  homeEntries: [
    {
      path: "/china/institutions",
      icon: "book-open",
      status: "available",
      title: "典章制度索引",
      description: "官制、赋役、律令、科举与礼制五大专题已开放，梳理制度沿革与关键条目。",
    },
  ],
  aboutItems: [
    {
      title: "制度与日常",
      text: "官制、赋役、律令、科举与礼制五大专题已开放，观察制度如何进入社会生活。",
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
