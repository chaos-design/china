/**
 * 品级礼制的真实图片索引：Wikimedia Commons 上的博物馆藏品照与古画像
 * （公有领域 / CC0 / CC-BY 系，许可逐条核验过）。
 *
 * 三张表分别按「补子动物名 / 顶戴材质名 / 朝代:服色」建索引；缺图条目由
 * rank-illustrations 回落（补子→手绘方补、顶戴→手绘暖帽、朝服→服色色样），
 * 因此允许部分覆盖。图片本体放在 public/qing-officials/（绝对路径引用，
 * 镜像 /heritage、/taiwan 的约定），caption 与 source 保留藏品说明与
 * Commons 文件页链接（同 taiwan 页 credit + sourceUrl 约定，非 ASCII 已转义）。
 * rank-images.test.ts 校验所有 src 都真实存在，避免死链上线。
 *
 * 覆盖口径（2026-11）：明清补子除 鹌鹑 / 练雀 / 犀牛 外全部有实物照；
 * 頂戴材质（明清宝石顶 + 秦汉印绶）除无印的「青绶」外全覆盖；朝服以清
 * 七组全图，另落 明绯袍 / 宋绯袍 / 秦黑袍一幅（其余朝服色以丝绢色样兜底）。
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
export const BADGE_IMAGES: Readonly<Record<string, RankImage>> = {
  仙鹤: {
    src: "/qing-officials/badge-xianhe.jpg",
    caption: "清晚期 · 一品文官仙鹤补 · 大都会艺术博物馆",
    source:
      "https://commons.wikimedia.org/wiki/File:%E6%B8%85%E6%99%9A%E6%9C%9F_%E4%B8%80%E5%93%81%E6%96%87%E5%AE%98%E4%BB%99%E9%B6%B4%E8%A3%9C-Rank_badge_with_crane_MET_DP-14150-012.jpg",
  },
  锦鸡: {
    src: "/qing-officials/badge-jinji.jpg",
    caption: "清晚期 · 二品文官锦鸡补 · 大都会艺术博物馆",
    source:
      "https://commons.wikimedia.org/wiki/File:%E6%B8%85%E6%99%9A%E6%9C%9F_%E4%BA%8C%E5%93%81%E6%96%87%E5%AE%98%E9%8C%A6%E9%9B%9E%E8%A3%9C-Rank_badge_with_pheasant_MET_DP-14150-017.jpg",
  },
  孔雀: {
    src: "/qing-officials/badge-kongque.jpg",
    caption: "清中期 · 三品文官孔雀补 · 大都会艺术博物馆",
    source:
      "https://commons.wikimedia.org/wiki/File:%E6%B8%85%E4%B8%AD%E6%9C%9F_%E4%B8%89%E5%93%81%E6%96%87%E5%AE%98%E5%AD%94%E9%9B%80%E8%A3%9C-Rank_badge_with_peacock_MET_DP-14150-014.jpg",
  },
  云雁: {
    src: "/qing-officials/badge-yunyan.jpg",
    caption: "清 · 云雁纹补子 · 库珀·休伊特设计博物馆",
    source:
      "https://commons.wikimedia.org/wiki/File:Rank_Badge_(China),_18th_century_(CH_18563227).jpg",
  },
  白鹇: {
    src: "/qing-officials/badge-baixian.jpg",
    caption: "清乾隆 · 刺绣白鹇补 · 大都会艺术博物馆",
    source:
      "https://commons.wikimedia.org/wiki/File:%E6%B8%85%E4%B9%BE%E9%9A%86_%E5%88%BA%E7%B9%A1%E7%99%BD%E9%B7%B4%E8%A3%9C-Rank_Badge_with_Silver_Pheasant_MET_DP227290.jpg",
  },
  鹭鸶: {
    src: "/qing-officials/badge-lusi.jpg",
    caption: "清 · 六品文官鹭鸶补",
    source: "https://commons.wikimedia.org/wiki/File:Qing_Dynasty_Mandarin_square.jpg",
  },
  鸂鶒: {
    src: "/qing-officials/badge-xichi.jpg",
    caption: "清 · 鸂鶒纹补子 · 大都会艺术博物馆",
    source:
      "https://commons.wikimedia.org/wiki/File:Rank_Badge_with_Mandarin_Duck_MET_DP-14772-001.jpg",
  },
  麒麟: {
    src: "/qing-officials/badge-qilin.jpg",
    caption: "清 · 缂丝麒麟补 · 大都会艺术博物馆",
    source: "https://commons.wikimedia.org/wiki/File:MET_DP227291.jpg",
  },
  狮: {
    src: "/qing-officials/badge-shi.jpg",
    caption: "清晚期 · 二品武官狮子补 · 大都会艺术博物馆",
    source:
      "https://commons.wikimedia.org/wiki/File:%E6%B8%85%E6%99%9A%E6%9C%9F_%E4%BA%8C%E5%93%81%E6%AD%A6%E5%AE%98%E7%8D%85%E5%AD%90%E8%A3%9C-Rank_badge_with_lion_MET_DP-14150-015.jpg",
  },
  豹: {
    src: "/qing-officials/badge-bao.jpg",
    caption: "清晚期 · 三品武官豹子补 · 大都会艺术博物馆",
    source:
      "https://commons.wikimedia.org/wiki/File:%E6%B8%85%E6%99%9A%E6%9C%9F_%E4%B8%89%E5%93%81%E6%AD%A6%E5%AE%98%E8%B1%B9%E5%AD%90%E8%A3%9C-Rank_badge_with_leopard_MET_DP-14150-016.jpg",
  },
  虎: {
    src: "/qing-officials/badge-hu.jpg",
    caption: "清 · 虎纹刺绣朝服补子（18 世纪）",
    source: "https://commons.wikimedia.org/wiki/File:Rank_badge_with_tiger_18th_century_China.jpg",
  },
  熊: {
    src: "/qing-officials/badge-xiong.jpg",
    caption: "清初 · 熊罴纹补子（17—18 世纪之交）",
    source:
      "https://commons.wikimedia.org/wiki/File:Rank_Badge_with_Bear_late_17th%E2%80%93early_18th_century_China.jpg",
  },
  彪: {
    src: "/qing-officials/badge-biao.jpg",
    caption: "清 · 武官彪补（幼虎）· 大都会艺术博物馆",
    source: "https://commons.wikimedia.org/wiki/File:MET_SC13262.jpg",
  },
  海马: {
    src: "/qing-officials/badge-haima.jpg",
    caption: "清 · 武官海马补 · 大都会艺术博物馆",
    source: "https://commons.wikimedia.org/wiki/File:MET_144228.jpg",
  },
  // 明清同物异名别名键（武官一品 / 五品等的写法差异）。
  狮子: {
    src: "/qing-officials/badge-shi.jpg",
    caption: "清晚期 · 二品武官狮子补 · 大都会艺术博物馆",
    source:
      "https://commons.wikimedia.org/wiki/File:%E6%B8%85%E6%99%9A%E6%9C%9F_%E4%BA%8C%E5%93%81%E6%AD%A6%E5%AE%98%E7%8D%85%E5%AD%90%E8%A3%9C-Rank_badge_with_lion_MET_DP-14150-015.jpg",
  },
  熊罴: {
    src: "/qing-officials/badge-xiong.jpg",
    caption: "清初 · 熊罴纹补子（17—18 世纪之交）",
    source:
      "https://commons.wikimedia.org/wiki/File:Rank_Badge_with_Bear_late_17th%E2%80%93early_18th_century_China.jpg",
  },
};

/** 顶戴：按数据里的 hat 材质名索引（明清宝石顶珠、秦汉印绶）。 */
export const HAT_IMAGES: Readonly<Record<string, RankImage>> = {
  红宝石顶: {
    src: "/qing-officials/hat-hongbaoshi.jpg",
    caption: "红宝石（一品顶珠材质）· Ruby gem · CC BY 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Ruby_gem.JPG",
  },
  珊瑚顶: {
    src: "/qing-officials/hat-shanhu.jpg",
    caption: "红珊瑚（二品顶珠材质）· Red coral gemstone · CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Red_coral_gemstone.jpg",
  },
  蓝宝石顶: {
    src: "/qing-officials/hat-lanbaoshi.jpg",
    caption: "蓝宝石（三品顶珠材质）· Yogo sapphire · CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Cornflower_blue_Yogo_Sapphire_2R.jpg",
  },
  青金石顶: {
    src: "/qing-officials/hat-qingjinshi.jpg",
    caption: "青金石（四品顶珠材质）· CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Tumble-polished_lapis_lazuli_2.jpg",
  },
  水晶顶: {
    src: "/qing-officials/hat-shuijing.jpg",
    caption: "水晶（五品顶珠材质）· CC BY 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Birmanian_rock_crystal_(6997000297).jpg",
  },
  砗磲顶: {
    src: "/qing-officials/hat-chequ.jpg",
    caption: "砗磲（六品顶珠材质）· Tridacna gigas · CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Tridacna_gigas_01.jpg",
  },
  素金顶: {
    src: "/qing-officials/hat-sujin.jpg",
    caption: "自然金（素金顶材质）· GoldNuggetUSGOV · 公有领域",
    source: "https://commons.wikimedia.org/wiki/File:GoldNuggetUSGOV.jpg",
  },
  素银顶: {
    src: "/qing-officials/hat-suyin.jpg",
    caption: "电解银晶体（素银顶材质）· CC BY-SA 3.0 DE",
    source: "https://commons.wikimedia.org/wiki/File:Silver_crystal.jpg",
  },
  镂金顶: {
    src: "/qing-officials/hat-loujin.jpg",
    caption: "砂金（镂金顶材质）· CC BY 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Gold_nugget_(placer_gold)_1_(17001285916).jpg",
  },
  阴纹镂花素金顶: {
    src: "/qing-officials/hat-loujin.jpg",
    caption: "砂金（阴纹镂花素金顶材质）· CC BY 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Gold_nugget_(placer_gold)_1_(17001285916).jpg",
  },
  金印紫绶: {
    src: "/qing-officials/seal-jinyin.jpg",
    caption: "西汉金印（龟钮）· 徐州博物馆 · CC0",
    source: "https://commons.wikimedia.org/wiki/File:Western_Han_Gold_Seal_(10091851065).jpg",
  },
  银印青绶: {
    src: "/qing-officials/seal-yinyin.jpg",
    caption: "西晋银印 · 内蒙古博物院 · CC0",
    source: "https://commons.wikimedia.org/wiki/File:Western_Jin_Silver_Seal_(19211464623).jpg",
  },
  铜印黑绶: {
    src: "/qing-officials/seal-tongyin-hei.jpg",
    caption: "铜印（龟钮）· 上海博物馆 · CC0",
    source: "https://commons.wikimedia.org/wiki/File:Bronze_Xi_or_Yin_Seal_03.jpg",
  },
  铜印黄绶: {
    src: "/qing-officials/seal-tongyin-huang.jpg",
    caption: "唐代铜印 · 洛阳博物馆 · CC0",
    source: "https://commons.wikimedia.org/wiki/File:Tang_Bronze_Seal.jpg",
  },
};

/** 朝服：按 `${dynastyId}:${robe}` 索引；dynastyId 与 data/dynasties 的 id 一致。 */
export const ROBE_IMAGES: Readonly<Record<string, RankImage>> = {
  "qing:石青色绣金": {
    src: "/qing-officials/robe-qing-shijin.jpg",
    caption: "清 · 石青地金线朝服（18 世纪末）· 印第安纳波利斯艺术博物馆 · CC BY 2.5",
    source: "https://commons.wikimedia.org/wiki/File:WLA_ima_mans_formal_court_robe_chaopao.jpg",
  },
  "qing:石青色绣银": {
    src: "/qing-officials/robe-qing-shiyin.jpg",
    caption: "清 · 蓝地吉服袍（银白纹样）· CC0",
    source:
      "https://commons.wikimedia.org/wiki/File:1913.158_-_Emperor%27s_Jifu_(Semiformal_Court_Robe).jpg",
  },
  "qing:青色": {
    src: "/qing-officials/robe-qing-qingse.jpg",
    caption: "清 · 蓝地缂丝朝服袍 · 大都会艺术博物馆 · CC0",
    source: "https://commons.wikimedia.org/wiki/File:MET_DP225689.jpg",
  },
  "qing:蓝色": {
    src: "/qing-officials/robe-qing-lanse.jpg",
    caption: "清 · 蓝地金龙纹袍 · 阿姆斯特丹博物馆 · CC BY 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Robe,_dragon,_man%27s_(AM_14796-7).jpg",
  },
  "qing:月白": {
    src: "/qing-officials/robe-qing-yuebai.jpg",
    caption: "清嘉庆 · 浅地吉服袍（月白）· 克利夫兰艺术博物馆 · CC0",
    source:
      "https://commons.wikimedia.org/wiki/File:China,_Qing_dynasty_(1644-1911),_Jiaqing_period_-_Semi-formal_Court_Robe_(Jifu)_-_1983.32_-_Cleveland_Museum_of_Art.tif",
  },
  "qing:花青": {
    src: "/qing-officials/robe-qing-huaqing.jpg",
    caption: "清 · 蓝地银白织金龙袍 · 阿姆斯特丹博物馆 · CC BY 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Robe,_dragon_(AM_12081-1).jpg",
  },
  "qing:灰蓝": {
    src: "/qing-officials/robe-qing-huilan.jpg",
    caption: "清 · 蓝地织金蟒袍（19 世纪末）· 东西中心 · 公有领域",
    source:
      "https://commons.wikimedia.org/wiki/File:Chinese_summer_court_robe_(%27dragon_robe%27),_c._1890s,_silk_gauze_couched_in_gold_thread,_East-West_Center.jpg",
  },
  "ming:绯袍": {
    src: "/qing-officials/robe-ming-feipao.jpg",
    caption: "明 · 绯袍文官坐像（白鹇补）· 公有领域",
    source:
      "https://commons.wikimedia.org/wiki/File:Portrait_of_an_elderly_unidentified_civil_official.jpg",
  },
  "song:绯袍": {
    src: "/qing-officials/robe-song-feipao.jpg",
    caption: "宋 · 参政范文正公仲淹像（绯袍）· 公有领域",
    source:
      "https://commons.wikimedia.org/wiki/File:%E6%AD%B7%E4%BB%A3%E8%81%96%E8%B3%A2%E5%90%8D%E4%BA%BA%E5%83%8F-26-%E5%AE%8B%E5%8F%83%E6%94%BF%E8%8C%83%E6%96%87%E6%AD%A3%E5%85%AC%E4%BB%B2%E6%B7%B9.jpg",
  },
  "qin:黑色（尚水德）": {
    src: "/qing-officials/robe-qinhan-heise.jpg",
    caption: "汉 · 长冠深衣「冠人」木俑 · 湖南博物院 · CC0",
    source:
      "https://commons.wikimedia.org/wiki/File:Changguan_of_Hatted_man_male_figurine,_Han_dynasty,_Hunan_Museum2.jpg",
  },
};

export function badgeImage(animal: string): RankImage | undefined {
  return BADGE_IMAGES[animal];
}

export function hatImage(hat: string | undefined): RankImage | undefined {
  return hat ? HAT_IMAGES[hat] : undefined;
}

export function robeImage(dynastyId: string, robe: string | undefined): RankImage | undefined {
  return robe ? ROBE_IMAGES[`${dynastyId}:${robe}`] : undefined;
}
