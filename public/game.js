const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const minimap = document.getElementById("minimap");
const mtx = minimap.getContext("2d");
const battleCanvas = document.getElementById("battleCanvas");
const btx = battleCanvas.getContext("2d");

ctx.imageSmoothingEnabled = false;
mtx.imageSmoothingEnabled = false;
btx.imageSmoothingEnabled = false;

const assetSheet = new Image();
const assets = {
  ready: false,
  image: assetSheet,
  monsterImages: [],
  hero: {
    down: [
      { x: 908, y: 42, w: 145, h: 185 },
      { x: 1096, y: 42, w: 145, h: 185 },
      { x: 1284, y: 42, w: 145, h: 185 }
    ],
    left: [
      { x: 900, y: 272, w: 160, h: 175 },
      { x: 1090, y: 272, w: 160, h: 175 },
      { x: 1278, y: 272, w: 160, h: 175 }
    ],
    right: [
      { x: 900, y: 488, w: 160, h: 178 },
      { x: 1090, y: 488, w: 160, h: 178 },
      { x: 1278, y: 488, w: 160, h: 178 }
    ],
    up: [
      { x: 914, y: 702, w: 140, h: 150 },
      { x: 1102, y: 702, w: 140, h: 150 },
      { x: 1288, y: 702, w: 140, h: 150 }
    ]
  },
  tiles: {
    g: { x: 18, y: 20, w: 180, h: 150 },
    f: { x: 210, y: 20, w: 190, h: 150 },
    m: { x: 405, y: 20, w: 190, h: 150 },
    p: { x: 598, y: 20, w: 190, h: 150 },
    w: { x: 20, y: 190, w: 180, h: 130 }
  },
  props: {
    tree: { x: 25, y: 588, w: 105, h: 120 },
    pine: { x: 154, y: 586, w: 100, h: 123 },
    rock: { x: 318, y: 596, w: 90, h: 80 },
    chest: { x: 15, y: 785, w: 115, h: 105 },
    flower: { x: 632, y: 603, w: 84, h: 58 }
  },
  monsters: [
    { x: 22, y: 884, w: 105, h: 92 },
    { x: 178, y: 895, w: 88, h: 88 },
    { x: 310, y: 888, w: 105, h: 88 },
    { x: 448, y: 892, w: 96, h: 80 }
  ]
};

assetSheet.onload = () => {
  assets.image = removeChromaKey(assetSheet);
  assets.monsterImages = assets.monsters.map((crop, index) => makeMonsterSprite(assets.image, crop, index));
  assets.ready = true;
};
assetSheet.src = "/assets/study-rpg-ai-sheet.png";

const tileW = 64;
const tileH = 32;
const mapW = 18;
const mapH = 18;
const monsterCount = 5;

const terrain = [
  "gggggggggggggggggg",
  "gggggggfffffgggggg",
  "gggggffffffffggggg",
  "ggggfffffggffggggg",
  "gggffffggggffggggg",
  "gggfffggwwggffgggg",
  "ggggfggwwwwggfgggg",
  "gggggggwwwwggggggg",
  "gggmmmmggggggffffg",
  "ggmmmmmmggggfffffg",
  "ggmmmmmmgggfffffgg",
  "gggmmmmggggffffggg",
  "ggggggggggggfggggg",
  "gggffggggggggggggg",
  "ggffffgggmmmmggggg",
  "gggffgggmmmmmmgggg",
  "gggggggggmmmmggggg",
  "gggggggggggggggggg"
];

const tileColors = {
  g: ["#5caf61", "#377c45", "#244d34"],
  f: ["#3f9652", "#2f6f3f", "#1d4430"],
  w: ["#4b9fc4", "#2c6d86", "#174053"],
  m: ["#89795d", "#5d503f", "#3e372f"]
};

const tileNames = {
  g: "青石原野",
  f: "杉木林",
  w: "月溪浅滩",
  m: "旧矿道"
};

const obstacles = [
  { x: 3, y: 2, type: "tree" },
  { x: 6, y: 4, type: "tree" },
  { x: 12, y: 3, type: "tree" },
  { x: 15, y: 6, type: "rock" },
  { x: 4, y: 12, type: "rock" },
  { x: 10, y: 14, type: "tree" },
  { x: 14, y: 12, type: "tree" },
  { x: 3, y: 5, type: "chest", opened: false }
];

const props = Array.from({ length: 90 }, (_, index) => ({
  x: (index * 7 + 3) % mapW + 0.22,
  y: (index * 11 + 5) % mapH + 0.18,
  type: index % 5
})).filter((item) => terrain[Math.floor(item.y)]?.[Math.floor(item.x)] !== "w");

const weapons = [
  { name: "木剑", icon: "I", power: 10, unlock: 1 },
  { name: "青铜短刃", icon: "II", power: 18, unlock: 2 },
  { name: "星纹长剑", icon: "III", power: 30, unlock: 4 },
  { name: "贤者之杖", icon: "IV", power: 45, unlock: 6 }
];

const skills = [
  { name: "专注回复", icon: "+", unlock: 1, cost: 0, desc: "恢复 35 HP" },
  { name: "破题斩", icon: "x2", unlock: 3, cost: 12, desc: "下题答对双倍伤害" },
  { name: "灵感护盾", icon: "□", unlock: 5, cost: 18, desc: "下次答错伤害减半" }
];

const monsters = [
  { name: "错题史莱姆", hp: 48, attack: 9, xp: 32, coin: 8, color: "#8c62d0" },
  { name: "遗忘菇怪", hp: 64, attack: 12, xp: 42, coin: 12, color: "#d07b52" },
  { name: "拖延石像", hp: 84, attack: 15, xp: 58, coin: 18, color: "#7b8490" },
  { name: "期末暗影", hp: 112, attack: 19, xp: 76, coin: 26, color: "#4f4f8f" }
];

const questions = [
  { subject: "math", tag: "数学", text: "36 ÷ 6 + 7 = ?", answers: ["11", "12", "13", "14"], correct: 2 },
  { subject: "math", tag: "数学", text: "一个数的 25% 是 9，这个数是多少？", answers: ["18", "27", "36", "45"], correct: 2 },
  { subject: "math", tag: "数学", text: "如果 x + 8 = 21，那么 x = ?", answers: ["11", "12", "13", "14"], correct: 2 },
  { subject: "math", tag: "数学", text: "长方形长 9、宽 4，面积是多少？", answers: ["13", "26", "36", "72"], correct: 2 },
  { subject: "english", tag: "英语", text: "“努力”最接近哪个英文单词？", answers: ["effort", "weather", "circle", "quiet"], correct: 0 },
  { subject: "english", tag: "英语", text: "Choose the correct sentence.", answers: ["She go home.", "She goes home.", "She going home.", "She gone home."], correct: 1 },
  { subject: "english", tag: "英语", text: "What is the opposite of “ancient”?", answers: ["old", "modern", "quiet", "heavy"], correct: 1 },
  { subject: "english", tag: "英语", text: "“I have finished my homework.” 是什么时态？", answers: ["一般现在时", "现在完成时", "一般过去时", "将来时"], correct: 1 },
  { subject: "science", tag: "科学", text: "水在标准大气压下的沸点是多少？", answers: ["0°C", "50°C", "100°C", "150°C"], correct: 2 },
  { subject: "science", tag: "科学", text: "太阳系中离太阳最近的行星是？", answers: ["金星", "地球", "水星", "火星"], correct: 2 },
  { subject: "science", tag: "科学", text: "植物进行光合作用主要需要哪种光源？", answers: ["月光", "阳光", "火光", "灯光"], correct: 1 },
  { subject: "science", tag: "科学", text: "人体主要通过哪个器官进行呼吸？", answers: ["胃", "肺", "肝", "骨骼"], correct: 1 }
];

const el = (id) => document.getElementById(id);
const ui = {
  level: el("level"),
  heroTitle: el("heroTitle"),
  location: el("location"),
  questText: el("questText"),
  hpBar: el("hpBar"),
  xpBar: el("xpBar"),
  hpText: el("hpText"),
  xpText: el("xpText"),
  weaponName: el("weaponName"),
  skillName: el("skillName"),
  attackText: el("attackText"),
  defeatedText: el("defeatedText"),
  coinText: el("coinText"),
  weaponList: el("weaponList"),
  skillList: el("skillList"),
  battle: el("battle"),
  battleHeroHp: el("battleHeroHp"),
  battleMonsterHp: el("battleMonsterHp"),
  battleMonsterName: el("battleMonsterName"),
  questionTag: el("questionTag"),
  battleLog: el("battleLog"),
  questionText: el("questionText"),
  answers: el("answers"),
  skillBtn: el("skillBtn"),
  fleeBtn: el("fleeBtn"),
  restartBtn: el("restartBtn")
};

const state = {
  mode: "world",
  subject: "mixed",
  player: {
    x: 2.5,
    y: 2.5,
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpNeed: 60,
    coins: 0,
    defeated: 0,
    weaponIndex: 0,
    skillIndex: 0,
    shield: false,
    doubleStrike: false,
    dir: "down",
    moving: false,
    walkTime: 0
  },
  keys: {},
  currentMonster: null,
  currentQuestion: null,
  answerLocked: false,
  message: "在大世界探索，碰到怪物开始战斗。"
};

let worldMonsters = [];
let lastTime = 0;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(640, Math.floor(rect.width));
  canvas.height = Math.max(460, Math.floor(rect.height));
  ctx.imageSmoothingEnabled = false;
}

function isoToScreen(x, y) {
  return {
    x: (x - y) * tileW / 2 + canvas.width / 2,
    y: (x + y) * tileH / 2 + 58
  };
}

function spawnMonsters() {
  worldMonsters = [];
  for (let index = 0; index < monsterCount; index += 1) {
    const pos = randomWalkablePosition(2.8);
    worldMonsters.push(makeWorldMonster(pos.x, pos.y, index % monsters.length));
  }
}

function makeWorldMonster(x, y, type) {
  const target = randomNearbyTarget(x, y);
  return {
    x,
    y,
    type,
    targetX: target.x,
    targetY: target.y,
    alive: true,
    bob: Math.random() * Math.PI * 2,
    moveTimer: 1 + Math.random() * 2,
    speed: 0.55 + Math.random() * 0.35
  };
}

function isBlocked(x, y) {
  if (x < 0.6 || y < 0.6 || x > mapW - 0.8 || y > mapH - 0.8) return true;
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (terrain[ty]?.[tx] === "w") return true;
  return hasObstacleAt(tx, ty, false);
}

function hasObstacleAt(tx, ty, includeChest) {
  return obstacles.some((item) => {
    if (item.opened || item.x !== tx || item.y !== ty) return false;
    return includeChest || item.type !== "chest";
  });
}

function isWalkableForMonster(x, y) {
  if (isBlocked(x, y)) return false;
  if (hasObstacleAt(Math.floor(x), Math.floor(y), true)) return false;
  if (isNearClosedChest(x, y)) return false;
  if (distance({ x, y }, state.player) < 1.6) return false;
  return !worldMonsters.some((monster) => monster.alive && distance(monster, { x, y }) < 1.2);
}

function isNearClosedChest(x, y) {
  return obstacles.some((item) => item.type === "chest" && !item.opened && distance(item, { x, y }) < 2);
}

function randomWalkablePosition(minPlayerDistance = 1.6) {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const x = 1 + Math.random() * (mapW - 2);
    const y = 1 + Math.random() * (mapH - 2);
    if (!isBlocked(x, y) && !hasObstacleAt(Math.floor(x), Math.floor(y), true) && !isNearClosedChest(x, y) && distance({ x, y }, state.player) >= minPlayerDistance) {
      if (!worldMonsters.some((monster) => distance(monster, { x, y }) < 1.4)) {
        return { x, y };
      }
    }
  }
  return { x: 13.5, y: 12.5 };
}

function randomNearbyTarget(x, y) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1 + Math.random() * 2.5;
    const target = {
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius
    };
    if (isWalkableForMonster(target.x, target.y)) return target;
  }
  return randomWalkablePosition();
}

function update(dt) {
  if (state.mode !== "world") return;
  const speed = 3.35 * dt;
  const dx = (state.keys.ArrowRight || state.keys.d ? 1 : 0) - (state.keys.ArrowLeft || state.keys.a ? 1 : 0);
  const dy = (state.keys.ArrowDown || state.keys.s ? 1 : 0) - (state.keys.ArrowUp || state.keys.w ? 1 : 0);
  const length = Math.hypot(dx, dy) || 1;
  state.player.moving = dx !== 0 || dy !== 0;
  if (state.player.moving) {
    state.player.walkTime += dt;
    if (Math.abs(dx) > Math.abs(dy)) {
      state.player.dir = dx > 0 ? "right" : "left";
    } else {
      state.player.dir = dy > 0 ? "down" : "up";
    }
  }
  const nx = state.player.x + dx / length * speed;
  const ny = state.player.y + dy / length * speed;

  if (!isBlocked(nx, state.player.y)) state.player.x = nx;
  if (!isBlocked(state.player.x, ny)) state.player.y = ny;

  const tile = terrain[Math.floor(state.player.y)]?.[Math.floor(state.player.x)] || "g";
  ui.location.textContent = tileNames[tile];
  updateMonsters(dt);
  checkEncounters();
}

function updateMonsters(dt) {
  worldMonsters.forEach((monster) => {
    if (!monster.alive) return;
    monster.moveTimer -= dt;
    const dx = monster.targetX - monster.x;
    const dy = monster.targetY - monster.y;
    const length = Math.hypot(dx, dy);

    if (length < 0.08 || monster.moveTimer <= 0) {
      const target = randomNearbyTarget(monster.x, monster.y);
      monster.targetX = target.x;
      monster.targetY = target.y;
      monster.moveTimer = 1.2 + Math.random() * 2.4;
      return;
    }

    const nx = monster.x + dx / length * monster.speed * dt;
    const ny = monster.y + dy / length * monster.speed * dt;
    if (isBlocked(nx, ny)) {
      monster.moveTimer = 0;
      return;
    }
    monster.x = nx;
    monster.y = ny;
  });
}

function checkEncounters() {
  const chest = obstacles.find((item) => item.type === "chest" && !item.opened);
  if (chest && distance(state.player, chest) < 0.8) {
    chest.opened = true;
    state.player.coins += 30;
    state.message = "打开宝箱，获得 30 金币。";
    renderUi();
  }

  const monster = worldMonsters.find((item) => item.alive && distance(state.player, item) < 0.72);
  if (monster) startBattle(monster);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function drawWorld(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSky();

  for (let y = 0; y < mapH; y += 1) {
    for (let x = 0; x < mapW; x += 1) {
      drawTile(x, y, terrain[y][x], time);
    }
  }

  props.forEach((prop) => drawGroundProp(prop, time));

  const drawables = [
    ...obstacles.map((item) => ({ kind: "obstacle", y: item.y + 0.6, item })),
    ...worldMonsters.filter((item) => item.alive).map((item) => ({ kind: "monster", y: item.y + 0.65, item })),
    { kind: "player", y: state.player.y + 0.7, item: state.player }
  ].sort((a, b) => a.y - b.y);

  drawables.forEach((entry) => {
    if (entry.kind === "obstacle") drawObstacle(entry.item);
    if (entry.kind === "monster") drawWorldMonster(entry.item, time);
    if (entry.kind === "player") drawPlayer(entry.item, time);
  });

  drawSpeech(state.message);
  drawMinimap();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#172b32");
  gradient.addColorStop(0.55, "#183334");
  gradient.addColorStop(1, "#101718");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawTile(x, y, type, time) {
  const p = isoToScreen(x, y);
  const [top, side, shade] = tileColors[type];
  ctx.fillStyle = type === "w" ? waterColor(time, x, y) : top;
  diamond(p.x, p.y, tileW, tileH);
  ctx.fill();
  ctx.strokeStyle = "rgba(10, 18, 16, 0.38)";
  ctx.stroke();

  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.moveTo(p.x - tileW / 2, p.y);
  ctx.lineTo(p.x, p.y + tileH / 2);
  ctx.lineTo(p.x, p.y + tileH / 2 + 12);
  ctx.lineTo(p.x - tileW / 2, p.y + 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(p.x + tileW / 2, p.y);
  ctx.lineTo(p.x, p.y + tileH / 2);
  ctx.lineTo(p.x, p.y + tileH / 2 + 12);
  ctx.lineTo(p.x + tileW / 2, p.y + 12);
  ctx.closePath();
  ctx.fill();

  if (assets.ready) {
    const crop = assets.tiles[type === "f" ? "f" : type === "m" ? "m" : type === "w" ? "w" : "g"];
    ctx.globalAlpha = type === "w" ? 0.72 : 0.82;
    drawAsset(crop, p.x - 46, p.y - 56, 92, 82);
    ctx.globalAlpha = 1;
  }
}

function waterColor(time, x, y) {
  const wave = Math.sin(time / 260 + x * 1.7 + y * 0.9) > 0 ? "#57add0" : "#418bad";
  return wave;
}

function diamond(x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x, y - h / 2);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x, y + h / 2);
  ctx.lineTo(x - w / 2, y);
  ctx.closePath();
}

function drawGroundProp(prop, time) {
  const p = isoToScreen(prop.x, prop.y);
  if (assets.ready && prop.type === 4) {
    drawAsset(assets.props.flower, p.x - 18, p.y - 30, 38, 28);
    return;
  }
  if (prop.type === 0) {
    pixelRect(p.x - 2, p.y - 11, 4, 12, "#2f6d36");
    pixelRect(p.x + 2, p.y - 15, 5, 5, "#efc65c");
  } else if (prop.type === 1) {
    pixelRect(p.x - 5, p.y - 6, 10, 5, "#6b7b5c");
  } else if (prop.type === 2) {
    pixelRect(p.x - 2, p.y - 8 + Math.sin(time / 200 + prop.x) * 2, 4, 4, "#e9da8d");
  }
}

function drawObstacle(item) {
  if (item.type === "chest" && item.opened) return;
  const p = isoToScreen(item.x + 0.5, item.y + 0.5);
  if (assets.ready) {
    if (item.type === "tree") {
      const crop = (item.x + item.y) % 2 ? assets.props.tree : assets.props.pine;
      drawAsset(crop, p.x - 42, p.y - 102, 84, 106);
      return;
    }
    if (item.type === "rock") {
      drawAsset(assets.props.rock, p.x - 34, p.y - 62, 70, 62);
      return;
    }
    drawAsset(assets.props.chest, p.x - 40, p.y - 76, 80, 74);
    return;
  }
  if (item.type === "tree") {
    pixelRect(p.x - 8, p.y - 35, 16, 32, "#774c2d");
    pixelRect(p.x - 28, p.y - 60, 56, 34, "#2f7d45");
    pixelRect(p.x - 20, p.y - 78, 40, 30, "#48a45d");
    pixelRect(p.x - 12, p.y - 88, 24, 18, "#5fc06b");
    return;
  }
  if (item.type === "rock") {
    pixelRect(p.x - 20, p.y - 23, 40, 23, "#797d77");
    pixelRect(p.x - 11, p.y - 36, 28, 18, "#999c91");
    pixelRect(p.x + 6, p.y - 18, 10, 8, "#5d625e");
    return;
  }
  pixelRect(p.x - 20, p.y - 28, 40, 25, "#9a5b2e");
  pixelRect(p.x - 16, p.y - 34, 32, 9, "#e1b64f");
  pixelRect(p.x - 4, p.y - 24, 8, 8, "#f0d26a");
}

function drawPlayer(player, time) {
  const p = isoToScreen(player.x, player.y);
  const bob = Math.sin(time / 150) * 2;
  if (assets.ready) {
    const frameIndex = player.moving ? Math.floor(player.walkTime * 8) % 3 : 1;
    const crop = assets.hero[player.dir][frameIndex];
    const width = player.dir === "up" ? 58 : 68;
    const height = player.dir === "up" ? 72 : 86;
    drawAsset(crop, p.x - width / 2, p.y - height + 4 + bob, width, height);
    return;
  }
  pixelRect(p.x - 12, p.y - 47 + bob, 24, 20, "#f0c48b");
  pixelRect(p.x - 16, p.y - 29 + bob, 32, 30, "#3f72ad");
  pixelRect(p.x - 20, p.y - 11 + bob, 12, 18, "#26323b");
  pixelRect(p.x + 8, p.y - 11 + bob, 12, 18, "#26323b");
  pixelRect(p.x + 18, p.y - 39 + bob, 6, 47, "#e7e0cf");
  pixelRect(p.x + 14, p.y - 18 + bob, 15, 5, "#c69338");
  pixelRect(p.x - 15, p.y - 53 + bob, 30, 8, "#233442");
}

function drawWorldMonster(monster, time) {
  const p = isoToScreen(monster.x, monster.y);
  const data = monsters[monster.type];
  const bob = Math.sin(time / 180 + monster.bob) * 4;
  if (assets.ready) {
    drawMonsterSprite(monster, p.x - 34, p.y - 74 + bob, 68, 70);
    return;
  }
  pixelRect(p.x - 20, p.y - 36 + bob, 40, 32, data.color);
  pixelRect(p.x - 14, p.y - 51 + bob, 28, 20, lighten(data.color, 34));
  pixelRect(p.x - 8, p.y - 36 + bob, 6, 6, "#fff6d6");
  pixelRect(p.x + 8, p.y - 36 + bob, 6, 6, "#fff6d6");
  pixelRect(p.x - 5, p.y - 34 + bob, 3, 3, "#101616");
  pixelRect(p.x + 11, p.y - 34 + bob, 3, 3, "#101616");
}

function drawSpeech(text) {
  const width = Math.min(560, canvas.width - 36);
  const y = canvas.height - 178;
  ctx.fillStyle = "rgba(14, 22, 22, 0.88)";
  ctx.fillRect(18, y, width, 42);
  ctx.strokeStyle = "#7b8d5e";
  ctx.lineWidth = 3;
  ctx.strokeRect(18, y, width, 42);
  ctx.fillStyle = "#fff3cf";
  ctx.font = "16px Microsoft YaHei, sans-serif";
  ctx.fillText(text, 34, y + 27);
}

function pixelRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawAsset(crop, x, y, w, h) {
  ctx.drawImage(assets.image, crop.x, crop.y, crop.w, crop.h, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawMonsterSprite(monster, x, y, w, h) {
  const sprite = assets.monsterImages[monster.type];
  if (sprite) {
    ctx.drawImage(sprite, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    return;
  }
  const crop = assets.monsters[monster.type] || assets.monsters[0];
  drawAsset(crop, x, y, w, h);
}

function drawBattleAsset(crop, x, y, w, h) {
  btx.drawImage(assets.image, crop.x, crop.y, crop.w, crop.h, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawBattleMonsterSprite(monster, x, y, w, h) {
  const sprite = assets.monsterImages[monster.worldMonster.type];
  if (sprite) {
    btx.drawImage(sprite, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    return;
  }
  drawBattleAsset(assets.monsters[monster.worldMonster.type] || assets.monsters[0], x, y, w, h);
}

function removeChromaKey(image) {
  const offscreen = document.createElement("canvas");
  offscreen.width = image.naturalWidth;
  offscreen.height = image.naturalHeight;
  const offscreenCtx = offscreen.getContext("2d", { willReadFrequently: true });
  offscreenCtx.drawImage(image, 0, 0);
  const imageData = offscreenCtx.getImageData(0, 0, offscreen.width, offscreen.height);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    if (green > 170 && red < 80 && blue < 90) {
      pixels[index + 3] = 0;
    }
  }

  offscreenCtx.putImageData(imageData, 0, 0);
  return offscreen;
}

function makeMonsterSprite(source, crop, type) {
  const sprite = document.createElement("canvas");
  sprite.width = crop.w;
  sprite.height = crop.h;
  const spriteCtx = sprite.getContext("2d", { willReadFrequently: true });
  spriteCtx.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
  const imageData = spriteCtx.getImageData(0, 0, crop.w, crop.h);
  const pixels = imageData.data;

  for (let y = 0; y < crop.h; y += 1) {
    for (let x = 0; x < crop.w; x += 1) {
      const index = (y * crop.w + x) * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      if (alpha === 0) continue;

      const lower = y > crop.h * 0.58;
      const greenGround = green > 90 && green > red * 1.12 && green > blue * 1.08;
      const dirtGround = lower && red > 70 && green > 45 && blue < 70 && red > blue * 1.4;
      const keepGoblinBody = type === 2 && x > crop.w * 0.18 && x < crop.w * 0.88 && y < crop.h * 0.84;

      if (lower && !keepGoblinBody && (greenGround || dirtGround)) {
        pixels[index + 3] = 0;
      }
    }
  }

  spriteCtx.putImageData(imageData, 0, 0);
  return sprite;
}

function battleRect(x, y, w, h, color) {
  btx.fillStyle = color;
  btx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function lighten(hex, amount = 28) {
  const num = Number.parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((num >> 16) & 255) + amount);
  const g = Math.min(255, ((num >> 8) & 255) + amount);
  const b = Math.min(255, (num & 255) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function drawMinimap() {
  const scale = minimap.width / mapW;
  mtx.clearRect(0, 0, minimap.width, minimap.height);
  for (let y = 0; y < mapH; y += 1) {
    for (let x = 0; x < mapW; x += 1) {
      mtx.fillStyle = tileColors[terrain[y][x]][0];
      mtx.fillRect(x * scale, y * scale, scale + 1, scale + 1);
    }
  }
  worldMonsters.filter((monster) => monster.alive).forEach((monster) => {
    mtx.fillStyle = "#e15d4f";
    mtx.fillRect(monster.x * scale - 2, monster.y * scale - 2, 5, 5);
  });
  mtx.fillStyle = "#fff3cf";
  mtx.fillRect(state.player.x * scale - 2, state.player.y * scale - 2, 5, 5);
}

function startBattle(worldMonster) {
  const base = monsters[worldMonster.type];
  state.mode = "battle";
  state.currentMonster = {
    worldMonster,
    name: base.name,
    hp: base.hp + state.player.level * 10,
    maxHp: base.hp + state.player.level * 10,
    attack: base.attack + Math.floor(state.player.level * 1.5),
    xp: base.xp,
    coin: base.coin,
    color: base.color
  };
  state.player.doubleStrike = false;
  state.player.shield = false;
  ui.battle.classList.remove("hidden");
  ui.battleLog.textContent = `${base.name} 挡住了去路。`;
  pickQuestion();
  renderUi();
  drawBattle();
}

function pickQuestion() {
  const pool = state.subject === "mixed"
    ? questions
    : questions.filter((question) => question.subject === state.subject);
  const next = pool[Math.floor(Math.random() * pool.length)];
  state.currentQuestion = next;
  state.answerLocked = false;
  ui.questionTag.textContent = next.tag;
  ui.questionText.textContent = next.text;
  ui.answers.innerHTML = "";

  next.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${String.fromCharCode(65 + index)}. ${answer}`;
    button.addEventListener("click", () => answerQuestion(index, button));
    ui.answers.appendChild(button);
  });
}

function answerQuestion(index, button) {
  if (state.answerLocked) return;
  state.answerLocked = true;
  const buttons = [...ui.answers.querySelectorAll("button")];
  buttons.forEach((item) => {
    item.disabled = true;
  });

  if (index === state.currentQuestion.correct) {
    const multiplier = state.player.doubleStrike ? 2 : 1;
    const damage = Math.round((getAttack() + state.player.level * 4) * multiplier);
    state.currentMonster.hp = Math.max(0, state.currentMonster.hp - damage);
    state.player.doubleStrike = false;
    button.classList.add("correct");
    ui.battleLog.textContent = `答对了，造成 ${damage} 点伤害。`;
    if (state.currentMonster.hp <= 0) {
      winBattle();
      return;
    }
  } else {
    const block = state.player.shield ? 0.5 : 1;
    const damage = Math.ceil(state.currentMonster.attack * block);
    state.player.hp = Math.max(0, state.player.hp - damage);
    state.player.shield = false;
    button.classList.add("wrong");
    buttons[state.currentQuestion.correct].classList.add("correct");
    ui.battleLog.textContent = `答错了，受到 ${damage} 点伤害。`;
    if (state.player.hp <= 0) {
      loseBattle();
      return;
    }
  }

  renderUi();
  drawBattle();
  window.setTimeout(pickQuestion, 900);
}

function winBattle() {
  const monster = state.currentMonster;
  monster.worldMonster.alive = false;
  state.player.defeated += 1;
  state.player.xp += monster.xp;
  state.player.coins += monster.coin;
  state.message = `击败 ${monster.name}，获得 ${monster.xp} 经验。`;
  levelUp();
  endBattle();
  if (worldMonsters.every((item) => !item.alive)) {
    spawnMonsters();
    state.message = "新的怪物刷新了，地图更热闹了。";
  }
}

function loseBattle() {
  state.player.hp = Math.ceil(state.player.maxHp * 0.55);
  state.player.x = 2.5;
  state.player.y = 2.5;
  state.message = "战斗失败，回到起点并恢复了一些体力。";
  endBattle();
}

function endBattle() {
  state.mode = "world";
  state.currentMonster = null;
  ui.battle.classList.add("hidden");
  renderUi();
}

function levelUp() {
  while (state.player.xp >= state.player.xpNeed) {
    state.player.xp -= state.player.xpNeed;
    state.player.level += 1;
    state.player.xpNeed = Math.round(state.player.xpNeed * 1.35);
    state.player.maxHp += 18;
    state.player.hp = state.player.maxHp;
    const best = weapons.reduce((index, weapon, current) => (
      weapon.unlock <= state.player.level ? current : index
    ), state.player.weaponIndex);
    state.player.weaponIndex = best;
    state.message = `升到 ${state.player.level} 级，新的力量解锁了。`;
  }
}

function useSkill() {
  const skill = skills[state.player.skillIndex];
  if (state.player.level < skill.unlock) return;
  if (skill.cost > 0 && state.player.coins < skill.cost) {
    ui.battleLog.textContent = "金币不够，暂时用不了这个技能。";
    return;
  }
  state.player.coins -= skill.cost;

  if (skill.name === "专注回复") {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 35 + state.player.level * 5);
    ui.battleLog.textContent = "使用专注回复，恢复了体力。";
  }
  if (skill.name === "破题斩") {
    state.player.doubleStrike = true;
    ui.battleLog.textContent = "破题斩准备好了，下一次答对伤害翻倍。";
  }
  if (skill.name === "灵感护盾") {
    state.player.shield = true;
    ui.battleLog.textContent = "灵感护盾展开，下一次答错伤害减半。";
  }
  renderUi();
  drawBattle();
}

function getAttack() {
  return weapons[state.player.weaponIndex].power + state.player.level * 4;
}

function renderUi() {
  const player = state.player;
  ui.level.textContent = player.level;
  ui.heroTitle.textContent = player.level >= 6 ? "贤者勇者" : player.level >= 3 ? "进阶学者" : "见习学者";
  ui.hpText.textContent = `${player.hp}/${player.maxHp}`;
  ui.xpText.textContent = `${player.xp}/${player.xpNeed}`;
  ui.hpBar.style.width = `${player.hp / player.maxHp * 100}%`;
  ui.xpBar.style.width = `${player.xp / player.xpNeed * 100}%`;
  ui.weaponName.textContent = weapons[player.weaponIndex].name;
  ui.skillName.textContent = skills[player.skillIndex].name;
  ui.attackText.textContent = getAttack();
  ui.defeatedText.textContent = player.defeated;
  ui.coinText.textContent = player.coins;
  ui.questText.textContent = player.defeated >= 5
    ? "第一片区域已清理，可以继续扩展新地图和章节。"
    : `击败 ${5 - player.defeated} 只怪物，收集金币升级装备。`;
  ui.battleHeroHp.value = player.hp;
  ui.battleHeroHp.max = player.maxHp;

  if (state.currentMonster) {
    ui.battleMonsterName.textContent = state.currentMonster.name;
    ui.battleMonsterHp.value = state.currentMonster.hp;
    ui.battleMonsterHp.max = state.currentMonster.maxHp;
  }

  renderCards();
}

function renderCards() {
  ui.weaponList.innerHTML = "";
  weapons.forEach((weapon, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `card ${index === state.player.weaponIndex ? "active" : ""} ${state.player.level < weapon.unlock ? "locked" : ""}`;
    card.dataset.icon = weapon.icon;
    appendCardText(card, weapon.name, `攻击 +${weapon.power} · ${weapon.unlock} 级解锁`, index === state.player.weaponIndex);
    card.addEventListener("click", () => {
      if (state.player.level >= weapon.unlock) {
        state.player.weaponIndex = index;
        renderUi();
      }
    });
    ui.weaponList.appendChild(card);
  });

  ui.skillList.innerHTML = "";
  skills.forEach((skill, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `card ${index === state.player.skillIndex ? "active" : ""} ${state.player.level < skill.unlock ? "locked" : ""}`;
    card.dataset.icon = skill.icon;
    appendCardText(card, skill.name, `${skill.desc} · ${skill.unlock} 级解锁`, index === state.player.skillIndex);
    card.addEventListener("click", () => {
      if (state.player.level >= skill.unlock) {
        state.player.skillIndex = index;
        renderUi();
      }
    });
    ui.skillList.appendChild(card);
  });
}

function appendCardText(card, title, detail, active) {
  const text = document.createElement("span");
  const strong = document.createElement("strong");
  const small = document.createElement("small");
  const badge = document.createElement("em");
  strong.textContent = title;
  small.textContent = detail;
  badge.textContent = active ? "装备中" : "";
  text.append(strong, small);
  card.append(text, badge);
}

function drawBattle() {
  const monster = state.currentMonster;
  if (!monster) return;
  btx.clearRect(0, 0, battleCanvas.width, battleCanvas.height);
  const gradient = btx.createLinearGradient(0, 0, 0, battleCanvas.height);
  gradient.addColorStop(0, "#213238");
  gradient.addColorStop(0.6, "#1a2828");
  gradient.addColorStop(1, "#111818");
  btx.fillStyle = gradient;
  btx.fillRect(0, 0, battleCanvas.width, battleCanvas.height);

  for (let i = 0; i < 8; i += 1) {
    btx.fillStyle = i % 2 ? "#314941" : "#3d564a";
    btx.fillRect(0, 166 + i * 11, battleCanvas.width, 11);
  }

  btx.fillStyle = "rgba(255, 243, 207, 0.12)";
  btx.fillRect(34, 42, 122, 8);
  btx.fillRect(410, 52, 156, 8);

  if (assets.ready) {
    drawBattleAsset(assets.hero.right[1], 78, 54, 122, 136);
    drawBattleMonsterSprite(monster, 396, 70, 132, 126);
  } else {
    battleRect(105, 78, 38, 32, "#f0c48b");
    battleRect(96, 108, 58, 54, "#3f72ad");
    battleRect(87, 145, 18, 27, "#26323b");
    battleRect(145, 145, 18, 27, "#26323b");
    battleRect(164, 82, 8, 88, "#e7e0cf");
    battleRect(156, 122, 26, 8, "#c69338");
    battleRect(96, 70, 58, 10, "#233442");

    battleRect(430, 96, 78, 62, monster.color);
    battleRect(447, 68, 46, 36, lighten(monster.color, 36));
    battleRect(451, 113, 12, 12, "#fff6d6");
    battleRect(482, 113, 12, 12, "#fff6d6");
    battleRect(456, 116, 5, 5, "#101616");
    battleRect(487, 116, 5, 5, "#101616");
  }

  if (state.player.shield) {
    btx.strokeStyle = "#61a7ef";
    btx.lineWidth = 5;
    btx.strokeRect(80, 60, 110, 126);
  }
}

function restart() {
  Object.assign(state.player, {
    x: 2.5,
    y: 2.5,
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpNeed: 60,
    coins: 0,
    defeated: 0,
    weaponIndex: 0,
    skillIndex: 0,
    shield: false,
    doubleStrike: false,
    dir: "down",
    moving: false,
    walkTime: 0
  });
  obstacles.forEach((item) => {
    if (item.type === "chest") item.opened = false;
  });
  state.mode = "world";
  state.message = "新的学习冒险开始了。";
  ui.battle.classList.add("hidden");
  spawnMonsters();
  renderUi();
}

function loop(time) {
  const dt = Math.min(0.035, (time - lastTime) / 1000 || 0);
  lastTime = time;
  update(dt);
  drawWorld(time);
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  state.keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
  state.keys[event.key] = false;
});

document.querySelectorAll(".mobile-pad button").forEach((button) => {
  const keyMap = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
  const key = keyMap[button.dataset.move];
  button.addEventListener("pointerdown", () => {
    state.keys[key] = true;
  });
  button.addEventListener("pointerup", () => {
    state.keys[key] = false;
  });
  button.addEventListener("pointerleave", () => {
    state.keys[key] = false;
  });
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    state.subject = tab.dataset.subject;
  });
});

ui.skillBtn.addEventListener("click", useSkill);
ui.fleeBtn.addEventListener("click", () => {
  state.message = "暂时撤退，换个方向继续探索。";
  state.player.x = Math.max(1.2, state.player.x - 1.1);
  state.player.y = Math.max(1.2, state.player.y - 1.1);
  endBattle();
});
ui.restartBtn.addEventListener("click", restart);
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
spawnMonsters();
renderUi();
requestAnimationFrame(loop);
