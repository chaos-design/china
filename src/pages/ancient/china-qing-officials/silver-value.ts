/**
 * 俸禄的当代货币映射：只做「白银金属价值」折算，不换算历史购买力。
 *
 * 口径：清末库平一两 = 37.301 克（1908 年度支部划一度量衡标准）；
 * 银价取 2026-11-21 国内白银大盘价约 9.25 元/克（现货 41.2 美元/盎司、美元兑人民币约 7.15）。
 * 行情每日浮动，因此把日期与单价一并写进出口文案，避免把参考值误读成固定汇率。
 */
export const QING_TAEL_GRAMS = 37.301;
export const SILVER_PRICE_PER_GRAM_CNY = 9.25;
export const SILVER_PRICE_DATE = "2026-11-21";

export const SILVER_NOTE = `按 ${SILVER_PRICE_DATE} 银价 ¥${SILVER_PRICE_PER_GRAM_CNY}/克、清库平两 ${QING_TAEL_GRAMS} 克折算，仅作金属价值参考`;

/** 从「180 两」这样的岁俸文案里取出两数；秩石等非银两口径返回 null。 */
export function parseSilverTaels(label: string | undefined): number | null {
  if (!label) {
    return null;
  }
  const match = label.match(/(\d+(?:\.\d+)?)\s*两/);
  return match ? Number(match[1]) : null;
}

export function silverTaelsToCny(taels: number): number {
  return Math.round(taels * QING_TAEL_GRAMS * SILVER_PRICE_PER_GRAM_CNY);
}

export function formatCny(value: number): string {
  return `¥${value.toLocaleString("zh-CN")}`;
}

export function formatCnyCompact(value: number): string {
  return value >= 10000 ? `¥${(value / 10000).toFixed(1)}万` : formatCny(value);
}
