// pages/schedule/schedule.js
const api = require('../../utils/api')
const { predictMatch, isUpset } = require('../../utils/predictions')

Page({
  data: {
    matches: [],
    dates: [],
    selectedDate: '',
    filter: 'all',
    loading: true,
  },

  onLoad() {
    this.loadSchedule()
  },

  onPullDownRefresh() {
    this.loadSchedule()
    wx.stopPullDownRefresh()
  },

  async loadSchedule() {
    this.setData({ loading: true })

    try {
      let allMatches

      if (api.DATA_MODE !== 'static') {
        allMatches = await api.fetchAllMatches()
      } else {
        allMatches = api.getAllMatches()
      }

      const matches = allMatches.map(m => ({
        ...m,
        prediction: (m.status === 'upcoming' || m.status === 'today') ? predictMatch(m) : null,
        isUpset: isUpset(m)
      }))

      const dateSet = new Set(matches.map(m => m.date))
      const dates = Array.from(dateSet).sort()

      this.setData({
        matches,
        dates,
        selectedDate: dates[0] || '',
        loading: false
      })
    } catch (err) {
      console.error('加载赛程失败:', err)
      this.setData({ loading: false })
    }
  },

  selectDate(e) {
    this.setData({ selectedDate: e.currentTarget.dataset.date })
  },

  setFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.filter })
  },
})
