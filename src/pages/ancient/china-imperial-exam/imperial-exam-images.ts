/**
 * 「科举之路」真实影像档案：全部来自 Wikimedia Commons 的公有领域
 * 或 CC 授权图片（贡院建筑、殿试卷、大金榜、夹带实物等），
 * 用于佐证登科之阶各站的难度与真实样貌。
 *
 * 约定与台湾专题一致：`src` 指向 `public/imperial-exam/*.jpg`（站根路径、
 * 文件名稳定），`w`/`h` 必须与落盘文件的像素尺寸一致（供 <img> 预留布局，
 * 测试锁定）；每张图必须保留 credit 与 sourceUrl（百分编码 ASCII）。
 */
export type ExamImageKey =
  | "dingzhou"
  | "cike"
  | "mingyuanlou"
  | "xiangshiti"
  | "haoshe"
  | "jiebao"
  | "gankao"
  | "pekingGongyuan"
  | "cheating"
  | "baohedian"
  | "jinbang"
  | "zhuangyuanjuan"
  | "yamen";

export interface ImperialExamImage {
  /** 站根绝对路径（SPA 直连 public/）。 */
  src: string;
  /** 落盘文件的真实像素尺寸，喂给 <img width/height> 预留布局。 */
  w: number;
  h: number;
  alt: string;
  /** 图注里的来源短语：作者 + 许可。 */
  credit: string;
  /** Wikimedia Commons 文件页（百分编码 ASCII）。 */
  sourceUrl: string;
}

export const EXAM_IMAGES: Record<ExamImageKey, ImperialExamImage> = {
  dingzhou: {
    src: "/imperial-exam/dingzhou-gongyuan.jpg",
    w: 1280,
    h: 854,
    alt: "定州贡院大堂与奎楼：清代直隶州考棚，童试与岁科两试在此举行",
    credit: "Wikimedia Commons · Siyuwj · CC BY-SA 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Dingzhou_Examination_Hall,_2020-09-07_03.jpg",
  },
  cike: {
    src: "/imperial-exam/exam-questions.jpg",
    w: 1280,
    h: 1215,
    alt: "清代科举备考刻本《大题文府》：八股范文与试题汇刻的题库书影",
    credit: "Wikimedia Commons · Mx. Granger · CC0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Imperial_examination_questions.jpg",
  },
  mingyuanlou: {
    src: "/imperial-exam/mingyuanlou.jpg",
    w: 1280,
    h: 960,
    alt: "南京江南贡院明远楼：全国最大的乡试考场，号舍曾达两万余间",
    credit: "Wikimedia Commons · 江上清风1961 · CC BY 3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:%E6%B1%9F%E5%8D%97%E8%B4%A1%E9%99%A2%E6%98%8E%E8%BF%9C%E6%A5%BC,_2009-01-26.jpg",
  },
  xiangshiti: {
    src: "/imperial-exam/shuntian-xiangshi-ti.jpg",
    w: 1280,
    h: 960,
    alt: "乾隆四十四年顺天乡试题单：从四书五经出题的书、诗、春秋各题",
    credit: "Wikimedia Commons · Tbatb · CC BY-SA 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Questions_of_the_Shuntian_Prefectural_Exam_in_Qianlong_44_(1779).jpg",
  },
  haoshe: {
    src: "/imperial-exam/peking-gongyuan-alt.jpg",
    w: 1280,
    h: 938,
    alt: "1901 年前后的北京贡院号舍长排：考生在每间小屋里吃住答卷九天",
    credit: "Wikimedia Commons · 未署名 · 公有领域",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Examination_hall,_Peking.jpg",
  },
  jiebao: {
    src: "/imperial-exam/jiebao-boards.jpg",
    w: 1280,
    h: 960,
    alt: "泉州所见中举捷报匾板：状元、榜眼、探花金字报板",
    credit: "Wikimedia Commons · Vmenkov · CC BY-SA 3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Quanzhou_Museum_-_imperial_exam_winner_boards_-_DSCF8225.JPG",
  },
  gankao: {
    src: "/imperial-exam/gankao-statue.jpg",
    w: 1280,
    h: 960,
    alt: "南京老门东《明代三赶考学生》铜雕：负笈携箱、结伴赴考的士子群像",
    credit: "Wikimedia Commons · 东京村子 · CC BY-SA 3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:%E5%8D%97%E4%BA%AC%E5%A4%AB%E5%AD%90%E5%BA%99%E8%80%81%E9%97%A8%E4%B8%9C%E9%9B%95%E5%A1%91%E3%80%8A%E6%98%8E%E4%BB%A3%E4%B8%89%E8%B5%B6%E8%80%83%E5%AD%A6%E7%94%9F%E3%80%8B_-_panoramio.jpg",
  },
  pekingGongyuan: {
    src: "/imperial-exam/peking-gongyuan.jpg",
    w: 1270,
    h: 934,
    alt: "1901 年的北京贡院：明远楼居中，两侧号舍连绵成巷",
    credit: "Wikimedia Commons · Alfons von Mumm · 公有领域",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Die_Kaiserlichen_Pr%C3%BCfungshallen_bei_meiner_Ankunft_I.jpg",
  },
  cheating: {
    src: "/imperial-exam/cheating-material.jpg",
    w: 1280,
    h: 960,
    alt: "清代科举夹带实物：满幅蝇头小字密写的作弊材料",
    credit: "Wikimedia Commons · Jack No1 · CC BY-SA 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Imperial_examination_cheating_material.JPG",
  },
  baohedian: {
    src: "/imperial-exam/baohedian.jpg",
    w: 1280,
    h: 960,
    alt: "北京故宫保和殿：清代殿试在此举行，天子亲策于廷",
    credit: "Wikimedia Commons · そらみみ · CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Hall_of_Preserving_Harmony_20160826.jpg",
  },
  jinbang: {
    src: "/imperial-exam/wudianshi-jinbang.jpg",
    w: 750,
    h: 557,
    alt: "道光二十四年武殿试大金榜卷首：奉天承运皇帝制曰，第一甲赐武进士及第",
    credit: "Wikimedia Commons · 未署名 · 公有领域",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:%E9%81%93%E5%85%89%E4%BA%8C%E5%8D%81%E5%9B%9B%E5%B9%B4%E6%AD%A6%E6%AE%BF%E8%A9%A6%E5%A4%A7%E9%87%91%E6%A6%9C.jpg",
  },
  zhuangyuanjuan: {
    src: "/imperial-exam/zhuangyuanjuan.jpg",
    w: 1280,
    h: 720,
    alt: "明万历二十六年赵秉忠殿试卷卷首：「第一甲第一名」金书朱批",
    credit: "Wikimedia Commons · 三猎 · CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:%E7%8A%B6%E5%85%83%E5%8D%B7.JPG",
  },
  yamen: {
    src: "/imperial-exam/neixiang-yamen.jpg",
    w: 1280,
    h: 814,
    alt: "河南内乡县衙正堂：新科进士外放知县，即从此等衙门做起",
    credit: "Wikimedia Commons · ScareCriterion12 · CC BY-SA 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:%E5%86%85%E4%B9%A1%E5%8E%BF%E8%A1%99%E6%AD%A3%E5%A0%822019.jpg",
  },
};

/** 页脚图片出处清单：按 EXAM_IMAGES 声明顺序排列。 */
export const EXAM_IMAGE_CREDITS: { src: string; caption: string; credit: string; url: string }[] =
  Object.values(EXAM_IMAGES).map((image) => ({
    src: image.src,
    caption: image.alt,
    credit: image.credit,
    url: image.sourceUrl,
  }));
