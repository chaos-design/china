/**
 * 战役规模与损失（按 war id 索引，在 registry 合并进 WarEvent）。
 *
 * 口径：军史常见数字，兵力多取「约」「史载号称」；损失数字争议大时写区间
 * 或「无确数」，不把宣传性数字当作实数。与疆域口径一致，仍为示意性叙事。
 */
export interface WarStat {
  /** 双方投入兵力规模。 */
  scale: string;
  /** 伤亡 / 被俘 / 溃散等损失。 */
  losses: string;
}

export const WAR_STATS: Record<string, WarStat> = {
  // 先秦
  mingtiao: { scale: "商汤约数千人，夏桀部众不详", losses: "夏师溃散，桀出奔南巢" },
  muye: { scale: "周武王约数千人，商纣大军数量史载不一", losses: "商师倒戈，纣自焚" },
  "quanjing-zhi-luan": { scale: "犬戎与诸侯联军，人数无确数", losses: "镐京陷落，幽王被杀" },
  chengpu: { scale: "晋楚各数万，史载号称十万", losses: "楚军败退，子玉自杀" },
  bi: { scale: "晋楚各数万", losses: "楚军败绩，晋师凯旋" },
  baiju: { scale: "吴军数万，楚军数万", losses: "楚军五战五败，昭王出奔" },
  maling: { scale: "齐魏各约数万", losses: "魏军大败，庞涓死，太子申被俘" },
  changping: {
    scale: "秦赵各约四五十万（含后勤民夫）",
    losses: "赵卒四十余万降而被坑（数目有争议）",
  },
  "leyue-fa-qi": { scale: "五国联军约十余万，齐军数万", losses: "齐七十余城陷，后田单复国" },
  // 秦汉
  "qin-mie-liuguo": {
    scale: "秦每役约十万级，六国各数万至数十万",
    losses: "六国主力尽失，韩赵魏楚燕齐相继亡",
  },
  "mengtian-beiji": { scale: "秦军约三十万", losses: "匈奴北退七百余里" },
  julu: { scale: "楚军约数万，秦军约二十余万", losses: "秦军主力覆灭，王离被俘" },
  "nanzheng-baiyue": { scale: "秦军约五十万（史载口径）", losses: "岭南初定，士卒伤亡无确数" },
  baideng: { scale: "汉军约三十二万，匈奴约四十万骑", losses: "汉军被困七日，损失以突围计" },
  "hexi-zhizhan": { scale: "汉军每次数万至十余万，匈奴部众数万", losses: "匈奴河西数万人被俘或降" },
  mobei: { scale: "汉军约十万骑，匈奴数万", losses: "匈奴主力远遁，汉军亦损失极大" },
  kunyang: {
    scale: "汉军数千至万余，新军号称百万、实约十余万",
    losses: "新军全线崩溃，王莽政权瓦解",
  },
  yanran: { scale: "汉军约五万", losses: "北匈奴主力溃散，稽落山一战斩获万级" },
  huangjin: { scale: "起义军数万至数十万，官军数万", losses: "双方伤亡无确数，州郡残破" },
  // 魏晋南北朝
  yiling: { scale: "蜀吴各约四五万", losses: "蜀军舟船器械尽失，刘备退白帝" },
  "zhugeliang-beifa": {
    scale: "蜀军每次数万，魏军数万至十余万",
    losses: "粮尽退兵，将士损失数千级",
  },
  "jin-mie-wu": { scale: "晋军约二十万，吴军数万", losses: "吴军溃散，孙皓出降" },
  bawang: { scale: "诸王兵各数万至十余万", losses: "宗室相残，中原兵力消耗无确数" },
  yongjia: { scale: "汉赵军数万，晋军数万", losses: "洛阳陷落，怀帝被俘" },
  feishui: {
    scale: "前秦号称八十万、实约二十余万；东晋约八万",
    losses: "前秦军溃散，斩获及逃亡不可胜计",
  },
  canhebei: { scale: "北魏军约十万，后燕军数万", losses: "燕军败溃，士卒被坑杀数万" },
  zhongli: { scale: "梁魏各约数万至十余万", losses: "魏军大败，溺死被俘数万" },
  heyin: { scale: "北魏宗室与禁军，人数无确数", losses: "王公百官被杀千余，朝局崩解" },
  houjing: { scale: "叛军约数千起兵，后数万；梁军十余万", losses: "建康陷落，江南士族损失惨重" },
  "sui-mie-chen": { scale: "隋军约五十万（史载口径），陈军数万", losses: "陈军溃散，后主被俘" },
  // 隋唐五代
  "sui-zheng-gaogouli": {
    scale: "每次出兵号称百万、实约数十万；高句丽举国兵数万",
    losses: "隋军三大役损失极大，士卒死者相枕",
  },
  "jinyang-qibing": { scale: "李渊军约三万，沿途归附数万", losses: "关中隋军望风而降" },
  "mie-dongtujue": { scale: "唐军约数万，突厥数万骑", losses: "颉利被俘，东突厥汗国瓦解" },
  "anshi-zhiluan": {
    scale: "叛军约十余万，唐军各路十余万",
    losses: "两京反复陷落，生民损失无确数",
  },
  huangchao: { scale: "义军数万至十余万，官军数万", losses: "长安陷落，黄巢败亡于泰山" },
  "ge-youyun": { scale: "后晋割让十六州，未发生大会战", losses: "幽云汉地入辽，中原失屏障" },
  "zhou-shizong-beifa": { scale: "后周军数万，辽军数万", losses: "关南失地收复，益津关等三关归周" },
  // 宋元
  "song-mie-nantang": { scale: "宋军约十余万，南唐军数万", losses: "金陵陷落，李煜出降" },
  chanyuan: { scale: "宋辽各十余万", losses: "澶渊议和，双方罢兵，岁币约三十万" },
  haoshuichuan: { scale: "宋夏各数万", losses: "宋军大败，任福等将校战死" },
  jingkang: { scale: "金军约十余万，宋军数万", losses: "汴京陷落，徽钦二帝被掳" },
  yancheng: { scale: "宋军数万，金军数万", losses: "金军败退，岳飞追至朱仙镇" },
  caishi: { scale: "宋军约万余，金军号称数十万、实数万", losses: "金军渡江失败，完颜亮被部下所杀" },
  xiangyang: { scale: "宋军数万守城，元军约十余万围城", losses: "守将吕文焕降，荆襄门户洞开" },
  yashan: { scale: "宋军约十余万（含船队），元军数万", losses: "宋师全军覆没，陆秀夫负帝昺投海" },
  hongjin: { scale: "义军数万至十余万，元军数万", losses: "州县残破，双方伤亡无确数" },
  poyanghu: {
    scale: "陈友谅军号称六十万、实约二十万；朱元璋军约数万",
    losses: "陈军主力覆没，友谅中箭死",
  },
  "xuda-beifa": { scale: "明军约二十五万", losses: "元军北遁，大都和平易帜" },
  // 明清
  jingnan: { scale: "燕军数万，建文军数万至十余万", losses: "南京陷落，建文帝下落不明" },
  tumubao: { scale: "明军约二十万，瓦剌军数万骑", losses: "明军溃败，英宗被俘，土木堡死者甚众" },
  saerhu: { scale: "明军约十一万，后金军约六万", losses: "明军三路尽没，损失约四五万" },
  ningyuan: { scale: "明军约万余，后金军约十余万", losses: "后金攻城失利，努尔哈赤受伤后卒" },
  "ru-guan": { scale: "清军约十余万，明军与降将部众数万", losses: "李自成军败退，山海关归清" },
  "ping-sanfan": {
    scale: "清军各路约十余万，藩军数万至十余万",
    losses: "三藩主力尽灭，西南多年兵燹",
  },
  yakesa: { scale: "清军约数千，沙俄守军数百", losses: "俄军撤离雅克萨，双方伤亡有限" },
  "ping-zhungaer": { scale: "清军数万，准部数万", losses: "准噶尔汗国瓦解，大小和卓败亡" },
};
