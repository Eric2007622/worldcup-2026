/**
 * predictions.js - AI预测引擎
 * 基于FIFA排名、历史战绩、球队状态等因素
 */

// 球队实力评分 (0-100)
const TEAM_RATINGS = {
  '阿根廷': 94, '法国': 93, '英格兰': 91, '巴西': 90, '德国': 89,
  '西班牙': 89, '荷兰': 87, '葡萄牙': 87, '比利时': 85, '克罗地亚': 84,
  '哥伦比亚': 83, '乌拉圭': 82, '日本': 80, '美国': 79, '墨西哥': 78,
  '韩国': 77, '澳大利亚': 76, '瑞士': 76, '塞内加尔': 75, '摩洛哥': 75,
  '挪威': 74, '瑞典': 74, '埃及': 73, '科特迪瓦': 73, '厄瓜多尔': 72,
  '土耳其': 72, '巴拉圭': 71, '苏格兰': 70, '卡塔尔': 69, '加拿大': 68,
  '伊朗': 67, '沙特阿拉伯': 66, '突尼斯': 65, '捷克': 65, '波黑': 64,
  '奥地利': 64, '加纳': 63, '新西兰': 62, '巴拿马': 61, '海地': 58,
  '阿尔及利亚': 62, '约旦': 59, '伊拉克': 58, '南非': 57, '佛得角': 55,
  '库拉索': 50, '乌兹别克斯坦': 56,
}

// 东道主加成
const HOME_ADVANTAGE = {
  '美国': 8, '墨西哥': 8, '加拿大': 6,
}

/**
 * 生成预测
 * @param {Object} match 比赛信息
 * @returns {Object} 预测结果
 */
function predictMatch(match) {
  const homeRating = TEAM_RATINGS[match.home] || 60
  const awayRating = TEAM_RATINGS[match.away] || 60
  const homeBonus = HOME_ADVANTAGE[match.home] || 0

  const homeStrength = homeRating + homeBonus
  const awayStrength = awayRating

  const diff = homeStrength - awayStrength

  let homeGoals, awayGoals, result, confidence, reason

  // 预测进球数
  if (diff >= 25) {
    homeGoals = 3; awayGoals = 0; result = 'home'
    confidence = 90
    reason = `${match.home}实力碾压，预计轻松取胜`
  } else if (diff >= 15) {
    homeGoals = 2; awayGoals = 0; result = 'home'
    confidence = 80
    reason = `${match.home}占据明显优势，主场或状态加成`
  } else if (diff >= 8) {
    homeGoals = 2; awayGoals = 1; result = 'home'
    confidence = 70
    reason = `${match.home}小胜，但${match.away}可能制造威胁`
  } else if (diff >= 3) {
    homeGoals = 1; awayGoals = 0; result = 'home'
    confidence = 60
    reason = `势均力敌，${match.home}微弱优势`
  } else if (diff >= -3) {
    homeGoals = 1; awayGoals = 1; result = 'draw'
    confidence = 55
    reason = `两队实力接近，平局可能性大`
  } else if (diff >= -8) {
    homeGoals = 0; awayGoals = 1; result = 'away'
    confidence = 60
    reason = `${match.away}客场小胜`
  } else if (diff >= -15) {
    homeGoals = 1; awayGoals = 2; result = 'away'
    confidence = 70
    reason = `${match.away}实力占优，客场取胜`
  } else {
    homeGoals = 0; awayGoals = 3; result = 'away'
    confidence = 85
    reason = `${match.away}实力远超对手`
  }

  // 特殊情况调整
  const specialCases = getSpecialPrediction(match)
  if (specialCases) {
    homeGoals = specialCases.homeGoals
    awayGoals = specialCases.awayGoals
    confidence = specialCases.confidence
    reason = specialCases.reason
  }

  return {
    homeGoals,
    awayGoals,
    result,
    confidence,
    reason,
    confidenceLevel: confidence >= 80 ? 'high' : confidence >= 60 ? 'med' : 'low'
  }
}

// 特殊比赛的精准预测
function getSpecialPrediction(match) {
  const key = `${match.home}vs${match.away}`
  const specials = {
    '法国vs塞内加尔': { homeGoals: 2, awayGoals: 0, confidence: 85, reason: '法国阵容豪华，姆巴佩领衔，小组赛首战通常强势' },
    '伊拉克vs挪威': { homeGoals: 1, awayGoals: 2, confidence: 65, reason: '哈兰德坐镇挪威锋线，攻击力强劲，但伊拉克防守顽强' },
    '奥地利vs约旦': { homeGoals: 2, awayGoals: 1, confidence: 70, reason: '欧洲劲旅经验取胜，约旦近年进步明显但深度不足' },
    '阿根廷vs阿尔及利亚': { homeGoals: 3, awayGoals: 0, confidence: 90, reason: '卫冕冠军首战，梅西最后一舞，全队动力十足' },
    '英格兰vs克罗地亚': { homeGoals: 2, awayGoals: 1, confidence: 65, reason: '英格兰青春风暴对决克罗地亚老将，激烈对抗' },
    '加纳vs巴拿马': { homeGoals: 1, awayGoals: 1, confidence: 55, reason: '两队实力接近，可能以平局收场' },
    '德国vs科特迪瓦': { homeGoals: 3, awayGoals: 1, confidence: 75, reason: '德国首轮7-1大胜后士气高涨，攻击力恐怖' },
    '美国vs澳大利亚': { homeGoals: 2, awayGoals: 1, confidence: 70, reason: '东道主美国状态火热，但澳大利亚也不容小觑' },
    '西班牙vs沙特阿拉伯': { homeGoals: 2, awayGoals: 0, confidence: 75, reason: '西班牙需要证明自己，首轮被佛得角逼平后必全力争胜' },
    '比利时vs伊朗': { homeGoals: 2, awayGoals: 0, confidence: 70, reason: '比利时首轮被埃及逼平，这场必须拿下' },
  }
  return specials[key] || null
}

/**
 * 获取冠军预测
 */
function getChampionPrediction() {
  return {
    champion: '阿根廷',
    flag: '🇦🇷',
    reason: '卫冕冠军阵容成熟，梅西最后一舞，恩佐/阿尔瓦雷斯接棒，攻守均衡',
    candidates: [
      { name: '法国', flag: '🇫🇷', chance: 18 },
      { name: '德国', flag: '🇩🇪', chance: 15 },
      { name: '巴西', flag: '🇧🇷', chance: 12 },
      { name: '西班牙', flag: '🇪🇸', chance: 10 },
      { name: '英格兰', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', chance: 10 },
    ],
    argentinaChance: 20
  }
}

/**
 * 判断是否冷门
 */
function isUpset(match) {
  if (match.status !== 'finished') return false
  const homeRating = TEAM_RATINGS[match.home] || 60
  const awayRating = TEAM_RATINGS[match.away] || 60

  // 强队输球或平局
  if (homeRating - awayRating >= 15 && match.homeScore <= match.awayScore) return true
  if (awayRating - homeRating >= 15 && match.awayScore <= match.homeScore) return true

  // 特定冷门
  if (match.home === '西班牙' && match.away === '佛得角' && match.homeScore === match.awayScore) return true
  if (match.home === '巴西' && match.away === '摩洛哥' && match.homeScore === match.awayScore) return true

  return false
}

module.exports = {
  TEAM_RATINGS,
  predictMatch,
  getChampionPrediction,
  isUpset
}
