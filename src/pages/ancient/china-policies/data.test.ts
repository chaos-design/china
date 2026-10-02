import { describe, expect, it } from "vitest";

import { DYNASTIES, GLOSSARY } from "./data";

function findDynasty(name: string) {
  const dynasty = DYNASTIES.find((item) => item.name === name);
  if (!dynasty) {
    throw new Error(`Expected dynasty ${name} to exist`);
  }
  return dynasty;
}

function stringifyDynasty(name: string) {
  return JSON.stringify(findDynasty(name));
}

describe("ancient China policy data accuracy", () => {
  it("keeps the Qin Lingnan and northern frontier records historically scoped", () => {
    const qin = stringifyDynasty("秦");

    expect(qin).toContain("赵佗为龙川县令");
    expect(qin).toContain("任嚣任南海郡尉");
    expect(qin).toContain("前 215 年蒙恬率三十万北逐匈奴");
    expect(qin).toContain("前 214 年收河南地(河套)置九原郡");
    expect(qin).not.toContain("屠睢、任嚣、赵佗率五十万大军平百越");
  });

  it("keeps Han Taixue chronology aligned with the glossary", () => {
    const han = stringifyDynasty("汉");

    expect(han).toContain("元朔五年(前124)置太学");
    expect(han).toContain("博士弟子50人");
    expect(GLOSSARY.太学.body).toContain("元朔五年(前124)");
    expect(han).not.toContain("兴太学500人");
  });

  it("uses neutral wording for Yuan Song transition and Penghu inspection office", () => {
    const yuan = stringifyDynasty("元");

    expect(yuan).toContain("崖山海战后陆秀夫负幼帝赵昺投海殉国");
    expect(yuan).toContain("管辖澎湖列岛，并管理台澎海域往来事务");
    expect(GLOSSARY.澎湖巡检司.body).toContain("台澎海域");
    expect(yuan).not.toContain("崖山之后无中华");
    expect(yuan).not.toContain("管辖澎湖列岛及台湾(琉求)");
  });
});
