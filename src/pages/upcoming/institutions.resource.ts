import type { PageResourceConfig } from "../page-resources";

const institutionsResource = {
  homeEntries: [
    {
      icon: "book-open",
      status: "preview",
      title: "典章制度索引",
      description: "预留官制、赋役、律令、科举与礼制条目，适合做专题检索与延伸阅读。",
    },
  ],
  aboutItems: [
    {
      title: "制度与日常",
      text: "后续可继续延展赋税、官制、律令、教育与礼制，观察制度如何进入社会生活。",
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
