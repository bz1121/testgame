const questions = [
  { subject: "math", tag: "数学", text: "36 ÷ 6 + 7 = ?", answers: ["11", "12", "13", "14"], correct: 2 },
  { subject: "math", tag: "数学", text: "一个数的 25% 是 9，这个数是多少？", answers: ["18", "27", "36", "45"], correct: 2 },
  { subject: "math", tag: "数学", text: "如果 x + 8 = 21，那么 x = ?", answers: ["11", "12", "13", "14"], correct: 2 },
  { subject: "math", tag: "数学", text: "长方形长 9、宽 4，面积是多少？", answers: ["13", "26", "36", "72"], correct: 2 },
  { subject: "english", tag: "英语", text: "“努力”最接近哪个英文单词？", answers: ["effort", "weather", "circle", "quiet"], correct: 0 },
  { subject: "english", tag: "英语", text: "Choose the correct sentence.", answers: ["She go home.", "She goes home.", "She going home.", "She gone home."], correct: 1 },
  { subject: "english", tag: "英语", text: "What is the opposite of “ancient”?", answers: ["old", "modern", "quiet", "heavy"], correct: 1 },
  { subject: "english", tag: "英语", text: "“I have finished my homework.” 是什么时态？", answers: ["一般现在时", "现在完成时", "一般过去时", "将来时"], correct: 1 },
  { subject: "logic", tag: "常识", text: "水在标准大气压下的沸点是多少？", answers: ["0°C", "50°C", "100°C", "150°C"], correct: 2 },
  { subject: "logic", tag: "常识", text: "太阳系中离太阳最近的行星是？", answers: ["金星", "地球", "水星", "火星"], correct: 2 },
  { subject: "logic", tag: "常识", text: "“己所不欲，勿施于人”强调的是？", answers: ["速度", "尊重", "财富", "记忆"], correct: 1 },
  { subject: "logic", tag: "常识", text: "植物进行光合作用主要需要哪种光源？", answers: ["月光", "阳光", "灯笼光", "火光"], correct: 1 }
];

const monsters = [
  "雾影史莱姆",
  "错题岩怪",
  "瞌睡法师",
  "拖延骑士",
  "遗忘巨像",
  "期末魔王"
];

const state = {
  level: 1,
  xp: 0,
  xpNeeded: 60,
  heroHp: 100,
  maxHeroHp: 100,
  stage: 1,
  monsterHp: 45,
  monsterMaxHp: 45,
  monsterAttack: 8,
  combo: 0,
  defeated: 0,
  correct: 0,
  wrong: 0,
  subject: "mixed",
  currentQuestion: null,
  locked: false
};

const $ = (id) => document.getElementById(id);
const els = {
  level: $("level"),
  combo: $("combo"),
  heroHp: $("heroHp"),
  heroHpBar: $("heroHpBar"),
  monsterName: $("monsterName"),
  monsterHp: $("monsterHp"),
  monsterMaxHp: $("monsterMaxHp"),
  monsterHpBar: $("monsterHpBar"),
  monsterAttack: $("monsterAttack"),
  stage: $("stage"),
  questionTag: $("questionTag"),
  questionText: $("questionText"),
  answers: $("answers"),
  feedback: $("feedback"),
  xp: $("xp"),
  xpNeeded: $("xpNeeded"),
  xpBar: $("xpBar"),
  healBtn: $("healBtn"),
  blastBtn: $("blastBtn"),
  defeated: $("defeated"),
  correct: $("correct"),
  wrong: $("wrong"),
  restartBtn: $("restartBtn")
};

function pickQuestion() {
  const pool = state.subject === "mixed"
    ? questions
    : questions.filter((question) => question.subject === state.subject);
  const next = pool[Math.floor(Math.random() * pool.length)];
  state.currentQuestion = next;
  els.questionTag.textContent = next.tag;
  els.questionText.textContent = next.text;
  els.answers.innerHTML = "";

  next.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.className = "answer";
    button.type = "button";
    button.textContent = `${String.fromCharCode(65 + index)}. ${answer}`;
    button.addEventListener("click", () => answerQuestion(index, button));
    els.answers.appendChild(button);
  });
}

function answerQuestion(index, button) {
  if (state.locked || state.heroHp <= 0) return;
  state.locked = true;
  const isCorrect = index === state.currentQuestion.correct;
  const allAnswers = [...document.querySelectorAll(".answer")];
  allAnswers.forEach((answer) => {
    answer.disabled = true;
  });

  if (isCorrect) {
    state.correct += 1;
    state.combo += 1;
    const damage = 16 + state.level * 4 + Math.min(state.combo * 3, 18);
    state.monsterHp = Math.max(0, state.monsterHp - damage);
    state.xp += 18 + state.stage * 2;
    button.classList.add("correct");
    document.querySelector(".monster-card").classList.add("hit");
    els.feedback.textContent = `答对！造成 ${damage} 点伤害。`;
    if (state.monsterHp === 0) {
      defeatMonster();
    }
  } else {
    state.wrong += 1;
    state.combo = 0;
    state.heroHp = Math.max(0, state.heroHp - state.monsterAttack);
    button.classList.add("wrong");
    allAnswers[state.currentQuestion.correct].classList.add("correct");
    document.querySelector(".hero-card").classList.add("shake");
    els.feedback.textContent = `答错了，被反击 ${state.monsterAttack} 点。`;
    if (state.heroHp === 0) {
      els.feedback.textContent = "勇者倒下了，点击重新开始再挑战一次。";
    }
  }

  levelUpIfNeeded();
  render();

  window.setTimeout(() => {
    document.querySelector(".monster-card").classList.remove("hit");
    document.querySelector(".hero-card").classList.remove("shake");
    state.locked = false;
    if (state.heroHp > 0) pickQuestion();
  }, 760);
}

function defeatMonster() {
  state.defeated += 1;
  state.stage += 1;
  state.xp += 24 + state.stage * 3;
  state.monsterMaxHp = 42 + state.stage * 18 + state.level * 8;
  state.monsterHp = state.monsterMaxHp;
  state.monsterAttack = 7 + Math.floor(state.stage * 1.8);
  els.feedback.textContent = "击败怪物！下一只更强的家伙出现了。";
}

function levelUpIfNeeded() {
  while (state.xp >= state.xpNeeded) {
    state.xp -= state.xpNeeded;
    state.level += 1;
    state.xpNeeded = Math.round(state.xpNeeded * 1.28);
    state.maxHeroHp += 12;
    state.heroHp = state.maxHeroHp;
    els.feedback.textContent = `升级到 ${state.level} 级，体力已恢复！`;
  }
}

function spendXp(cost) {
  if (state.xp < cost || state.heroHp <= 0) return false;
  state.xp -= cost;
  return true;
}

function heal() {
  if (!spendXp(30)) return;
  const amount = 28 + state.level * 4;
  state.heroHp = Math.min(state.maxHeroHp, state.heroHp + amount);
  els.feedback.textContent = `专注回复恢复 ${amount} 点体力。`;
  render();
}

function blast() {
  if (!spendXp(50)) return;
  const damage = 34 + state.level * 6;
  state.monsterHp = Math.max(0, state.monsterHp - damage);
  els.feedback.textContent = `灵感一击造成 ${damage} 点伤害。`;
  if (state.monsterHp === 0) defeatMonster();
  levelUpIfNeeded();
  render();
}

function render() {
  els.level.textContent = state.level;
  els.combo.textContent = state.combo;
  els.heroHp.textContent = state.heroHp;
  els.heroHpBar.style.width = `${(state.heroHp / state.maxHeroHp) * 100}%`;
  els.monsterName.textContent = monsters[(state.stage - 1) % monsters.length];
  els.stage.textContent = state.stage;
  els.monsterAttack.textContent = state.monsterAttack;
  els.monsterHp.textContent = state.monsterHp;
  els.monsterMaxHp.textContent = state.monsterMaxHp;
  els.monsterHpBar.style.width = `${(state.monsterHp / state.monsterMaxHp) * 100}%`;
  els.xp.textContent = state.xp;
  els.xpNeeded.textContent = state.xpNeeded;
  els.xpBar.style.width = `${(state.xp / state.xpNeeded) * 100}%`;
  els.healBtn.disabled = state.xp < 30 || state.heroHp <= 0;
  els.blastBtn.disabled = state.xp < 50 || state.heroHp <= 0;
  els.defeated.textContent = state.defeated;
  els.correct.textContent = state.correct;
  els.wrong.textContent = state.wrong;
}

function restart() {
  Object.assign(state, {
    level: 1,
    xp: 0,
    xpNeeded: 60,
    heroHp: 100,
    maxHeroHp: 100,
    stage: 1,
    monsterHp: 45,
    monsterMaxHp: 45,
    monsterAttack: 8,
    combo: 0,
    defeated: 0,
    correct: 0,
    wrong: 0,
    locked: false
  });
  els.feedback.textContent = "新的冒险开始了。";
  render();
  pickQuestion();
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    state.subject = tab.dataset.subject;
    els.feedback.textContent = "题目类型已切换。";
    pickQuestion();
  });
});

els.healBtn.addEventListener("click", heal);
els.blastBtn.addEventListener("click", blast);
els.restartBtn.addEventListener("click", restart);

render();
pickQuestion();
