# ⚽ 2026世界杯AI预测小程序

微信小程序 + 实时数据 + AI预测

## 📁 项目结构

```
worldcup-mini/
├── app.js / app.json / app.wxss     # 小程序全局配置
├── project.config.json               # 微信开发者工具配置
├── utils/
│   ├── api.js                        # 数据源 (支持云/服务器/静态)
│   ├── predictions.js                # AI预测引擎
│   └── util.js                       # 工具函数
├── pages/
│   ├── index/     🏠 首页            # 今日焦点 + 冷门 + 冠军预测
│   ├── schedule/  📋 赛程            # 完整赛程，按日期筛选
│   ├── predictions/ 🤖 预测          # 所有预测，按置信度排序
│   └── groups/    📊 积分            # 12组积分榜
├── cloud/functions/
│   └── fetchMatches/                 # 微信云函数 (实时数据)
├── server/
│   ├── server.js                     # Express后端 (自建数据服务)
│   ├── package.json
│   └── .env.example
└── static/                           # 图标资源
```

## 🚀 快速开始

### 方式一：静态数据 (最简单，开箱即用)

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入 `worldcup-mini/` 目录
3. AppID 选「测试号」或填入你自己的
4. 点击编译 → 预览

> 数据已内置，无需任何后端。缺点是需要手动更新比分。

### 方式二：自建后端 (推荐)

1. **注册免费API key**：
   - [football-data.org](https://www.football-data.org/client/register) (免费，10请求/分钟)

2. **启动后端**：
   ```bash
   cd server
   npm install
   FD_API_KEY=你的key node server.js
   ```

3. **修改小程序配置**：
   ```js
   // utils/api.js
   const DATA_MODE = 'server'  // 改为 'server'
   const SERVER_URL = 'http://你的服务器IP:3000'
   ```

4. **小程序后台配置**：
   在微信公众平台 → 开发管理 → 服务器域名，添加你的后端域名

### 方式三：微信云开发 (最优雅)

1. 在微信开发者工具中开通「云开发」
2. 创建云开发环境，记下环境ID
3. 修改 `app.js` 中的环境ID：
   ```js
   wx.cloud.init({ env: '你的环境ID' })
   ```
4. 右键 `cloud/functions/fetchMatches` → 上传并部署
5. 在云开发控制台 → 设置 → 环境变量，添加 `FD_API_KEY`
6. 修改 `utils/api.js`：
   ```js
   const DATA_MODE = 'cloud'
   ```

## 📊 API 接口

后端服务提供以下接口：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/matches` | GET | 所有比赛 (支持 ?status=&date=&group= 筛选) |
| `/api/matches/today` | GET | 今日比赛 |
| `/api/matches/:id` | GET | 比赛详情 |
| `/api/standings` | GET | 积分榜 |
| `/api/health` | GET | 健康检查 |

### 云函数接口

```js
wx.cloud.callFunction({
  name: 'fetchMatches',
  data: { action: 'matches' }  // matches | today | standings | refresh
})
```

## 🤖 预测引擎

AI预测基于：
- **球队实力评分** (0-100，基于FIFA排名和历史战绩)
- **东道主加成** (美国/墨西哥/加拿大 +6~8分)
- **特殊比赛修正** (关键场次精准预测)
- **冷门检测** (自动标记爆冷比赛)

## 📝 更新数据

### 手动更新
编辑 `utils/api.js` 中的静态数据。

### 自动更新 (后端模式)
后端每5分钟自动从API拉取最新数据并缓存。

### 自动更新 (云函数模式)
云函数配置了定时触发器，每5分钟自动刷新。

## 🔧 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `FD_API_KEY` | football-data.org API key | 是 |
| `BSD_API_KEY` | bzzoiro API key | 否 (备选) |
| `PORT` | 后端端口 | 否 (默认3000) |

## 📱 功能特性

- ✅ 4个Tab页：首页、赛程、预测、积分榜
- ✅ AI智能预测 + 置信度
- ✅ 冷门自动检测
- ✅ 冠军预测
- ✅ 深色主题
- ✅ 下拉刷新
- ✅ 分享功能
- ✅ 多数据源支持 (云/服务器/静态)
- ✅ 自动缓存

## 📄 License

MIT
