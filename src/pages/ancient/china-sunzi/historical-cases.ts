/**
 * 有正史出处的计谋案例。只收能在原始史籍中查到记载的条目；
 * 计名与史事的对应若系后人归纳，逐条注明，不把演义当史实。
 */
export interface HistoricalCase {
  number: number;
  title: string;
  period: string;
  summary: string;
  source: string;
  quote?: string;
  url: string;
  note?: string;
}

export const HISTORICAL_CASES: readonly HistoricalCase[] = [
  {
    number: 2,
    title: "桂陵之战",
    period: "公元前353年",
    summary:
      "孙膑不赴邯郸解围，直趋魏都大梁，迫使庞涓回师，在桂陵将其截败。第二计「围魏救赵」即由此而来。",
    source: "《史记·孙子吴起列传》",
    quote: "批亢捣虚，形格势禁，则自为解耳",
    url: "https://ctext.org/shiji/sun-zi-wu-qi-lie-zhuan/zh",
  },
  {
    number: 4,
    title: "夷陵之战",
    period: "公元222年",
    summary: "陆逊拒绝诸将速战，坚守数月，待蜀军兵疲意沮才一举反击，并借火攻破四十余营。",
    source: "《三国志·吴书·陆逊传》",
    quote: "今住已久，不得我便，兵疲意沮，计不复生，掎角此寇，正在今日。",
    url: "https://zh.wikisource.org/zh-hans/%E4%B8%89%E5%9C%8B%E5%BF%97/%E5%8D%B758",
  },
  {
    number: 8,
    title: "韩信还定三秦",
    period: "公元前206年",
    summary: "刘邦入汉中时烧毁栈道示无东归之意，韩信随后主力从故道绕出，突袭雍王章邯。",
    source: "《史记·高祖本纪》",
    quote: "从故道还，袭雍王章邯",
    url: "https://ctext.org/shiji/gao-zu-ben-ji/zh",
    note: "「明修栈道，暗度陈仓」是后世成语概括，正史只载烧栈道与从故道还师。",
  },
  {
    number: 19,
    title: "官渡乌巢烧粮",
    period: "公元200年",
    summary: "曹操以五千步骑夜袭乌巢，尽燔袁绍粮草，袁军随之崩溃；不击其兵而绝其食。",
    source: "《三国志·魏书·武帝纪》",
    quote: "燔其积聚，不过三日，袁氏自败也",
    url: "https://zh.wikisource.org/zh-hans/%E4%B8%89%E5%9C%8B%E5%BF%97/%E5%8D%B701",
  },
  {
    number: 22,
    title: "长平之战",
    period: "公元前260年",
    summary: "白起诱赵括出垒，以奇兵断其粮道、围其前军，赵军溃败，赵国主力尽失。",
    source: "《史记·白起王翦列传》",
    url: "https://ctext.org/shiji/bai-qi-wang-jian-lie-zhuan/zh",
    note: "史籍载其围断粮道，后人常以此说明「关门捉贼」，但计名并非出自此役。",
  },
  {
    number: 23,
    title: "范雎献策远交近攻",
    period: "公元前3世纪",
    summary: "范雎说秦昭王：与远方国家交好，集中力量攻取邻近之地，得寸得尺皆为秦有。",
    source: "《史记·范雎蔡泽列传》",
    quote: "远交而近攻，得寸则王之寸也，得尺亦王之尺也",
    url: "https://ctext.org/shiji/fan-sui-cai-ze-lie-zhuan/zh",
  },
  {
    number: 24,
    title: "晋假道于虞以伐虢",
    period: "公元前655年",
    summary: "晋献公两次向虞借道伐虢，宫之奇以「唇亡齿寒」力谏不听；晋灭虢后回师顺手灭虞。",
    source: "《左传·僖公五年》",
    quote: "一之谓甚，其可再乎",
    url: "https://ctext.org/chun-qiu-zuo-zhuan/xi-gong-wu-nian/zh",
  },
  {
    number: 33,
    title: "田单反间复齐",
    period: "公元前279年",
    summary: "田单利用燕惠王与乐毅的嫌隙纵反间，使骑劫代将；再以诈降松懈燕军，火牛阵反击复国。",
    source: "《史记·田单列传》",
    quote: "乐毅畏诛而不敢归，以伐齐为名，实欲连兵南面而王齐",
    url: "https://ctext.org/shiji/tian-dan-lie-zhuan/zh",
  },
  {
    number: 36,
    title: "檀道济「走为上计」",
    period: "南朝宋",
    summary: "《南齐书》记王敬则引「檀公三十六策，走是上计」，是「三十六策」一词最早的文献出处。",
    source: "《南齐书·王敬则传》",
    quote: "檀公三十六策，走是上计，汝父子唯应急走耳",
    url: "https://ctext.org/nan-qi-shu/wang-jing-ze-zhuan/zh",
  },
];

export const CASE_BY_NUMBER: Readonly<Record<number, HistoricalCase>> = Object.fromEntries(
  HISTORICAL_CASES.map((item) => [item.number, item]),
);
