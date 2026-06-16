/**
 * api.js - 世界杯数据源 (支持多种模式)
 * 
 * 模式1: 'cloud'  - 使用微信云函数 (推荐)
 * 模式2: 'server' - 使用自建后端服务
 * 模式3: 'static' - 使用本地静态数据 (离线/开发用)
 * 
 * 切换方式: 修改下方 DATA_MODE
 */

// ===== 配置 =====
const DATA_MODE = 'static'  // 'cloud' | 'server' | 'static'
const SERVER_URL = 'http://localhost:3000'  // 自建后端地址

// ===== 云函数调用 =====
async function cloudCall(action, params = {}) {
  try {
    const res = await wx.cloud.callFunction({
      name: 'fetchMatches',
      data: { action, ...params }
    })
    return res.result
  } catch (err) {
    console.error('云函数调用失败:', err)
    return null
  }
}

// ===== 后端API调用 =====
async function serverFetch(endpoint) {
  try {
    const res = await new Promise((resolve, reject) => {
      wx.request({
        url: `${SERVER_URL}${endpoint}`,
        method: 'GET',
        success: (res) => resolve(res.data),
        fail: reject
      })
    })
    return res
  } catch (err) {
    console.error('后端请求失败:', err)
    return null
  }
}

// ===== 统一数据接口 =====

/**
 * 获取所有比赛
 */
async function fetchAllMatches() {
  if (DATA_MODE === 'cloud') {
    const result = await cloudCall('matches')
    return result ? result.matches : getStaticMatches()
  }
  if (DATA_MODE === 'server') {
    const data = await serverFetch('/api/matches')
    return data ? data.matches : getStaticMatches()
  }
  return getStaticMatches()
}

/**
 * 获取今日比赛
 */
async function fetchTodayMatches() {
  if (DATA_MODE === 'cloud') {
    const result = await cloudCall('today')
    return result ? result.matches : getStaticTodayMatches()
  }
  if (DATA_MODE === 'server') {
    const data = await serverFetch('/api/matches/today')
    return data ? data.matches : getStaticTodayMatches()
  }
  return getStaticTodayMatches()
}

/**
 * 获取积分榜
 */
async function fetchStandings() {
  if (DATA_MODE === 'cloud') {
    const result = await cloudCall('standings')
    return result ? result.groups : getStaticGroups()
  }
  if (DATA_MODE === 'server') {
    const data = await serverFetch('/api/standings')
    return data ? data.groups : getStaticGroups()
  }
  return getStaticGroups()
}

/**
 * 强制刷新缓存
 */
async function refreshData() {
  if (DATA_MODE === 'cloud') {
    return await cloudCall('refresh')
  }
  if (DATA_MODE === 'server') {
    return await serverFetch('/api/health')
  }
  return { message: '静态模式无需刷新' }
}

// ===== 静态数据 (离线兜底) =====

function getStaticMatches() {
  return [
    { id: 1, date: '2026-06-12', time: '04:00', group: 'A', home: '墨西哥', homeFlag: '🇲🇽', away: '南非', awayFlag: '🇿🇦', homeScore: 2, awayScore: 0, status: 'finished', venue: '墨西哥城' },
    { id: 2, date: '2026-06-12', time: '11:00', group: 'A', home: '韩国', homeFlag: '🇰🇷', away: '捷克', awayFlag: '🇨🇿', homeScore: 2, awayScore: 1, status: 'finished', venue: '瓜达拉哈拉' },
    { id: 3, date: '2026-06-12', time: '00:00', group: 'B', home: '加拿大', homeFlag: '🇨🇦', away: '波黑', awayFlag: '🇧🇦', homeScore: 1, awayScore: 1, status: 'finished', venue: '多伦多' },
    { id: 4, date: '2026-06-13', time: '09:00', group: 'D', home: '美国', homeFlag: '🇺🇸', away: '巴拉圭', awayFlag: '🇵🇾', homeScore: 4, awayScore: 1, status: 'finished', venue: '洛杉矶' },
    { id: 5, date: '2026-06-13', time: '00:00', group: 'B', home: '卡塔尔', homeFlag: '🇶🇦', away: '瑞士', awayFlag: '🇨🇭', homeScore: 1, awayScore: 1, status: 'finished', venue: '旧金山' },
    { id: 6, date: '2026-06-14', time: '03:00', group: 'C', home: '巴西', homeFlag: '🇧🇷', away: '摩洛哥', awayFlag: '🇲🇦', homeScore: 1, awayScore: 1, status: 'finished', venue: '纽约' },
    { id: 7, date: '2026-06-14', time: '06:00', group: 'C', home: '海地', homeFlag: '🇭🇹', away: '苏格兰', awayFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', homeScore: 0, awayScore: 1, status: 'finished', venue: '波士顿' },
    { id: 8, date: '2026-06-14', time: '06:00', group: 'D', home: '澳大利亚', homeFlag: '🇦🇺', away: '土耳其', awayFlag: '🇹🇷', homeScore: 2, awayScore: 0, status: 'finished', venue: '温哥华' },
    { id: 9, date: '2026-06-14', time: '00:00', group: 'E', home: '德国', homeFlag: '🇩🇪', away: '库拉索', awayFlag: '🇨🇼', homeScore: 7, awayScore: 1, status: 'finished', venue: '休斯顿' },
    { id: 10, date: '2026-06-15', time: '03:00', group: 'F', home: '荷兰', homeFlag: '🇳🇱', away: '日本', awayFlag: '🇯🇵', homeScore: 2, awayScore: 2, status: 'finished', venue: '达拉斯' },
    { id: 11, date: '2026-06-15', time: '00:00', group: 'E', home: '科特迪瓦', homeFlag: '🇨🇮', away: '厄瓜多尔', awayFlag: '🇪🇨', homeScore: 1, awayScore: 0, status: 'finished', venue: '费城' },
    { id: 12, date: '2026-06-15', time: '05:00', group: 'F', home: '瑞典', homeFlag: '🇸🇪', away: '突尼斯', awayFlag: '🇹🇳', homeScore: 5, awayScore: 1, status: 'finished', venue: '蒙特雷' },
    { id: 13, date: '2026-06-16', time: '00:00', group: 'H', home: '西班牙', homeFlag: '🇪🇸', away: '佛得角', awayFlag: '🇨🇻', homeScore: 0, awayScore: 0, status: 'finished', venue: '亚特兰大' },
    { id: 14, date: '2026-06-16', time: '03:00', group: 'G', home: '比利时', homeFlag: '🇧🇪', away: '埃及', awayFlag: '🇪🇬', homeScore: 1, awayScore: 1, status: 'finished', venue: '西雅图' },
    { id: 15, date: '2026-06-16', time: '00:00', group: 'G', home: '伊朗', homeFlag: '🇮🇷', away: '新西兰', awayFlag: '🇳🇿', homeScore: null, awayScore: null, status: 'upcoming', venue: '洛杉矶' },
    { id: 16, date: '2026-06-16', time: '06:00', group: 'H', home: '沙特阿拉伯', homeFlag: '🇸🇦', away: '乌拉圭', awayFlag: '🇺🇾', homeScore: 1, awayScore: 1, status: 'finished', venue: '迈阿密' },
    { id: 17, date: '2026-06-16', time: '06:00', group: 'I', home: '法国', homeFlag: '🇫🇷', away: '塞内加尔', awayFlag: '🇸🇳', homeScore: null, awayScore: null, status: 'upcoming', venue: '纽约' },
    { id: 18, date: '2026-06-16', time: '09:00', group: 'I', home: '伊拉克', homeFlag: '🇮🇶', away: '挪威', awayFlag: '🇳🇴', homeScore: null, awayScore: null, status: 'upcoming', venue: '波士顿' },
    { id: 19, date: '2026-06-17', time: '00:00', group: 'J', home: '奥地利', homeFlag: '🇦🇹', away: '约旦', awayFlag: '🇯🇴', homeScore: null, awayScore: null, status: 'upcoming', venue: '旧金山' },
    { id: 20, date: '2026-06-17', time: '04:00', group: 'L', home: '英格兰', homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away: '克罗地亚', awayFlag: '🇭🇷', homeScore: null, awayScore: null, status: 'upcoming', venue: '达拉斯' },
    { id: 21, date: '2026-06-17', time: '07:00', group: 'L', home: '加纳', homeFlag: '🇬🇭', away: '巴拿马', awayFlag: '🇵🇦', homeScore: null, awayScore: null, status: 'upcoming', venue: '多伦多' },
    { id: 22, date: '2026-06-17', time: '09:00', group: 'J', home: '阿根廷', homeFlag: '🇦🇷', away: '阿尔及利亚', awayFlag: '🇩🇿', homeScore: null, awayScore: null, status: 'upcoming', venue: '堪萨斯城' },
  ]
}

function getStaticTodayMatches() {
  return getStaticMatches().filter(m => m.date === '2026-06-16')
}

function getStaticGroups() {
  return {
    A: { name: 'A组', teams: [
      { name: '墨西哥', flag: '🇲🇽', mp: 1, w: 1, d: 0, l: 0, gf: 2, ga: 0, pts: 3, rank: 1 },
      { name: '韩国', flag: '🇰🇷', mp: 1, w: 1, d: 0, l: 0, gf: 2, ga: 1, pts: 3, rank: 2 },
      { name: '捷克', flag: '🇨🇿', mp: 1, w: 0, d: 0, l: 1, gf: 1, ga: 2, pts: 0, rank: 3 },
      { name: '南非', flag: '🇿🇦', mp: 1, w: 0, d: 0, l: 1, gf: 0, ga: 2, pts: 0, rank: 4 },
    ]},
    B: { name: 'B组', teams: [
      { name: '加拿大', flag: '🇨🇦', mp: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1, rank: 1 },
      { name: '卡塔尔', flag: '🇶🇦', mp: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1, rank: 2 },
      { name: '瑞士', flag: '🇨🇭', mp: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1, rank: 3 },
      { name: '波黑', flag: '🇧🇦', mp: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1, rank: 4 },
    ]},
    C: { name: 'C组', teams: [
      { name: '苏格兰', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', mp: 1, w: 1, d: 0, l: 0, gf: 1, ga: 0, pts: 3, rank: 1 },
      { name: '巴西', flag: '🇧🇷', mp: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1, rank: 2 },
      { name: '摩洛哥', flag: '🇲🇦', mp: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1, rank: 3 },
      { name: '海地', flag: '🇭🇹', mp: 1, w: 0, d: 0, l: 1, gf: 0, ga: 1, pts: 0, rank: 4 },
    ]},
    D: { name: 'D组', teams: [
      { name: '美国', flag: '🇺🇸', mp: 1, w: 1, d: 0, l: 0, gf: 4, ga: 1, pts: 3, rank: 1 },
      { name: '澳大利亚', flag: '🇦🇺', mp: 1, w: 1, d: 0, l: 0, gf: 2, ga: 0, pts: 3, rank: 2 },
      { name: '土耳其', flag: '🇹🇷', mp: 1, w: 0, d: 0, l: 1, gf: 0, ga: 2, pts: 0, rank: 3 },
      { name: '巴拉圭', flag: '🇵🇾', mp: 1, w: 0, d: 0, l: 1, gf: 1, ga: 4, pts: 0, rank: 4 },
    ]},
    E: { name: 'E组', teams: [
      { name: '德国', flag: '🇩🇪', mp: 1, w: 1, d: 0, l: 0, gf: 7, ga: 1, pts: 3, rank: 1 },
      { name: '科特迪瓦', flag: '🇨🇮', mp: 1, w: 1, d: 0, l: 0, gf: 1, ga: 0, pts: 3, rank: 2 },
      { name: '厄瓜多尔', flag: '🇪🇨', mp: 1, w: 0, d: 0, l: 1, gf: 0, ga: 1, pts: 0, rank: 3 },
      { name: '库拉索', flag: '🇨🇼', mp: 1, w: 0, d: 0, l: 1, gf: 1, ga: 7, pts: 0, rank: 4 },
    ]},
    F: { name: 'F组', teams: [
      { name: '瑞典', flag: '🇸🇪', mp: 1, w: 1, d: 0, l: 0, gf: 5, ga: 1, pts: 3, rank: 1 },
      { name: '荷兰', flag: '🇳🇱', mp: 1, w: 0, d: 1, l: 0, gf: 2, ga: 2, pts: 1, rank: 2 },
      { name: '日本', flag: '🇯🇵', mp: 1, w: 0, d: 1, l: 0, gf: 2, ga: 2, pts: 1, rank: 3 },
      { name: '突尼斯', flag: '🇹🇳', mp: 1, w: 0, d: 0, l: 1, gf: 1, ga: 5, pts: 0, rank: 4 },
    ]},
    G: { name: 'G组', teams: [
      { name: '比利时', flag: '🇧🇪', mp: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1, rank: 1 },
      { name: '埃及', flag: '🇪🇬', mp: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1, rank: 2 },
      { name: '伊朗', flag: '🇮🇷', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 3 },
      { name: '新西兰', flag: '🇳🇿', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 4 },
    ]},
    H: { name: 'H组', teams: [
      { name: '西班牙', flag: '🇪🇸', mp: 1, w: 0, d: 1, l: 0, gf: 0, ga: 0, pts: 1, rank: 1 },
      { name: '沙特阿拉伯', flag: '🇸🇦', mp: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1, rank: 2 },
      { name: '乌拉圭', flag: '🇺🇾', mp: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1, rank: 3 },
      { name: '佛得角', flag: '🇨🇻', mp: 1, w: 0, d: 1, l: 0, gf: 0, ga: 0, pts: 1, rank: 4 },
    ]},
    I: { name: 'I组', teams: [
      { name: '法国', flag: '🇫🇷', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 1 },
      { name: '塞内加尔', flag: '🇸🇳', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 2 },
      { name: '伊拉克', flag: '🇮🇶', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 3 },
      { name: '挪威', flag: '🇳🇴', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 4 },
    ]},
    J: { name: 'J组', teams: [
      { name: '阿根廷', flag: '🇦🇷', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 1 },
      { name: '阿尔及利亚', flag: '🇩🇿', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 2 },
      { name: '奥地利', flag: '🇦🇹', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 3 },
      { name: '约旦', flag: '🇯🇴', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 4 },
    ]},
    K: { name: 'K组', teams: [
      { name: '葡萄牙', flag: '🇵🇹', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 1 },
      { name: '哥伦比亚', flag: '🇨🇴', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 2 },
      { name: '乌兹别克斯坦', flag: '🇺🇿', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 3 },
      { name: '刚果(金)', flag: '🇨🇩', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 4 },
    ]},
    L: { name: 'L组', teams: [
      { name: '英格兰', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 1 },
      { name: '克罗地亚', flag: '🇭🇷', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 2 },
      { name: '加纳', flag: '🇬🇭', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 3 },
      { name: '巴拿马', flag: '🇵🇦', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, rank: 4 },
    ]},
  }
}

// ===== 向后兼容的同步接口 =====
function getTodayMatches() {
  return getStaticTodayMatches()
}

function getUpcomingMatches() {
  return getStaticMatches().filter(m => m.status === 'upcoming' || m.status === 'today')
}

function getFinishedMatches() {
  return getStaticMatches().filter(m => m.status === 'finished')
}

function getAllMatches() {
  return getStaticMatches()
}

function getGroups() {
  return getStaticGroups()
}

function getGroup(key) {
  return getStaticGroups()[key]
}

module.exports = {
  // 异步接口 (推荐)
  fetchAllMatches,
  fetchTodayMatches,
  fetchStandings,
  refreshData,
  // 同步接口 (兼容)
  MATCHES: getStaticMatches(),
  GROUPS: getStaticGroups(),
  getTodayMatches,
  getUpcomingMatches,
  getFinishedMatches,
  getAllMatches,
  getGroups,
  getGroup,
  DATA_MODE,
}
