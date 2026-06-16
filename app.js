// app.js - 世界杯预测小程序
App({
  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'worldcup-prod', // 替换为你的云开发环境ID
        traceUser: true
      })
    }

    // 检查更新
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已准备好，是否重启应用？',
          success(res) {
            if (res.confirm) updateManager.applyUpdate()
          }
        })
      })
    }
  },
  globalData: {
    version: '1.0.0',
    dataMode: 'static' // 'cloud' | 'server' | 'static'
  }
})
