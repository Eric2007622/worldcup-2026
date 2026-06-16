/**
 * util.js - 工具函数
 */

// 格式化日期
function formatDate(dateStr) {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}月${day}日`
}

// 获取星期
function getWeekday(dateStr) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = new Date(dateStr)
  return days[d.getDay()]
}

// 判断是否今天
function isToday(dateStr) {
  const today = new Date()
  const d = new Date(dateStr)
  return d.toDateString() === today.toDateString()
}

module.exports = {
  formatDate,
  getWeekday,
  isToday
}
