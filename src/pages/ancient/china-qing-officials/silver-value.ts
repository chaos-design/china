/**
 * 俸禄的当代货币映射：只做「白银金属价值」折算，不换算历史购买力。
 *
 * 默认口径：清末库平一两 = 37.301 克（1908 年度支部划一度量衡标准）；
 * 默认银价取 2026-11-21 国内白银大盘价约 9.25 元/克。
 * 现查接口：gold-api.com 的 XAG 美元/金衡盎司报价 × frankfurter.app 的 USD→CNY 汇率，
 * 两者均免费、免 key、支持浏览器 CORS。
 */
export const QING_TAEL_GRAMS = 37.301;
export const TROY_OUNCE_GRAMS = 31.1034768;
export const SILVER_PRICE_PER_GRAM_CNY = 9.25;
export const SILVER_PRICE_DATE = "2026-11-21";

const SILVER_API = "https://api.gold-api.com/price/XAG";
const FX_API = "https://api.frankfurter.app/latest?from=USD&to=CNY";

export interface LiveSilverPrice {
  cnyPerGram: number;
  usdPerOunce: number;
  usdCnyRate: number;
  updatedAt: string;
}

/** 任一环节失败返回 null，页面回落到当前输入值。 */
export async function fetchSilverPriceCnyPerGram(): Promise<LiveSilverPrice | null> {
  if (typeof fetch !== "function") {
    return null;
  }
  try {
    const [silverResponse, fxResponse] = await Promise.all([fetch(SILVER_API), fetch(FX_API)]);
    if (!silverResponse.ok || !fxResponse.ok) {
      return null;
    }
    const silver = (await silverResponse.json()) as { price?: number; updatedAt?: string };
    const fx = (await fxResponse.json()) as { rates?: { CNY?: number } };
    const usdPerOunce = silver.price;
    const usdCnyRate = fx.rates?.CNY;
    if (
      typeof usdPerOunce !== "number" ||
      !Number.isFinite(usdPerOunce) ||
      typeof usdCnyRate !== "number" ||
      !Number.isFinite(usdCnyRate)
    ) {
      return null;
    }
    return {
      cnyPerGram: Math.round((usdPerOunce * usdCnyRate * 100) / TROY_OUNCE_GRAMS) / 100,
      usdPerOunce,
      usdCnyRate,
      updatedAt: silver.updatedAt ?? "",
    };
  } catch {
    return null;
  }
}

export interface SilverSalary {
  /** 折合库平两。 */
  taels: number;
  /** true=数据明确写两；false=非银两朝代按品秩指数等比折银。 */
  exact: boolean;
}

/** 从「180 两」取两数；非银两朝代按品秩指数等比折成库平两（满分=180 两）。 */
export function salaryToTaels(salary: number, label?: string): SilverSalary {
  const match = label?.match(/(\d+(?:\.\d+)?)\s*两/);
  if (match?.[1]) {
    return { taels: Number(match[1]), exact: true };
  }
  return { taels: Math.round(salary * 1.8 * 10) / 10, exact: false };
}

export function silverTaelsToCny(taels: number, cnyPerGram: number): number {
  return Math.round(taels * QING_TAEL_GRAMS * cnyPerGram);
}

export function formatCny(value: number): string {
  return `¥${value.toLocaleString("zh-CN")}`;
}

export function formatCnyCompact(value: number): string {
  return value >= 10000 ? `¥${(value / 10000).toFixed(1)}万` : formatCny(value);
}

export function silverNote(cnyPerGram: number, source: string, exact: boolean): string {
  const basis = exact ? `清库平两 ${QING_TAEL_GRAMS} 克` : "非银两朝代按品秩指数等比折银";
  return `按 ${source} 银价 ¥${cnyPerGram}/克、${basis}折算，仅作金属价值参考`;
}
