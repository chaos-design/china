import { describe, expect, it } from "vitest";
import { RARE_PINYIN, rarePinyinOf } from "./rare-pinyin";
import { CHRONICLE_PERIODS } from "./registry";

/** 生僻字注音：只注名单里确实出现的难读字，常见字不加噪音。 */
describe("rare character pinyin", () => {
  it("annotates rare characters once, in order", () => {
    expect(rarePinyinOf("关龙逄")).toEqual(["逄(páng)"]);
    expect(rarePinyinOf("召公奭")).toEqual(["奭(shì)"]);
    expect(rarePinyinOf("澶渊之盟")).toEqual(["澶(chán)"]);
    expect(rarePinyinOf("寻常姓名")).toEqual([]);
    expect(rarePinyinOf("逄逄")).toEqual(["逄(páng)"]);
  });

  it("covers every rare character actually used in figure and war names", () => {
    const missing = new Set<string>();
    for (const period of CHRONICLE_PERIODS) {
      for (const figure of period.figures ?? []) {
        for (const char of figure.name) {
          if (!RARE_PINYIN[char] && /[\u4e00-\u9fff]/.test(char) && isRare(char)) {
            missing.add(`${figure.name}:${char}`);
          }
        }
      }
      for (const war of period.wars) {
        for (const char of war.name) {
          if (!RARE_PINYIN[char] && /[\u4e00-\u9fff]/.test(char) && isRare(char)) {
            missing.add(`${war.name}:${char}`);
          }
        }
      }
    }
    expect([...missing]).toEqual([]);
  });
});

/** 抽样检查：本页已知难读字必须在映射表里。 */
function isRare(char: string): boolean {
  return "逄浞奭姒蠡嚭鞅羿恬祜苻颎伽炀瑭煜胤淹拯桧邲澶郾淝陂鄱镠蕊昺湉珅逖嵇羲邕箕纣".includes(
    char,
  );
}
