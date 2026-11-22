import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getDynastyPath, IMPERIAL_EXAM_DYNASTIES } from "./dynasties";
import { EXAM_IMAGE_CREDITS, EXAM_IMAGES, type ExamImageKey } from "./imperial-exam-images";
import {
  ADVANCEMENT_FUNNEL,
  EXAM_CADENCE,
  EXAM_DYNASTY_DIFFS,
  EXAM_LEGEND,
  EXAM_MILESTONES,
  EXAM_STAGES,
  SIDE_ROUTES,
} from "./ladder";

/**
 * 极简 JPEG 尺寸解析：跳过 APP 段、找到 SOF0-SOF3/SOF9-SOF11 读出像素尺寸，
 * 用于锁定数据里的 w/h 与落盘文件一致（jsdom 不解码图片，只有这里能查）。
 */
function jpegDimensions(buffer: Buffer): { w: number; h: number } {
  expect(buffer.readUInt16BE(0)).toBe(0xffd8);
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) throw new Error(`bad marker at ${offset}`);
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc9 && marker <= 0xcb)) {
      return { h: buffer.readUInt16BE(offset + 5), w: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error("no SOF marker found");
}

describe("imperial exam stage chain (登科之阶)", () => {
  it("runs seven stations from 童试 to 铨选授官 with unique names", () => {
    expect(EXAM_STAGES).toHaveLength(7);
    expect(EXAM_STAGES[0]?.name).toBe("童试");
    expect(EXAM_STAGES[EXAM_STAGES.length - 1]?.name).toBe("铨选授官");
    const names = EXAM_STAGES.map((stage) => stage.name);
    expect(new Set(names).size).toBe(names.length);
    for (const [index, stage] of EXAM_STAGES.entries()) {
      expect(stage.num).toBe(["①", "②", "③", "④", "⑤", "⑥", "⑦"][index]);
      expect(stage.name.length).toBeGreaterThan(1);
      expect(stage.place.length).toBeGreaterThan(1);
      expect(stage.timing.length).toBeGreaterThan(3);
      expect(stage.identity.length).toBeGreaterThan(3);
      expect(stage.summary.length).toBeGreaterThan(10);
    }
  });

  it("gives every station two or three details, and every station a main image", () => {
    for (const stage of EXAM_STAGES) {
      expect(stage.details.length).toBeGreaterThanOrEqual(2);
      expect(stage.details.length).toBeLessThanOrEqual(3);
      // 每站必须有影像细节（第一张图细节即主图），完整链路配真实影像佐证
      expect(stage.details.some((detail) => detail.image)).toBe(true);
      const labels = stage.details.map((detail) => detail.label);
      expect(new Set(labels).size).toBe(labels.length);
      for (const detail of stage.details) {
        expect(detail.label.length).toBeGreaterThan(1);
        expect(detail.text.length).toBeGreaterThan(6);
        if (detail.image) {
          expect(detail.image.caption.length).toBeGreaterThan(4);
        }
      }
    }
  });

  it("details exam subjects and methods for the five exam stations", () => {
    const withExam = EXAM_STAGES.filter((stage) => stage.exam);
    // 五个考试站：童试/乡试/会试/殿试/铨选授官；放榜与赶考两站不设考试
    expect(withExam.map((stage) => stage.name)).toEqual([
      "童试",
      "乡试",
      "会试",
      "殿试",
      "铨选授官",
    ]);
    for (const stage of withExam) {
      const exam = stage.exam;
      if (!exam) throw new Error(`missing exam block for ${stage.name}`);
      expect(exam.subjects.length).toBeGreaterThanOrEqual(2);
      expect(exam.methods.length).toBeGreaterThanOrEqual(2);
      for (const item of [...exam.subjects, ...exam.methods]) {
        expect(item.name.length).toBeGreaterThan(1);
        expect(item.text.length).toBeGreaterThan(4);
      }
      const subjectNames = exam.subjects.map((item) => item.name);
      expect(new Set(subjectNames).size).toBe(subjectNames.length);
    }
    // 童试口径：岁试科试是学政对生员的考试，不该出现在童试时点章
    expect(EXAM_STAGES[0]?.timing).not.toContain("岁科两试");
  });

  it("details the per-station flow with at least three ordered steps", () => {
    for (const stage of EXAM_STAGES) {
      expect(stage.flow.length).toBeGreaterThanOrEqual(3);
      const steps = stage.flow;
      expect(new Set(steps).size).toBe(steps.length);
      for (const step of steps) {
        expect(step.length).toBeGreaterThan(1);
      }
      // 流程从进场到出榜：末步不再是一次考试动作（进学/榜/上任收尾）
      expect(stage.flow[stage.flow.length - 1]).toMatch(/进学|榜|上任|春闱|题名|谢师/);
    }
  });

  it("keeps odds claims marked as estimates", () => {
    // 「约」必须出现在标签或正文里（估算口径），全链至少四处
    const estimates = EXAM_STAGES.flatMap((stage) =>
      stage.details.map((detail) => `${detail.label}${detail.text}`),
    ).filter((combined) => combined.includes("约"));
    expect(estimates.length).toBeGreaterThanOrEqual(4);
  });

  it("describes the side routes with a note about the promotion ceiling", () => {
    expect(SIDE_ROUTES.routes.length).toBeGreaterThanOrEqual(3);
    expect(SIDE_ROUTES.note).toContain("天花板");
    for (const route of SIDE_ROUTES.routes) {
      expect(route.name.length).toBeGreaterThan(0);
      expect(route.detail.length).toBeGreaterThan(6);
    }
  });

  it("keeps milestones chronological by stated year", () => {
    expect(EXAM_MILESTONES.length).toBeGreaterThanOrEqual(5);
    expect(EXAM_MILESTONES[0]?.year).toBe("前134");
    expect(EXAM_MILESTONES[EXAM_MILESTONES.length - 1]?.year).toBe("1905");
  });
});

describe("advancement funnel and exam cadence", () => {
  it("narrows the funnel from 童生 to 进士 with estimate counts", () => {
    expect(ADVANCEMENT_FUNNEL.length).toBeGreaterThanOrEqual(4);
    const identities = ADVANCEMENT_FUNNEL.map((level) => level.identity);
    expect(identities[0]).toBe("童生");
    expect(identities[identities.length - 1]).toBe("进士");
    expect(new Set(identities).size).toBe(identities.length);
    for (const level of ADVANCEMENT_FUNNEL) {
      expect(level.count.length).toBeGreaterThan(3);
      expect(level.icons).toBeGreaterThanOrEqual(1);
    }
    // 估算口径至少两处带「约」（「以百万计」「一甲只三名」这类表述本身即估算或确数）
    const withAbout = ADVANCEMENT_FUNNEL.filter((level) => level.count.includes("约"));
    expect(withAbout.length).toBeGreaterThanOrEqual(2);
    // 人形个数逐级递减，构成漏斗
    for (const [index, level] of ADVANCEMENT_FUNNEL.entries()) {
      if (index > 0) {
        expect(level.icons).toBeLessThan(ADVANCEMENT_FUNNEL[index - 1].icons);
      }
    }
  });

  it("attaches a valid image with a caption to every funnel level", () => {
    for (const level of ADVANCEMENT_FUNNEL) {
      expect(
        EXAM_IMAGES[level.image.key],
        `missing funnel image for ${level.identity}`,
      ).toBeTruthy();
      expect(level.image.caption.length).toBeGreaterThan(4);
    }
  });

  it("lays out the three-year cadence with five nodes", () => {
    expect(EXAM_CADENCE).toHaveLength(5);
    expect(EXAM_CADENCE.map((node) => node.name)).toEqual([
      "童试",
      "乡试",
      "会试",
      "殿试",
      "朝考授官",
    ]);
    // 一科三年：乡试在第一年，会试、殿试、授官在第二年
    expect(EXAM_CADENCE[1]?.time).toContain("第一年");
    expect(EXAM_CADENCE[2]?.time).toContain("第二年");
    expect(EXAM_CADENCE[4]?.time).toContain("第二年");
  });

  it("provides six legend items with unique icon keys", () => {
    expect(EXAM_LEGEND).toHaveLength(6);
    const iconKeys = EXAM_LEGEND.map((item) => item.icon);
    expect(new Set(iconKeys).size).toBe(6);
    for (const item of EXAM_LEGEND) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.note.length).toBeGreaterThan(5);
    }
  });
});

describe("imperial exam images", () => {
  it("ships every referenced image file under public/imperial-exam with matching dimensions", () => {
    const referencedKeys = EXAM_STAGES.flatMap((stage) =>
      stage.details.flatMap((detail) => (detail.image ? [detail.image.key] : [])),
    );
    expect(referencedKeys.length).toBeGreaterThanOrEqual(10);
    const publicRoot = join(process.cwd(), "public");
    for (const key of referencedKeys as ExamImageKey[]) {
      const image = EXAM_IMAGES[key];
      expect(image, `missing image record: ${key}`).toBeTruthy();
      const file = join(publicRoot, image.src.slice(1));
      expect(existsSync(file), `missing file for ${key}: ${image.src}`).toBe(true);
      const { w, h } = jpegDimensions(readFileSync(file));
      expect(`${w}x${h}`).toBe(`${image.w}x${image.h}`);
    }
  });

  it("credits every image with a Commons file page and keeps sourceUrl ASCII", () => {
    expect(EXAM_IMAGE_CREDITS.length).toBe(Object.keys(EXAM_IMAGES).length);
    for (const credit of EXAM_IMAGE_CREDITS) {
      expect(credit.url).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(credit.url).not.toMatch(/[^\x20-\x7e]/);
      expect(credit.credit.length).toBeGreaterThan(5);
      expect(credit.caption.length).toBeGreaterThan(4);
    }
  });

  it("covers the difficulty evidence: cells, cheating material, golden list, exam paper", () => {
    for (const key of ["haoshe", "cheating", "jinbang", "zhuangyuanjuan"] as ExamImageKey[]) {
      expect(EXAM_IMAGES[key].alt.length).toBeGreaterThan(8);
    }
  });
});

describe("imperial exam dynasties data", () => {
  it("keeps ids lowercase-unique and spans 先秦 through 清", () => {
    const ids = IMPERIAL_EXAM_DYNASTIES.map((dynasty) => dynasty.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z]+$/);
    }
    expect(IMPERIAL_EXAM_DYNASTIES[0]?.id).toBe("preqin");
    expect(IMPERIAL_EXAM_DYNASTIES[IMPERIAL_EXAM_DYNASTIES.length - 1]?.id).toBe("qing");
    expect(IMPERIAL_EXAM_DYNASTIES.length).toBeGreaterThanOrEqual(7);
  });

  it("gives every dynasty entry routes across known kinds", () => {
    for (const dynasty of IMPERIAL_EXAM_DYNASTIES) {
      expect(dynasty.name.length).toBeGreaterThan(0);
      expect(dynasty.headline.length).toBeGreaterThan(4);
      expect(dynasty.period).toMatch(/前\d+|\d{3,4}/);
      expect(dynasty.entry.routes.length).toBeGreaterThanOrEqual(3);

      for (const route of dynasty.entry.routes) {
        expect(route.name.length).toBeGreaterThan(1);
        expect(route.detail.length).toBeGreaterThan(8);
      }
    }
  });

  it("gives every dynasty promotion mechanisms and a multi-stage ladder", () => {
    for (const dynasty of IMPERIAL_EXAM_DYNASTIES) {
      expect(dynasty.promotion.summary.length).toBeGreaterThan(15);
      expect(dynasty.promotion.mechanisms.length).toBeGreaterThanOrEqual(2);
      expect(dynasty.promotion.ladder.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("attaches a sourced career sample with at least four dated steps", () => {
    for (const dynasty of IMPERIAL_EXAM_DYNASTIES) {
      expect(dynasty.career.source).toMatch(/《[^》]+·[^》]+》/);
      expect(dynasty.career.steps.length).toBeGreaterThanOrEqual(4);
      const stepKeys = dynasty.career.steps.map((step) => `${step.year}-${step.role}`);
      expect(new Set(stepKeys).size).toBe(stepKeys.length);
    }
  });

  it("gives every dynasty achievements and a retirement rule", () => {
    for (const dynasty of IMPERIAL_EXAM_DYNASTIES) {
      expect(dynasty.achievements.length).toBeGreaterThanOrEqual(2);
      for (const item of dynasty.achievements) {
        expect(item.length).toBeGreaterThan(10);
      }
      expect(dynasty.retirement.rule.length).toBeGreaterThan(2);
      expect(dynasty.retirement.detail.length).toBeGreaterThan(15);
    }
  });

  it("names exam notables from 汉 onward, not for the pre-exam ages", () => {
    const withNotables = IMPERIAL_EXAM_DYNASTIES.filter((dynasty) => dynasty.notables);
    // 先秦（世卿世禄）与魏晋南北朝（九品中正）无科场名人；汉（察举）起有人可点
    expect(withNotables.map((dynasty) => dynasty.id)).toEqual([
      "han",
      "suitang",
      "song",
      "yuan",
      "ming",
      "qing",
    ]);
    for (const dynasty of withNotables) {
      const notables = dynasty.notables;
      if (!notables) throw new Error(`missing notables for ${dynasty.id}`);
      expect(notables.length).toBeGreaterThanOrEqual(2);
      const names = notables.map((person) => person.name);
      expect(new Set(names).size).toBe(names.length);
      for (const person of notables) {
        expect(person.note.length).toBeGreaterThan(6);
      }
      // 名人不与履历样本重复
      expect(names).not.toContain(dynasty.career.subject);
    }
  });

  it("describes per-dynasty differences across the five exam dynasties", () => {
    expect(EXAM_DYNASTY_DIFFS.map((diff) => diff.dynasty)).toEqual(["唐", "宋", "元", "明", "清"]);
    const ids = EXAM_DYNASTY_DIFFS.map((diff) => diff.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const diff of EXAM_DYNASTY_DIFFS) {
      expect(diff.id).toMatch(/^[a-z]+$/);
      expect(diff.points.length).toBeGreaterThanOrEqual(3);
      for (const point of diff.points) {
        expect(point.length).toBeGreaterThan(10);
      }
    }
  });

  it("provides unique terms and named sources for every dynasty", () => {
    for (const dynasty of IMPERIAL_EXAM_DYNASTIES) {
      expect(dynasty.terms.length).toBeGreaterThanOrEqual(2);
      const termNames = dynasty.terms.map((term) => term.name);
      expect(new Set(termNames).size).toBe(termNames.length);
      expect(dynasty.sources.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("resolves dynasties by id and returns undefined for unknown ids", () => {
    expect(getDynastyPath("han")?.name).toBe("汉");
    expect(getDynastyPath("qing-dynasty")).toBeUndefined();
    expect(getDynastyPath("")).toBeUndefined();
  });
});
