import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { getXuShiOpeningStatus } from "./ziwu-liuzhu.js";
import "./style.css";

const modelStatus = document.querySelector("#modelStatus");

async function loadAcu361Data() {
  const paths = [
    "/data/acu361/points.json",
    "/data/acu361/meridians.json",
    "/data/extraordinary-vessels.json",
    "/data/point-effects.json"
  ];
  const responses = await Promise.all(paths.map((path) => fetch(path)));
  const failedResponse = responses.find((response) => !response.ok);
  if (failedResponse) {
    throw new Error(`Could not load ${failedResponse.url}: HTTP ${failedResponse.status}`);
  }
  return Promise.all(responses.map((response) => response.json()));
}

const [acupointCatalog, routeCatalog, extraordinaryVesselCatalog, pointEffectsCatalog] = await loadAcu361Data().catch((error) => {
  modelStatus.textContent = "经络与穴位数据加载失败，无法显示定位";
  console.error("Could not load Acu361 reference data.", error);
  throw error;
});

const channelCodes = ["GB", "LR", "LU", "LI", "ST", "SP", "HT", "SI", "BL", "KI", "PC", "TE"];
const fiveElements = {
  wood: { label: "木", color: "#5cae7b", accent: "#5cae7b" },
  fire: { label: "火", color: "#d95f57", accent: "#d95f57" },
  earth: { label: "土", color: "#d5a948", accent: "#d5a948" },
  metal: { label: "金", color: "#e5e3d8", accent: "#e5e3d8" },
  water: { label: "水", color: "#000000", accent: "#71879a" }
};
const elementByChannel = {
  GB: "wood", LR: "wood",
  HT: "fire", SI: "fire", PC: "fire", TE: "fire",
  SP: "earth", ST: "earth",
  LU: "metal", LI: "metal",
  KI: "water", BL: "water"
};
const palette = channelCodes.map((code) => fiveElements[elementByChannel[code]].color);
const accentPalette = channelCodes.map((code) => fiveElements[elementByChannel[code]].accent);

const channels = [
  { name: "胆经", en: "Gallbladder · Shaoyang", shichen: "子时", time: "23:00 — 01:00", direction: "头侧 → 身侧 → 下肢外侧", points: ["瞳子髎", "听会", "上关", "颔厌", "悬颅", "悬厘", "曲鬓", "率谷", "天冲", "浮白", "头窍阴", "完骨", "本神", "阳白", "头临泣", "目窗", "正营", "承灵", "脑空", "风池", "肩井", "渊腋", "辄筋", "日月", "京门", "带脉", "五枢", "维道", "居髎", "环跳", "风市", "中渎", "膝阳关", "阳陵泉", "阳交", "外丘", "光明", "阳辅", "悬钟", "丘墟", "足临泣", "地五会", "侠溪", "足窍阴"], wisdom: "子时气血流注于胆，休息是最好的养护。", path: [[-.26,3.35,.27],[-.62,2.4,.31],[-.64,1.1,.38],[-.58,.1,.38],[-.48,-1.15,.34],[-.39,-2.35,.28],[-.28,-3.22,.18]] },
  { name: "肝经", en: "Liver · Jueyin", shichen: "丑时", time: "01:00 — 03:00", direction: "足大趾 → 胫内侧 → 胁部", points: ["大敦", "行间", "太冲", "中封", "蠡沟", "中都", "膝关", "曲泉", "阴包", "足五里", "阴廉", "急脉", "章门", "期门"], wisdom: "丑时气血流注于肝，宜顺势安睡静养。", path: [[-.24,-3.28,.2],[-.34,-2.65,.3],[-.4,-1.6,.37],[-.38,-.55,.38],[-.28,.4,.38],[-.24,1.3,.34],[-.38,1.95,.31]] },
  { name: "肺经", en: "Lung · Taiyin", shichen: "寅时", time: "03:00 — 05:00", direction: "胸部 → 上臂内侧 → 拇指", points: ["中府", "云门", "天府", "侠白", "尺泽", "孔最", "列缺", "经渠", "太渊", "鱼际", "少商"], wisdom: "寅时气血流注于肺，视觉路线仅作学习参考。", path: [[-.43,1.85,.4],[-.59,2.35,.38],[-.78,1.9,.34],[-.85,1.05,.31],[-.85,.2,.29],[-.83,-.25,.25],[-.97,-.45,.18]] },
  { name: "大肠经", en: "Large Intestine · Yangming", shichen: "卯时", time: "05:00 — 07:00", direction: "食指 → 上肢外侧 → 鼻旁", points: ["商阳", "二间", "三间", "合谷", "阳溪", "偏历", "温溜", "下廉", "上廉", "手三里", "曲池", "肘髎", "手五里", "臂臑", "肩髃", "巨骨", "天鼎", "扶突", "口禾髎", "迎香"], wisdom: "卯时气血流注于大肠，生活作息因人而异。", path: [[-.97,-.42,.18],[-.84,.12,.32],[-.88,.8,.34],[-.89,1.38,.34],[-.78,2.05,.34],[-.5,2.55,.35],[-.18,3.18,.34]] },
  { name: "胃经", en: "Stomach · Yangming", shichen: "辰时", time: "07:00 — 09:00", direction: "面部 → 胸腹 → 下肢前侧", points: ["承泣", "四白", "巨髎", "地仓", "大迎", "颊车", "下关", "头维", "人迎", "水突", "气舍", "缺盆", "气户", "库房", "屋翳", "膺窗", "乳中", "乳根", "不容", "承满", "梁门", "关门", "太乙", "滑肉门", "天枢", "外陵", "大巨", "水道", "归来", "气冲", "髀关", "伏兔", "阴市", "梁丘", "犊鼻", "足三里", "上巨虚", "条口", "下巨虚", "丰隆", "解溪", "冲阳", "陷谷", "内庭", "厉兑"], wisdom: "辰时气血流注于胃，宜规律进食、从容用餐。", path: [[-.17,3.23,.35],[-.3,2.85,.36],[-.36,2.1,.4],[-.35,1.2,.4],[-.37,.35,.37],[-.44,-.8,.33],[-.43,-1.65,.3],[-.29,-3.2,.18]] },
  { name: "脾经", en: "Spleen · Taiyin", shichen: "巳时", time: "09:00 — 11:00", direction: "足大趾 → 内踝 → 腹胸侧", points: ["隐白", "大都", "太白", "公孙", "商丘", "三阴交", "漏谷", "地机", "阴陵泉", "血海", "箕门", "冲门", "府舍", "腹结", "大横", "腹哀", "食窦", "天溪", "胸乡", "周荣", "大包"], wisdom: "巳时气血流注于脾，可结合自身感受安排活动。", path: [[-.24,-3.27,.2],[-.38,-2.72,.31],[-.4,-1.7,.34],[-.42,-.8,.34],[-.4,.1,.38],[-.39,.9,.4],[-.38,1.75,.39]] },
  { name: "心经", en: "Heart · Shaoyin", shichen: "午时", time: "11:00 — 13:00", direction: "腋下 → 上臂内侧 → 小指", points: ["极泉", "青灵", "少海", "灵道", "通里", "阴郄", "神门", "少府", "少冲"], wisdom: "午时气血流注于心，适合短暂休息、舒展身心。", path: [[-.65,2.08,.32],[-.77,1.8,.34],[-.85,1.12,.32],[-.82,.48,.29],[-.84,-.12,.26],[-.79,-.43,.2],[-.9,-.48,.16]] },
  { name: "小肠经", en: "Small Intestine · Taiyang", shichen: "未时", time: "13:00 — 15:00", direction: "小指 → 上肢外侧 → 肩颈 → 耳侧", points: ["少泽", "前谷", "后溪", "腕骨", "阳谷", "养老", "支正", "小海", "肩贞", "臑俞", "天宗", "秉风", "曲垣", "肩外俞", "肩中俞", "天窗", "天容", "颧髎", "听宫"], wisdom: "未时气血流注于小肠，保持舒适节奏即可。", path: [[-.9,-.48,.16],[-.8,-.12,.28],[-.86,.52,.33],[-.85,1.2,.34],[-.76,1.85,.36],[-.62,2.5,.34],[-.23,3.23,.32]] },
  { name: "膀胱经", en: "Bladder · Taiyang", shichen: "申时", time: "15:00 — 17:00", direction: "内眼角 → 后头 → 背部 → 足外侧", points: ["睛明", "攒竹", "眉冲", "曲差", "五处", "承光", "通天", "络却", "玉枕", "天柱", "大杼", "风门", "肺俞", "厥阴俞", "心俞", "督俞", "膈俞", "肝俞", "胆俞", "脾俞", "胃俞", "三焦俞", "肾俞", "气海俞", "大肠俞", "关元俞", "小肠俞", "膀胱俞", "中膂俞", "白环俞", "上髎", "次髎", "中髎", "下髎", "会阳", "承扶", "殷门", "浮郄", "委阳", "委中", "附分", "魄户", "膏肓", "神堂", "譩譆", "膈关", "魂门", "阳纲", "意舍", "胃仓", "肓门", "志室", "胞肓", "秩边", "合阳", "承筋", "承山", "飞扬", "跗阳", "昆仑", "仆参", "申脉", "金门", "京骨", "束骨", "足通谷", "至阴"], wisdom: "申时气血流注于膀胱，久坐时可适度起身活动。", path: [[-.15,3.42,-.28],[-.32,2.98,-.38],[-.42,2.1,-.4],[-.43,1.15,-.4],[-.4,.1,-.38],[-.45,-1.05,-.35],[-.38,-2.25,-.28],[-.28,-3.22,-.18]] },
  { name: "肾经", en: "Kidney · Shaoyin", shichen: "酉时", time: "17:00 — 19:00", direction: "足底 → 内踝后 → 腹胸", points: ["涌泉", "然谷", "太溪", "大钟", "水泉", "照海", "复溜", "交信", "筑宾", "阴谷", "横骨", "大赫", "气穴", "四满", "中注", "肓俞", "商曲", "石关", "阴都", "腹通谷", "幽门", "步廊", "神封", "灵墟", "神藏", "彧中", "俞府"], wisdom: "酉时气血流注于肾，保持温暖与规律作息。", path: [[-.27,-3.28,.18],[-.35,-2.72,.3],[-.42,-2.15,.34],[-.4,-1.4,.36],[-.38,-.5,.38],[-.32,.42,.4],[-.3,1.2,.39],[-.38,1.88,.36]] },
  { name: "心包经", en: "Pericardium · Jueyin", shichen: "戌时", time: "19:00 — 21:00", direction: "胸侧 → 上臂内侧 → 中指", points: ["天池", "天泉", "曲泽", "郄门", "间使", "内关", "大陵", "劳宫", "中冲"], wisdom: "戌时气血流注于心包，适合放松心绪、准备休息。", path: [[-.42,1.85,.41],[-.57,2.2,.38],[-.77,1.83,.34],[-.8,1.08,.32],[-.8,.42,.29],[-.8,-.14,.26],[-.83,-.46,.18]] },
  { name: "三焦经", en: "Triple Burner · Shaoyang", shichen: "亥时", time: "21:00 — 23:00", direction: "无名指 → 上肢外侧 → 耳侧颞部", points: ["关冲", "液门", "中渚", "阳池", "外关", "支沟", "会宗", "三阳络", "四渎", "天井", "清冷渊", "消泺", "臑会", "肩髎", "天髎", "天牖", "翳风", "瘈脉", "颅息", "角孙", "耳门", "耳和髎", "丝竹空"], wisdom: "亥时气血流注于三焦，可循自身节奏放松身心。", path: [[-.82,-.47,.17],[-.8,-.1,.29],[-.85,.58,.33],[-.86,1.25,.35],[-.76,1.92,.36],[-.61,2.52,.34],[-.24,3.22,.34]] }
];

const pointHighlights = pointEffectsCatalog.highlights;
const modelScale = 0.004;
const pointRecordsById = new Map(acupointCatalog.points.map((point) => [point.id, point]));
const availablePointCodes = new Set(acupointCatalog.points.map((point) => point.code));
for (const pointCode of Object.keys(pointEffectsCatalog.effects)) {
  if (!availablePointCodes.has(pointCode)) throw new Error(`Unknown acupoint effect code: ${pointCode}`);
}

channels.forEach((channel, index) => {
  const code = channelCodes[index];
  const referenceChannel = routeCatalog.meridians[code];
  if (!referenceChannel) throw new Error(`Missing Acu361 route data: ${code}`);
  channel.code = code;
  channel.pointRecords = channel.points.map((name) => {
    const point = acupointCatalog.points.find((record) => record.meridian === code && record.name_zh === name);
    if (!point) throw new Error(`Missing ${code} point record: ${name}`);
    return point;
  });
  channel.routeLines = referenceChannel.lines;
  channel.path = referenceChannel.lines.L.flatMap((segment) => segment.points);
});

const extraordinaryColors = [
  { color: "#e5a56b", accent: "#f0bd83" },
  { color: "#83b5a2", accent: "#a1d2bd" },
  { color: "#aa8ed1", accent: "#c5a9ed" },
  { color: "#6bb7c0", accent: "#8ad5dd" },
  { color: "#65b99a", accent: "#87d7b6" },
  { color: "#de9d6d", accent: "#f2ba8b" },
  { color: "#7d9eca", accent: "#a1bbe0" },
  { color: "#cf8297", accent: "#e5a1b5" }
];
const extraordinaryVessels = extraordinaryVesselCatalog.vessels.map((vessel, index) => {
  const pointRecords = vessel.points.map((code) => {
    const point = pointRecordsById.get(`${code}_M`)
      ?? pointRecordsById.get(`${code}_L`)
      ?? pointRecordsById.get(`${code}_R`);
    if (!point) throw new Error(`Missing Acu361 intersection point: ${code}`);
    return point;
  });
  const referenceRoute = routeCatalog.meridians[vessel.code];
  const routeLines = referenceRoute?.lines ?? Object.fromEntries(
    Object.entries(vessel.paths).map(([side, paths]) => [
      side,
      paths.map((ids) => ({
        points: ids.map((id) => {
          const point = pointRecordsById.get(id);
          if (!point) throw new Error(`Missing Acu361 route coordinate: ${id}`);
          return point.pos;
        })
      }))
    ])
  );
  const path = Object.values(routeLines).flatMap((segments) =>
    segments.flatMap((segment) => segment.points)
  );
  const colors = extraordinaryColors[index];
  palette.push(colors.color);
  accentPalette.push(colors.accent);
  return {
    ...vessel,
    pointCodes: vessel.points,
    points: pointRecords.map((record) => record.name_zh),
    extraordinary: true,
    pointRecords,
    routeLines,
    path,
    shichen: "奇经",
    time: "不按十二时辰流注",
    wisdom: vessel.code === "CV" || vessel.code === "GV"
      ? "按 Acu361 任、督脉路线数据映射；仅作模型学习参考，不代表个体临床定位。"
      : "按主要交会穴坐标串接的简化示意，未包含全部分支，不代表完整或临床精准走向。"
  };
});
const allChannels = [...channels, ...extraordinaryVessels];

const hourNames = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const dom = {
  canvas: document.querySelector("#scene"),
  list: document.querySelector("#meridianList"),
  extraordinaryList: document.querySelector("#extraordinaryList"),
  time: document.querySelector("#digitalTime"),
  headerTime: document.querySelector("#headerTime"),
  shichen: document.querySelector("#shichenName"),
  date: document.querySelector("#solarDate"),
  progress: document.querySelector("#timeProgressFill"),
  mode: document.querySelector("#selectionMode"),
  channelNumber: document.querySelector("#channelNumber"),
  name: document.querySelector("#currentMeridianName"),
  en: document.querySelector("#currentMeridianEn"),
  glyph: document.querySelector("#channelGlyph"),
  interval: document.querySelector("#meridianTime"),
  currentShichen: document.querySelector("#currentShichen"),
  xuShiOpening: document.querySelector("#xuShiOpening"),
  direction: document.querySelector("#flowDirection"),
  pointList: document.querySelector("#pointList"),
  pointFocus: document.querySelector("#focusPointName"),
  pointCode: document.querySelector("#focusPointCode"),
  pointArea: document.querySelector("#focusPointArea"),
  pointSequence: document.querySelector("#focusPointSequence"),
  pointEffect: document.querySelector("#focusPointEffect"),
  pointEffectSource: document.querySelector("#pointEffectSource"),
  pointFocusHint: document.querySelector("#pointFocusHint"),
  pointCallout: document.querySelector("#pointCallout"),
  calloutPointName: document.querySelector("#calloutPointName"),
  calloutPointCode: document.querySelector("#calloutPointCode"),
  calloutPointArea: document.querySelector("#calloutPointArea"),
  pointInfoDialog: document.querySelector("#pointInfoDialog"),
  pointInfoTitle: document.querySelector("#pointInfoTitle"),
  pointInfoCode: document.querySelector("#pointInfoCode"),
  pointInfoSummary: document.querySelector("#pointInfoSummary"),
  pointInfoMeridian: document.querySelector("#pointInfoMeridian"),
  pointInfoSequence: document.querySelector("#pointInfoSequence"),
  pointInfoLandmark: document.querySelector("#pointInfoLandmark"),
  pointInfoDiagram: document.querySelector("#pointInfoDiagram"),
  pointLocationDiagram: document.querySelector("#pointLocationDiagram"),
  modelStatus,
  wisdom: document.querySelector("#wisdomText")
};

const renderer = new THREE.WebGLRenderer({
  canvas: dom.canvas,
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
camera.position.set(0, 0.55, 14);
const controls = new OrbitControls(camera, dom.canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.enableZoom = true;
controls.zoomSpeed = 0.9;
controls.minDistance = 1.8;
controls.maxDistance = 20;
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.PAN
};
controls.target.set(0, -0.16, 0);
controls.minPolarAngle = Math.PI * 0.25;
controls.maxPolarAngle = Math.PI * 0.75;

scene.add(new THREE.HemisphereLight(0xe9e9e5, 0x272727, 1.25));
const keyLight = new THREE.DirectionalLight(0xfff0e5, 2.1);
keyLight.position.set(-4, 6, 7);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xb5bfca, 0.75);
fillLight.position.set(4, 1, -6);
scene.add(fillLight);
const rimLight = new THREE.DirectionalLight(0xc9c3b9, 0.9);
rimLight.position.set(3, 4, -4);
scene.add(rimLight);
const floor = new THREE.GridHelper(12, 24, 0x415248, 0x26352d);
floor.position.y = -3.16;
floor.material.transparent = true;
floor.material.opacity = 0.26;
scene.add(floor);

const bodyRoot = new THREE.Group();
bodyRoot.position.y = -3.15;
bodyRoot.scale.setScalar(modelScale);
scene.add(bodyRoot);
const skinMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  vertexColors: true,
  roughness: 0.78,
  metalness: 0,
  specularIntensity: 0.26,
  specularColor: 0xe7d5ca,
  sheen: 0.08,
  sheenColor: 0xb89c8e,
  sheenRoughness: 0.92
});
let genitalMosaic = null;
let skinModelLoaded = false;
const genitalMosaicFrontAnchor = new THREE.Vector3(0, 770, 150);
const genitalMosaicSideAnchor = new THREE.Vector3(0, 745, 90);
const genitalMosaicWorldPosition = new THREE.Vector3();
const cameraWorldPosition = new THREE.Vector3();

function createMosaicTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 120;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the privacy mosaic texture.");
  const palette = ["#bca996", "#d0bdab", "#c5b19e", "#d7c6b6", "#ae9c8b", "#cbb9a8"];

  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 10; column += 1) {
      const paletteIndex = (row * 3 + column * 5 + row * column) % palette.length;
      context.fillStyle = palette[paletteIndex];
      context.fillRect(column * 12, row * 12, 12, 12);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

function updateGenitalMosaicVisibility() {
  if (!genitalMosaic) return;
  const cameraOffset = camera.getWorldPosition(cameraWorldPosition).sub(bodyRoot.position);
  const frontFacing = cameraOffset.z > Math.abs(cameraOffset.x) * 0.2;
  const sideFacing = Math.abs(cameraOffset.x) >= Math.abs(cameraOffset.z)
    && cameraOffset.z > -0.05;
  genitalMosaic.visible = frontFacing || sideFacing;
  if (!genitalMosaic.visible) return;

  const anchor = frontFacing ? genitalMosaicFrontAnchor : genitalMosaicSideAnchor;
  genitalMosaicWorldPosition.copy(anchor);
  bodyRoot.localToWorld(genitalMosaicWorldPosition);
  genitalMosaic.position.copy(genitalMosaicWorldPosition);
  genitalMosaic.scale.set(
    frontFacing ? 0.44 : 0.24,
    frontFacing ? 0.44 : 0.36,
    1
  );
}

function addNaturalSkinTones(geometry) {
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const base = new THREE.Color(0xd2b7a2);
  const flush = new THREE.Color(0xc89e93);
  const gaussian = (value, center, spread) => {
    const normalized = (value - center) / spread;
    return Math.exp(-(normalized ** 2));
  };

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const front = THREE.MathUtils.smoothstep(z, 20, 100);
    const cheek = (
      gaussian(Math.abs(x), 58, 42) * gaussian(y, 1575, 48) * front
    );
    const elbow = (
      gaussian(Math.abs(x), 270, 48) * gaussian(y, 880, 90)
    );
    const knee = (
      gaussian(Math.abs(x), 70, 55) * gaussian(y, 475, 75) * front
    );
    const warmth = Math.min(0.08, cheek * 0.06 + elbow * 0.025 + knee * 0.03);
    const color = base.clone().lerp(flush, warmth);
    color.toArray(colors, index * 3);
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

new GLTFLoader().load(
  "/models/acu361-skin.glb",
  (gltf) => {
    gltf.scene.traverse((object) => {
      if (!object.isMesh) return;
      addNaturalSkinTones(object.geometry);
      object.material = skinMaterial;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    bodyRoot.add(gltf.scene);
    genitalMosaic = new THREE.Sprite(new THREE.SpriteMaterial({
      map: createMosaicTexture(),
      depthTest: false,
      depthWrite: false
    }));
    genitalMosaicWorldPosition.copy(genitalMosaicFrontAnchor);
    bodyRoot.localToWorld(genitalMosaicWorldPosition);
    genitalMosaic.position.copy(genitalMosaicWorldPosition);
    genitalMosaic.scale.set(0.44, 0.44, 1);
    genitalMosaic.renderOrder = 1;
    scene.add(genitalMosaic);
    skinModelLoaded = true;
    dom.modelStatus.hidden = true;
    schedulePointDiagramCapture(
      allChannels[activeIndex],
      focusedPointIndex ?? getTimeFocusIndex(allChannels[activeIndex]),
      getPreferredSide()
    );
  },
  undefined,
  (error) => {
    dom.modelStatus.textContent = "人体皮肤模型加载失败，穴位坐标无法对照";
    console.error("Could not load the Acu361 skin model.", error);
  }
);
const routeGroup = new THREE.Group();
bodyRoot.add(routeGroup);
const routeEntries = [];
const raycaster = new THREE.Raycaster();
raycaster.params.Line.threshold = 0.12;
const pointer = new THREE.Vector2();
let activeIndex = 0;
let manualSelection = false;
let currentMinute = 0;
let focusedPointIndex = null;
let focusedSide = "L";
let isolatedPoint = null;
let pointDiagramKey = null;
let pointDiagramCaptureFrame = null;
let lastXuShiMarkup = null;
let pointCalloutMarker = null;
let pointCalloutSize = { width: 120, height: 80 };
let pointCalloutPosition = { left: null, top: null };

function makeRoute(index, side) {
  const channel = allChannels[index];
  const segments = channel.routeLines[side] ?? [];
  const curves = [];
  const meshes = [];
  const lengths = [];
  for (const segment of segments) {
    const points = segment.points.map((point) => new THREE.Vector3(...point));
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    const geometry = new THREE.TubeGeometry(curve, Math.max(points.length * 2, 8), 0.6, 5, false);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(palette[index]).multiplyScalar(0.84),
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.channelIndex = index;
    mesh.renderOrder = 2;
    routeGroup.add(mesh);
    curves.push(curve);
    meshes.push(mesh);
    lengths.push(curve.getLength());
  }

  const beads = [];
  for (let beadIndex = 0; beadIndex < 3; beadIndex += 1) {
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(3, 12, 10),
      new THREE.MeshBasicMaterial({ color: palette[index], transparent: true, opacity: 0.95 })
    );
    bead.visible = false;
    routeGroup.add(bead);
    beads.push(bead);
  }
  const markers = channel.points.map((_, pointIndex) => {
    const record = channel.pointRecords[pointIndex];
    const sourcePoint = pointRecordsById.get(`${record.code}_${side}`)
      ?? pointRecordsById.get(`${record.code}_M`)
      ?? pointRecordsById.get(`${record.code}_L`)
      ?? pointRecordsById.get(`${record.code}_R`);
    if (!sourcePoint) throw new Error(`Missing Acu361 ${side} coordinate: ${record.code}`);
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 12, 10),
      new THREE.MeshBasicMaterial({ color: palette[index], transparent: true, opacity: 0.9 })
    );
    marker.position.fromArray(sourcePoint.pos);
    marker.visible = false;
    marker.userData = { channelIndex: index, pointIndex, side, sourcePoint };
    marker.renderOrder = 3;
    routeGroup.add(marker);
    return marker;
  });
  routeEntries.push({ index, side, meshes, curves, lengths, totalLength: lengths.reduce((sum, length) => sum + length, 0), beads, markers });
}

for (let index = 0; index < allChannels.length; index += 1) {
  const sides = Object.keys(allChannels[index].routeLines);
  for (const side of sides) makeRoute(index, side);
}

function renderMeridianList() {
  dom.list.innerHTML = channels.map((channel, index) => `
    <button class="meridian-item${index === activeIndex ? " is-active" : ""}" type="button" data-index="${index}" data-element="${elementByChannel[channel.code]}" style="--channel-accent-color:${accentPalette[index]};--channel-color:${palette[index]}" aria-pressed="${index === activeIndex}">
      <span class="meridian-index">${String(index + 1).padStart(2, "0")}</span>
      <span class="meridian-dot"></span>
      <span class="meridian-name">${channel.name}</span>
      <span class="meridian-period">${channel.time.replace(" — ", "–")}</span>
    </button>
  `).join("");
}

function renderExtraordinaryList() {
  dom.extraordinaryList.innerHTML = extraordinaryVessels.map((vessel, index) => {
    const channelIndex = channels.length + index;
    return `
      <button class="extraordinary-item${channelIndex === activeIndex ? " is-active" : ""}" type="button" data-index="${channelIndex}" style="--vessel-color:${palette[channelIndex]};--vessel-accent:${accentPalette[channelIndex]}" aria-pressed="${channelIndex === activeIndex}">
        <span class="extraordinary-dot"></span>
        <span>${vessel.name}</span>
      </button>
    `;
  }).join("");
}

function getTimeFocusIndex(channel) {
  if (channel.extraordinary) return Math.floor((channel.points.length - 1) / 2);
  return Math.min(channel.points.length - 1, Math.floor((currentMinute / 120) * channel.points.length));
}

function getPreferredSide() {
  return focusedSide;
}

function describePointRegion(position) {
  const [rawX, rawY, rawZ] = position;
  const x = Math.abs(rawX * modelScale);
  const y = rawY * modelScale - 3.15;
  const z = rawZ * modelScale;
  let region;
  if (y >= 2.45) region = "头面部";
  else if (y >= 1.55 && x >= 0.5) region = "肩颈与上臂根部";
  else if (x >= 0.58 && y >= -0.45) region = "上肢（上臂、前臂或手部）";
  else if (y >= 1.45) region = z < 0 ? "上背部" : "胸前上部";
  else if (x < 0.52 && y >= 0.15) region = "胸腹部";
  else if (y >= -0.7 && x >= 0.22) region = "髋部与大腿上段";
  else if (y >= -1.6) region = "膝周";
  else if (y >= -2.65) region = "小腿与踝周";
  else region = "足部";

  const surface = Math.abs(z) < 0.08
    ? y >= 2.45 ? "头侧" : x >= 0.58 ? "肢体外侧" : "身体侧面"
    : z > 0 ? "前侧" : "后侧";
  return `${region} · ${surface}`;
}

function updatePointLocation(channel, pointIndex) {
  const pointRecord = channel.pointRecords[pointIndex];
  const preferredSide = getPreferredSide();
  const entry = routeEntries.find((route) => route.index === activeIndex && route.side === preferredSide)
    ?? routeEntries.find((route) => route.index === activeIndex && route.side === "M")
    ?? routeEntries.find((route) => route.index === activeIndex && route.side === "L")
    ?? routeEntries.find((route) => route.index === activeIndex && route.side === "R");
  if (!entry) throw new Error(`Missing route for ${channel.code}`);
  const side = entry.side;
  focusedSide = side;
  pointCalloutMarker = entry.markers[pointIndex];
  const sourcePoint = pointCalloutMarker.userData.sourcePoint;
  const previousPoint = channel.points[pointIndex - 1] ?? "起点";
  const nextPoint = channel.points[pointIndex + 1] ?? "终点";
  const sideName = side === "M" ? "正中" : side === "L" ? "左侧" : "右侧";
  const region = describePointRegion(sourcePoint.pos);
  const boneName = sourcePoint.nearest_bone?.replace(/\.[lr]$/i, "");
  const boneDistance = Number.isFinite(sourcePoint.bone_distance_mm)
    ? `（骨距 ${sourcePoint.bone_distance_mm.toFixed(1)} mm）`
    : "";

  dom.pointFocus.textContent = channel.points[pointIndex];
  dom.pointCode.textContent = pointRecord.code;
  dom.pointArea.textContent = `模型点位 · ${sideName}${region}${boneName ? ` · 邻近骨结构：${boneName}${boneDistance}` : ""}`;
  dom.pointSequence.textContent = `${previousPoint} → ${channel.points[pointIndex]} → ${nextPoint}`;
  const pointEffect = pointEffectsCatalog.effects[pointRecord.code];
  dom.pointEffect.textContent = pointEffect
    ? `传统主治/作用概述：${pointEffect.summary}${pointEffect.caution ? ` 注意：${pointEffect.caution}` : ""}`
    : "该穴位尚无经过核对的传统主治摘要。";
  dom.pointEffectSource.textContent = pointEffectsCatalog.sourceNote;
  dom.calloutPointName.textContent = channel.points[pointIndex];
  dom.calloutPointCode.textContent = pointRecord.code;
  dom.calloutPointArea.textContent = `${sideName}${region}`;
  const diagramKey = `${pointRecord.code}_${side}`;
  if (diagramKey !== pointDiagramKey) {
    dom.pointLocationDiagram.innerHTML = renderPointDiagram(channel, pointIndex);
    pointDiagramKey = diagramKey;
    schedulePointDiagramCapture(channel, pointIndex, side);
  }
  pointCalloutSize = {
    width: dom.pointCallout.offsetWidth,
    height: dom.pointCallout.offsetHeight
  };
  pointCalloutPosition = { left: null, top: null };
}

function renderPointDiagram(channel, pointIndex) {
  const record = channel.pointRecords[pointIndex];
  return `
    <figure class="licensed-chart-reference model-point-reference">
      <div class="point-image-zoom" data-zoomable tabindex="0" aria-label="当前穴位的三维模型定位示意图，可滚轮缩放">
        <div class="point-image-layer">
          <img alt="${record.name_zh}（${record.code}）在三维模型中的当前视角截图" draggable="false" />
          <span class="point-image-placeholder">正在生成模型定位示意图…</span>
          <span class="point-model-marker" role="img" aria-label="所选穴位模型标记"></span>
        </div>
        <span class="point-image-selected-label">所选穴位 · 模型示意</span>
        <span class="point-image-zoom-hint">滚轮缩放 · 放大后拖动 · 双击复位</span>
      </div>
      <figcaption>
        当前选择：${record.name_zh} · ${record.code} · ${channel.name}<br />
        <a href="https://github.com/Elwyn921/Acu361" target="_blank" rel="noreferrer">Acu361 专家共识坐标 · CC BY-SA 4.0</a><br />
        Z-Anatomy 皮肤模型当前视角生成的原创示意图；标记对应当前所选穴位。图示仅供学习参考，不代表个体临床精准定位。
      </figcaption>
    </figure>
    `;
}

function schedulePointDiagramCapture(channel, pointIndex, side) {
  if (pointDiagramCaptureFrame !== null) cancelAnimationFrame(pointDiagramCaptureFrame);
  pointDiagramCaptureFrame = requestAnimationFrame(() => {
    pointDiagramCaptureFrame = null;
    if (!skinModelLoaded) return;

    const viewer = dom.pointLocationDiagram.querySelector("[data-zoomable]");
    const image = viewer?.querySelector("img");
    const placeholder = viewer?.querySelector(".point-image-placeholder");
    const marker = viewer?.querySelector(".point-model-marker");
    const entry = routeEntries.find((route) => route.index === activeIndex && route.side === side);
    const pointMarker = entry?.markers[pointIndex];
    if (!viewer || !image || !marker || !pointMarker) return;

    renderer.render(scene, camera);
    const projected = pointMarker.getWorldPosition(new THREE.Vector3()).project(camera);
    const sourceWidth = dom.canvas.width;
    const sourceHeight = dom.canvas.height;
    if (!sourceWidth || !sourceHeight) return;
    const cropWidth = Math.min(sourceWidth, sourceHeight * 1.5);
    const cropHeight = cropWidth / 1.5;
    const pointX = (projected.x * 0.5 + 0.5) * sourceWidth;
    const pointY = (-projected.y * 0.5 + 0.5) * sourceHeight;
    const cropX = THREE.MathUtils.clamp(pointX - cropWidth / 2, 0, sourceWidth - cropWidth);
    const cropY = THREE.MathUtils.clamp(pointY - cropHeight / 2, 0, sourceHeight - cropHeight);
    const snapshot = document.createElement("canvas");
    snapshot.width = 900;
    snapshot.height = 600;
    const context = snapshot.getContext("2d");
    if (!context) throw new Error("Could not create the model locator snapshot.");

    try {
      context.drawImage(
        dom.canvas,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, snapshot.width, snapshot.height
      );
      image.src = snapshot.toDataURL("image/png");
      placeholder.hidden = true;
    } catch (error) {
      console.error("Could not capture the Acu361 model locator.", error);
      image.alt = "模型定位图生成失败";
      placeholder.textContent = "模型定位图生成失败，请刷新后重试。";
      return;
    }

    const bounds = viewer.getBoundingClientRect();
    const left = ((pointX - cropX) / cropWidth) * bounds.width;
    const top = ((pointY - cropY) / cropHeight) * bounds.height;
    const visible = projected.z >= -1 && projected.z <= 1
      && Math.abs(projected.x) <= 1
      && Math.abs(projected.y) <= 1;
    marker.hidden = !visible;
    if (visible) {
      marker.style.left = `${left}px`;
      marker.style.top = `${top}px`;
    }
    marker.setAttribute("aria-label", `${channel.points[pointIndex]} ${channel.pointRecords[pointIndex].code} 穴位标记`);
  });
}

function getPointViewDirection(sourcePoint) {
  const [x, y, z] = sourcePoint.pos;
  const direction = new THREE.Vector3();
  if (y < 80) direction.set(Math.sign(x) * 0.15, -0.65, Math.sign(z || 1) * 0.75);
  else if (z < -45) direction.set(0, 0, -1);
  else if (z > 45) direction.set(0, 0, 1);
  else if (Math.abs(x) > 230) direction.set(Math.sign(x), 0, 0.25);
  else direction.set(0, 0, 1);
  return direction.normalize();
}

function getPointImageZoomState(viewer) {
  let state = pointImageZoomStates.get(viewer);
  if (!state) {
    state = { scale: 1, x: 0, y: 0, pointerId: null, lastX: 0, lastY: 0 };
    pointImageZoomStates.set(viewer, state);
  }
  return state;
}

function updatePointImageZoom(viewer, state) {
  const imageLayer = viewer.querySelector(".point-image-layer") ?? viewer.querySelector("img");
  imageLayer.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
  viewer.classList.toggle("is-zoomed", state.scale > 1);
}

function renderPointList(channel) {
  const focusIndex = focusedPointIndex ?? getTimeFocusIndex(channel);
  const highlightedPoints = new Set(pointHighlights[channel.code] ?? []);
  document.querySelector("#pointSectionHeading").textContent = channel.extraordinary ? "交会穴" : "经络全部穴位";
  document.querySelector("#pointCount").textContent = String(channel.points.length).padStart(2, "0");
  dom.pointList.innerHTML = channel.points.map((point, index) => `
    <button class="point-row${focusIndex === index ? " is-current" : ""}" type="button" data-point-index="${index}" aria-pressed="${focusIndex === index}">
      <span class="point-index">${String(index + 1).padStart(2, "0")}</span>
      <span class="point-name">${point}</span>
      ${highlightedPoints.has(point) ? '<span class="point-highlight">重点</span>' : ""}
    </button>
  `).join("");
  updatePointLocation(channel, focusIndex);
  dom.pointFocusHint.textContent = focusedPointIndex !== null
    ? "已放大定位 · 专家共识模型"
    : channel.extraordinary
      ? "奇经交会穴连线 · 学习示意"
    : manualSelection
      ? "所选经络浏览游标 · 演示"
      : "当前时段焦点 · 演示";
}

function renderXuShiOpening(now) {
  const status = getXuShiOpeningStatus(now);
  const renderEvent = (label, event) => {
    if (!event) return "";
    const buttons = event.points.map(({ channelCode, pointName }) => {
      const channelIndex = channels.findIndex((channel) => channel.code === channelCode);
      const pointIndex = channels[channelIndex]?.points.indexOf(pointName) ?? -1;
      if (channelIndex < 0 || pointIndex < 0) {
        throw new Error(`Unknown Xu Shi opening point: ${channelCode} ${pointName}`);
      }
      return `<button class="opening-point" type="button" data-channel-index="${channelIndex}" data-point-index="${pointIndex}">${pointName}</button>`;
    }).join("");
    return `<div class="opening-event"><span>${label} · ${event.timePillar}时 ${event.time}</span><div>${buttons}</div></div>`;
  };

  const dayLabel = `${status.day.stem}${status.day.branch}日`;
  const currentLabel = status.current
    ? `当前开穴 · ${dayLabel} ${status.hourBranch}时`
    : `${dayLabel} ${status.hourBranch}时 · 本法此时无开穴`;
  const markup = `
    <div class="opening-status">${currentLabel}</div>
    ${renderEvent(status.current ? "当前穴位" : "上一开穴", status.current ?? status.previous)}
    ${status.current ? renderEvent("下一开穴", status.next) : renderEvent("下一开穴", status.next)}
    <p class="opening-source">按本地公历日干支查徐氏歌诀 · 点穴名可定位</p>
  `;
  if (markup !== lastXuShiMarkup) {
    dom.xuShiOpening.innerHTML = markup;
    lastXuShiMarkup = markup;
  }
}

function updateActiveVisuals() {
  for (const entry of routeEntries) {
    const active = entry.index === activeIndex;
    for (const mesh of entry.meshes) {
      mesh.visible = isolatedPoint === null;
      mesh.material.opacity = active ? 0.98 : 0.13;
    }
    for (const bead of entry.beads) bead.visible = active && isolatedPoint === null;
    const channel = allChannels[entry.index];
    const focusIndex = focusedPointIndex ?? getTimeFocusIndex(channel);
    for (const [pointIndex, marker] of entry.markers.entries()) {
      const focused = pointIndex === focusIndex
        && (focusedPointIndex === null || entry.side === focusedSide || entry.side === "M");
      const selected = isolatedPoint
        && isolatedPoint.channelIndex === entry.index
        && isolatedPoint.pointIndex === pointIndex
        && isolatedPoint.side === entry.side;
      marker.visible = isolatedPoint ? selected : active;
      marker.scale.setScalar(selected ? 1.8 : focused ? 1.2 : 1);
      marker.material.color.setHex(selected ? 0xff35d3 : palette[entry.index]);
      marker.material.opacity = selected ? 1 : focused ? 1 : 0.66;
    }
  }
  if (isolatedPoint) dom.pointCallout.hidden = true;
}

function renderDetails() {
  const channel = allChannels[activeIndex];
  document.documentElement.style.setProperty("--active-color", accentPalette[activeIndex]);
  document.documentElement.style.setProperty("--route-color", palette[activeIndex]);
  document.querySelectorAll(".meridian-item").forEach((item, index) => {
    const selected = index === activeIndex;
    item.classList.toggle("is-active", selected);
    item.setAttribute("aria-pressed", String(selected));
  });
  dom.channelNumber.textContent = String(activeIndex + 1).padStart(2, "0");
  dom.name.textContent = channel.name;
  dom.en.textContent = channel.en;
  dom.glyph.textContent = channel.name.slice(0, 1);
  dom.interval.textContent = channel.time;
  dom.currentShichen.textContent = channel.extraordinary ? "奇经" : channel.shichen;
  if (channel.extraordinary) dom.interval.textContent = "无固定时辰";
  dom.direction.textContent = channel.direction;
  dom.wisdom.textContent = channel.wisdom;
  dom.mode.textContent = manualSelection ? "浏览" : "实时";
  dom.mode.classList.toggle("is-browsing", manualSelection);
  document.querySelectorAll(".extraordinary-item").forEach((item) => {
    const selected = Number(item.dataset.index) === activeIndex;
    item.classList.toggle("is-active", selected);
    item.setAttribute("aria-pressed", String(selected));
  });
  if (channel.extraordinary) {
    dom.interval.textContent = "无固定时辰";
    dom.currentShichen.textContent = "奇经";
  }
  renderPointList(channel);
  updateActiveVisuals();
}

function updateViewSelection(direction) {
  const view = Math.abs(direction.x) > Math.abs(direction.z)
    ? "side"
    : direction.z < 0 ? "back" : "front";
  document.querySelectorAll(".view-button").forEach((button) => {
    const selected = button.dataset.view === view;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function focusChannel(index) {
  const channel = allChannels[index];
  const center = channel.extraordinary
    ? new THREE.Vector3(...channel.pointRecords[getTimeFocusIndex(channel)].pos)
    : channel.path.reduce((sum, point) => {
      sum.x += point[0];
      sum.y += point[1];
      sum.z += point[2];
      return sum;
    }, new THREE.Vector3()).multiplyScalar(1 / channel.path.length);
  const direction = camera.position.clone().sub(controls.target).normalize();
  if (Math.abs(center.z) > 50) direction.set(0, 0, Math.sign(center.z));
  routeGroup.updateMatrixWorld(true);
  center.applyMatrix4(routeGroup.matrixWorld);
  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(direction, 8.8);
  controls.update();
  updateViewSelection(direction);
}

function selectChannel(index, manual = true) {
  activeIndex = ((index % allChannels.length) + allChannels.length) % allChannels.length;
  manualSelection = manual;
  focusedPointIndex = null;
  isolatedPoint = null;
  pointDiagramKey = null;
  if (manual) focusChannel(activeIndex);
  renderDetails();
}

function focusPoint(channelIndex, pointIndex, side = getPreferredSide()) {
  const entry = routeEntries.find((route) => route.index === channelIndex && route.side === side)
    ?? routeEntries.find((route) => route.index === channelIndex && route.side === "M");
  if (!entry) throw new Error(`Missing route for ${allChannels[channelIndex]?.code}`);
  focusedSide = entry.side;
  selectChannel(channelIndex);
  focusedPointIndex = pointIndex;
  isolatedPoint = { channelIndex, pointIndex, side: entry.side };
  renderPointList(allChannels[activeIndex]);
  const marker = entry.markers[pointIndex];
  const position = marker.getWorldPosition(new THREE.Vector3());
  const direction = getPointViewDirection(marker.userData.sourcePoint);
  controls.target.copy(position);
  camera.position.copy(position).addScaledVector(direction, 3.8);
  controls.update();
  updateViewSelection(direction);
  updateActiveVisuals();
}

function activeChannelForHour(hour) {
  return Math.floor((hour + 1) / 2) % 12;
}

function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const date = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(now);
  const elapsedMinutes = (hours % 2 === 0 ? 60 : 0) + minutes;
  dom.time.textContent = time;
  dom.headerTime.textContent = time;
  dom.date.textContent = date;
  dom.shichen.textContent = `${hourNames[activeChannelForHour(hours)]}时`;
  dom.progress.style.width = `${(elapsedMinutes / 120) * 100}%`;
  currentMinute = elapsedMinutes;
  renderXuShiOpening(now);
  if (!manualSelection) {
    const timedIndex = activeChannelForHour(hours);
    if (timedIndex !== activeIndex) activeIndex = timedIndex;
    renderDetails();
  } else {
    renderPointList(allChannels[activeIndex]);
  }
}

function setView(view) {
  const positions = {
    front: new THREE.Vector3(0, 0.34, 14),
    side: new THREE.Vector3(14, 0.34, 0),
    back: new THREE.Vector3(0, 0.34, -14)
  };
  routeGroup.rotation.y = 0;
  routeGroup.updateMatrixWorld(true);
  camera.position.copy(positions[view]);
  controls.target.set(0, -0.16, 0);
  controls.update();
  updateViewSelection(new THREE.Vector3().subVectors(camera.position, controls.target).normalize());
  updatePointLocation(allChannels[activeIndex], focusedPointIndex ?? getTimeFocusIndex(allChannels[activeIndex]));
  schedulePointDiagramCapture(
    allChannels[activeIndex],
    focusedPointIndex ?? getTimeFocusIndex(allChannels[activeIndex]),
    pointCalloutMarker.userData.side
  );
}

function resetView() {
  setView("front");
  camera.position.set(0, 0.34, 14);
  controls.target.set(0, -0.16, 0);
  controls.update();
  manualSelection = false;
  focusedPointIndex = null;
  isolatedPoint = null;
  pointDiagramKey = null;
  focusedSide = "L";
  activeIndex = activeChannelForHour(new Date().getHours());
  renderDetails();
}

dom.list.addEventListener("click", (event) => {
  const button = event.target.closest(".meridian-item");
  if (button) selectChannel(Number(button.dataset.index));
});

dom.extraordinaryList.addEventListener("click", (event) => {
  const button = event.target.closest(".extraordinary-item");
  if (button) selectChannel(Number(button.dataset.index));
});

dom.pointList.addEventListener("click", (event) => {
  const button = event.target.closest(".point-row");
  if (button) focusPoint(activeIndex, Number(button.dataset.pointIndex), getPreferredSide());
});

dom.xuShiOpening.addEventListener("click", (event) => {
  const button = event.target.closest(".opening-point");
  if (button) focusPoint(Number(button.dataset.channelIndex), Number(button.dataset.pointIndex));
});

document.querySelector("#closePointInfo").addEventListener("click", () => dom.pointInfoDialog.close());
dom.pointInfoDialog.addEventListener("click", (event) => {
  if (event.target === dom.pointInfoDialog) dom.pointInfoDialog.close();
});

const pointImageZoomStates = new WeakMap();
dom.pointLocationDiagram.addEventListener("wheel", (event) => {
  const viewer = event.target.closest("[data-zoomable]");
  if (!viewer) return;
  const state = getPointImageZoomState(viewer);
  const nextScale = THREE.MathUtils.clamp(
    state.scale * (event.deltaY < 0 ? 1.18 : 1 / 1.18),
    1,
    5
  );
  if (nextScale === state.scale) return;

  event.preventDefault();
  const bounds = viewer.getBoundingClientRect();
  const anchorX = event.clientX - bounds.left - bounds.width / 2;
  const anchorY = event.clientY - bounds.top - bounds.height / 2;
  const scaleRatio = nextScale / state.scale;
  state.x = anchorX - (anchorX - state.x) * scaleRatio;
  state.y = anchorY - (anchorY - state.y) * scaleRatio;
  state.scale = nextScale;
  state.x = THREE.MathUtils.clamp(state.x, -bounds.width * (state.scale - 1) / 2, bounds.width * (state.scale - 1) / 2);
  state.y = THREE.MathUtils.clamp(state.y, -bounds.height * (state.scale - 1) / 2, bounds.height * (state.scale - 1) / 2);
  updatePointImageZoom(viewer, state);
}, { passive: false });

dom.pointLocationDiagram.addEventListener("pointerdown", (event) => {
  const viewer = event.target.closest("[data-zoomable]");
  if (!viewer || event.button !== 0) return;
  const state = getPointImageZoomState(viewer);
  if (state.scale === 1) return;
  state.pointerId = event.pointerId;
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  viewer.setPointerCapture(event.pointerId);
  viewer.classList.add("is-panning");
  event.preventDefault();
});

dom.pointLocationDiagram.addEventListener("pointermove", (event) => {
  const viewer = event.target.closest("[data-zoomable]");
  if (!viewer) return;
  const state = getPointImageZoomState(viewer);
  if (state.pointerId !== event.pointerId) return;
  state.x += event.clientX - state.lastX;
  state.y += event.clientY - state.lastY;
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  const bounds = viewer.getBoundingClientRect();
  state.x = THREE.MathUtils.clamp(state.x, -bounds.width * (state.scale - 1) / 2, bounds.width * (state.scale - 1) / 2);
  state.y = THREE.MathUtils.clamp(state.y, -bounds.height * (state.scale - 1) / 2, bounds.height * (state.scale - 1) / 2);
  updatePointImageZoom(viewer, state);
});

function stopPointImagePan(event) {
  const viewer = event.target.closest("[data-zoomable]");
  if (!viewer) return;
  const state = getPointImageZoomState(viewer);
  if (state.pointerId !== event.pointerId) return;
  state.pointerId = null;
  viewer.classList.remove("is-panning");
  viewer.releasePointerCapture(event.pointerId);
}

controls.addEventListener("end", () => {
  const channel = allChannels[activeIndex];
  schedulePointDiagramCapture(
    channel,
    focusedPointIndex ?? getTimeFocusIndex(channel),
    getPreferredSide()
  );
});

dom.pointLocationDiagram.addEventListener("pointerup", stopPointImagePan);
dom.pointLocationDiagram.addEventListener("pointercancel", stopPointImagePan);
dom.pointLocationDiagram.addEventListener("dblclick", (event) => {
  const viewer = event.target.closest("[data-zoomable]");
  if (!viewer) return;
  const state = getPointImageZoomState(viewer);
  state.scale = 1;
  state.x = 0;
  state.y = 0;
  updatePointImageZoom(viewer, state);
});

document.querySelectorAll(".view-button").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});
document.querySelector("#resetView").addEventListener("click", resetView);

let scenePointerStart = null;
dom.canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  scenePointerStart = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY
  };
});
dom.canvas.addEventListener("pointercancel", (event) => {
  if (scenePointerStart?.pointerId === event.pointerId) scenePointerStart = null;
});
dom.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
dom.canvas.addEventListener("pointerup", (event) => {
  const start = scenePointerStart;
  if (!start || start.pointerId !== event.pointerId) return;
  const dragged = Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4;
  scenePointerStart = null;
  if (event.button !== 0 || dragged) return;
  const bounds = dom.canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(routeGroup.children, false).find((intersection) => {
    return Number.isInteger(intersection.object.userData.channelIndex);
  });
  if (hit) {
    const { channelIndex, pointIndex, side } = hit.object.userData;
    if (Number.isInteger(pointIndex)) focusPoint(channelIndex, pointIndex, side);
    else selectChannel(channelIndex);
  }
});

function updatePointCalloutPosition() {
  if (isolatedPoint || !pointCalloutMarker) {
    dom.pointCallout.hidden = true;
    return;
  }
  const bounds = dom.canvas.parentElement.getBoundingClientRect();
  const projected = pointCalloutMarker.getWorldPosition(new THREE.Vector3()).project(camera);
  const visible = projected.z >= -1 && projected.z <= 1
    && Math.abs(projected.x) <= 1.15
    && Math.abs(projected.y) <= 1.15;
  dom.pointCallout.hidden = !visible;
  if (!visible || !bounds.width || !bounds.height) return;

  const x = (projected.x * 0.5 + 0.5) * bounds.width;
  const y = (-projected.y * 0.5 + 0.5) * bounds.height;
  const halfWidth = pointCalloutSize.width / 2;
  const showBelow = y < pointCalloutSize.height + 20;
  dom.pointCallout.classList.toggle("is-below", showBelow);
  const left = Math.round(Math.max(halfWidth + 4, Math.min(bounds.width - halfWidth - 4, x)));
  const top = Math.round(Math.max(42, Math.min(bounds.height - 24, y)));
  if (left !== pointCalloutPosition.left) {
    dom.pointCallout.style.left = `${left}px`;
    pointCalloutPosition.left = left;
  }
  if (top !== pointCalloutPosition.top) {
    dom.pointCallout.style.top = `${top}px`;
    pointCalloutPosition.top = top;
  }
}

function resize() {
  const { width, height } = dom.canvas.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(dom.canvas.parentElement);
window.addEventListener("resize", resize);

const clock = new THREE.Clock();
function pointOnRoute(entry, progress) {
  let distance = progress * entry.totalLength;
  for (let index = 0; index < entry.curves.length; index += 1) {
    const length = entry.lengths[index];
    if (distance <= length || index === entry.curves.length - 1) {
      return entry.curves[index].getPointAt(Math.min(distance / length, 1));
    }
    distance -= length;
  }
  return new THREE.Vector3();
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  for (const entry of routeEntries) {
    if (entry.index !== activeIndex) continue;
    entry.beads.forEach((bead, index) => {
      bead.position.copy(pointOnRoute(entry, (elapsed * 0.09 + index / entry.beads.length) % 1));
    });
  }
  controls.update();
  updateGenitalMosaicVisibility();
  updatePointCalloutPosition();
  renderer.render(scene, camera);
}

renderMeridianList();
renderExtraordinaryList();
resize();
updateClock();
setInterval(updateClock, 1000);
animate();
