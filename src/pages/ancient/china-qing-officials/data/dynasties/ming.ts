import { branch, ladder, level, badges as makeBadges, node, sequence } from "../builders";
import type { DynastyAtlas } from "../types";

/** 明：废丞相设内阁，九品十八级，补子分文武。 */
export const ming: DynastyAtlas = {
  id: "ming",
  name: "明",
  period: "1368 — 1644",
  system: "九品十八级 · 内阁制衡",
  source: "《明史·职官志》《大明会典》",
  intro:
    "明太祖废丞相、权分六部，内阁渐成票拟中枢；官分九品十八级，补子绣飞禽走兽以别文武品级，厂卫与科道并立监察。",
  root: { title: "皇帝", note: "废丞相、权分六部，内阁票拟、司礼批红" },
  honorary: [
    {
      id: "ming-three-gong",
      rank: "正一品",
      title: "三公",
      children: [
        node("ming-taishi", "太师", {
          note: "明代三公为正一品荣誉衔，不常置、无定员。太师居三师之首，多为勋臣或内阁重臣加官，无实际职掌，用以尊崇元老、示以殊礼。",
        }),
        node("ming-taifu", "太傅", {
          note: "三公之一，位次太师，常与太子太傅等衔并加。多为累朝元老或外戚勋臣的虚衔，不预部院政务，朝班依加衔列于前列。",
        }),
        node("ming-taibao", "太保", {
          note: "三公之末，例以勋臣、阁老加官，属荣誉虚衔。明代不常置，无专职，用以褒崇旧勋、敦睦宗戚。",
        }),
      ],
    },
    {
      id: "ming-three-gu",
      rank: "从一品",
      title: "三孤",
      children: [
        node("ming-shaoshi", "少师", {
          note: "三孤为从一品荣誉衔，位次三公。少师居首，多由内阁大学士或勋臣加衔，无实际职掌，用以崇阁臣之望。",
        }),
        node("ming-shaofu", "少傅", {
          note: "三孤之一，位次少师，常与太子少傅并加。多为阁老、部臣的虚衔，不预政务，仅示朝廷优礼。",
        }),
        node("ming-shaobao", "少保", {
          note: "三孤之末，常加于内阁重臣与勋贵。属荣誉虚衔，无定员、无专职，朝会班序依加衔而列。",
        }),
      ],
    },
  ],
  branches: [
    branch("central", "中", "内阁与六部", "内阁掌票拟，六部分掌政务，司礼监批红，形成内外制衡。", [
      node("ming-cabinet", "内阁", {
        note: "明太祖废丞相后，内阁大学士入直文渊阁预机务，掌票拟批答章奏。首辅居首、次辅佐之，群辅分掌部院票拟。内阁本为五品衙门，后以加衔升至一品，实权在票拟而与司礼监批红相制。",
        children: [
          node("ming-grand-secretary", "殿阁大学士", {
            rank: "正五品 → 从一品",
            note: "殿阁大学士为内阁诸臣本官，洪武时秩正五品，后加尚书、三孤衔升至一品。掌票拟章奏、参预机务，是内阁办事之官。",
          }),
          node("ming-first-secretary", "首辅", {
            note: "居内阁之首，主票拟、裁决庶政，实际秉政。虽本品仅五品，常加三孤、尚书衔以崇其位。对皇帝负责，与司礼监掌印、秉笔太监相互制衡。",
          }),
          node("ming-second-secretary", "次辅", {
            note: "内阁位居第二者，佐首辅票拟章奏，分掌部院事务。首辅缺员或休假时代行阁务，常加尚书衔以重其权。",
          }),
          node("ming-cabinet-fellow", "群辅", {
            note: "内阁中除首辅、次辅外的大学士，分掌六部、都察院等衙门票拟。人数无定，多由各部尚书、侍郎入阁兼领。",
          }),
          node("ming-neige-xueshi", "内阁学士", {
            rank: "从五品",
            note: "内阁属官，掌诰敕起草、文书收发与阁中事务。为内阁办事的中下级官，进士出身者多由此历练上升。",
          }),
        ],
      }),
      node("ming-six-boards", "六部", {
        note: "吏、户、礼、兵、刑、工六部尚书正二品、侍郎正三品，分掌铨选、财赋、礼仪、军政、刑名与营造。明废丞相后六部直属皇帝，部下分司由郎中、员外郎、主事分办。",
        children: [
          { title: "吏部", duty: "掌文官铨选、升降、考绩与封爵，下设文选、验封、稽勋、考功四司。" },
          { title: "户部", duty: "掌户籍、田赋、仓储与俸禄，按省分司承办钱粮奏销。" },
          {
            title: "礼部",
            duty: "掌朝会礼仪、祭祀、贡举与外宾接待，下设仪制、祠祭、主客、精膳四司。",
          },
          { title: "兵部", duty: "掌武官铨选、军籍、军令与驿传，下设武选、职方、车驾、武库四司。" },
          { title: "刑部", duty: "掌律令刑名与各司复审，与大理寺、都察院合称三法司。" },
          { title: "工部", duty: "掌营造、水利、屯田与山泽物产，下设营缮、虞衡、都水、屯田四司。" },
        ].map(({ title, duty }, i) =>
          node(`ming-board-${i}`, title, {
            rank: "尚书 正二品 · 侍郎 正三品",
            note: `${duty}尚书总领部务，左右侍郎协理，郎中、员外郎、主事分司办事。`,
            children: [
              node(`ming-board-${i}-shangshu`, "尚书", {
                rank: "正二品",
                note: "本部正长官，总领一部政务，直接对皇帝负责。明废丞相后六部尚书位望隆重，列为九卿之首。",
              }),
              node(`ming-board-${i}-left-vice`, "左侍郎", {
                rank: "正三品",
                note: "本部副长官之一，协理部务并分掌本司事务。明代以左为上，尚书缺员时由左侍郎署理。",
              }),
              node(`ming-board-${i}-right-vice`, "右侍郎", {
                rank: "正三品",
                note: "本部副长官之一，与左侍郎分掌部务。遇大政则与左侍郎同理，分领本部诸司。",
              }),
            ],
          }),
        ),
      }),
      node("ming-sili-jian", "司礼监", {
        note: "明代宦官十二监之首，掌批红、传旨与内外章奏出纳。掌印太监总领监务，秉笔太监代皇帝批答章奏，与内阁票拟相制，是内廷机要所在。",
        children: [
          node("ming-sili-zhangyin", "掌印太监", {
            note: "司礼监最高长官，掌监印、批红与传旨，内廷文书必经其手。与内阁首辅相对，是明代内廷权力中枢。",
          }),
          node("ming-sili-bingbi", "秉笔太监", {
            note: "司礼监次官，代皇帝批答章奏、记录旨意，常兼提督东厂。掌印太监缺员时可署理监务，权柄尤重。",
          }),
        ],
      }),
      node("ming-hanlin", "翰林院", {
        note: "掌制诰、修史、经筵讲读与贡举考校，为明代文柄所出。学士居首，侍读、编修、检讨分掌讲读与编纂。翰林官多由进士高第者充任，是内阁与部院大臣的储才之地。",
        children: [
          node("ming-hanlin-xueshi", "翰林学士", {
            rank: "从五品",
            note: "翰林院长官，掌制诰起草、修史与经筵事务，备皇帝顾问。多为文学宿望，常兼充内阁或经筵讲官。",
          }),
          node("ming-hanlin-shidu", "侍读", {
            note: "翰林院属官，掌经筵讲读、陪侍皇帝读书论史。多由进士中擅长经义者任之，是清要之职。",
          }),
          node("ming-hanlin-bianxiu", "编修", {
            rank: "正七品",
            note: "翰林院史官，掌编纂实录、会典与起居注。进士二甲、三甲入翰林者多授此职，为升迁的重要阶梯。",
          }),
          node("ming-hanlin-jiantao", "检讨", {
            rank: "从七品",
            note: "翰林院属官，与编修同理编纂、校勘与制诰文字。品秩略低，同为进士入翰之起点。",
          }),
        ],
      }),
    ]),
    branch("assistant", "佐", "监察与厂卫", "都察院、六科掌纠劾封驳，锦衣卫、东厂为皇帝耳目。", [
      node("ming-censorate", "都察院", {
        note: "明代最高监察机构，左都御史正二品、右都御史次之，十三道监察御史分巡各省。掌纠劾百官、巡按州县与复审刑狱，与六科给事中并称科道。",
        children: [
          node("ming-left-censor", "左都御史", {
            rank: "正二品",
            note: "都察院正长官，掌纠察百官、肃正纲纪，率十三道监察御史巡按天下。直接对皇帝负责，位列九卿。",
          }),
          node("ming-right-censor", "右都御史", {
            note: "都察院副长官，佐左都御史掌院务，多为总督、巡抚加衔。无加衔时协理院事、分领诸道御史。",
          }),
          node("ming-inspector", "监察御史", {
            rank: "正七品",
            note: "十三道监察御史，分巡各省纠劾官吏，并巡视盐政、漕运与京营。品秩虽卑而权责甚重，直接对都察院与皇帝负责。",
          }),
        ],
      }),
      node("ming-six-offices", "六科给事中", {
        note: "掌封驳六部章奏、纠劾六部百官，独立于都察院。六科各设都给事中、左右给事中与给事中，凡六部奏事皆得封还驳正。",
      }),
      node("ming-embroidered-uniform", "锦衣卫 / 东厂", {
        note: "锦衣卫为皇帝亲军，掌侦伺百官、掌诏狱与仪仗；东厂为宦官提督的特务机构，与锦衣卫相表里。厂卫直接对皇帝负责，是明代的特务监察系统。",
        children: [
          node("ming-emb-commander", "锦衣卫指挥使", {
            rank: "正三品",
            note: "锦衣卫最高长官，掌亲军、侦伺与诏狱，直接对皇帝负责。凡奉诏捕拿、鞫讯百官，不由三法司。",
          }),
          node("ming-emb-qianhu", "千户", {
            note: "锦衣卫中层武官，分领所部校尉、力士，承办侦查、缉捕与诏狱行刑。受指挥使节制，是厂卫办事的骨干。",
          }),
          node("ming-emb-baihu", "百户", {
            note: "锦衣卫基层武官，率小旗、校尉执行侦伺、缉拿与随驾仪仗。品秩虽卑，直接经手诏狱与密探事务。",
          }),
          node("ming-dongchang-taijian", "东厂提督太监", {
            note: "东厂由司礼监秉笔太监提督，掌侦伺百官、刺探民情，与锦衣卫互相监督。直接对皇帝负责，权势往往凌驾于法司之上。",
          }),
        ],
      }),
      node("ming-dali", "大理寺", {
        note: "掌刑名复审、平反冤狱，与刑部、都察院合称三法司。大理寺卿正三品、少卿佐之，凡大狱必经三法司会审而后定谳。",
        children: [
          node("ming-dali-qing", "大理寺卿", {
            rank: "正三品",
            note: "大理寺长官，掌复审刑名、驳正冤滥，与刑部尚书、左都御史同列九卿。大狱会审时主持平反议。",
          }),
          node("ming-dali-shaoqing", "大理寺少卿", {
            note: "大理寺副长官，佐寺卿分掌复审与驳议，寺卿缺员时代理寺务。分领左右寺丞与评事办事。",
          }),
        ],
      }),
    ]),
    branch("local", "地", "省府州县", "布政司、按察司、都指挥使司三分权，府州县亲民而治。", [
      node("ming-province", "三司", {
        children: [
          node("ming-brb", "承宣布政使司", {
            rank: "从二品",
            note: "布政使掌一省民政、财赋与户籍，为省级行政长官。左右参政、参议分领诸道，考核府州县并承转朝廷政令。",
          }),
          node("ming-ca", "提刑按察使司", {
            rank: "正三品",
            note: "按察使掌一省刑名、监察与驿传，为省级司法监察长官。副使、佥事分巡各道，纠劾府州县官吏。",
          }),
          node("ming-drc", "都指挥使司", {
            rank: "正二品",
            note: "都指挥使掌一省军务、卫所与兵籍，为省级军事长官。与布政司、按察司并称三司，分权而治、互不统属。",
          }),
        ],
      }),
      node("ming-prefecture", "府", {
        children: [
          node("ming-governor", "知府", {
            rank: "正四品",
            note: "府之正官，掌一府民政、赋役、狱讼与教化，考核属州县。直接向布政司、按察司负责，为亲民之要职。",
          }),
          node("ming-vice", "同知、通判", {
            note: "府之佐贰官，同知掌粮捕、水利与军务，通判掌粮运、巡盐与刑狱。分领府中事务，知府缺员时递署府事。",
            children: [
              node("ming-tongzhi", "同知", {
                rank: "正五品",
                note: "知府副贰，专掌粮捕、水利与军务，分驻要地弹压。遇知府出缺则署理府事。",
              }),
              node("ming-tongpan", "通判", {
                rank: "正六品",
                note: "府之佐官，掌粮运、巡盐、刑狱与巡检，与同知分职而治。得直接向布政司、按察司陈事。",
              }),
            ],
          }),
        ],
      }),
      node("ming-county", "州 / 县", {
        children: [
          node("ming-magistrate", "知州 / 知县", {
            rank: "从五品 / 正七品",
            note: "知州掌一州民政、赋役与狱讼，知县掌一县政务，皆为亲民之官。州县直接承布政司、按察司与府的考核，下设佐贰分掌粮捕、簿籍与巡徼。",
            children: [
              node("ming-zhizhou", "知州", {
                rank: "从五品",
                note: "州之正官，掌一州赋役、狱讼与教化，考核属县。事繁者加衔，直接对府与布政司负责。",
              }),
              node("ming-zhixian", "知县", {
                rank: "正七品",
                note: "县之正官，掌一县赋役、狱讼、劝农与教化，直接面对编户齐民。考满由府、按察司核转，是亲民之官。",
              }),
            ],
          }),
          node("ming-aide", "县丞、主簿、典史", {
            note: "县之佐贰与属官，县丞掌粮马户籍、主簿掌簿籍文书、典史掌捕盗狱囚。品秩虽卑，为县政日常运转所必需。",
            children: [
              node("ming-xian-cheng", "县丞", {
                rank: "正八品",
                note: "县令副贰，掌粮马、户籍与水利，知县缺员时代理县务。多由贡生、监生出身者任之。",
              }),
              node("ming-zhubu", "主簿", {
                rank: "正九品",
                note: "掌簿籍文书、印钥勾检与仓廪出纳，是县中掌会计文书之官。直接对知县负责。",
              }),
              node("ming-dianshi", "典史", {
                rank: "未入流",
                note: "县属首领官，掌捕盗、狱囚与巡徼，统率弓手。无品级而承知县差遣，典狱缉捕皆其所司。",
              }),
            ],
          }),
        ],
      }),
    ]),
  ],
  hierarchyNote: "明代内阁大学士本为五品，后以加衔升至一品；品级与实权并不总相一致。",
  rankSystemLabel: "九品十八级",
  rankIntro: "明分九品十八级，文官补子绣飞禽、武官补子绣走兽，服色与补子共表品级。",
  levels: sequence([
    level("正一品", "正", "太师、太傅、太保、宗人令", {
      order: 1,
      salary: 100,
      hat: "红宝石顶",
      hatColor: "#9e2b25",
      robe: "绯袍",
      robeColor: "#8a3a37",
    }),
    level("从一品", "从", "少师、少傅、少保、太子太师", {
      order: 1,
      salary: 94,
      hat: "珊瑚顶",
      hatColor: "#c8503c",
      robe: "绯袍",
      robeColor: "#97473f",
    }),
    level("正二品", "正", "六部尚书、都察院左都御史", {
      order: 2,
      salary: 84,
      hat: "珊瑚顶",
      hatColor: "#d2694f",
      robe: "绯袍",
      robeColor: "#a2544a",
    }),
    level("从二品", "从", "布政使、都指挥同知", {
      order: 2,
      salary: 79,
      hat: "珊瑚顶",
      hatColor: "#d2694f",
      robe: "绯袍",
      robeColor: "#aa6055",
    }),
    level("正三品", "正", "侍郎、按察使、大理寺卿", {
      order: 3,
      salary: 68,
      hat: "蓝宝石顶",
      hatColor: "#2f5fa8",
      robe: "绯袍",
      robeColor: "#b26a5e",
    }),
    level("从三品", "从", "光禄寺卿、太仆寺卿、盐运使", {
      order: 3,
      salary: 63,
      hat: "蓝宝石顶",
      hatColor: "#3a6cb5",
      robe: "绯袍",
      robeColor: "#b87064",
    }),
    level("正四品", "正", "知府、太常寺少卿、通政司副使", {
      order: 4,
      salary: 54,
      hat: "青金石顶",
      hatColor: "#2b4c9b",
      robe: "绯袍",
      robeColor: "#bf786b",
    }),
    level("从四品", "从", "国子监祭酒、翰林院侍读学士", {
      order: 4,
      salary: 50,
      hat: "青金石顶",
      hatColor: "#3557a8",
      robe: "绯袍",
      robeColor: "#c67e71",
    }),
    level("正五品", "正", "郎中、知州、六部大学士本品", {
      order: 5,
      salary: 42,
      hat: "水晶顶",
      hatColor: "#b9c9d6",
      robe: "青袍",
      robeColor: "#3f5d78",
    }),
    level("从五品", "从", "员外郎、知州、监察御史", {
      order: 5,
      salary: 39,
      hat: "水晶顶",
      hatColor: "#c6d3dd",
      robe: "青袍",
      robeColor: "#496a83",
    }),
    level("正六品", "正", "主事、京县知县、通判", {
      order: 6,
      salary: 31,
      hat: "砗磲顶",
      hatColor: "#e2d9c6",
      robe: "青袍",
      robeColor: "#53768f",
    }),
    level("从六品", "从", "州同、翰林院修撰", {
      order: 6,
      salary: 29,
      hat: "砗磲顶",
      hatColor: "#e8dfcd",
      robe: "青袍",
      robeColor: "#5d8099",
    }),
    level("正七品", "正", "知县、翰林院编修、大理寺评事", {
      order: 7,
      salary: 24,
      hat: "素金顶",
      hatColor: "#c9a227",
      robe: "青袍",
      robeColor: "#678aa3",
    }),
    level("从七品", "从", "州判、翰林院检讨、中书舍人", {
      order: 7,
      salary: 22,
      hat: "素金顶",
      hatColor: "#d2ab2f",
      robe: "青袍",
      robeColor: "#7194ad",
    }),
    level("正八品", "正", "县丞、教谕、国子监学正", {
      order: 8,
      salary: 19,
      hat: "素银顶",
      hatColor: "#adb7bd",
      robe: "青袍",
      robeColor: "#7b9eb7",
    }),
    level("从八品", "从", "训导、盐课司提举", {
      order: 8,
      salary: 17,
      hat: "素银顶",
      hatColor: "#b8c1c7",
      robe: "青袍",
      robeColor: "#85a8c1",
    }),
    level("正九品", "正", "主簿、巡检、笔帖式", {
      order: 9,
      salary: 15,
      hat: "镂金顶",
      hatColor: "#d9b64a",
      robe: "青袍",
      robeColor: "#8fb2ca",
    }),
    level("从九品", "从", "典史、驿丞、闸官", {
      order: 9,
      salary: 13,
      hat: "镂金顶",
      hatColor: "#dfc15c",
      robe: "青袍",
      robeColor: "#99bcd3",
    }),
  ]),
  ladderGroups: [
    ladder("正一品", "三公、宗人令", [1]),
    ladder("从一品", "三孤、太子太师", [1]),
    ladder("正二品", "六部尚书、左都御史", [2]),
    ladder("三至六品", "侍郎、郎中、知府、知州", [3, 4, 5, 6]),
    ladder("七至九品", "知县、县丞、典史", [7, 8, 9]),
  ],
  badgesAvailable: true,
  civilBadges: makeBadges(["仙鹤", "锦鸡", "孔雀", "云雁", "白鹇", "鹭鸶", "鸂鶒", "黄鹂", "鹌鹑"]),
  militaryBadges: makeBadges(["狮子", "狮子", "虎", "豹", "熊罴", "彪", "彪", "犀牛", "海马"]),
  badgeNote:
    "明始以补子别文武：文官绣飞禽、武官绣走兽，品级一眼可辨。明制八品黄鹂、九品鹌鹑，与清制（八品鹌鹑、九品练雀）不同。",
  notes: {
    rank: "明分九品十八级，品级决定服色、补子与礼遇。",
    hat: "以材质与颜色区分官员品级高低。",
    robe: "一品至四品绯、五品至七品青、八九品绿。",
    salary: "品级越高，俸禄越多。",
    ritual: "朝会、宴会与仪仗依品级定尊卑。",
    badge: "文官补子绣飞禽、武官绣走兽。",
  },
  ritual: {
    title: "以品级定朝班",
    text: "朝会、宴会与仪仗的位次依品级高下排定。",
    left: "上僚",
    right: "下僚",
  },
  footnote: "明代补子始于洪武，文武禽兽各九品；品级与俸禄据《明史·职官志》《大明会典》。",
};
