import type { OfficeTrack, RankDynasty } from "./types";

/**
 * 八朝品级数据：秦、汉行秩石制而无「品」，每级附「约当 N 品」示意映射；
 * 曹魏创九品、北魏分正从，隋唐定型三十阶，明清简为十八级。
 * 品秩以正史职官志的通行记载为准，存疑处用「约」；
 * 「古今对应」承政策全览「官制·职级对照」的口径，仅为量级类比。
 */
export const RANK_DYNASTIES: readonly RankDynasty[] = [
  {
    id: "qin",
    name: "秦",
    period: "前221 — 前206",
    system: "三公九卿 · 印绶秩石",
    systemNote:
      "秦无「品」，以印绶与秩石定尊卑：金印紫绶最高、银印青绶次之，秩石自万石至佐史——这是「品级」诞生前夜的原生阶梯。",
    levels: [
      {
        grade: "万石",
        approxGrade: 1,
        offices: [
          {
            title: "丞相",
            branch: "civil",
            rank: "金印紫绶 · 秩万石",
            duty: "百官之长，助理万机，文官之首。",
            modern: "国务院总理（参考）",
            note: "李斯由廷尉进位丞相；相权与皇权的张力自秦已有。",
          },
          {
            title: "太尉",
            branch: "military",
            rank: "金印紫绶 · 秩万石",
            duty: "掌武事，为全国最高军职，秦常虚置不轻授。",
            modern: "中央军委主席（参考）",
            note: "实际未常设，出征临时拜将，如王翦、蒙恬。",
          },
        ],
      },
      {
        grade: "中二千石",
        approxGrade: 2,
        offices: [
          {
            title: "御史大夫",
            branch: "civil",
            rank: "银印青绶 · 秩中二千石",
            duty: "副丞相，典正法度、举劾百官，监察系统之始。",
            modern: "国家监委主任＋副总理（参考）",
          },
          {
            title: "廷尉",
            branch: "civil",
            rank: "银印青绶 · 秩中二千石",
            duty: "掌刑辟，全国司法最高长官。",
            modern: "最高法院院长＋司法部长（参考）",
          },
          {
            title: "治粟内史",
            branch: "civil",
            rank: "银印青绶 · 秩中二千石",
            duty: "掌谷货，总领国家财政。",
            modern: "财政部长（参考）",
          },
        ],
      },
      {
        grade: "二千石",
        approxGrade: 3,
        offices: [
          {
            title: "郡守",
            branch: "civil",
            rank: "秩二千石",
            duty: "一郡最高行政长官，掌民政赋役、岁终上计。",
            modern: "省长（参考）",
          },
          {
            title: "郡尉",
            branch: "military",
            rank: "秩比二千石",
            duty: "佐郡守典武职甲卒，一郡军事长官。",
            modern: "省军区司令（参考）",
          },
        ],
      },
      {
        grade: "千石 — 六百石",
        approxGrade: 5,
        offices: [
          {
            title: "县令 · 县长",
            branch: "civil",
            rank: "秩千石至六百石",
            duty: "万户以上称令、不满称长，掌一县政刑。",
            modern: "县委书记＋县长（参考）",
          },
        ],
      },
      {
        grade: "四百石 — 二百石",
        approxGrade: 8,
        offices: [
          {
            title: "县尉",
            branch: "military",
            rank: "秩四百石至二百石",
            duty: "掌一县治安巡徼、捕盗贼。",
            modern: "县武装部长（参考）",
          },
        ],
      },
      {
        grade: "百石以下",
        approxGrade: 9,
        offices: [
          {
            title: "亭长",
            branch: "civil",
            rank: "秩百石以下",
            duty: "十里一亭，掌治安捕盗、邮传迎送。",
            modern: "派出所所长（参考）",
            note: "刘邦起家之职。",
          },
        ],
      },
    ],
    source: "《汉书·百官公卿表》",
  },
  {
    id: "han",
    name: "汉",
    period: "前202 — 220",
    system: "三公九卿 · 秩石十六等",
    systemNote:
      "汉承秦制而秩石细密：万石至佐史凡十六等，以石计秩、以印绶别贵贱。「品」尚未诞生，尊卑全系于秩石。",
    levels: [
      {
        grade: "万石",
        approxGrade: 1,
        offices: [
          {
            title: "丞相 · 大司徒",
            branch: "civil",
            rank: "秩万石 · 金印紫绶",
            duty: "百官之长；哀帝改丞相为大司徒，与太尉、御史大夫合称三公。",
            modern: "国务院总理（参考）",
            note: "武帝后内朝尚书兴起，外朝丞相渐成尊位。",
            salary: "月俸约三百五十斛",
          },
          {
            title: "大司马 · 大将军",
            branch: "military",
            rank: "秩万石",
            duty: "武官之极致；卫青、霍光以大司马大将军录尚书事秉政。",
            modern: "军委副主席兼中枢执政（参考）",
            note: "汉武之后外朝三公渐让于内朝大将军。",
          },
        ],
      },
      {
        grade: "中二千石",
        approxGrade: 2,
        offices: [
          {
            title: "九卿",
            branch: "civil",
            rank: "秩中二千石 · 银印青绶",
            duty: "太常、光禄勋、卫尉、廷尉、大司农等分掌礼制宿卫刑狱财政。",
            modern: "各部部长（参考）",
          },
        ],
      },
      {
        grade: "二千石",
        approxGrade: 3,
        offices: [
          {
            title: "州牧 · 郡守",
            branch: "civil",
            rank: "秩二千石",
            duty: "东汉刺史改州牧掌一州军民；郡守掌一郡民政上计。",
            modern: "省长（参考）",
            note: "武帝置十三州刺史秩仅六百石，「以卑临尊」而权重。",
          },
        ],
      },
      {
        grade: "比二千石",
        approxGrade: 4,
        offices: [
          {
            title: "校尉 · 都尉",
            branch: "military",
            rank: "秩比二千石",
            duty: "执金吾属官巡徼京师，边郡都尉掌屯戍兵事。",
            modern: "省军区司令（参考）",
          },
        ],
      },
      {
        grade: "千石 — 六百石",
        approxGrade: 5,
        offices: [
          {
            title: "尚书令",
            branch: "civil",
            rank: "秩千石",
            duty: "尚书台之长，出纳王命、政令所归。",
            modern: "中央办公厅主任（参考）",
            note: "秩止千石而权倾朝野——「品级≠实权」最早的样本。",
          },
          {
            title: "御史中丞",
            branch: "civil",
            rank: "秩千石",
            duty: "在殿中兰台受公卿奏事，外督部刺史，内领侍御史。",
            modern: "国家监委副主任（参考）",
          },
          {
            title: "县令 · 县长",
            branch: "civil",
            rank: "秩千石至三百石",
            duty: "万户以上称令、不满称长，课农桑、理讼赋。",
            modern: "县长（参考）",
          },
        ],
      },
      {
        grade: "二百石以下",
        approxGrade: 9,
        offices: [
          {
            title: "佐史 · 亭长",
            branch: "civil",
            rank: "秩二百石以下",
            duty: "郡县少吏与亭邮之职，文书杂役所出。",
            modern: "基层办事员（参考）",
          },
        ],
      },
    ],
    source: "《汉书·百官公卿表》《后汉书·百官志》",
  },
  {
    id: "weijin",
    name: "魏晋南北朝",
    period: "220 — 589",
    system: "九品官人法 · 上品清途",
    systemNote:
      "曹魏陈群立九品官人之法，官分九品，「品」自此成为制度；北魏孝文帝太和后职令更分正从、四品以下置上下阶。门阀之下「上品无寒门，下品无势族」，品级与出身深度捆绑。",
    levels: [
      {
        grade: "一品",
        offices: [
          {
            title: "丞相 · 八公",
            branch: "civil",
            rank: "一品",
            band: 1,
            duty: "太宰、太傅、太保与丞相为上公，多授宗室勋臣门阀元老。",
            modern: "名誉国家主席（参考）",
          },
          {
            title: "大司马 · 大将军",
            branch: "military",
            rank: "一品",
            band: 1,
            duty: "都督中外诸军事者居之，军权所寄。",
            modern: "军委副主席（参考）",
          },
        ],
      },
      {
        grade: "二品 · 三品",
        offices: [
          {
            title: "录尚书事 · 尚书令",
            branch: "civil",
            rank: "约二品至三品",
            band: 2,
            duty: "总领尚书省，朝政枢纽；加「录尚书事」者即为执政。",
            modern: "国务院总理（参考）",
          },
          {
            title: "中书监 · 中书令",
            branch: "civil",
            rank: "约三品",
            band: 3,
            duty: "掌诏令机要，出纳王言，权重于秩。",
            modern: "中办＋中央政策研究室（参考）",
          },
        ],
      },
      {
        grade: "三品 · 四品",
        offices: [
          {
            title: "侍中 · 吏部尚书",
            branch: "civil",
            rank: "约三品至四品",
            band: 3,
            duty: "侍中居门下参决机要；吏部尚书掌百官铨选。",
            modern: "组织部长（参考）",
            note: "吏部之权与中正品第相表里，门阀必争之职。",
          },
          {
            title: "州刺史 · 都督诸州军事",
            branch: "civil",
            rank: "约四品，带将军号持节者权重",
            band: 4,
            duty: "一州军政长官，多带将军开府，「车上刺史」转为「马上刺史」。",
            modern: "省委书记（参考）",
          },
        ],
      },
      {
        grade: "五品",
        offices: [
          {
            title: "郡太守",
            branch: "civil",
            rank: "约五品",
            band: 5,
            duty: "一郡长官，南朝郡国分等而治。",
            modern: "市长（参考）",
          },
        ],
      },
      {
        grade: "六品 · 七品",
        offices: [
          {
            title: "县令",
            branch: "civil",
            rank: "约六品至七品",
            band: 6,
            duty: "京邑大县与边县悬殊，清望之职多归士族。",
            modern: "县长（参考）",
          },
        ],
      },
      {
        grade: "流外",
        outOfRank: true,
        offices: [
          {
            title: "台省令史 · 胥吏",
            branch: "civil",
            rank: "品外",
            duty: "台省文书胥吏不入流品，积劳方可入流。",
            modern: "基层办事员（参考）",
            note: "门阀清官居上品、寒人浊官居下位，「清」「浊」两途自此分立。",
          },
        ],
      },
    ],
    source: "《魏书·官氏志》《通典·职官》",
  },
  {
    id: "suitang",
    name: "隋唐",
    period: "581 — 907",
    system: "九品三十阶 · 流内流外",
    systemNote:
      "隋文帝定九品三十阶、罢中正官；唐承之而文武分途，散官定阶、职事定职——品级体系至此定型千年。",
    levels: [
      {
        grade: "一品",
        offices: [
          {
            title: "太师 · 太傅 · 太保",
            branch: "civil",
            rank: "正一品",
            band: 1,
            duty: "三师为天子师友，荣衔不常置。",
            modern: "名誉国家主席（参考）",
          },
          {
            title: "天策上将",
            branch: "military",
            rank: "正一品（特置）",
            band: 1,
            duty: "李世民平定天下后特置，位在王公上，唐一代仅此一人。",
            modern: "荣誉元帅（参考）",
          },
          {
            title: "骠骑大将军",
            branch: "military",
            rank: "从一品（散官）",
            band: 1,
            duty: "武散官最高阶，标识身份与章服。",
            modern: "上将衔（参考）",
          },
        ],
      },
      {
        grade: "二品",
        offices: [
          {
            title: "尚书令",
            branch: "civil",
            rank: "正二品",
            band: 2,
            duty: "尚书省长官；因太宗曾任此职，唐世臣下不敢居，故常虚置。",
            modern: "国务院总理（参考）",
          },
          {
            title: "尚书仆射",
            branch: "civil",
            rank: "从二品",
            band: 2,
            duty: "尚书省副长官，贞观间与两省长官同为宰相。",
            modern: "副总理（参考）",
          },
        ],
      },
      {
        grade: "三品",
        offices: [
          {
            title: "六部尚书",
            branch: "civil",
            rank: "正三品",
            band: 3,
            duty: "吏户礼兵刑工六部长官，政务中枢。",
            modern: "部长（参考）",
          },
          {
            title: "中书令 · 侍中",
            branch: "civil",
            rank: "正三品（大历后升正二品）",
            band: 3,
            duty: "两省长官，与仆射共议政事堂，同为宰相。",
            modern: "副总理级（参考）",
          },
          {
            title: "州刺史",
            branch: "civil",
            rank: "从三品下至正四品下，随州等",
            band: 3,
            duty: "一州长官，上州从三品、中下州降至正四品下。",
            modern: "省长／市委书记（参考）",
          },
          {
            title: "十六卫大将军",
            branch: "military",
            rank: "正三品",
            band: 3,
            duty: "南衙十六卫掌宿卫宫廷与京师戍防。",
            modern: "卫戍司令（参考）",
          },
        ],
      },
      {
        grade: "四品 · 五品",
        offices: [
          {
            title: "中书侍郎 · 门下侍郎",
            branch: "civil",
            rank: "正四品上",
            band: 4,
            duty: "两省副长官，参议政事。",
            modern: "副部长（参考）",
          },
          {
            title: "折冲都尉",
            branch: "military",
            rank: "上府正四品上至下府正五品下",
            band: 4,
            duty: "府兵折冲府长官，掌训练宿卫轮番。",
            modern: "师长（参考）",
          },
          {
            title: "给事中",
            branch: "civil",
            rank: "正五品上",
            band: 5,
            duty: "门下省封驳诏书，涂改奏抄。",
            modern: "中办法规审核（参考）",
            note: "品不高而可驳君命，封驳之权历代所重。",
          },
          {
            title: "郎中 · 员外郎",
            branch: "civil",
            rank: "从五品上 · 从六品上",
            band: 5,
            duty: "六部诸司长官，具体政务所出。",
            modern: "司局级（参考）",
          },
        ],
      },
      {
        grade: "六品 · 七品",
        offices: [
          {
            title: "县令",
            branch: "civil",
            rank: "京县正五品上至下县从七品下",
            band: 7,
            duty: "唐县分京、畿、上、中、中下、下六等，考课最繁。",
            modern: "县长（参考）",
          },
          {
            title: "侍御史",
            branch: "civil",
            rank: "从六品下",
            band: 6,
            duty: "台院御史，纠弹百僚、推鞫狱讼。",
            modern: "中央巡视组长（参考）",
          },
        ],
      },
      {
        grade: "八品 · 九品",
        offices: [
          {
            title: "县尉",
            branch: "civil",
            rank: "从八品下至从九品下",
            band: 8,
            duty: "亲理捕盗催科，进士释褐多由此入。",
            modern: "科员（参考）",
          },
          {
            title: "校书郎",
            branch: "civil",
            rank: "正九品上",
            band: 9,
            duty: "秘书省校雠典籍，起家清选。",
            modern: "科员（参考）",
            note: "品虽末而号清贵，白居易、元稹皆由此入仕。",
          },
        ],
      },
      {
        grade: "流外",
        outOfRank: true,
        offices: [
          {
            title: "令史 · 书令史",
            branch: "civil",
            rank: "流外",
            duty: "台省胥吏不入九品，积劳可入流。",
            modern: "基层办事员（参考）",
          },
        ],
      },
    ],
    source: "《唐六典》《新唐书·百官志》",
  },
  {
    id: "song",
    name: "宋",
    period: "960 — 1279",
    system: "寄禄官制 · 官职差遣",
    systemNote:
      "宋官名仅定品俸，实权另派「差遣」——官以寓禄秩、职以待文学、差遣以治事；品级与实职长期脱钩，元丰改制才渐归一。",
    levels: [
      {
        grade: "一品",
        offices: [
          {
            title: "三师 · 三公",
            branch: "civil",
            rank: "正一品",
            band: 1,
            duty: "太师、太傅、太保与三公，宰执加官与宗室荣衔。",
            modern: "名誉国家主席（参考）",
          },
        ],
      },
      {
        grade: "二品",
        offices: [
          {
            title: "宰相 · 同平章事",
            branch: "civil",
            rank: "差遣 · 品随寄禄官",
            band: 2,
            duty: "首相领政事堂，品级随本官寄禄官而定。",
            modern: "国务院总理（参考）",
            note: "同一相位，品可悬殊——「官」与「职」分离的枢纽。",
          },
          {
            title: "枢密使",
            branch: "military",
            rank: "差遣",
            band: 2,
            duty: "执掌军国机务，与中书对掌文武二柄。",
            modern: "军委副主席（参考）",
          },
          {
            title: "参知政事",
            branch: "civil",
            rank: "差遣",
            band: 2,
            duty: "副相，分宰相之权。",
            modern: "副总理（参考）",
          },
        ],
      },
      {
        grade: "二品 · 三品",
        offices: [
          {
            title: "六部尚书",
            branch: "civil",
            rank: "从二品（元丰后实化）",
            band: 2,
            duty: "改制前为寄禄虚名，改制后实掌部务。",
            modern: "部长（参考）",
          },
          {
            title: "御史中丞",
            branch: "civil",
            rank: "约从三品（寄禄定品）",
            band: 3,
            duty: "台院长官纠弹百官，台谏许风闻言事。",
            modern: "国家监委副主任（参考）",
          },
        ],
      },
      {
        grade: "四品 · 五品",
        offices: [
          {
            title: "知州 · 知府",
            branch: "civil",
            rank: "差遣 · 品随本官",
            band: 4,
            duty: "差遣知某州军州事，实掌州政。",
            modern: "市委书记（参考）",
            note: "「知」字官皆差遣，故有知州知县之称。",
          },
          {
            title: "转运使",
            branch: "civil",
            rank: "差遣",
            band: 4,
            duty: "漕司按察一路财赋转运、兼纠官吏。",
            modern: "省长级专员（参考）",
          },
          {
            title: "通判",
            branch: "civil",
            rank: "差遣",
            band: 5,
            duty: "州府通判与知州连署互监。",
            modern: "市委副书记＋监察专员（参考）",
          },
        ],
      },
      {
        grade: "六品 · 七品",
        offices: [
          {
            title: "知县",
            branch: "civil",
            rank: "差遣 · 京朝官为之",
            band: 7,
            duty: "以京朝官差遣知县事，县令反成寄禄官名。",
            modern: "县委书记（参考）",
            note: "高官知小县与低品知大县并存，品级与辖区彻底解耦。",
          },
        ],
      },
      {
        grade: "八品 · 九品",
        offices: [
          {
            title: "县尉 · 主簿",
            branch: "civil",
            rank: "从八品至从九品（约）",
            band: 8,
            duty: "缉捕盗贼、簿书钱谷，亲民之末。",
            modern: "科员（参考）",
          },
        ],
      },
    ],
    source: "《宋史·职官志》",
  },
  {
    id: "yuan",
    name: "元",
    period: "1206 — 1368",
    system: "中书一省 · 九品等差",
    systemNote:
      "元行中书省一省制，中书省总领六部；官分九品而以右为上，蒙古色目居要职，达鲁花赤监临府州县。",
    levels: [
      {
        grade: "一品",
        offices: [
          {
            title: "中书令",
            branch: "civil",
            rank: "正一品",
            band: 1,
            duty: "中书省长官，常以皇太子兼领，虚尊而不常视事。",
            modern: "名誉职位（参考）",
          },
          {
            title: "右丞相 · 左丞相",
            branch: "civil",
            rank: "正一品",
            band: 1,
            duty: "中书省实际长官，领六部总天下政务；元尚右，右为上。",
            modern: "国务院总理（参考）",
            note: "蒙古旧俗尚右，故右丞相居左之上。",
          },
          {
            title: "平章政事",
            branch: "civil",
            rank: "从一品",
            band: 1,
            duty: "中书省宰执，位丞相之次。",
            modern: "副总理（参考）",
          },
          {
            title: "知枢密院事",
            branch: "military",
            rank: "从一品",
            band: 1,
            duty: "枢密院掌天下兵甲机密。",
            modern: "军委副主席（参考）",
          },
        ],
      },
      {
        grade: "二品",
        offices: [
          {
            title: "右丞 · 左丞",
            branch: "civil",
            rank: "正二品",
            band: 2,
            duty: "中书省宰执，参决庶务。",
            modern: "国务委员（参考）",
          },
          {
            title: "御史大夫",
            branch: "civil",
            rank: "正二品",
            band: 2,
            duty: "御史台长官纠劾百司，与中书、枢密并称三大府。",
            modern: "国家监委主任（参考）",
          },
        ],
      },
      {
        grade: "三品",
        offices: [
          {
            title: "六部尚书",
            branch: "civil",
            rank: "正三品",
            band: 3,
            duty: "吏户礼兵刑工六部长官，隶属中书省。",
            modern: "部长（参考）",
          },
        ],
      },
      {
        grade: "路府州县",
        offices: [
          {
            title: "达鲁花赤",
            branch: "civil",
            rank: "自正三品至正八品，随署等而下",
            band: 3,
            duty: "蒙古语「镇压者」「监临官」，位在各路府州县长官之上。",
            modern: "党委书记（参考）",
            note: "蒙古色目专任，汉人南人为总管、知州以下。",
          },
          {
            title: "路总管 · 府尹",
            branch: "civil",
            rank: "正三品至从四品（约）",
            band: 3,
            duty: "路府实际行政长官，与达鲁花赤同署理事。",
            modern: "市长（参考）",
          },
        ],
      },
      {
        grade: "七品 · 九品",
        offices: [
          {
            title: "县尹",
            branch: "civil",
            rank: "从七品至从八品（约）",
            band: 8,
            duty: "亲民长官，上有达鲁花赤监临。",
            modern: "县长（参考）",
          },
          {
            title: "巡检",
            branch: "civil",
            rank: "从九品（约）",
            band: 9,
            duty: "掌关隘要地巡捕盘诘。",
            modern: "派出所所长（参考）",
          },
        ],
      },
    ],
    source: "《元史·百官志》",
  },
  {
    id: "ming",
    name: "明",
    period: "1368 — 1644",
    system: "九品十八级 · 内阁制衡",
    systemNote:
      "明罢丞相，六部直隶于上；内阁大学士始正五品而权同宰相——品级与实权再度背离，言官七品得以封驳部院。",
    levels: [
      {
        grade: "一品",
        offices: [
          {
            title: "三公 · 三孤",
            branch: "civil",
            rank: "正一品 · 从一品",
            band: 1,
            duty: "太师太傅太保、少师少傅少保，加官荣衔无实职。",
            modern: "名誉国家主席（参考）",
          },
          {
            title: "五军都督府左右都督",
            branch: "military",
            rank: "正一品",
            band: 1,
            duty: "掌兵籍与训练而不统兵调兵。",
            modern: "军委副主席（参考）",
          },
        ],
      },
      {
        grade: "二品",
        offices: [
          {
            title: "六部尚书",
            branch: "civil",
            rank: "正二品",
            band: 2,
            duty: "六部长官直接对皇帝负责。",
            modern: "部长（参考）",
          },
          {
            title: "都察院左都御史",
            branch: "civil",
            rank: "正二品",
            band: 2,
            duty: "都察院长官纠劾百司。",
            modern: "国家监委主任（参考）",
          },
          {
            title: "都指挥使",
            branch: "military",
            rank: "正二品",
            band: 2,
            duty: "都指挥使司长官，掌一省军政。",
            modern: "省军区司令（参考）",
          },
        ],
      },
      {
        grade: "三品",
        offices: [
          {
            title: "六部侍郎",
            branch: "civil",
            rank: "正三品",
            band: 3,
            duty: "部务副长官，佐尚书掌一部之政。",
            modern: "副部长（参考）",
          },
          {
            title: "按察使",
            branch: "civil",
            rank: "正三品",
            band: 3,
            duty: "提刑按察使司长官，掌一省刑名监察。",
            modern: "省高院院长＋公安厅长（参考）",
          },
          {
            title: "卫指挥使 · 锦衣卫指挥使",
            branch: "military",
            rank: "正三品",
            band: 3,
            duty: "卫（5600人）长官世袭；锦衣卫掌侍卫缉捕刑狱。",
            modern: "师长／国安部长（参考）",
          },
        ],
      },
      {
        grade: "四品 · 五品",
        offices: [
          {
            title: "知府",
            branch: "civil",
            rank: "正四品",
            band: 4,
            duty: "府级长官，承上启下。",
            modern: "市委书记＋市长（参考）",
          },
          {
            title: "内阁大学士",
            branch: "civil",
            rank: "正五品（后多加至一品）",
            band: 5,
            duty: "殿阁大学士掌票拟，中后期首辅权同宰相。",
            modern: "国务院总理（参考）",
            note: "品低权重：位在尚书之上凭加衔，票拟终须批红而后行。",
          },
          {
            title: "郎中",
            branch: "civil",
            rank: "正五品",
            band: 5,
            duty: "六部诸司长官，政务所出。",
            modern: "司局长（参考）",
          },
          {
            title: "千户",
            branch: "military",
            rank: "正五品",
            band: 5,
            duty: "千户所（1120人）长官，卫所世袭。",
            modern: "团长（参考）",
          },
        ],
      },
      {
        grade: "六品 · 七品",
        offices: [
          {
            title: "百户",
            branch: "military",
            rank: "正六品",
            band: 6,
            duty: "百户所（112人）长官。",
            modern: "营长（参考）",
          },
          {
            title: "监察御史",
            branch: "civil",
            rank: "正七品",
            band: 7,
            duty: "十三道御史分察地方与中央。",
            modern: "中央巡视组长（参考）",
          },
          {
            title: "六科给事中",
            branch: "civil",
            rank: "从七品",
            band: 7,
            duty: "封驳六部诏令，稽查章奏。",
            modern: "纪检监察组长（参考）",
            note: "品极低而权重，言官之制明代最盛。",
          },
          {
            title: "知县",
            branch: "civil",
            rank: "正七品",
            band: 7,
            duty: "亲民之官莫如县，钱谷刑名一身任之。",
            modern: "县委书记＋县长（参考）",
          },
        ],
      },
      {
        grade: "八品 · 九品",
        offices: [
          {
            title: "县主簿",
            branch: "civil",
            rank: "正九品",
            band: 9,
            duty: "佐知县典文书簿籍。",
            modern: "科员（参考）",
          },
          {
            title: "巡检",
            branch: "civil",
            rank: "从九品",
            band: 9,
            duty: "掌关隘要地巡捕盘诘。",
            modern: "派出所所长（参考）",
          },
        ],
      },
    ],
    source: "《明史·职官志》",
  },
  {
    id: "qing",
    name: "清",
    period: "1636 — 1912",
    system: "九品十八级 · 超品满汉",
    systemNote:
      "清承明制而宗室勋臣「超品」居九品之上；大学士正一品为极位，军机大臣无定品而掌实权；六部满汉复职，同署对等。",
    levels: [
      {
        grade: "超品",
        outOfRank: true,
        offices: [
          {
            title: "亲王 · 郡王",
            branch: "civil",
            rank: "超品（爵位）",
            duty: "宗室爵位居九品十八级之上，掌议政与旗务。",
            note: "不在职官品级表内，故不与九品对列。",
          },
        ],
      },
      {
        grade: "一品",
        offices: [
          {
            title: "大学士",
            branch: "civil",
            rank: "正一品",
            band: 1,
            duty: "三殿三阁内阁极位，领班军机者兼之。",
            modern: "国务院总理（参考）",
          },
          {
            title: "军机大臣",
            branch: "civil",
            rank: "无定品 · 差遣",
            band: 1,
            duty: "每日觐见承旨，实际中枢。",
            modern: "国务院总理（参考）",
            note: "军机处非正式衙门，大臣以内廷行走充任——清代权力顶点却不在品级表上。",
          },
          {
            title: "领侍卫内大臣",
            branch: "military",
            rank: "正一品",
            band: 1,
            duty: "侍卫处统帅，掌宫廷宿卫。",
            modern: "中央警卫局局长（参考）",
          },
        ],
      },
      {
        grade: "从一品",
        offices: [
          {
            title: "六部尚书",
            branch: "civil",
            rank: "从一品（雍正八年自二品升）",
            band: 1,
            duty: "部院长官满汉各一。",
            modern: "部长（参考）",
          },
          {
            title: "都察院左都御史",
            branch: "civil",
            rank: "从一品",
            band: 1,
            duty: "都察院长官满汉各一，六科并入都察院。",
            modern: "国家监委主任（参考）",
          },
          {
            title: "驻防将军",
            branch: "military",
            rank: "从一品（乾隆间定制）",
            band: 1,
            duty: "八旗驻防各省长官。",
            modern: "战区司令（参考）",
          },
        ],
      },
      {
        grade: "二品",
        offices: [
          {
            title: "总督",
            branch: "civil",
            rank: "正二品（例加兵部尚书衔至从一品）",
            band: 2,
            duty: "封疆大吏，掌一至三省军政粮饷。",
            modern: "大区书记（参考）",
          },
          {
            title: "巡抚",
            branch: "civil",
            rank: "从二品（例加侍郎衔至正二品）",
            band: 2,
            duty: "一省之主，掌民政监察。",
            modern: "省委书记（参考）",
          },
          {
            title: "布政使",
            branch: "civil",
            rank: "从二品",
            band: 2,
            duty: "承宣布政使司长官，掌一省民政财赋。",
            modern: "省长（参考）",
          },
          {
            title: "总兵",
            branch: "military",
            rank: "正二品",
            band: 2,
            duty: "绿营一镇最高武官。",
            modern: "军长（参考）",
          },
        ],
      },
      {
        grade: "三品 · 四品",
        offices: [
          {
            title: "按察使",
            branch: "civil",
            rank: "正三品",
            band: 3,
            duty: "省级刑名监察长官。",
            modern: "省高院院长＋公安厅长（参考）",
          },
          {
            title: "知府",
            branch: "civil",
            rank: "从四品（初正四品，乾隆中改）",
            band: 4,
            duty: "府级长官，承上启下。",
            modern: "市委书记（参考）",
          },
        ],
      },
      {
        grade: "五品 · 六品",
        offices: [
          {
            title: "郎中",
            branch: "civil",
            rank: "从五品（雍正八年定）",
            band: 5,
            duty: "六部诸司长官，政务所出。",
            modern: "司局级（参考）",
          },
          {
            title: "同知",
            branch: "civil",
            rank: "正五品",
            band: 5,
            duty: "府州佐贰，分掌粮盐水利。",
            modern: "副市长（参考）",
          },
          {
            title: "千总",
            branch: "military",
            rank: "正六品",
            band: 6,
            duty: "绿营营级武官，汛地分防。",
            modern: "营长（参考）",
          },
        ],
      },
      {
        grade: "七品 · 九品",
        offices: [
          {
            title: "知县",
            branch: "civil",
            rank: "正七品",
            band: 7,
            duty: "一县之令，幕友胥吏佐理。",
            modern: "县委书记＋县长（参考）",
          },
          {
            title: "县丞 · 主簿",
            branch: "civil",
            rank: "正八品 · 正九品",
            band: 8,
            duty: "县佐贰，分掌钱粮文书。",
            modern: "副县长／科员（参考）",
          },
          {
            title: "巡检",
            branch: "civil",
            rank: "从九品",
            band: 9,
            duty: "掌州县关隘巡捕弹压。",
            modern: "派出所所长（参考）",
          },
        ],
      },
    ],
    source: "《清史稿·职官志》",
  },
];

/**
 * 六条职系追踪：同一条职系在八个王朝间的名称、品秩与实权演变。
 * stops 与 RANK_DYNASTIES 同序；某朝无此职时以文字说明其实态，不留空。
 */
export const RANK_TRACKS: readonly OfficeTrack[] = [
  {
    id: "chancellor",
    name: "宰辅 · 百官之长",
    blurb: "相位的名称与品级不断变化，「一人之下」的实权却几度转移。",
    stops: [
      {
        dynastyId: "qin",
        title: "丞相",
        rank: "秩万石",
        power: "助理万机，开百官之长定式；李斯当国而郡县行。",
      },
      {
        dynastyId: "han",
        title: "丞相（后改大司徒）",
        rank: "秩万石",
        power: "武帝后内朝尚书分权，霍光以大将军录尚书事实际执政。",
      },
      {
        dynastyId: "weijin",
        title: "录尚书事 · 尚书令",
        rank: "约二品至三品",
        power: "门阀公卿录尚书事即为执政，尚书省成为政本。",
      },
      {
        dynastyId: "suitang",
        title: "中书令 · 侍中 · 仆射",
        rank: "正三品（大历后升二品）",
        power: "三省长官共议政事堂，集体宰相制定型。",
      },
      {
        dynastyId: "song",
        title: "同平章事 · 参知政事",
        rank: "差遣 · 品随寄禄官",
        power: "官名与实权分离，以差遣为相，位子与品级脱钩。",
      },
      {
        dynastyId: "yuan",
        title: "中书省右丞相",
        rank: "正一品",
        power: "一省制下相权重归，中书总领六部。",
      },
      {
        dynastyId: "ming",
        title: "内阁首辅",
        rank: "正五品起 · 例加至一品",
        power: "洪武废相，票拟须批红而后行，相权让于皇权与太监批红。",
      },
      {
        dynastyId: "qing",
        title: "军机大臣",
        rank: "无定品",
        power: "议政王大臣与南书房递让军机处，跪受笔录、承旨行事。",
      },
    ],
  },
  {
    id: "censor",
    name: "监察 · 御史台系",
    blurb: "从副丞相到正二品，监察长官以卑临尊的传统贯穿两千年。",
    stops: [
      {
        dynastyId: "qin",
        title: "御史大夫",
        rank: "中二千石",
        power: "副丞相而典正法度，监察系统之始。",
      },
      {
        dynastyId: "han",
        title: "御史大夫 · 御史中丞",
        rank: "万石（改大司空）· 千石",
        power: "成帝改大夫为大司空与丞相等秩，中丞实领台务。",
      },
      {
        dynastyId: "weijin",
        title: "御史中丞 · 治书侍御史",
        rank: "约四品至五品",
        power: "纠弹公卿不避强御，中正品第与官品互为表里。",
      },
      {
        dynastyId: "suitang",
        title: "御史大夫 · 侍御史",
        rank: "正三品 · 从六品下",
        power: "台院、殿院、察院三院分设，御史出使巡按州县。",
      },
      {
        dynastyId: "song",
        title: "御史中丞 · 知杂侍御史",
        rank: "约从三品",
        power: "台谏合一，许风闻言事，谏官权势最盛。",
      },
      {
        dynastyId: "yuan",
        title: "御史大夫",
        rank: "正二品",
        power: "位尊权重，与中书省、枢密院并称三大府。",
      },
      {
        dynastyId: "ming",
        title: "都察院左都御史 · 监察御史",
        rank: "正二品 · 正七品",
        power: "十三道御史与六科给事中交相弹劾，七品可劾二品。",
      },
      {
        dynastyId: "qing",
        title: "都察院左都御史",
        rank: "从一品",
        power: "满汉各一，六科并入都察院，科道合一。",
      },
    ],
  },
  {
    id: "military",
    name: "军事 · 最高军职",
    blurb: "太尉、都督、节度使、枢密、都督府、军机处——调兵与统兵之权始终分合。",
    stops: [
      {
        dynastyId: "qin",
        title: "太尉（虚设） · 将军",
        rank: "秩万石 · 上卿",
        power: "常备虚位不轻授，出征临时拜将，兵权归于皇帝。",
      },
      {
        dynastyId: "han",
        title: "大司马 · 大将军",
        rank: "秩万石",
        power: "卫青、霍光以大将军录尚书事，外朝武职转秉内朝。",
      },
      {
        dynastyId: "weijin",
        title: "都督中外诸军事 · 大都督",
        rank: "一品至二品（约）",
        power: "都督制成形，持节都督掌一方兵权，启南北朝武人政治。",
      },
      {
        dynastyId: "suitang",
        title: "十六卫大将军 · 节度使",
        rank: "正三品 · 节钺无品阶",
        power: "府兵卫戍京师；开元后节度使专边兵，终成藩镇。",
      },
      {
        dynastyId: "song",
        title: "枢密使 · 都统制",
        rank: "差遣",
        power: "文臣知军政，枢密掌调兵、三衙掌统兵，两权分离。",
      },
      {
        dynastyId: "yuan",
        title: "知枢密院事",
        rank: "从一品",
        power: "枢密院总天下兵甲，四怯薛宿卫直属大汗。",
      },
      {
        dynastyId: "ming",
        title: "五军都督府左都督",
        rank: "正一品",
        power: "兵部掌调兵、都督掌统兵，两权相制。",
      },
      {
        dynastyId: "qing",
        title: "军机处 · 领侍卫内大臣",
        rank: "无定品 · 正一品",
        power: "八旗都统与绿营提督分治，兵符归于军机承旨。",
      },
    ],
  },
  {
    id: "ministry",
    name: "铨叙中枢 · 尚书六部系",
    blurb: "从九卿到六部：日常政务部门的组织方式如何一路演化。",
    stops: [
      {
        dynastyId: "qin",
        title: "九卿分曹",
        rank: "中二千石",
        power: "家国事务混一，治粟内史、少府并管国财与皇室财政。",
      },
      {
        dynastyId: "han",
        title: "尚书台五曹",
        rank: "尚书令秩千石",
        power: "位低权重，尚书台渐代三公听政。",
      },
      {
        dynastyId: "weijin",
        title: "尚书省诸曹",
        rank: "吏部尚书约三品",
        power: "吏部铨选成为门阀必争，五兵、度支诸曹渐备。",
      },
      {
        dynastyId: "suitang",
        title: "六部二十四司",
        rank: "尚书正三品",
        power: "三省六部定型，六部为政务中枢沿用至清末。",
      },
      {
        dynastyId: "song",
        title: "六部 · 二十四司",
        rank: "从二品（元丰后）",
        power: "改制前虚名寄禄，改制后实掌部务。",
      },
      {
        dynastyId: "yuan",
        title: "中书省六部",
        rank: "尚书正三品",
        power: "六部隶属中书省，一省统之，无三省相抗。",
      },
      {
        dynastyId: "ming",
        title: "六部",
        rank: "尚书正二品",
        power: "直接对皇帝负责，部权最重，废相后尤甚。",
      },
      {
        dynastyId: "qing",
        title: "六部",
        rank: "尚书从一品",
        power: "满汉尚书各一，议政之权归于军机处。",
      },
    ],
  },
  {
    id: "province",
    name: "封疆 · 地方大员",
    blurb: "郡—州—道—路—省：最高地方区划与封疆大吏的权力曲线。",
    stops: [
      {
        dynastyId: "qin",
        title: "郡守",
        rank: "二千石",
        power: "郡县两级，守、尉、监分掌民政军务监察。",
      },
      {
        dynastyId: "han",
        title: "州刺史 → 州牧",
        rank: "六百石 → 二千石",
        power: "刺史秩卑权重、以卑临尊，东汉末牧镇坐大。",
      },
      {
        dynastyId: "weijin",
        title: "都督诸州军事 · 刺史",
        rank: "约三品至四品",
        power: "军政合一，「州郡置兵」，刺史带号开府。",
      },
      {
        dynastyId: "suitang",
        title: "州刺史 · 节度使",
        rank: "从三品下起",
        power: "安史后节度使兼掌军民，藩镇割据数十年。",
      },
      {
        dynastyId: "song",
        title: "知州 · 转运使",
        rank: "差遣",
        power: "路分漕、宪、仓、帅四司，互相牵制而无专阃。",
      },
      {
        dynastyId: "yuan",
        title: "行省平章 · 达鲁花赤",
        rank: "从一品 · 随署",
        power: "行中书省为最高地方区划，省制自此始。",
      },
      {
        dynastyId: "ming",
        title: "总督 · 巡抚 · 布政使",
        rank: "加衔从一品 · 正二品等",
        power: "督抚由临时差遣渐成定制，三司分权归于督抚。",
      },
      {
        dynastyId: "qing",
        title: "总督 · 巡抚",
        rank: "从一品 · 从二品加衔",
        power: "封疆定制，督抚节制全省司道府县。",
      },
    ],
  },
  {
    id: "county",
    name: "亲民 · 县级长官",
    blurb: "县是帝制中国最稳定的治理单元，县官品级却一路走低。",
    stops: [
      {
        dynastyId: "qin",
        title: "县令 · 县长",
        rank: "千石至六百石",
        power: "万户以上称令，不满称长；秦政的最后一环。",
      },
      {
        dynastyId: "han",
        title: "县令 · 县长",
        rank: "千石至三百石",
        power: "「百里之治」，课农桑、理讼赋、兴教化。",
      },
      {
        dynastyId: "weijin",
        title: "县令",
        rank: "约六品至七品",
        power: "分等悬殊，京邑大县多清望所归。",
      },
      {
        dynastyId: "suitang",
        title: "县令",
        rank: "京县正五品上至下县从七品下",
        power: "县等六级，四善二十七最的考课体系最繁密。",
      },
      {
        dynastyId: "song",
        title: "知县",
        rank: "差遣 · 京朝官为之",
        power: "县令成为虚衔，实权在「知县事」，文治下沉。",
      },
      {
        dynastyId: "yuan",
        title: "达鲁花赤 · 县尹",
        rank: "正八品上下（约）",
        power: "达鲁花赤监临在县尹之上，双长官并置。",
      },
      {
        dynastyId: "ming",
        title: "知县",
        rank: "正七品",
        power: "钱谷刑名一身任之，幕友胥吏佐理。",
      },
      {
        dynastyId: "qing",
        title: "知县",
        rank: "正七品",
        power: "「亲民之官莫如县」，上有督抚司道层层节制。",
      },
    ],
  },
];

export function getRankDynasty(id: string): RankDynasty | undefined {
  return RANK_DYNASTIES.find((dynasty) => dynasty.id === id);
}
