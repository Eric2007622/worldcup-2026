/**
 * 云函数: fetchMatches
 * 数据源: OpenLigaDB (免费，无需API key)
 */

const cloud = require('wx-server-sdk')
const fetch = require('node-fetch')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const API_URL = 'https://api.openligadb.de/getmatchdata/wm2026'

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

function t(n) { return TEAM_CN[n] || n }
function f(n) { return TEAM_FLAGS[n] || '🏳️' }
function g(n) { return TEAM_GROUP[n] || '' }

function convertMatch(m) {
  const results = m.matchResults || []
  const final = results.find(r => r.resultTypeID === 2)
  const utcDate = new Date(m.matchDateTimeUTC || m.matchDateTime)
  const bjTime = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000)

  return {
    id: m.matchID,
    date: bjTime.toISOString().split('T')[0],
    time: `${String(bjTime.getHours()).padStart(2,'0')}:${String(bjTime.getMinutes()).padStart(2,'0')}`,
    group: g(m.team1.teamName),
    home: t(m.team1.teamName), homeFlag: f(m.team1.teamName),
    away: t(m.team2.teamName), awayFlag: f(m.team2.teamName),
    homeScore: final ? final.pointsTeam1 : null,
    awayScore: final ? final.pointsTeam2 : null,
    status: m.matchIsFinished ? 'finished' : 'upcoming',
    goals: (m.goals || []).map(g => ({
      minute: g.matchMinute, scorer: g.goalGetterName,
      isPenalty: g.isPenalty, score: `${g.scoreTeam1}-${g.scoreTeam2}`
    })),
  }
}

function computeStandings(matches) {
  const groups = {}
  for (const k of 'ABCDEFGHIJKL') groups[k] = { name: `${k}组`, teams: {} }

  for (const m of matches.filter(m => m.status === 'finished')) {
    const key = m.group
    if (!key || !groups[key]) continue
    const h = m.home, a = m.away
    if (!groups[key].teams[h]) groups[key].teams[h] = { name: h, flag: m.homeFlag, mp:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 }
    if (!groups[key].teams[a]) groups[key].teams[a] = { name: a, flag: m.awayFlag, mp:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 }
    const ht = groups[key].teams[h], at = groups[key].teams[a]
    ht.mp++; at.mp++; ht.gf += m.homeScore; ht.ga += m.awayScore; at.gf += m.awayScore; at.ga += m.homeScore
    if (m.homeScore > m.awayScore) { ht.w++; ht.pts+=3; at.l++ }
    else if (m.homeScore < m.awayScore) { at.w++; at.pts+=3; ht.l++ }
    else { ht.d++; ht.pts++; at.d++; at.pts++ }
  }

  for (const k of 'ABCDEFGHIJKL') {
    const arr = Object.values(groups[k].teams)
    arr.sort((a,b) => b.pts - a.pts || (b.gf-b.ga) - (a.gf-a.ga) || b.gf - a.gf)
    groups[k].teams = arr.map((t,i) => ({...t, rank:i+1}))
  }
  return groups
}

async function fetchData() {
  try {
    const cached = await db.collection('cache').doc('matches').get()
    if (cached.data && Date.now() - cached.data.updatedAt < 3 * 60 * 1000) {
      return cached.data.matches
    }
  } catch (e) {}

  const res = await fetch(API_URL)
  const raw = await res.json()
  const matches = raw.map(convertMatch)

  try {
    await db.collection('cache').doc('matches').set({
      data: { matches, updatedAt: Date.now() }
    })
  } catch (e) {
    try { await db.collection('cache').add({ data: { _id: 'matches', matches, updatedAt: Date.now() } }) } catch(e2) {}
  }
  return matches
}

exports.main = async (event) => {
  const { action, date, status, group } = event
  try {
    const matches = await fetchData()

    switch (action) {
      case 'matches': {
        let result = matches
        if (date) result = result.filter(m => m.date === date)
        if (status) result = result.filter(m => m.status === status)
        if (group) result = result.filter(m => m.group === group)
        return { code: 0, count: result.length, matches: result }
      }
      case 'today': {
        const now = new Date()
        const bj = new Date(now.getTime() + 8*60*60*1000)
        const today = bj.toISOString().split('T')[0]
        const result = matches.filter(m => m.date === today)
        return { code: 0, date: today, count: result.length, matches: result }
      }
      case 'standings': {
        return { code: 0, groups: computeStandings(matches) }
      }
      case 'refresh': {
        try { await db.collection('cache').doc('matches').remove() } catch(e) {}
        const fresh = await fetchData()
        return { code: 0, message: '已刷新', count: fresh.length }
      }
      default:
        return { code: -1, error: `未知操作: ${action}` }
    }
  } catch (err) {
    return { code: -1, error: err.message }
  }
}
