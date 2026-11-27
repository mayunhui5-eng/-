const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const branchStartHours = {
  子: 23, 丑: 1, 寅: 3, 卯: 5, 辰: 7, 巳: 9,
  午: 11, 未: 13, 申: 15, 酉: 17, 戌: 19, 亥: 21
};

const openingsByDayStem = {
  甲: [
    ["甲戌", [["GB", "足窍阴"]]], ["丙子", [["SI", "前谷"]]],
    ["戊寅", [["ST", "陷谷"], ["GB", "丘墟"]]], ["庚辰", [["LI", "阳溪"]]],
    ["壬午", [["BL", "委中"]]], ["甲申", [["TE", "液门"]]]
  ],
  乙: [
    ["乙酉", [["LR", "大敦"]]], ["丁亥", [["HT", "少府"]]],
    ["己丑", [["SP", "太白"], ["LR", "太冲"]]], ["辛卯", [["LU", "经渠"]]],
    ["癸巳", [["KI", "阴谷"]]], ["乙未", [["PC", "劳宫"]]]
  ],
  丙: [
    ["丙申", [["SI", "少泽"]]], ["戊戌", [["ST", "内庭"]]],
    ["庚子", [["LI", "三间"], ["SI", "腕骨"]]], ["壬寅", [["BL", "昆仑"]]],
    ["甲辰", [["GB", "阳陵泉"]]], ["丙午", [["TE", "中渚"]]]
  ],
  丁: [
    ["丁未", [["HT", "少冲"]]], ["己酉", [["SP", "大都"]]],
    ["辛亥", [["LU", "太渊"], ["HT", "神门"]]], ["癸丑", [["KI", "复溜"]]],
    ["乙卯", [["LR", "曲泉"]]], ["丁巳", [["PC", "大陵"]]]
  ],
  戊: [
    ["戊午", [["ST", "厉兑"]]], ["庚申", [["LI", "二间"]]],
    ["壬戌", [["BL", "束骨"], ["ST", "冲阳"]]], ["甲子", [["GB", "阳辅"]]],
    ["丙寅", [["SI", "小海"]]], ["戊辰", [["TE", "支沟"]]]
  ],
  己: [
    ["己巳", [["SP", "隐白"]]], ["辛未", [["LU", "鱼际"]]],
    ["癸酉", [["KI", "太溪"], ["SP", "太白"]]], ["乙亥", [["LR", "中封"]]],
    ["丁丑", [["HT", "少海"]]], ["己卯", [["PC", "间使"]]]
  ],
  庚: [
    ["庚辰", [["LI", "商阳"]]], ["壬午", [["BL", "足通谷"]]],
    ["甲申", [["GB", "足临泣"], ["LI", "合谷"]]], ["丙戌", [["SI", "阳谷"]]],
    ["戊子", [["ST", "足三里"]]], ["庚寅", [["TE", "天井"]]]
  ],
  辛: [
    ["辛卯", [["LU", "少商"]]], ["癸巳", [["KI", "然谷"]]],
    ["乙未", [["LR", "太冲"], ["LU", "太渊"]]], ["丁酉", [["HT", "灵道"]]],
    ["己亥", [["SP", "阴陵泉"]]], ["辛丑", [["PC", "曲泽"]]]
  ],
  壬: [
    ["壬寅", [["BL", "至阴"]]], ["甲辰", [["GB", "侠溪"]]],
    ["丙午", [["SI", "后溪"], ["BL", "京骨"], ["TE", "阳池"]]],
    ["戊申", [["ST", "解溪"]]], ["庚戌", [["LI", "曲池"]]],
    ["壬子", [["TE", "关冲"]]]
  ],
  癸: [
    ["癸亥", [["KI", "涌泉"]]], ["乙丑", [["LR", "行间"]]],
    ["丁卯", [["HT", "神门"], ["KI", "太溪"], ["PC", "大陵"]]],
    ["己巳", [["SP", "商丘"]]], ["辛未", [["LU", "尺泽"]]],
    ["癸酉", [["PC", "中冲"]]]
  ]
};

function julianDayNumber(year, month, day) {
  const adjustment = Math.floor((14 - month) / 12);
  const adjustedYear = year + 4800 - adjustment;
  const adjustedMonth = month + 12 * adjustment - 3;
  return day
    + Math.floor((153 * adjustedMonth + 2) / 5)
    + 365 * adjustedYear
    + Math.floor(adjustedYear / 4)
    - Math.floor(adjustedYear / 100)
    + Math.floor(adjustedYear / 400)
    - 32045;
}

function getLocalJulianDay(date) {
  return julianDayNumber(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function getSexagenaryDay(date) {
  const julianDay = getLocalJulianDay(date);
  return {
    stem: stems[(julianDay + 9) % 10],
    branch: branches[(julianDay + 1) % 12]
  };
}

function formatOpeningTime(branch) {
  const start = branchStartHours[branch];
  const end = (start + 2) % 24;
  return `${String(start).padStart(2, "0")}:00–${String(end).padStart(2, "0")}:00`;
}

function getDayOpenings(date, dayOffset) {
  const openingDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset);
  const { stem } = getSexagenaryDay(openingDate);
  const julianDay = getLocalJulianDay(openingDate);
  return openingsByDayStem[stem].map(([timePillar, points]) => {
    const branch = timePillar.slice(1);
    return {
      branch,
      timePillar,
      points: points.map(([channelCode, pointName]) => ({ channelCode, pointName })),
      time: formatOpeningTime(branch),
      minute: julianDay * 1440 + branchStartHours[branch] * 60
    };
  });
}

export function getXuShiOpeningStatus(date) {
  const day = getSexagenaryDay(date);
  const hourBranch = branches[Math.floor((date.getHours() + 1) / 2) % 12];
  const nowMinute = getLocalJulianDay(date) * 1440 + date.getHours() * 60 + date.getMinutes();
  const events = [-2, -1, 0, 1, 2].flatMap((offset) => getDayOpenings(date, offset));
  const current = events.find((event) => (
    event.branch === hourBranch
    && nowMinute >= event.minute
    && nowMinute < event.minute + 120
  )) ?? null;
  const previous = events
    .filter((event) => event.minute + 120 <= nowMinute)
    .sort((left, right) => right.minute - left.minute)[0] ?? null;
  const next = events
    .filter((event) => event.minute > nowMinute)
    .sort((left, right) => left.minute - right.minute)[0] ?? null;

  return { day, hourBranch, current, previous, next };
}
