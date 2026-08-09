// utils/constants.js - 常量定义

// 客户状态
const CUSTOMER_STATUS = {
  new: { label: '新客户', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', tagClass: 'tag-info' },
  following: { label: '跟进中', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', tagClass: 'tag-warning' },
  converted: { label: '已转化', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', tagClass: 'tag-success' },
  lost: { label: '已流失', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.15)', tagClass: 'tag-gray' }
};

// 报告状态
const REPORT_STATUS = {
  generating: { label: '生成中', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', tagClass: 'tag-ai' },
  pending_review: { label: '待审核', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', tagClass: 'tag-warning' },
  approved: { label: '已通过', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', tagClass: 'tag-success' },
  rejected: { label: '已驳回', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', tagClass: 'tag-danger' },
  sent: { label: '已推送', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)', tagClass: 'tag-primary' }
};

// AI教师状态
const AI_TEACHER_STATUS = {
  training: { label: '训练中', color: '#F59E0B', tagClass: 'tag-warning' },
  ready: { label: '已就绪', color: '#10B981', tagClass: 'tag-success' },
  archived: { label: '已归档', color: '#9CA3AF', tagClass: 'tag-gray' }
};

// 问卷发放状态
const ASSIGNMENT_STATUS = {
  pending: { label: '待发送', color: '#9CA3AF', tagClass: 'tag-gray' },
  sent: { label: '已发送', color: '#3B82F6', tagClass: 'tag-info' },
  started: { label: '填写中', color: '#F59E0B', tagClass: 'tag-warning' },
  completed: { label: '已完成', color: '#10B981', tagClass: 'tag-success' },
  expired: { label: '已过期', color: '#EF4444', tagClass: 'tag-danger' }
};

// 问卷模板状态
const TEMPLATE_STATUS = {
  draft: { label: '草稿', color: '#9CA3AF', tagClass: 'tag-gray' },
  active: { label: '使用中', color: '#10B981', tagClass: 'tag-success' },
  archived: { label: '已归档', color: '#9CA3AF', tagClass: 'tag-gray' }
};

// 语言类型
const LANGUAGES = {
  en: { label: '英语', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' },
  fr: { label: '法语', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  de: { label: '德语', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  es: { label: '西班牙语', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  ja: { label: '日语', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' },
  ko: { label: '韩语', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  other: { label: '其他', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' }
};

// 头像背景色循环
const AVATAR_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899'];

const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getLanguageLabel = (lang) => (LANGUAGES[lang] || LANGUAGES.other).label;

module.exports = {
  CUSTOMER_STATUS,
  REPORT_STATUS,
  AI_TEACHER_STATUS,
  ASSIGNMENT_STATUS,
  TEMPLATE_STATUS,
  LANGUAGES,
  AVATAR_COLORS,
  getAvatarColor,
  getLanguageLabel
};
