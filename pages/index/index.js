// pages/index/index.js
const api = require('../../utils/api')
const { predictMatch, getChampionPrediction, isUpset } = require('../../utils/predictions')

Page({
  data: {
    todayMatches: [],
    upcomingMatches: [],
    recentUpsets: [],
    champion: null,
    lastUpdate: '',
    activeTab: 'today',
    loading: true,
    dataMode: api.DATA_MODE,
  },

  onLoad() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData()
    wx.stopPullDownRefresh()
  },

  async loadData() {
    this.setData({ loading: true })

    try {
      let allMatches, groups

      if (api.DATA_MODE !== 'static') {
        // 异步获取实时数据
        allMatches = await api.fetchAllMatches()
        groups = await api.fetchStandings()
      } else {
        // 静态数据
        allMatches = api.getAllMatches()
        groups = api.getGroups()
      }

      // 添加预测和冷门标记
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
      
      const todayMatches = allMatches
        .filter(m => m.date === today)
        .map(m => ({
          ...m,
          prediction: (m.status === 'upcoming' || m.status === 'today') ? predictMatch(m) : null,
          isUpset: isUpset(m)
        }))

      const upcomingMatches = allMatches
        .filter(m => m.status === 'upcoming' || m.status === 'today')
        .map(m => ({
          ...m,
          prediction: predictMatch(m)
        }))
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

      const recentUpsets = allMatches
        .filter(m => m.status === 'finished' && isUpset(m))
        .map(m => ({ ...m, isUpset: true }))

      const champion = getChampionPrediction()

      const now = new Date()
      const lastUpdate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

      this.setData({
        todayMatches,
        upcomingMatches,
        recentUpsets,
        champion,
        lastUpdate,
        loading: false
      })

      // 更新全局数据
      if (groups) {
        getApp().globalData.groups = groups
      }
    } catch (err) {
      console.error('加载数据失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '数据加载失败', icon: 'none' })
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  onShareAppMessage() {
    return {
      title: '🏆 2026世界杯AI预测 - 实时更新',
      path: '/pages/index/index'
    }
  }
})
