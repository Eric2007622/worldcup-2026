const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000
const API_URL = 'https://api.openligadb.de/getmatchdata/wm2026'
const DATABASE_URL = process.env.DATABASE_URL || ''

// ===== 数据库 =====
let pool = null

async function initDB() {
  if (!DATABASE_URL) {
    console.log('⚠️ 无数据库配置，使用内存存储（重启会丢失数据）')
    return
  }
  const { Pool } = require('pg')
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
  
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY, nickname TEXT UNIQUE, avatar TEXT DEFAULT '😎',
    coins INTEGER DEFAULT 1000, total_bets INTEGER DEFAULT 0, wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0, profit INTEGER DEFAULT 0, invite_code TEXT,
    wechat_id TEXT UNIQUE, invited_by TEXT, invite_reward INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`)
  
  await pool.query(`CREATE TABLE IF NOT EXISTS bets (
    id TEXT PRIMARY KEY, uid TEXT, match_id INTEGER, choice TEXT,
    amount INTEGER, odds REAL, potential INTEGER, home TEXT, home_flag TEXT,
    away TEXT, away_flag TEXT, grp TEXT, match_date TEXT,
    status TEXT DEFAULT 'pending', result TEXT, profit INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`)
  
  await pool.query(`CREATE TABLE IF NOT EXISTS friends (
    uid TEXT, friend_uid TEXT, PRIMARY KEY(uid, friend_uid)
  )`)
  
  console.log('✅ PostgreSQL 已连接')
}

// ===== 内存存储 fallback =====
let memDB = { users: {}, bets: [], friends: [] }

async function query(sql, params) {
  if (pool) {
    const res = await pool.query(sql, params)
    return res.rows
  }
  return []
}

async function run(sql, params) {
  if (pool) {
    await pool.query(sql, params)
  }
}

// ===== 缓存 =====
let cachedData = null, cacheTime = 0
const CACHE_TTL = 3 * 60 * 1000

async function getRawData() {
  if (cachedData && Date.now() - cacheTime < CACHE_TTL) return cachedData
  const res = await fetch(API_URL)
  if (!res.ok) throw new Error('API error')
  cachedData = await res.json()
  cacheTime = Date.now()
  return cachedData
}

// ===== 翻译 =====
const CN={'Mexiko':'墨西哥','Südafrika':'南非','Südkorea':'韩国','Tschechien':'捷克','Kanada':'加拿大','Bosnien-Herzegowina':'波黑','Katar':'卡塔尔','Schweiz':'瑞士','Brasilien':'巴西','Marokko':'摩洛哥','Haiti':'海地','Schottland':'苏格兰','USA':'美国','Paraguay':'巴拉圭','Australien':'澳大利亚','Türkei':'土耳其','Deutschland':'德国','Curaçao':'库拉索','Elfenbeinküste':'科特迪瓦','Ecuador':'厄瓜多尔','Niederlande':'荷兰','Japan':'日本','Schweden':'瑞典','Tunesien':'突尼斯','Spanien':'西班牙','Kap Verde':'佛得角','Saudi-Arabien':'沙特阿拉伯','Uruguay':'乌拉圭','Belgien':'比利时','Ägypten':'埃及','Iran':'伊朗','Neuseeland':'新西兰','Frankreich':'法国','Senegal':'塞内加尔','Irak':'伊拉克','Norwegen':'挪威','Argentinien':'阿根廷','Algerien':'阿尔及利亚','Österreich':'奥地利','Jordanien':'约旦','Kolumbien':'哥伦比亚','Portugal':'葡萄牙','Usbekistan':'乌兹别克斯坦','DR Kongo':'刚果(金)','England':'英格兰','Kroatien':'克罗地亚','Ghana':'加纳','Panama':'巴拿马'}
const FL={'Mexiko':'🇲🇽','Südafrika':'🇿🇦','Südkorea':'🇰🇷','Tschechien':'🇨🇿','Kanada':'🇨🇦','Bosnien-Herzegowina':'🇧🇦','Katar':'🇶🇦','Schweiz':'🇨🇭','Brasilien':'🇧🇷','Marokko':'🇲🇦','Haiti':'🇭🇹','Schottland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','USA':'🇺🇸','Paraguay':'🇵🇾','Australien':'🇦🇺','Türkei':'🇹🇷','Deutschland':'🇩🇪','Curaçao':'🇨🇼','Elfenbeinküste':'🇨🇮','Ecuador':'🇪🇨','Niederlande':'🇳🇱','Japan':'🇯🇵','Schweden':'🇸🇪','Tunesien':'🇹🇳','Spanien':'🇪🇸','Kap Verde':'🇨🇻','Saudi-Arabien':'🇸🇦','Uruguay':'🇺🇾','Belgien':'🇧🇪','Ägypten':'🇪🇬','Iran':'🇮🇷','Neuseeland':'🇳🇿','Frankreich':'🇫🇷','Senegal':'🇸🇳','Irak':'🇮🇶','Norwegen':'🇳🇴','Argentinien':'🇦🇷','Algerien':'🇩🇿','Österreich':'🇦🇹','Jordanien':'🇯🇴','Kolumbien':'🇨🇴','Portugal':'🇵🇹','Usbekistan':'🇺🇿','DR Kongo':'🇨🇩','England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Kroatien':'🇭🇷','Ghana':'🇬🇭','Panama':'🇵🇦'}
const GP={'Mexiko':'A','Südafrika':'A','Südkorea':'A','Tschechien':'A','Kanada':'B','Bosnien-Herzegowina':'B','Katar':'B','Schweiz':'B','Brasilien':'C','Marokko':'C','Haiti':'C','Schottland':'C','USA':'D','Paraguay':'D','Australien':'D','Türkei':'D','Deutschland':'E','Curaçao':'E','Elfenbeinküste':'E','Ecuador':'E','Niederlande':'F','Japan':'F','Schweden':'F','Tunesien':'F','Belgien':'G','Ägypten':'G','Iran':'G','Neuseeland':'G','Spanien':'H','Kap Verde':'H','Saudi-Arabien':'H','Uruguay':'H','Frankreich':'I','Senegal':'I','Irak':'I','Norwegen':'I','Argentinien':'J','Algerien':'J','Österreich':'J','Jordanien':'J','Kolumbien':'K','Portugal':'K','Usbekistan':'K','DR Kongo':'K','England':'L','Kroatien':'L','Ghana':'L','Panama':'L'}
function t(n){return CN[n]||n} function f(n){return FL[n]||'🏳️'} function g(n){return GP[n]||''}

function convertMatch(m){const r=m.matchResults||[],fi=r.find(x=>x.resultTypeID===2),u=new Date(m.matchDateTimeUTC||m.matchDateTime),bj=new Date(u.getTime()+8*3600000);return{id:m.matchID,date:bj.toISOString().split('T')[0],time:String(bj.getHours()).padStart(2,'0')+':'+String(bj.getMinutes()).padStart(2,'0'),group:g(m.team1.teamName),home:t(m.team1.teamName),homeFlag:f(m.team1.teamName),away:t(m.team2.teamName),awayFlag:f(m.team2.teamName),homeScore:fi?fi.pointsTeam1:null,awayScore:fi?fi.pointsTeam2:null,status:m.matchIsFinished?'finished':'upcoming'}}

function calcOdds(ch,h,a){const R={'阿根廷':94,'法国':93,'英格兰':91,'巴西':90,'德国':89,'西班牙':89,'荷兰':87,'葡萄牙':87,'比利时':85,'克罗地亚':84,'哥伦比亚':83,'乌拉圭':82,'日本':80,'美国':79,'墨西哥':78,'韩国':77,'澳大利亚':76,'瑞士':76},HB={'美国':8,'墨西哥':8,'加拿大':6};const hr=(R[h]||60)+(HB[h]||0),ar=R[a]||60,diff=hr-ar;let base;if(diff>=8)base={home:1.5,draw:3.5,away:6.0};else if(diff>=3)base={home:1.8,draw:3.2,away:4.5};else if(diff>=-3)base={home:2.5,draw:2.8,away:2.8};else if(diff>=-8)base={home:4.5,draw:3.2,away:1.8};else base={home:6.0,draw:3.5,away:1.5};return base[ch]||2.0}

function computeStandings(matches){const groups={};for(const k of 'ABCDEFGHIJKL')groups[k]={name:k+'组',teams:{}};for(const m of matches.filter(m=>m.status==='finished')){const key=m.group;if(!key||!groups[key])continue;const h=m.home,a=m.away;if(!groups[key].teams[h])groups[key].teams[h]={name:h,flag:m.homeFlag,mp:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};if(!groups[key].teams[a])groups[key].teams[a]={name:a,flag:m.awayFlag,mp:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};const ht=groups[key].teams[h],at=groups[key].teams[a];ht.mp++;at.mp++;ht.gf+=m.homeScore;ht.ga+=m.awayScore;at.gf+=m.awayScore;at.ga+=m.homeScore;if(m.homeScore>m.awayScore){ht.w++;ht.pts+=3;at.l++}else if(m.homeScore<m.awayScore){at.w++;at.pts+=3;ht.l++}else{ht.d++;ht.pts++;at.d++;at.pts++}}for(const k of 'ABCDEFGHIJKL'){const arr=Object.values(groups[k].teams);arr.sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf);groups[k].teams=arr.map((t,i)=>({...t,rank:i+1}))}return groups}

// ===== 用户 API =====
app.post('/api/user/invite-login', async (req, res) => {
  const { nickname, avatar, inviteCode, wechatId } = req.body
  if (!nickname) return res.status(400).json({ error: '请输入昵称' })
  if (!wechatId) return res.status(400).json({ error: '请输入微信号' })

  if (pool) {
    // 通过微信号查找已有用户
    const existing = await query('SELECT * FROM users WHERE wechat_id = $1', [wechatId])
    if (existing.length > 0) {
      const user = existing[0]
      await run('UPDATE users SET nickname=$1, avatar=$2 WHERE uid=$3', [nickname, avatar || user.avatar, user.uid])
      return res.json({ user: dbUser(user), login: true })
    }

    // 检查昵称唯一
    const nameCheck = await query('SELECT uid FROM users WHERE nickname = $1', [nickname])
    if (nameCheck.length > 0) return res.status(400).json({ error: '昵称已被占用' })

    // 创建新用户
    const uid = 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
    const invCode = wechatId.substr(0, 3).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase()
    
    await run('INSERT INTO users(uid,nickname,avatar,coins,invite_code,wechat_id) VALUES($1,$2,$3,1000,$4,$5)', [uid, nickname, avatar || '😎', invCode, wechatId])

    // 处理邀请
    let inviterName = null
    if (inviteCode) {
      const inviter = await query('SELECT * FROM users WHERE invite_code = $1', [inviteCode])
      if (inviter.length > 0) {
        await run('UPDATE users SET invited_by=$1 WHERE uid=$2', [inviter[0].uid, uid])
        await run('INSERT INTO friends(uid,friend_uid) VALUES($1,$2) ON CONFLICT DO NOTHING', [inviter[0].uid, uid])
        await run('INSERT INTO friends(uid,friend_uid) VALUES($1,$2) ON CONFLICT DO NOTHING', [uid, inviter[0].uid])
        await run('UPDATE users SET coins = coins + 200, invite_reward = invite_reward + 200 WHERE uid = $1', [inviter[0].uid])
        inviterName = inviter[0].nickname
      }
    }

    const user = (await query('SELECT * FROM users WHERE uid=$1', [uid]))[0]
    return res.json({ user: dbUser(user), inviter: inviterName, bonus: inviterName ? 200 : 0 })
  }

  // 内存 fallback
  const uid = 'u_' + Date.now()
  const user = { uid, nickname, avatar: avatar || '😎', coins: 1000, total_bets: 0, wins: 0, losses: 0, profit: 0, invite_code: uid.substr(0,8), wechat_id: wechatId }
  memDB.users[uid] = user
  res.json({ user })
})

app.get('/api/user/:uid', async (req, res) => {
  if (pool) {
    const rows = await query('SELECT * FROM users WHERE uid=$1', [req.params.uid])
    if (!rows.length) return res.status(404).json({ error: '用户不存在' })
    return res.json({ user: dbUser(rows[0]) })
  }
  const user = memDB.users[req.params.uid]
  if (!user) return res.status(404).json({ error: '用户不存在' })
  res.json({ user })
})

app.get('/api/user/search/:kw', async (req, res) => {
  const kw = '%' + req.params.kw + '%'
  if (pool) {
    const rows = await query('SELECT * FROM users WHERE wechat_id ILIKE $1 OR nickname ILIKE $1 LIMIT 10', [kw])
    return res.json({ results: rows.map(u => ({ uid: u.uid, nickname: u.nickname, avatar: u.avatar, wechatId: u.wechat_id || '', coins: u.coins })) })
  }
  const kw2 = req.params.keyword.toLowerCase()
  const results = Object.values(memDB.users).filter(u => (u.wechat_id && u.wechat_id.toLowerCase().includes(kw2)) || u.nickname.toLowerCase().includes(kw2)).slice(0, 10).map(u => ({ uid: u.uid, nickname: u.nickname, avatar: u.avatar, wechatId: u.wechat_id || '', coins: u.coins }))
  res.json({ results })
})

// 下注
app.post('/api/bet', async (req, res) => {
  const { uid, matchId, choice, amount } = req.body
  if (!uid || !matchId || !choice || !amount) return res.status(400).json({ error: '参数不完整' })
  if (!['home','draw','away'].includes(choice)) return res.status(400).json({ error: '无效选择' })
  if (amount < 10) return res.status(400).json({ error: '最低下注10金币' })

  if (pool) {
    const users = await query('SELECT * FROM users WHERE uid=$1', [uid])
    if (!users.length) return res.status(400).json({ error: '请先登录' })
    const user = users[0]
    if (amount > user.coins) return res.status(400).json({ error: '金币不足' })

    const existing = await query('SELECT id FROM bets WHERE uid=$1 AND match_id=$2 AND status=$3', [uid, matchId, 'pending'])
    if (existing.length) return res.status(400).json({ error: '已下注过这场比赛' })

    let raw = cachedData
    if (!raw || !raw.length) {
      try { raw = await getRawData() } catch(e) { raw = [] }
    }
    const match = raw.find(m => m.matchID === matchId)
    if (!match) return res.status(400).json({ error: '比赛不存在(ID:' + matchId + ')' })

    const converted = convertMatch(match)
    const odds = calcOdds(choice, converted.home, converted.away)
    const betId = 'b_' + Date.now()
    const potential = Math.round(amount * odds)

    await run('INSERT INTO bets(id,uid,match_id,choice,amount,odds,potential,home,home_flag,away,away_flag,grp,match_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [betId, uid, matchId, choice, amount, odds, potential, converted.home, converted.homeFlag, converted.away, converted.awayFlag, converted.group, converted.date])
    await run('UPDATE users SET coins = coins - $1, total_bets = total_bets + 1 WHERE uid = $2', [amount, uid])

    const newCoins = (await query('SELECT coins FROM users WHERE uid=$1', [uid]))[0].coins
    return res.json({ bet: { id: betId, matchId, choice, amount, odds, potential }, coins: newCoins })
  }
  res.status(400).json({ error: '服务暂不可用' })
})

// 获取用户竞猜
app.get('/api/bets/:uid', async (req, res) => {
  if (pool) {
    const rows = await query('SELECT * FROM bets WHERE uid=$1 ORDER BY created_at DESC', [req.params.uid])
    return res.json({ bets: rows.map(b => ({ id: b.id, matchId: b.match_id, choice: b.choice, amount: b.amount, odds: b.odds, potential: b.potential, home: b.home, homeFlag: b.home_flag, away: b.away, awayFlag: b.away_flag, group: b.grp, date: b.match_date, status: b.status, result: b.result, profit: b.profit })) })
  }
  res.json({ bets: [] })
})

// 结算
app.post('/api/settle', async (req, res) => {
  if (!pool) return res.json({ settled: 0 })
  let raw = cachedData
  if (!raw || !raw.length) {
    try { raw = await getRawData() } catch(e) { raw = [] }
  }
  const pending = await query('SELECT * FROM bets WHERE status=$1', ['pending'])
  let settled = 0

  for (const bet of pending) {
    const match = raw.find(m => m.matchID === bet.match_id)
    if (!match || !match.matchIsFinished) continue

    const converted = convertMatch(match)
    let result
    if (converted.homeScore > converted.awayScore) result = 'home'
    else if (converted.homeScore < converted.awayScore) result = 'away'
    else result = 'draw'

    const won = bet.choice === result
    const profit = won ? bet.potential - bet.amount : -bet.amount

    await run('UPDATE bets SET status=$1, result=$2, profit=$3 WHERE id=$4', [won ? 'won' : 'lost', result, profit, bet.id])
    if (won) {
      await run('UPDATE users SET coins = coins + $1, wins = wins + 1, profit = profit + $2 WHERE uid = $3', [bet.potential, profit, bet.uid])
    } else {
      await run('UPDATE users SET losses = losses + 1, profit = profit + $1 WHERE uid = $2', [profit, bet.uid])
    }
    settled++
  }
  res.json({ settled })
})

// 邀请码使用
app.post('/api/user/:uid/use-invite', async (req, res) => {
  const { inviteCode } = req.body
  if (!inviteCode) return res.status(400).json({ error: '请输入邀请码' })
  if (!pool) return res.status(400).json({ error: '服务暂不可用' })

  const users = await query('SELECT * FROM users WHERE uid=$1', [req.params.uid])
  if (!users.length) return res.status(404).json({ error: '用户不存在' })
  const user = users[0]
  if (user.invited_by) return res.status(400).json({ error: '已使用过邀请码' })

  const inviter = await query('SELECT * FROM users WHERE invite_code=$1', [inviteCode])
  if (!inviter.length) return res.status(404).json({ error: '邀请码无效' })
  if (inviter[0].uid === user.uid) return res.status(400).json({ error: '不能使用自己的邀请码' })

  await run('UPDATE users SET invited_by=$1, coins=coins+200 WHERE uid=$2', [inviter[0].uid, user.uid])
  await run('UPDATE users SET coins=coins+200, invite_reward=invite_reward+200 WHERE uid=$1', [inviter[0].uid])
  await run('INSERT INTO friends(uid,friend_uid) VALUES($1,$2) ON CONFLICT DO NOTHING', [inviter[0].uid, user.uid])
  await run('INSERT INTO friends(uid,friend_uid) VALUES($1,$2) ON CONFLICT DO NOTHING', [user.uid, inviter[0].uid])

  const updated = (await query('SELECT * FROM users WHERE uid=$1', [user.uid]))[0]
  res.json({ user: dbUser(updated), inviterName: inviter[0].nickname, bonus: 200 })
})

// 添加好友
app.post('/api/user/:uid/add-friend', async (req, res) => {
  const { targetUid } = req.body
  if (!pool) return res.status(400).json({ error: '服务暂不可用' })
  const user = (await query('SELECT * FROM users WHERE uid=$1', [req.params.uid]))[0]
  if (!user) return res.status(404).json({ error: '用户不存在' })
  const friend = (await query('SELECT * FROM users WHERE uid=$1', [targetUid]))[0]
  if (!friend) return res.status(404).json({ error: '未找到用户' })
  if (friend.uid === user.uid) return res.status(400).json({ error: '不能添加自己' })

  const existing = await query('SELECT * FROM friends WHERE uid=$1 AND friend_uid=$2', [user.uid, friend.uid])
  if (existing.length) return res.status(400).json({ error: '已经是好友了' })

  await run('INSERT INTO friends(uid,friend_uid) VALUES($1,$2)', [user.uid, friend.uid])
  await run('INSERT INTO friends(uid,friend_uid) VALUES($1,$2)', [friend.uid, user.uid])
  res.json({ friend: { nickname: friend.nickname, avatar: friend.avatar, wechatId: friend.wechat_id || '' } })
})

// 排行榜
app.get('/api/leaderboard', async (req, res) => {
  if (pool) {
    const allUsers = await query('SELECT * FROM users ORDER BY coins DESC LIMIT 50')
    const byCoins = allUsers.map((u, i) => ({ rank: i+1, uid: u.uid, nickname: u.nickname, avatar: u.avatar, coins: u.coins, totalBets: u.total_bets, wins: u.wins, losses: u.losses, winRate: u.total_bets>0?Math.round(u.wins/u.total_bets*100):0, profit: u.profit, wechatId: u.wechat_id||'' }))
    const byWinRate = allUsers.filter(u => u.total_bets >= 3).sort((a,b) => (b.wins/b.total_bets)-(a.wins/a.total_bets)).slice(0,20).map((u,i) => ({ rank:i+1, nickname:u.nickname, avatar:u.avatar, winRate:Math.round(u.wins/u.total_bets*100), wins:u.wins, totalBets:u.total_bets, coins:u.coins }))
    const byProfit = allUsers.filter(u => u.total_bets>0).sort((a,b) => b.profit-a.profit).slice(0,20).map((u,i) => ({ rank:i+1, nickname:u.nickname, avatar:u.avatar, profit:u.profit, coins:u.coins, totalBets:u.total_bets }))
    return res.json({ byCoins, byWinRate, byProfit })
  }
  const users = Object.values(memDB.users)
  const byCoins = users.sort((a,b) => b.coins-a.coins).slice(0,20).map((u,i) => ({ rank:i+1, nickname:u.nickname, avatar:u.avatar, coins:u.coins, totalBets:u.total_bets||0, wins:u.wins||0, losses:u.losses||0, winRate:0, profit:0, wechatId:u.wechat_id||'' }))
  res.json({ byCoins, byWinRate: [], byProfit: [] })
})

// 好友排行榜
app.get('/api/leaderboard/friends/:uid', async (req, res) => {
  if (!pool) return res.json({ byCoins: [], byWinRate: [] })
  const friendRows = await query('SELECT friend_uid FROM friends WHERE uid=$1', [req.params.uid])
  const uids = [req.params.uid, ...friendRows.map(r => r.friend_uid)]
  const placeholders = uids.map((_, i) => '$' + (i+1)).join(',')
  const users = await query(`SELECT * FROM users WHERE uid IN (${placeholders}) ORDER BY coins DESC`, uids)
  const byCoins = users.map((u,i) => ({ rank:i+1, nickname:u.nickname, avatar:u.avatar, coins:u.coins, wins:u.wins, totalBets:u.total_bets, winRate:u.total_bets>0?Math.round(u.wins/u.total_bets*100):0, isMe:u.uid===req.params.uid }))
  res.json({ byCoins, byWinRate: [] })
})

// 比赛 API
app.get('/api/matches', async (req, res) => {
  try { const raw = await getRawData(); let matches = raw.map(convertMatch); const {status,date,group}=req.query; if(status)matches=matches.filter(m=>m.status===status); if(date)matches=matches.filter(m=>m.date===date); if(group)matches=matches.filter(m=>m.group===group); res.json({count:matches.length,matches}) } catch(e) { res.status(500).json({error:'获取失败'}) }
})
app.get('/api/matches/today', async (req, res) => {
  try { const raw = await getRawData(); const all = raw.map(convertMatch); const bj = new Date(Date.now()+8*3600000); const today = bj.toISOString().split('T')[0]; const ms = all.filter(m=>m.date===today); res.json({date:today,count:ms.length,matches:ms}) } catch(e) { res.status(500).json({error:'获取失败'}) }
})
app.get('/api/standings', async (req, res) => {
  try { const raw = await getRawData(); res.json({groups:computeStandings(raw.map(convertMatch))}) } catch(e) { res.status(500).json({error:'获取失败'}) }
})


// 通过微信号登录
app.post('/api/user/login-by-wechat', async (req, res) => {
  const { wechatId } = req.body
  if (!wechatId) return res.status(400).json({ error: '请输入微信号' })

  if (pool) {
    const rows = await query('SELECT * FROM users WHERE wechat_id = $1', [wechatId])
    if (!rows.length) return res.status(404).json({ error: '该微信号未注册,请先注册' })
    return res.json({ user: dbUser(rows[0]) })
  }

  const user = Object.values(memDB.users).find(u => u.wechat_id === wechatId)
  if (!user) return res.status(404).json({ error: '该微信号未注册' })
  res.json({ user })
})

app.get('/api/health', async (req, res) => {
  const userCount = pool ? (await query('SELECT COUNT(*) as c FROM users'))[0].c : Object.keys(memDB.users).length
  const betCount = pool ? (await query('SELECT COUNT(*) as c FROM bets'))[0].c : memDB.bets.length
  res.json({ status:'ok', db: pool?'PostgreSQL':'Memory', users: parseInt(userCount), bets: parseInt(betCount) })
})

// 设置微信号
app.post('/api/user/:uid/wechat', async (req, res) => {
  const { wechatId } = req.body
  if (!wechatId) return res.status(400).json({ error: '请输入微信号' })
  if (pool) {
    const existing = await query('SELECT uid FROM users WHERE wechat_id=$1 AND uid!=$2', [wechatId, req.params.uid])
    if (existing.length) return res.status(400).json({ error: '该微信号已被绑定' })
    await run('UPDATE users SET wechat_id=$1 WHERE uid=$2', [wechatId, req.params.uid])
    const user = (await query('SELECT * FROM users WHERE uid=$1', [req.params.uid]))[0]
    return res.json({ user: dbUser(user) })
  }
  res.status(400).json({ error: '服务暂不可用' })
})

function dbUser(u) {
  return { uid: u.uid, nickname: u.nickname, avatar: u.avatar, coins: u.coins, totalBets: u.total_bets, wins: u.wins, losses: u.losses, profit: u.profit, inviteCode: u.invite_code, wechatId: u.wechat_id || '', invitedBy: u.invited_by || null, inviteReward: u.invite_reward || 0 }
}

app.use(express.static(path.join(__dirname, '..', 'web')))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'web', 'index.html'))
})

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`⚽ 世界杯服务已启动: http://localhost:${PORT}`)
    console.log(`   数据库: ${pool ? 'PostgreSQL' : '内存存储'}`)
  })
})
