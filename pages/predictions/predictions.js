// pages/predictions/predictions.js
const api = require('../../utils/api')
const { predictMatch, getChampionPrediction } = require('../../utils/predictions')

Page({
  data: {
    predictions: [],
    champion: null,
    sortBy: 'confidence',
    loading: true,
  },

  onLoad() {
    this.loadPredictions()
  },

  onPullDownRefresh() {
    this.loadPredictions()
    wx.stopPullDownRefresh()
  },

  async loadPredictions() {
    this.setData({ loading: true })

    try {
      let allMatches

      if (api.DATA_MODE !== 'static') {
        allMatches = await api.fetchAllMatches()
      } else {
        allMatches = api.getAllMatches()
      }

      const predictions = allMatches
        .filter(m => m.status === 'upcoming' || m.status === 'today')
        .map(m => ({
          ...m,
          prediction: predictMatch(m)
        }))
        .sort((a, b) => b.prediction.confidence - a.prediction.confidence)

      const champion = getChampionPrediction()

      this.setData({ predictions, champion, loading: false })
    } catch (err) {
      console.error('加载预测失败:', err)
      this.setData({ loading: false })
    }
  },

  switchSort(e) {
    const sortBy = e.currentTarget.dataset.sort
    const predictions = [...this.data.predictions]
    if (sortBy === 'confidence') {
      predictions.sort((a, b) => b.prediction.confidence - a.prediction.confidence)
    } else {
      predictions.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    }
    this.setData({ sortBy, predictions })
  },

  onShareAppMessage() {
    return {
      title: '🏆 世界杯AI预测 - 谁能夺冠？',
      path: '/pages/predictions/predictions'
    }
  }
})
