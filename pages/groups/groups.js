// pages/groups/groups.js
const api = require('../../utils/api')

Page({
  data: {
    groups: [],
    selectedGroup: 'A',
    groupKeys: ['A','B','C','D','E','F','G','H','I','J','K','L'],
    loading: true,
  },

  onLoad() {
    this.loadGroups()
  },

  onPullDownRefresh() {
    this.loadGroups()
    wx.stopPullDownRefresh()
  },

  async loadGroups() {
    this.setData({ loading: true })

    try {
      let allGroups

      if (api.DATA_MODE !== 'static') {
        allGroups = await api.fetchStandings()
      } else {
        allGroups = api.getGroups()
      }

      const groups = Object.keys(allGroups).map(key => ({
        key,
        ...allGroups[key],
        teams: allGroups[key].teams.sort((a, b) => {
          if (b.pts !== a.pts) return b.pts - a.pts
          const gdA = a.gf - a.ga
          const gdB = b.gf - b.ga
          if (gdB !== gdA) return gdB - gdA
          return b.gf - a.gf
        }).map((t, i) => ({
          ...t,
          rank: i + 1,
          gd: t.gf - t.ga,
          gdStr: (t.gf - t.ga) > 0 ? `+${t.gf - t.ga}` : `${t.gf - t.ga}`,
          status: t.pts >= 6 ? 'qualified' : t.pts <= 0 && t.mp >= 2 ? 'danger' : 'pending'
        }))
      }))

      this.setData({ groups, loading: false })
    } catch (err) {
      console.error('加载积分榜失败:', err)
      this.setData({ loading: false })
    }
  },

  selectGroup(e) {
    this.setData({ selectedGroup: e.currentTarget.dataset.group })
  }
})
