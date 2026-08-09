// utils/util.js - 工具函数

/**
 * 格式化日期
 */
const formatTime = (date, format = 'YYYY-MM-DD HH:mm') => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
};

const formatDateShort = (date) => formatTime(date, 'MM-DD HH:mm');

/**
 * 相对时间格式化
 */
const formatRelativeTime = (date) => {
  if (!date) return '-';
  const now = new Date();
  const target = new Date(date);
  const diff = now - target;
  const diffMin = Math.floor(diff / 60000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return diffMin + '分钟前';

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return diffHour + '小时前';

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return diffDay + '天前';

  return formatTime(date, 'MM-DD');
};

/**
 * 手机号脱敏
 */
const maskPhone = (phone) => {
  if (!phone || phone.length < 7) return phone || '-';
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
};

/**
 * 获取首字母（用于头像占位）
 */
const getInitials = (name) => {
  if (!name) return '?';
  return name.substring(0, 1);
};

/**
 * 根据分数获取等级
 */
const getScoreLevel = (score, max = 100) => {
  const percent = (score / max) * 100;
  if (percent >= 90) return { level: '优秀', color: '#10B981' };
  if (percent >= 75) return { level: '良好', color: '#3B82F6' };
  if (percent >= 60) return { level: '中等', color: '#F59E0B' };
  return { level: '待提升', color: '#EF4444' };
};

/**
 * 生成简单唯一ID
 */
const uuid = () => {
  return 'id-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
};

/**
 * 防抖
 */
const debounce = (fn, delay = 300) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

/**
 * 显示Toast
 */
const showToast = (title, icon = 'none', duration = 1500) => {
  wx.showToast({ title, icon, duration });
};

/**
 * 显示Loading
 */
const showLoading = (title = '加载中...') => {
  wx.showLoading({ title, mask: true });
};

const hideLoading = () => {
  wx.hideLoading();
};

module.exports = {
  formatTime,
  formatDateShort,
  formatRelativeTime,
  maskPhone,
  getInitials,
  getScoreLevel,
  uuid,
  debounce,
  showToast,
  showLoading,
  hideLoading
};
