/**
 * 品级礼制的真实图片索引：Wikimedia Commons 上的博物馆藏品照（公有领域 / CC0）。
 *
 * 三张表分别按「补子动物名 / 顶戴材质名 / 朝代:服色」建索引；缺图的条目由
 * rank-illustrations 回落到手绘 SVG，因此允许部分覆盖。图片本体放在
 * public/qing-officials/（绝对路径引用，镜像 /heritage、/taiwan 的约定），
 * caption 与 source 保留藏品说明与 Commons 文件页链接（同 taiwan 页 credit 约定）。
 * rank-images.test.ts 校验所有 src 都真实存在，避免死链上线。
 */

export interface RankImage {
  /** 站内绝对路径（public/ 下）。 */
  src: string;
  /** 藏品短注：年代 + 品名 + 馆藏（img title 与图源页脚展示）。 */
  caption: string;
  /** Commons 文件页（图源页脚链接）。 */
  source: string;
}

/** 补子：按动物名索引（明清同名动物共用一图；狮/狮子、熊/熊罴为同物异名别名键）。 */
export const BADGE_IMAGES: Readonly<Record<string, RankImage>> = {};

/** 顶戴：按数据里的 hat 材质名索引（明清宝石顶珠、秦汉印绶、魏晋宋元冠制）。 */
export const HAT_IMAGES: Readonly<Record<string, RankImage>> = {};

/** 朝服：按 `${dynastyId}:${robe}` 索引。 */
export const ROBE_IMAGES: Readonly<Record<string, RankImage>> = {};

export function badgeImage(animal: string): RankImage | undefined {
  return BADGE_IMAGES[animal];
}

export function hatImage(hat: string | undefined): RankImage | undefined {
  return hat ? HAT_IMAGES[hat] : undefined;
}

export function robeImage(dynastyId: string, robe: string | undefined): RankImage | undefined {
  return robe ? ROBE_IMAGES[`${dynastyId}:${robe}`] : undefined;
}
