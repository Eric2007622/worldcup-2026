/**
 * server.js - 世界杯数据后端
 * 
 * 数据源: OpenLigaDB (完全免费，无需API key)
 * API: https://api.openligadb.de/getmatchdata/wm2026
 * 
 * 启动: node server.js
 * 环境变量: PORT=3000 (可选)
 */

const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')

const app = express()
app.use(cors())

const PORT = process.env.PORT || 3000
const API_URL = 'https://api.openligadb.de/getmatchdata/wm2026'

// ===== 缓存 =====
let cachedData = null
let cacheTime = 0
const CACHE_TTL = 3 * 60 * 1000 // 3分钟

async function getRawData() {
  if (cachedData && Date.now() - cacheTime < CACHE_TTL) {
    return cachedData
  }
  const res = await fetch(API_URL)
  if (!res.ok) throw new Error(`OpenLigaDB error: ${res.status}`)
  cachedData = await res.json()
  cacheTime = Date.now()
  return cachedData
}

// ===== 德语 → 中文翻译 =====
const TEAM_CN = {
  'Mexiko': '墨西哥', 'Südafrika': '南非', 'Südkorea': '韩国', 'Tschechien': '捷克',
  'Kanada': '加拿大', 'Bosnien-Herzegowina': '波黑', 'Katar': '卡塔尔', 'Schweiz': '瑞士',
  'Brasilien': '巴西', 'Marokko': '摩洛哥', 'Haiti': '海地', 'Schottland': '苏格兰',
  'USA': '美国', 'Paraguay': '巴拉圭', 'Australien': '澳大利亚', 'Türkei': '土耳其',
  'Deutschland': '德国', 'Curaçao': '库拉索', 'Elfenbeinküste': '科特迪瓦', 'Ecuador': '厄瓜多尔',
  'Niederlande': '荷兰', 'Japan': '日本', 'Schweden': '瑞典', 'Tunesien': '突尼斯',
  'Spanien': '西班牙', 'Kap Verde': '佛得角', 'Saudi-Arabien': '沙特阿拉伯', 'Uruguay': '乌拉圭',
  'Belgien': '比利时', 'Ägypten': '埃及', 'Iran': '伊朗', 'Neuseeland': '新西兰',
  'Frankreich': '法国', 'Senegal': '塞内加尔', 'Irak': '伊拉克', 'Norwegen': '挪威',
  'Argentinien': '阿根廷', 'Algerien': '阿尔及利亚', 'Österreich': '奥地利', 'Jordanien': '约旦',
  'Kolumbien': '哥伦比亚', 'Portugal': '葡萄牙', 'Usbekistan': '乌兹别克斯坦', 'DR Kongo': '刚果(金)',
  'England': '英格兰', 'Kroatien': '克罗地亚', 'Ghana': '加纳', 'Panama': '巴拿马',
}

const TEAM_FLAGS = {
  'Mexiko': '🇲🇽', 'Südafrika': '🇿🇦', 'Südkorea': '🇰🇷', 'Tschechien': '🇨🇿',
  'Kanada': '🇨🇦', 'Bosnien-Herzegowina': '🇧🇦', 'Katar': '🇶🇦', 'Schweiz': '🇨🇭',
  'Brasilien': '🇧🇷', 'Marokko': '🇲🇦', 'Haiti': '🇭🇹', 'Schottland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'USA': '🇺🇸', 'Paraguay': '🇵🇾', 'Australien': '🇦🇺', 'Türkei': '🇹🇷',
  'Deutschland': '🇩🇪', 'Curaçao': '🇨🇼', 'Elfenbeinküste': '🇨🇮', 'Ecuador': '🇪🇨',
  'Niederlande': '🇳🇱', 'Japan': '🇯🇵', 'Schweden': '🇸🇪', 'Tunesien': '🇹🇳',
  'Spanien': '🇪🇸', 'Kap Verde': '🇨🇻', 'Saudi-Arabien': '🇸🇦', 'Uruguay': '🇺🇾',
  'Belgien': '🇧🇪', 'Ägypten': '🇪🇬', 'Iran': '🇮🇷', 'Neuseeland': '🇳🇿',
  'Frankreich': '🇫🇷', 'Senegal': '🇸🇳', 'Irak': '🇮🇶', 'Norwegen': '🇳🇴',
  'Argentinien': '🇦🇷', 'Algerien': '🇩🇿', 'Österreich': '🇦🇹', 'Jordanien': '🇯🇴',
  'Kolumbien': '🇨🇴', 'Portugal': '🇵🇹', 'Usbekistan': '🇺🇿', 'DR Kongo': '🇨🇩',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Kroatien': '🇭🇷', 'Ghana': '🇬🇭', 'Panama': '🇵🇦',
}

// 小组映射 (根据球队分组)
const TEAM_GROUP = {
  'Mexiko': 'A', 'Südafrika': 'A', 'Südkorea': 'A', 'Tschechien': 'A',
  'Kanada': 'B', 'Bosnien-Herzegowina': 'B', 'Katar': 'B', 'Schweiz': 'B',
  'Brasilien': 'C', 'Marokko': 'C', 'Haiti': 'C', 'Schottland': 'C',
  'USA': 'D', 'Paraguay': 'D', 'Australien': 'D', 'Türkei': 'D',
  'Deutschland': 'E', 'Curaçao': 'E', 'Elfenbeinküste': 'E', 'Ecuador': 'E',
  'Niederlande': 'F', 'Japan': 'F', 'Schweden': 'F', 'Tunesien': 'F',
  'Belgien': 'G', 'Ägypten': 'G', 'Iran': 'G', 'Neuseeland': 'G',
  'Spanien': 'H', 'Kap Verde': 'H', 'Saudi-Arabien': 'H', 'Uruguay': 'H',
  'Frankreich': 'I', 'Senegal': 'I', 'Irak': 'I', 'Norwegen': 'I',
  'Argentinien': 'J', 'Algerien': 'J', 'Österreich': 'J', 'Jordanien': 'J',
  'Kolumbien': 'K', 'Portugal': 'K', 'Usbekistan': 'K', 'DR Kongo': 'K',
  'England': 'L', 'Kroatien': 'L', 'Ghana': 'L', 'Panama': 'L',
}

function t(name) { return TEAM_CN[name] || name }
function f(name) { return TEAM_FLAGS[name] || '🏳️' }
function g(name) { return TEAM_GROUP[name] || '' }

// ===== 数据转换 =====

function convertMatch(m) {
  const results = m.matchResults || []
  const final = results.find(r => r.resultTypeID === 2) // 终场比分
  const halftime = results.find(r => r.resultTypeID === 1) // 半场比分

  const homeScore = final ? final.pointsTeam1 : null
  const awayScore = final ? final.pointsTeam2 : null

  // 转换为北京时间
  const utcDate = new Date(m.matchDateTimeUTC || m.matchDateTime)
  const bjTime = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000)
  const dateStr = bjTime.toISOString().split('T')[0]
  const timeStr = `${String(bjTime.getHours()).padStart(2,'0')}:${String(bjTime.getMinutes()).padStart(2,'0')}`

  const goals = (m.goals || []).map(g => ({
    minute: g.matchMinute,
    scorer: g.goalGetterName,
    isPenalty: g.isPenalty,
    isOwnGoal: g.isOwnGoal,
    score: `${g.scoreTeam1}-${g.scoreTeam2}`
  }))

  return {
    id: m.matchID,
    date: dateStr,
    time: timeStr,
    group: g(m.team1.teamName),
    home: t(m.team1.teamName),
    homeFlag: f(m.team1.teamName),
    homeShort: m.team1.shortName,
    away: t(m.team2.teamName),
    awayFlag: f(m.team2.teamName),
    awayShort: m.team2.shortName,
    homeScore,
    awayScore,
    halftimeHome: halftime ? halftime.pointsTeam1 : null,
    halftimeAway: halftime ? halftime.pointsTeam2 : null,
    status: m.matchIsFinished ? 'finished' : 'upcoming',
    goals,
    matchday: m.group ? m.group.groupName : '',
  }
}

function computeStandings(matches) {
  const groups = {}
  const groupKeys = ['A','B','C','D','E','F','G','H','I','J','K','L']

  for (const key of groupKeys) {
    groups[key] = { name: `${key}组`, teams: {} }
  }

  const finished = matches.filter(m => m.status === 'finished')
  for (const m of finished) {
    const groupKey = m.group
    if (!groupKey || !groups[groupKey]) continue

    const home = m.home
    const away = m.away

    if (!groups[groupKey].teams[home]) {
      groups[groupKey].teams[home] = { name: home, flag: m.homeFlag, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }
    }
    if (!groups[groupKey].teams[away]) {
      groups[groupKey].teams[away] = { name: away, flag: m.awayFlag, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }
    }

    const ht = groups[groupKey].teams[home]
    const at = groups[groupKey].teams[away]

    ht.mp++; at.mp++
    ht.gf += m.homeScore; ht.ga += m.awayScore
    at.gf += m.awayScore; at.ga += m.homeScore

    if (m.homeScore > m.awayScore) {
      ht.w++; ht.pts += 3; at.l++
    } else if (m.homeScore < m.awayScore) {
      at.w++; at.pts += 3; ht.l++
    } else {
      ht.d++; ht.pts += 1; at.d++; at.pts += 1
    }
  }

  // 排序
  for (const key of groupKeys) {
    const teamArr = Object.values(groups[key].teams)
    teamArr.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      const gdA = a.gf - a.ga, gdB = b.gf - b.ga
      if (gdB !== gdA) return gdB - gdA
      return b.gf - a.gf
    })
    groups[key].teams = teamArr.map((t, i) => ({ ...t, rank: i + 1 }))
  }

  return groups
}

// ===== API 路由 =====

app.get('/api/matches', async (req, res) => {
  try {
    const raw = await getRawData()
    let matches = raw.map(convertMatch)

    const { status, date, group } = req.query
    if (status) matches = matches.filter(m => m.status === status)
    if (date) matches = matches.filter(m => m.date === date)
    if (group) matches = matches.filter(m => m.group === group)

    res.json({ count: matches.length, lastUpdate: new Date().toISOString(), matches })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '获取数据失败' })
  }
})

app.get('/api/matches/today', async (req, res) => {
  try {
    const raw = await getRawData()
    const all = raw.map(convertMatch)
    // 北京时间今天
    const now = new Date()
    const bjNow = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const today = bjNow.toISOString().split('T')[0]
    const matches = all.filter(m => m.date === today)
    res.json({ date: today, count: matches.length, matches })
  } catch (err) {
    res.status(500).json({ error: '获取数据失败' })
  }
})

app.get('/api/standings', async (req, res) => {
  try {
    const raw = await getRawData()
    const matches = raw.map(convertMatch)
    const groups = computeStandings(matches)
    res.json({ groups })
  } catch (err) {
    res.status(500).json({ error: '获取积分榜失败' })
  }
})

app.get('/api/matches/:id', async (req, res) => {
  try {
    const raw = await getRawData()
    const match = raw.find(m => m.matchID === parseInt(req.params.id))
    if (!match) return res.status(404).json({ error: '比赛未找到' })
    res.json(convertMatch(match))
  } catch (err) {
    res.status(500).json({ error: '获取比赛详情失败' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    source: 'OpenLigaDB (免费，无需API key)',
    cacheAge: cachedData ? Math.round((Date.now() - cacheTime) / 1000) + 's' : 'no cache',
    cacheMatches: cachedData ? cachedData.length : 0,
  })
})

const path = require('path')
app.use(express.static(path.join(__dirname, '..', 'web')))

app.listen(PORT, () => {
  console.log(`⚽ 世界杯数据服务已启动: http://localhost:${PORT}`)
  console.log(`📊 数据源: OpenLigaDB (免费，无需API key)`)
  console.log(``)
  console.log(`   GET /api/matches         所有比赛 (?status=&date=&group=)`)
  console.log(`   GET /api/matches/today    今日比赛`)
  console.log(`   GET /api/matches/:id      比赛详情`)
  console.log(`   GET /api/standings        积分榜`)
  console.log(`   GET /api/health           健康检查`)
})
