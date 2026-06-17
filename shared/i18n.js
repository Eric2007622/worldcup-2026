/**
 * i18n.js - 共享翻译模块
 * 德语队名 → 中文名/国旗/分组
 * server.js 和 cloud function 共用
 */

const CN = {
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

const FLAGS = {
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

const GROUPS = {
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

function t(n) { return CN[n] || n }
function f(n) { return FLAGS[n] || '🏳️' }
function g(n) { return GROUPS[n] || '' }

module.exports = { CN, FLAGS, GROUPS, t, f, g }
