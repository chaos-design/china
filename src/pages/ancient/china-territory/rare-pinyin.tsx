import type { ReactNode } from "react";

/**
 * 生僻字 / 奇异字注音：只覆盖本页人物名与古地名中确实难读的字，
 * 不引入全字表，也不给常见字加噪音。注音直接跟在名字后（如「逄(páng)」），
 * 对屏幕阅读器同样可读。
 */
export const RARE_PINYIN: Record<string, string> = {
  逄: "páng",
  浞: "zhuó",
  奭: "shì",
  姒: "sì",
  蠡: "lǐ",
  嚭: "pǐ",
  鞅: "yāng",
  羿: "yì",
  恬: "tián",
  祜: "hù",
  苻: "fú",
  颎: "jiǒng",
  伽: "jiā",
  炀: "yáng",
  瑭: "táng",
  煜: "yù",
  胤: "yìn",
  淹: "yān",
  拯: "zhěng",
  桧: "huì",
  邲: "bì",
  澶: "chán",
  郾: "yǎn",
  淝: "féi",
  陂: "bēi",
  鄱: "pó",
  镠: "liú",
  蕊: "ruǐ",
  昺: "bǐng",
  昶: "chǎng",
  湉: "tián",
  珅: "shēn",
  逖: "tì",
  嵇: "jī",
  羲: "xī",
  邕: "yōng",
  箕: "jī",
  纣: "zhòu",
  逡: "qūn",
  奂: "huàn",
  亶: "dǎn",
  瞀: "mào",
  颛: "zhuān",
  顼: "xū",
  蚩: "chī",
  涿: "zhuō",
  狁: "yǔn",
  玁: "xiǎn",
  獯: "xūn",
  鬻: "yù",
  匐: "fú",
  匍: "pú",
};

/** 名字中的生僻字注音列表（去重、保序）。 */
export function rarePinyinOf(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const char of text) {
    const pinyin = RARE_PINYIN[char];
    if (pinyin && !seen.has(char)) {
      seen.add(char);
      result.push(`${char}(${pinyin})`);
    }
  }
  return result;
}

/** 带注音的名字：原名 + 紧跟的注音小字。 */
export function RareName({ name }: { name: string }): ReactNode {
  const pinyin = rarePinyinOf(name);
  return (
    <>
      {name}
      {pinyin.length > 0 ? <span className="tch-pinyin">{pinyin.join(" ")}</span> : null}
    </>
  );
}
