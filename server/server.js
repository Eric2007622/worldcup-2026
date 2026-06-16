const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')
const path = require('path')
const fs = require('fs')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000
const API_URL = 'https://api.openligadb.de/getmatchdata/wm2026'
const DB_FILE = path.join(__dirname, 'db.json')

// ===== 数据库 (JSON文件) =====
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  } catch (e) {
    return { users: {}, bets: [] }
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

// ===== 缓存 =====
let cachedData = null, cacheTime = 0
const CACHE_TTL = 3 * 60 * 1000

async function getRawData() {
  if (cachedData && Date.now() - cacheTime < CACHE_TTL) return cachedData
  const res = await fetch(API_URL)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  cachedData = await res.json()
  cacheTime = Date.now()
  return cachedData
}

// ===== 翻译 =====
const CN = {'Mexiko':'墨西哥','Südafrika':'南非','Südkorea':'韩国','Tschechien':'捷克','Kanada':'加拿大','Bosnien-Herzegowina':'波黑','Katar':'卡塔尔','Schweiz':'瑞士','Brasilien':'巴西','Marokko':'摩洛哥','Haiti':'海地','Schottland':'苏格兰','USA':'美国','Paraguay':'巴拉圭','Australien':'澳大利亚','Türkei':'土耳其','Deutschland':'德国','Curaçao':'库拉索','Elfenbeinküste':'科特迪瓦','Ecuador':'厄瓜多尔','Niederlande':'荷兰','Japan':'日本','Schweden':'瑞典','Tunesien':'突尼斯','Spanien':'西班牙','Kap Verde':'佛得角','Saudi-Arabien':'沙特阿拉伯','Uruguay':'乌拉圭','Belgien':'比利时','Ägypten':'埃及','Iran':'伊朗','Neuseeland':'新西兰','Frankreich':'法国','Senegal':'塞内加尔','Irak':'伊拉克','Norwegen':'挪威','Argentinien':'阿根廷','Algerien':'阿尔及利亚','Österreich':'奥地利','Jordanien':'约旦','Kolumbien':'哥伦比亚','Portugal':'葡萄牙','Usbekistan':'乌兹别克斯坦','DR Kongo':'刚果(金)','England':'英格兰','Kroatien':'克罗地亚','Ghana':'加纳','Panama':'巴拿马'}
const FL = {'Mexiko':'🇲🇽','Südafrika':'🇿🇦','Südkorea':'🇰🇷','Tschechien':'🇨🇿','Kanada':'🇨🇦','Bosnien-Herzegowina':'🇧🇦','Katar':'🇶🇦','Schweiz':'🇨🇭','Brasilien':'🇧🇷','Marokko':'🇲🇦','Haiti':'🇭🇹','Schottland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','USA':'🇺🇸','Paraguay':'🇵🇾','Australien':'🇦🇺','Türkei':'🇹🇷','Deutschland':'🇩🇪','Curaçao':'🇨🇼','Elfenbeinküste':'🇨🇮','Ecuador':'🇪🇨','Niederlande':'🇳🇱','Japan':'🇯🇵','Schweden':'🇸🇪','Tunesien':'🇹🇳','Spanien':'🇪🇸','Kap Verde':'🇨🇻','Saudi-Arabien':'🇸🇦','Uruguay':'🇺🇾','Belgien':'🇧🇪','Ägypten':'🇪🇬','Iran':'🇮🇷','Neuseeland':'🇳🇿','Frankreich':'🇫🇷','Senegal':'🇸🇳','Irak':'🇮🇶','Norwegen':'🇳🇴','Argentinien':'🇦🇷','Algerien':'🇩🇿','Österreich':'🇦🇹','Jordanien':'🇯🇴','Kolumbien':'🇨🇴','Portugal':'🇵🇹','Usbekistan':'🇺🇿','DR Kongo':'🇨🇩','England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Kroatien':'🇭🇷','Ghana':'🇬🇭','Panama':'🇵🇦'}
const GP = {'Mexiko':'A','Südafrika':'A','Südkorea':'A','Tschechien':'A','Kanada':'B','Bosnien-Herzegowina':'B','Katar':'B','Schweiz':'B','Brasilien':'C','Marokko':'C','Haiti':'C','Schottland':'C','USA':'D','Paraguay':'D','Australien':'D','Türkei':'D','Deutschland':'E','Curaçao':'E','Elfenbeinküste':'E','Ecuador':'E','Niederlande':'F','Japan':'F','Schweden':'F','Tunesien':'F','Belgien':'G','Ägypten':'G','Iran':'G','Neuseeland':'G','Spanien':'H','Kap Verde':'H','Saudi-Arabien':'H','Uruguay':'H','Frankreich':'I','Senegal':'I','Irak':'I','Norwegen':'I','Argentinien':'J','Algerien':'J','Österreich':'J','Jordanien':'J','Kolumbien':'K','Portugal':'K','Usbekistan':'K','DR Kongo':'K','England':'L','Kroatien':'L','Ghana':'L','Panama':'L'}
function t(n){return CN[n]||n} function f(n){return FL[n]||'🏳️'} function g(n){return GP[n]||''}

function convertMatch(m) {
  const results = m.matchResults || []
  const final = results.find(r => r.resultTypeID === 2)
  const utcDate = new Date(m.matchDateTimeUTC || m.matchDateTime)
  const bj = new Date(utcDate.getTime() + 8*3600000)
  return {
    id: m.matchID, date: bj.toISOString().split('T')[0],
    time: String(bj.getHours()).padStart(2,'0')+':'+String(bj.getMinutes()).padStart(2,'0'),
    group: g(m.team1.teamName),
    home: t(m.team1.teamName), homeFlag: f(m.team1.teamName),
    away: t(m.team2.teamName), awayFlag: f(m.team2.teamName),
    homeScore: final ? final.pointsTeam1 : null,
    awayScore: final ? final.pointsTeam2 : null,
    status: m.matchIsFinished ? 'finished' : 'upcoming',
    goals: (m.goals||[]).map(g => ({minute:g.matchMinute,scorer:g.goalGetterName,isPenalty:g.isPenalty,score:g.scoreTeam1+'-'+g.scoreTeam2})),
  }
}

function computeStandings(matches) {
  const groups = {}
  for (const k of 'ABCDEFGHIJKL') groups[k] = {name:`${k}组`,teams:{}}
  for (const m of matches.filter(m=>m.status==='finished')) {
    const key = m.group; if (!key||!groups[key]) continue
    const h=m.home, a=m.away
    if (!groups[key].teams[h]) groups[key].teams[h]={name:h,flag:m.homeFlag,mp:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}
    if (!groups[key].teams[a]) groups[key].teams[a]={name:a,flag:m.awayFlag,mp:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}
    const ht=groups[key].teams[h], at=groups[key].teams[a]
    ht.mp++;at.mp++;ht.gf+=m.homeScore;ht.ga+=m.awayScore;at.gf+=m.awayScore;at.ga+=m.homeScore
    if(m.homeScore>m.awayScore){ht.w++;ht.pts+=3;at.l++}
    else if(m.homeScore<m.awayScore){at.w++;at.pts+=3;ht.l++}
    else{ht.d++;ht.pts++;at.d++;at.pts++}
  }
  for (const k of 'ABCDEFGHIJKL') {
    const arr=Object.values(groups[k].teams)
    arr.sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf)
    groups[k].teams=arr.map((t,i)=>({...t,rank:i+1}))
  }
  return groups
}

// ===== 用户 API =====

// 注册/登录
app.post('/api/user/login', (req, res) => {
  const { nickname, avatar } = req.body
  if (!nickname || nickname.length < 1 || nickname.length > 12) {
    return res.status(400).json({ error: '昵称1-12个字符' })
  }
  const db = readDB()
  // 检查昵称是否已存在
  let user = Object.values(db.users).find(u => u.nickname === nickname)
  if (!user) {
    const uid = 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
    user = {
      uid, nickname, avatar: avatar || '😎',
      coins: 1000, totalBets: 0, wins: 0, losses: 0, profit: 0,
      createdAt: new Date().toISOString()
    }
    db.users[uid] = user
    writeDB(db)
  }
  res.json({ user })
})

// 获取用户信息
app.get('/api/user/:uid', (req, res) => {
  const db = readDB()
  const user = db.users[req.params.uid]
  if (!user) return res.status(404).json({ error: '用户不存在' })
  res.json({ user })
})

// 下注
app.post('/api/bet', (req, res) => {
  const { uid, matchId, choice, amount } = req.body
  const db = readDB()
  const user = db.users[uid]
  if (!user) return res.status(400).json({ error: '请先登录' })
  if (!['home','draw','away'].includes(choice)) return res.status(400).json({ error: '无效选择' })
  if (!amount || amount < 10) return res.status(400).json({ error: '最低下注10金币' })
  if (amount > user.coins) return res.status(400).json({ error: '金币不足' })

  // 检查是否已下注
  const existing = db.bets.find(b => b.uid === uid && b.matchId === matchId && b.status === 'pending')
  if (existing) return res.status(400).json({ error: '已下注过这场比赛' })

  // 计算赔率
  const raw = cachedData || []
  const match = raw.find(m => m.matchID === matchId)
  if (!match) return res.status(400).json({ error: '比赛不存在' })

  const converted = convertMatch(match)
  const odds = calcOdds(choice, converted)

  const bet = {
    id: 'b_' + Date.now(),
    uid, matchId, choice, amount,
    odds: Math.round(odds * 100) / 100,
    potential: Math.round(amount * odds),
    home: converted.home, homeFlag: converted.homeFlag,
    away: converted.away, awayFlag: converted.awayFlag,
    group: converted.group, date: converted.date,
    status: 'pending', result: null, profit: 0,
    time: new Date().toISOString()
  }

  user.coins -= amount
  user.totalBets++
  db.bets.push(bet)
  writeDB(db)

  res.json({ bet, coins: user.coins })
})

// 获取用户的竞猜
app.get('/api/bets/:uid', (req, res) => {
  const db = readDB()
  const bets = db.bets.filter(b => b.uid === req.params.uid).reverse()
  res.json({ bets })
})

// 自动结算
app.post('/api/settle', (req, res) => {
  const db = readDB()
  const raw = cachedData || []
  let settled = 0

  db.bets.forEach(bet => {
    if (bet.status !== 'pending') return
    const match = raw.find(m => m.matchID === bet.matchId)
    if (!match || !match.matchIsFinished) return

    const converted = convertMatch(match)
    let result
    if (converted.homeScore > converted.awayScore) result = 'home'
    else if (converted.homeScore < converted.awayScore) result = 'away'
    else result = 'draw'

    bet.result = result
    const user = db.users[bet.uid]
    if (bet.choice === result) {
      bet.status = 'won'
      bet.profit = bet.potential - bet.amount
      if (user) user.coins += bet.potential
      if (user) user.wins++
    } else {
      bet.status = 'lost'
      bet.profit = -bet.amount
      if (user) user.losses++
    }
    if (user) user.profit += bet.profit
    settled++
  })

  if (settled) writeDB(db)
  res.json({ settled })
})

// 排行榜
app.get('/api/leaderboard', (req, res) => {
  const db = readDB()
  const users = Object.values(db.users)

  // 按金币排名
  const byCoins = users.slice().sort((a, b) => b.coins - a.coins).slice(0, 20).map((u, i) => ({
    rank: i + 1, nickname: u.nickname, avatar: u.avatar,
    coins: u.coins, totalBets: u.totalBets, wins: u.wins, losses: u.losses,
    winRate: u.totalBets > 0 ? Math.round(u.wins / u.totalBets * 100) : 0,
    profit: u.profit
  }))

  // 按胜率排名 (至少3场)
  const byWinRate = users.filter(u => u.totalBets >= 3).sort((a, b) => {
    const rateA = a.wins / a.totalBets
    const rateB = b.wins / b.totalBets
    return rateB - rateA || b.wins - a.wins
  }).slice(0, 20).map((u, i) => ({
    rank: i + 1, nickname: u.nickname, avatar: u.avatar,
    winRate: Math.round(u.wins / u.totalBets * 100),
    wins: u.wins, totalBets: u.totalBets, coins: u.coins
  }))

  // 按盈利排名
  const byProfit = users.filter(u => u.totalBets > 0).sort((a, b) => b.profit - a.profit).slice(0, 20).map((u, i) => ({
    rank: i + 1, nickname: u.nickname, avatar: u.avatar,
    profit: u.profit, coins: u.coins, totalBets: u.totalBets
  }))

  res.json({ byCoins, byWinRate, byProfit })
})

// 赔率计算
function calcOdds(choice, match) {
  const R = {'阿根廷':94,'法国':93,'英格兰':91,'巴西':90,'德国':89,'西班牙':89,'荷兰':87,'葡萄牙':87,'比利时':85,'克罗地亚':84,'哥伦比亚':83,'乌拉圭':82,'日本':80,'美国':79,'墨西哥':78,'韩国':77,'澳大利亚':76,'瑞士':76,'塞内加尔':75,'摩洛哥':75,'挪威':74,'瑞典':74,'埃及':73,'科特迪瓦':73,'厄瓜多尔':72,'土耳其':72,'巴拉圭':71,'苏格兰':70,'卡塔尔':69,'加拿大':68,'伊朗':67,'沙特阿拉伯':66,'突尼斯':65,'捷克':65,'波黑':64,'奥地利':64,'加纳':63,'新西兰':62,'巴拿马':61,'海地':58,'阿尔及利亚':62,'约旦':59,'伊拉克':58,'南非':57,'佛得角':55,'库拉索':50,'乌兹别克斯坦':56}
  const HB = {'美国':8,'墨西哥':8,'加拿大':6}
  const hr = (R[match.home]||60)+(HB[match.home]||0), ar = R[match.away]||60, diff = hr-ar
  let base
  if (diff>=8) base = {home:1.5,draw:3.5,away:6.0}
  else if (diff>=3) base = {home:1.8,draw:3.2,away:4.5}
  else if (diff>=-3) base = {home:2.5,draw:2.8,away:2.8}
  else if (diff>=-8) base = {home:4.5,draw:3.2,away:1.8}
  else base = {home:6.0,draw:3.5,away:1.5}
  return base[choice] || 2.0
}

// ===== 比赛 API =====
app.get('/api/matches', async (req, res) => {
  try {
    const raw = await getRawData()
    let matches = raw.map(convertMatch)
    const { status, date, group } = req.query
    if (status) matches = matches.filter(m => m.status === status)
    if (date) matches = matches.filter(m => m.date === date)
    if (group) matches = matches.filter(m => m.group === group)
    res.json({ count: matches.length, lastUpdate: new Date().toISOString(), matches })
  } catch (err) { res.status(500).json({ error: '获取数据失败' }) }
})

app.get('/api/matches/today', async (req, res) => {
  try {
    const raw = await getRawData()
    const all = raw.map(convertMatch)
    const bj = new Date(Date.now() + 8*3600000)
    const today = bj.toISOString().split('T')[0]
    res.json({ date: today, count: all.filter(m=>m.date===today).length, matches: all.filter(m=>m.date===today) })
  } catch (err) { res.status(500).json({ error: '获取数据失败' }) }
})

app.get('/api/standings', async (req, res) => {
  try {
    const raw = await getRawData()
    res.json({ groups: computeStandings(raw.map(convertMatch)) })
  } catch (err) { res.status(500).json({ error: '获取积分榜失败' }) }
})



// ===== 邀请系统 =====

// 通过邀请码注册
app.post('/api/user/invite-login', (req, res) => {
  const { nickname, avatar, inviteCode } = req.body
  if (!nickname) return res.status(400).json({ error: '请输入昵称' })
  const db = readDB()

  // 查找邀请人
  let inviter = null
  if (inviteCode) {
    inviter = Object.values(db.users).find(u => u.inviteCode === inviteCode)
  }

  // 检查昵称是否已存在
  let user = Object.values(db.users).find(u => u.nickname === nickname)
  if (user) {
    // 已有用户，更新头像
    user.avatar = avatar || user.avatar
    writeDB(db)
    return res.json({ user, inviter: inviter ? inviter.nickname : null })
  }

  // 创建新用户
  const uid = 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
  const code = nickname.charCodeAt(0).toString(16) + Math.random().toString(36).substr(2, 6).toUpperCase()

  user = {
    uid, nickname, avatar: avatar || '\ud83d\ude0e',
    coins: 1000, totalBets: 0, wins: 0, losses: 0, profit: 0,
    inviteCode: code,
    invitedBy: inviter ? inviter.uid : null,
    friends: [],
    createdAt: new Date().toISOString()
  }

  db.users[uid] = user

  // 建立好友关系
  if (inviter) {
    if (!inviter.friends) inviter.friends = []
    if (!inviter.friends.includes(uid)) inviter.friends.push(uid)
    // 邀请奖励：邀请人+200金币
    inviter.coins += 200
    inviter.inviteReward = (inviter.inviteReward || 0) + 200
  }

  writeDB(db)
  res.json({ user, inviter: inviter ? inviter.nickname : null, bonus: inviter ? 200 : 0 })
})

// 获取用户的邀请信息
app.get('/api/user/:uid/invite', (req, res) => {
  const db = readDB()
  const user = db.users[req.params.uid]
  if (!user) return res.status(404).json({ error: '用户不存在' })

  const friends = (user.friends || []).map(fid => {
    const f = db.users[fid]
    if (!f) return null
    return { nickname: f.nickname, avatar: f.avatar, coins: f.coins, wins: f.wins, totalBets: f.totalBets, profit: f.profit }
  }).filter(Boolean)

  const inviter = user.invitedBy ? db.users[user.invitedBy] : null

  res.json({
    inviteCode: user.inviteCode,
    inviteLink: '/?invite=' + user.inviteCode,
    inviteReward: user.inviteReward || 0,
    friendsCount: friends.length,
    friends,
    inviterName: inviter ? inviter.nickname : null
  })
})

// 好友排行榜
app.get('/api/leaderboard/friends/:uid', (req, res) => {
  const db = readDB()
  const user = db.users[req.params.uid]
  if (!user) return res.status(404).json({ error: '用户不存在' })

  const uids = [user.uid, ...(user.friends || [])]
  const friends = uids.map(uid => db.users[uid]).filter(Boolean)

  const byCoins = friends.slice().sort((a, b) => b.coins - a.coins).map((u, i) => ({
    rank: i + 1, nickname: u.nickname, avatar: u.avatar, coins: u.coins, wins: u.wins, totalBets: u.totalBets,
    winRate: u.totalBets > 0 ? Math.round(u.wins / u.totalBets * 100) : 0, isMe: u.uid === user.uid
  }))

  const byWinRate = friends.filter(u => u.totalBets >= 1).sort((a, b) => {
    const rA = a.wins / a.totalBets, rB = b.wins / b.totalBets
    return rB - rA || b.wins - a.wins
  }).map((u, i) => ({
    rank: i + 1, nickname: u.nickname, avatar: u.avatar,
    winRate: Math.round(u.wins / u.totalBets * 100), wins: u.wins, totalBets: u.totalBets, isMe: u.uid === user.uid
  }))

  res.json({ byCoins, byWinRate })
})

app.get('/api/health', (req, res) => {
  const db = readDB()
  res.json({ status: 'ok', source: 'OpenLigaDB', users: Object.keys(db.users).length, bets: db.bets.length })
})

// 静态文件
app.use(express.static(path.join(__dirname, '..', 'web')))

app.listen(PORT, () => {
  console.log(`⚽ 世界杯数据服务已启动: http://localhost:${PORT}`)
  console.log(`   GET  /api/matches        所有比赛`)
  console.log(`   GET  /api/matches/today   今日比赛`)
  console.log(`   GET  /api/standings       积分榜`)
  console.log(`   POST /api/user/login      登录/注册`)
  console.log(`   POST /api/bet             下注`)
  console.log(`   GET  /api/bets/:uid       我的竞猜`)
  console.log(`   GET  /api/leaderboard     排行榜`)
  console.log(`   POST /api/settle          结算`)
  console.log(`   GET  /api/health          健康检查`)
})
