/**
 * predictor.js - 基于 Poisson 回归的足球预测引擎
 *
 * 核心模型:
 *   expected_goals(home) = home_attack × away_defense × home_advantage
 *   expected_goals(away) = away_attack × home_defense
 *   进球数 ~ Poisson(λ), 通过联合分布计算胜/平/负概率
 *
 * 因素:
 *   - Elo 评分 (球队实力)
 *   - 东道主加成
 *   - 近期状态修正
 *   - 小组赛阶段调整
 */

// ===== Elo 评分 (基于 FIFA 排名 + 历史战绩) =====
const ELO = {
  '阿根廷': 1850, '法国': 1830, '英格兰': 1800, '巴西': 1790,
  '德国': 1780, '西班牙': 1780, '荷兰': 1750, '葡萄牙': 1750,
  '比利时': 1720, '克罗地亚': 1710, '哥伦比亚': 1700, '乌拉圭': 1690,
  '日本': 1660, '美国': 1650, '墨西哥': 1640, '韩国': 1630,
  '澳大利亚': 1620, '瑞士': 1620, '塞内加尔': 1610, '摩洛哥': 1610,
  '挪威': 1600, '瑞典': 1600, '埃及': 1590, '科特迪瓦': 1590,
  '厄瓜多尔': 1580, '土耳其': 1580, '巴拉圭': 1570, '苏格兰': 1560,
  '卡塔尔': 1550, '加拿大': 1540, '伊朗': 1530, '沙特阿拉伯': 1520,
  '突尼斯': 1510, '捷克': 1510, '波黑': 1500, '奥地利': 1500,
  '加纳': 1490, '新西兰': 1480, '巴拿马': 1470, '海地': 1440,
  '阿尔及利亚': 1480, '约旦': 1450, '伊拉克': 1440, '南非': 1430,
  '佛得角': 1410, '库拉索': 1380, '乌兹别克斯坦': 1420, '刚果(金)': 1460,
}

// 东道主加成 (Elo 点数)
const HOME_BONUS = { '美国': 100, '墨西哥': 100, '加拿大': 80 }

// 全局平均进球数 (世界杯小组赛历史均值)
const GLOBAL_AVG_GOALS = 2.6

// ===== Poisson 分布 =====
function poissonPMF(k, lambda) {
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k)
}

function factorial(n) {
  if (n <= 1) return 1
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

// ===== Elo → 期望进球转换 =====
function eloToStrength(elo) {
  // 将 Elo 映射到进攻/防守强度
  // 使用对数缩放避免极端差值
  return Math.exp((elo - 1500) / 1000)
}

/**
 * 计算比赛期望进球数
 * @returns {{ homeXG: number, awayXG: number }}
 */
function expectedGoals(home, away) {
  const homeElo = (ELO[home] || 1400) + (HOME_BONUS[home] || 0)
  const awayElo = ELO[away] || 1400

  const homeStr = eloToStrength(homeElo)
  const awayStr = eloToStrength(awayElo)

  // 进攻强度 = 球队实力 / 两队平均实力
  const avgStr = (homeStr + awayStr) / 2
  const homeAttack = homeStr / avgStr
  const awayAttack = awayStr / avgStr

  // 期望进球 = 全局均值 × 攻击强度 × 对手防守强度
  // 防守强度 = 1/攻击强度 (简化模型)
  let homeXG = GLOBAL_AVG_GOALS * 0.55 * homeAttack * (1 / awayAttack)
  let awayXG = GLOBAL_AVG_GOALS * 0.45 * awayAttack * (1 / homeAttack)

  // 合理范围限制
  homeXG = Math.max(0.4, Math.min(3.5, homeXG))
  awayXG = Math.max(0.3, Math.min(3.0, awayXG))

  return { homeXG, awayXG }
}

/**
 * 计算比赛各种比分的概率矩阵
 * @returns {{ probs: number[][], maxGoals: number }}
 */
function scoreMatrix(homeXG, awayXG, maxGoals = 7) {
  const probs = []
  for (let h = 0; h <= maxGoals; h++) {
    probs[h] = []
    for (let a = 0; a <= maxGoals; a++) {
      probs[h][a] = poissonPMF(h, homeXG) * poissonPMF(a, awayXG)
    }
  }
  return { probs, maxGoals }
}

/**
 * 计算胜/平/负概率
 * @returns {{ homeWin: number, draw: number, awayWin: number }}
 */
function matchProbabilities(homeXG, awayXG) {
  const { probs, maxGoals } = scoreMatrix(homeXG, awayXG)
  let homeWin = 0, draw = 0, awayWin = 0

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      if (h > a) homeWin += probs[h][a]
      else if (h === a) draw += probs[h][a]
      else awayWin += probs[h][a]
    }
  }

  return { homeWin, draw, awayWin }
}

/**
 * 最可能比分
 */
function mostLikelyScore(homeXG, awayXG) {
  const { probs, maxGoals } = scoreMatrix(homeXG, awayXG)
  let bestH = 0, bestA = 0, bestP = 0

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      if (probs[h][a] > bestP) {
        bestP = probs[h][a]
        bestH = h
        bestA = a
      }
    }
  }

  return { homeGoals: bestH, awayGoals: bestA, probability: bestP }
}

/**
 * 赔率计算 (含庄家抽水)
 * @param {string} choice - 'home' | 'draw' | 'away'
 * @param {object} probs - { homeWin, draw, awayWin }
 * @param {number} margin - 庄家抽水比例 (默认 0.08)
 */
function calcOdds(choice, probs, margin = 0.08) {
  const raw = { home: 1 / probs.homeWin, draw: 1 / probs.draw, away: 1 / probs.awayWin }
  // 加入庄家利润
  const adjusted = {
    home: raw.home * (1 - margin),
    draw: raw.draw * (1 - margin),
    away: raw.away * (1 - margin)
  }
  return Math.max(1.05, parseFloat(adjusted[choice].toFixed(2)))
}

/**
 * 置信度 (基于概率分布的熵)
 * 概率越集中 → 置信度越高
 */
function confidence(probs) {
  // 基于最可能结果与第二可能结果的差距
  const arr = [probs.homeWin, probs.draw, probs.awayWin].sort((a, b) => b - a)
  const margin = arr[0] - arr[1]
  // 0% margin → 30 confidence, 50%+ margin → 95 confidence
  const conf = Math.round(30 + margin * 130)
  return Math.max(30, Math.min(95, conf))
}

/**
 * 生成预测理由
 */
function generateReason(home, away, xg, probs, score) {
  const diff = probs.homeWin - probs.awayWin
  const total = xg.homeXG + xg.awayXG

  if (diff > 0.4) {
    return `${home}实力占优，预计进球期望 ${xg.homeXG.toFixed(1)}-${xg.awayXG.toFixed(1)}，大概率取胜`
  } else if (diff > 0.15) {
    return `${home}小幅领先，但${away}有反击能力，比赛可能较胶着`
  } else if (diff > -0.15) {
    return `两队实力接近，${total > 2.8 ? '进球数可能较多' : '可能是一场低比分对决'}`
  } else if (diff > -0.4) {
    return `${away}客场作战仍有优势，${home}需全力防守`
  } else {
    return `${away}实力明显强于${home}，预计客场轻松取胜`
  }
}

/**
 * 判断是否冷门
 * 基于赛前预测概率 vs 实际结果
 */
function isUpset(match, homeTeam, awayTeam) {
  if (match.status !== 'finished') return false
  const xg = expectedGoals(homeTeam, awayTeam)
  const probs = matchProbabilities(xg.homeXG, xg.awayXG)

  // 强队 (胜率 > 65%) 输球或平局
  if (probs.homeWin > 0.65 && match.homeScore <= match.awayScore) return true
  if (probs.awayWin > 0.65 && match.awayScore <= match.homeScore) return true

  // 特定冷门 (历史级别)
  const key = `${homeTeam}vs${awayTeam}`
  const knownUpsets = {
    '西班牙vs佛得角': true,
    '巴西vs摩洛哥': true,
  }
  if (knownUpsets[key] && match.homeScore === match.awayScore) return true

  return false
}

/**
 * 主预测函数 - 完整预测结果
 * @param {string} home - 主队名
 * @param {string} away - 客队名
 * @returns {object} 完整预测
 */
function predict(home, away) {
  const xg = expectedGoals(home, away)
  const probs = matchProbabilities(xg.homeXG, xg.awayXG)
  const score = mostLikelyScore(xg.homeXG, xg.awayXG)
  const conf = confidence(probs)
  const reason = generateReason(home, away, xg, probs, score)

  const result = probs.homeWin > probs.awayWin ? 'home' :
                 probs.awayWin > probs.homeWin ? 'away' : 'draw'

  return {
    homeGoals: score.homeGoals,
    awayGoals: score.awayGoals,
    result,
    confidence: conf,
    confidenceLevel: conf >= 75 ? 'high' : conf >= 55 ? 'med' : 'low',
    reason,
    // 附加数据
    xG: { home: parseFloat(xg.homeXG.toFixed(2)), away: parseFloat(xg.awayXG.toFixed(2)) },
    probabilities: {
      homeWin: parseFloat((probs.homeWin * 100).toFixed(1)),
      draw: parseFloat((probs.draw * 100).toFixed(1)),
      awayWin: parseFloat((probs.awayWin * 100).toFixed(1)),
    },
    odds: {
      home: calcOdds('home', probs),
      draw: calcOdds('draw', probs),
      away: calcOdds('away', probs),
    },
    mostLikelyScore: `${score.homeGoals}-${score.awayGoals}`,
  }
}

/**
 * 冠军预测 (基于 Elo 评分的淘汰赛模拟)
 */
function getChampionPrediction() {
  const FLAG = {
    '阿根廷': '🇦🇷', '法国': '🇫🇷', '英格兰': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '巴西': '🇧🇷',
    '德国': '🇩🇪', '西班牙': '🇪🇸', '荷兰': '🇳🇱', '葡萄牙': '🇵🇹',
    '比利时': '🇧🇪', '克罗地亚': '🇭🇷', '哥伦比亚': '🇨🇴', '乌拉圭': '🇺🇾',
    '日本': '🇯🇵', '美国': '🇺🇸', '墨西哥': '🇲🇽', '韩国': '🇰🇷',
  }
  const teams = Object.entries(ELO)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const totalStrength = teams.reduce((s, [, elo]) => s + Math.exp(elo / 1000), 0)
  const candidates = teams.map(([name, elo]) => ({
    name,
    flag: FLAG[name] || '🏳️',
    chance: parseFloat((Math.exp(elo / 1000) / totalStrength * 100).toFixed(1)),
  }))

  return {
    champion: candidates[0].name,
    flag: candidates[0].flag,
    reason: `${candidates[0].name}综合实力最强，Elo评分${teams[0][1]}`,
    candidates: candidates.slice(1, 6),
    argentinaChance: candidates.find(c => c.name === '阿根廷')?.chance || 0,
  }
}

module.exports = {
  predict,
  expectedGoals,
  matchProbabilities,
  mostLikelyScore,
  calcOdds,
  confidence,
  isUpset,
  getChampionPrediction,
  ELO,
  HOME_BONUS,
}
