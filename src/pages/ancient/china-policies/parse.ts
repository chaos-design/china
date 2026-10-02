import { GLOSSARY } from "./data";
import type { Glossary } from "./types";

/** Escape a string for safe use inside a RegExp. */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Escape a string for safe use inside an HTML attribute. */
export function escapeAttr(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Map a glossary term to its highlight CSS class. */
export function highlightClass(key: string, glossary: Glossary = GLOSSARY): string | null {
  const term = glossary[key];
  if (!term) return null;
  const t = term.type || "";
  if (t === "人物") return "hl-person";
  if (t === "制度" || t === "机构" || t === "现象") return "hl-system";
  return "hl-policy";
}

function wrapTerm(key: string, display: string, glossary: Glossary): string {
  const cls = highlightClass(key, glossary);
  if (!cls) return display;
  return `<span class="${cls}" data-term="${escapeAttr(key)}">${display}</span>`;
}

let cachedAutoTermRe: RegExp | null = null;
let cachedAutoTermGlossary: Glossary | null = null;

/** Build (and cache) the auto-highlight regex from glossary keys (length >= 2, longest first). */
export function getAutoTermRe(glossary: Glossary = GLOSSARY): RegExp {
  if (cachedAutoTermRe && cachedAutoTermGlossary === glossary) return cachedAutoTermRe;
  const keys = Object.keys(glossary)
    .filter((k) => k.length >= 2)
    .sort((a, b) => b.length - a.length);
  cachedAutoTermRe = new RegExp(`(${keys.map(escapeRegExp).join("|")})`, "g");
  cachedAutoTermGlossary = glossary;
  return cachedAutoTermRe;
}

/** Pinyin annotation dictionary for rare / polyphonic characters. */
export const PINYIN_DICT: Record<string, string> = {
  籴: "dí",
  粜: "tiào",
  氾: "fán",
  頞: "è",
  邗: "hán",
  缗: "mín",
  赈: "zhèn",
  廪: "lǐn",
  黜: "chù",
  觐: "jìn",
  羁: "jī",
  縻: "mí",
  勖: "xù",
  谥: "shì",
  弑: "shì",
  嬖: "bì",
  蠲: "juān",
  廓: "kuò",
  谮: "zèn",
  殽: "xiáo",
  阙: "què",
  甗: "yǎn",
  鼎: "dǐng",
  劾: "hé",
  诏: "zhào",
  敕: "chì",
  笏: "hù",
  觚: "gū",
  簋: "guǐ",
  篆: "zhuàn",
  隶: "lì",
  嗣: "sì",
  僭: "jiàn",
  禅: "shàn",
  膺: "yīng",
  戍: "shù",
  戊: "wù",
  戌: "xū",
  睢: "suī",
  雎: "jū",
  亳: "bó",
  殷: "yīn",
  邺: "yè",
  郾: "yǎn",
  鄢: "yān",
  郢: "yǐng",
  酂: "zàn",
  雍: "yōng",
  邠: "bīn",
  岐: "qí",
  崤: "xiáo",
  函: "hán",
  潼: "tóng",
  渑: "miǎn",
  砀: "dàng",
  巩: "gǒng",
  荥: "xíng",
  濮: "pú",
  虢: "guó",
  蔡: "cài",
  鄂: "è",
  黔: "qián",
  滇: "diān",
  蜀: "shǔ",
  陇: "lǒng",
  碣: "jié",
  琅: "láng",
  琊: "yá",
  珲: "hún",
  瑷: "ài",
  噶: "gá",
  喀: "kā",
  嘉峪: "jiāyù",
  敦煌: "dūnhuáng",
  龟兹: "qiūcí",
  吐蕃: "tǔbō",
  焉耆: "yānqí",
  大宛: "dàyuān",
  月氏: "yuèzhī",
  身毒: "yuāndú",
  冒顿: "mòdú",
  阏氏: "yānzhī",
  单于: "chányú",
  可汗: "kèhán",
  赞普: "zànpǔ",
  榷: "què",
  酤: "gū",
  筴: "cè",
  庸: "yōng",
  赋: "fù",
  赍: "jī",
  厘: "lí",
  钞: "chāo",
  楮: "chǔ",
  圜: "huán",
  铢: "zhū",
  鬻: "yù",
  靺: "mò",
  鞨: "hé",
  羌: "qiāng",
  氐: "dī",
  獠: "liáo",
  俚: "lǐ",
  僚: "liáo",
  仡: "gē",
  佬: "lǎo",
  侗: "dòng",
  傣: "dǎi",
  彝: "yí",
  嫡: "dí",
  庶: "shù",
  藩: "fān",
  幕: "mù",
  僖: "xī",
  懿: "yì",
  昶: "chǎng",
  胤: "yìn",
  祚: "zuò",
  祎: "yī",
  禛: "zhēn",
  颙: "yóng",
  旻: "mín",
  昀: "yún",
  奕: "yì",
  弘: "hóng",
  祺: "qí",
  祾: "líng",
};

let cachedPinyinRe: RegExp | null = null;

function getPinyinRe(): RegExp {
  if (cachedPinyinRe) return cachedPinyinRe;
  const keys = Object.keys(PINYIN_DICT).sort((a, b) => b.length - a.length);
  cachedPinyinRe = new RegExp(`(${keys.join("|")})`, "g");
  return cachedPinyinRe;
}

/** Add ruby pinyin annotations to text segments, skipping HTML tags. */
export function addRuby(html: string): string {
  return html.replace(/([^<]*)(<[^>]*>)?/g, (_m, text: string, tag?: string) => {
    const out = text
      ? text.replace(
          getPinyinRe(),
          (ch) => `<ruby>${ch}<rp>(</rp><rt>${PINYIN_DICT[ch]}</rt><rp>)</rp></ruby>`,
        )
      : "";
    return out + (tag || "");
  });
}

// Private-use sentinels that will not appear in source text.
const PH_OPEN = "\uE000";
const PH_CLOSE = "\uE001";
const PLACEHOLDER_RE = new RegExp(`${PH_OPEN}(\\d+)${PH_CLOSE}`, "g");
const EXPLICIT_TERM_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/**
 * Parse `[[term]]` / `[[term|label]]` markup, auto-highlight registered glossary
 * terms (longest first), then add pinyin ruby annotations. Returns an HTML string.
 */
export function parseTerms(text: string | undefined | null, glossary: Glossary = GLOSSARY): string {
  if (!text) return "";
  const placeholders: string[] = [];

  let s = String(text).replace(EXPLICIT_TERM_RE, (_m, key: string, label?: string) => {
    const k = key.trim();
    const display = (label || k).trim();
    placeholders.push(wrapTerm(k, display, glossary));
    return `${PH_OPEN}${placeholders.length - 1}${PH_CLOSE}`;
  });

  s = s.replace(getAutoTermRe(glossary), (match) => {
    placeholders.push(wrapTerm(match, match, glossary));
    return `${PH_OPEN}${placeholders.length - 1}${PH_CLOSE}`;
  });

  s = s.replace(PLACEHOLDER_RE, (_m, i: string) => placeholders[Number(i)]);
  return addRuby(s);
}
