import { describe, expect, it } from "vitest";

import { normalizePunctuation, parseTerms } from "./parse";

describe("normalizePunctuation", () => {
  it("widens CJK-adjacent half-width commas, colons and semicolons", () => {
    expect(normalizePunctuation("灭六国后,需集权。")).toBe("灭六国后，需集权。");
    expect(normalizePunctuation("始皇创三公九卿:文;武。")).toBe("始皇创三公九卿：文；武。");
  });

  it("converts a CJK-adjacent parenthesis pair to full-width, keeping it balanced", () => {
    expect(normalizePunctuation("元朔五年(前124)置太学")).toBe("元朔五年（前124）置太学");
  });

  it("leaves parens whose neighbours are all ASCII half-width", () => {
    // ASCII content inside the pair stays half-width; a CJK pair stays balanced.
    expect(normalizePunctuation("比例为(4:6)")).toBe("比例为(4:6)");
    expect(normalizePunctuation("鱼嘴(分江为内外二江)")).toBe("鱼嘴（分江为内外二江）");
  });

  it("leaves numeric ratios untouched", () => {
    expect(normalizePunctuation("分内外江比例约 4:6 / 6:4 随季节")).toBe(
      "分内外江比例约 4:6 / 6:4 随季节",
    );
    expect(normalizePunctuation("铅按 7:2:1 熔化于坩埚")).toBe("铅按 7:2:1 熔化于坩埚");
  });

  it("turns paired straight quotes into curly quotes", () => {
    expect(normalizePunctuation("范雎'远交近攻':交远攻近")).toBe("范雎‘远交近攻’：交远攻近");
  });

  it("widens CJK-adjacent question and exclamation marks", () => {
    expect(normalizePunctuation("真的吗?好的!")).toBe("真的吗？好的！");
    // ASCII-adjacent ones (code, shell syntax) stay half-width.
    expect(normalizePunctuation("运行 hello?world 命令")).toBe("运行 hello?world 命令");
  });

  it("passes empty and pure-ASCII strings through untouched", () => {
    expect(normalizePunctuation("")).toBe("");
    expect(normalizePunctuation("hello, world: ok")).toBe("hello, world: ok");
  });

  it("leaves unbalanced parenthesis runs unchanged instead of corrupting them", () => {
    // A close with no prior open, and opens with no close at all — the pairing
    // loop must skip/stop rather than convert half a pair.
    expect(normalizePunctuation("分江)再合(流")).toBe("分江)再合(流");
    expect(normalizePunctuation("前 214 ((年 置郡")).toBe("前 214 ((年 置郡");
  });

  it("leaves already-full-width punctuation unchanged", () => {
    expect(normalizePunctuation("剑身含锡 18-22% 而不脆。")).toBe("剑身含锡 18-22% 而不脆。");
  });

  it("runs inside parseTerms before term/ruby markup is applied", () => {
    // The half-width paren pair is widened even when followed by glossary terms that
    // parseTerms will later wrap in highlight spans.
    expect(parseTerms("前 214 年收河南(河套)置九原郡")).toContain("收河南（河套）");
  });
});
