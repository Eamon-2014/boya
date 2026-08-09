const util = require('../../utils/util.js');
const i18n = require('../../utils/i18n.js');

const PERMISSION_MODULES = [
  { key: 'customer', label: '客户管理', icon: '👥', desc: '客户档案、跟进、转化' },
  { key: 'report', label: '评估报告', icon: '📊', desc: '报告生成、审核、推送' },
  { key: 'template', label: '问卷模板', icon: '📝', desc: '模板创建、编辑、发布' },
  { key: 'ai_teacher', label: 'AI教师', icon: '🤖', desc: '教师训练、状态管理' },
  { key: 'team', label: '团队管理', icon: '👨‍🏫', desc: '成员、角色、权限配置' },
  { key: 'system', label: '系统设置', icon: '⚙️', desc: '全局配置、数据导出' }
];

const ROLE_PERMISSIONS = [
  {
    key: 'admin', label: '管理员', color: '#EF4444',
    perms: ['customer', 'report', 'template', 'ai_teacher', 'team', 'system']
  },
  {
    key: 'manager', label: '校区主管', color: '#2563EB',
    perms: ['customer', 'report', 'template', 'ai_teacher']
  },
  {
    key: 'teacher', label: '高级教师', color: '#10B981',
    perms: ['customer', 'report', 'template']
  },
  {
    key: 'trainer', label: 'AI训练师', color: '#8B5CF6',
    perms: ['report', 'ai_teacher']
  },
  {
    key: 'consultant', label: '课程顾问', color: '#F59E0B',
    perms: ['customer']
  },
  {
    key: 'intern', label: '实习教师', color: '#6B7280',
    perms: ['customer']
  }
];

const LOGS = [
  { id: 'log-1', time: '2025-08-01 14:32', user: '李老师', action: '审核报告', target: 'REP-20250801-008', ip: '192.168.1.12', risk: 'low' },
  { id: 'log-2', time: '2025-08-01 11:08', user: '王老师', action: '修改问卷模板', target: '法语入门评估V2', ip: '192.168.1.23', risk: 'low' },
  { id: 'log-3', time: '2025-07-31 16:45', user: '系统', action: 'AI教师训练完成', target: '英语-Emily老师', ip: '-', risk: 'info' },
  { id: 'log-4', time: '2025-07-31 10:22', user: '李老师', action: '新增客户', target: '王小明', ip: '192.168.1.12', risk: 'low' },
  { id: 'log-5', time: '2025-07-30 22:15', user: '张老师', action: '导出数据报表', target: '2025年7月统计', ip: '192.168.1.45', risk: 'medium' },
  { id: 'log-6', time: '2025-07-30 09:30', user: '陈老师', action: '修改跟进记录', target: '李雨桐', ip: '192.168.1.67', risk: 'low' }
];

const RISK_MAP = {
  low: { label: '正常', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  medium: { label: '关注', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  high: { label: '高危', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  info: { label: '系统', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' }
};

Page({
  data: {
    tabIndex: 0,
    tabs: ['权限管理', '访问日志', '安全设置'],
    roles: [],
    modules: PERMISSION_MODULES,
    selectedRoleIdx: 1,
    logs: [],
    securitySettings: [
      { key: 'twoFA', label: '双因素认证', desc: '登录时需二次验证', enabled: true },
      { key: 'pwdPolicy', label: '强密码策略', desc: '密码至少8位，含大小写+数字', enabled: true },
      { key: 'sessionTimeout', label: '会话自动过期', desc: '30分钟无操作自动退出', enabled: true },
      { key: 'dataEncryption', label: '敏感数据加密', desc: '手机号、邮箱等字段加密存储', enabled: true },
      { key: 'ipRestriction', label: 'IP白名单', desc: '仅允许办公室网络登录', enabled: false },
      { key: 'auditLog', label: '操作审计日志', desc: '记录所有重要操作，保留90天', enabled: true }
    ]
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    i18n.setPageTitle('security');
  },

  loadData() {
    const roles = ROLE_PERMISSIONS.map(r => ({
      ...r,
      activeCount: r.perms.length
    }));

    const logs = LOGS.map(l => ({
      ...l,
      ...RISK_MAP[l.risk]
    }));

    this.setData({ roles, logs });
  },

  onTabChange(e) {
    this.setData({ tabIndex: e.currentTarget.dataset.idx });
  },

  onSelectRole(e) {
    this.setData({ selectedRoleIdx: e.currentTarget.dataset.idx });
  },

  onTogglePerm(e) {
    const moduleKey = e.currentTarget.dataset.mod;
    const { roles, selectedRoleIdx } = this.data;
    const role = roles[selectedRoleIdx];
    const has = role.perms.includes(moduleKey);
    const newPerms = has
      ? role.perms.filter(p => p !== moduleKey)
      : [...role.perms, moduleKey];

    const newRoles = [...roles];
    newRoles[selectedRoleIdx] = {
      ...role,
      perms: newPerms,
      activeCount: newPerms.length
    };
    this.setData({ roles: newRoles });
  },

  onToggleSetting(e) {
    const key = e.currentTarget.dataset.key;
    const { securitySettings } = this.data;
    const list = securitySettings.map(s =>
      s.key === key ? { ...s, enabled: !s.enabled } : s
    );
    this.setData({ securitySettings: list });
    const item = list.find(s => s.key === key);
    if (item) {
      util.showToast(`${item.label}已${item.enabled ? '开启' : '关闭'}`);
    }
  },

  onRoleTap(e) {
    const role = e.currentTarget.dataset.role;
    wx.showModal({
      title: '编辑角色',
      content: `编辑「${role.label}」的权限配置`,
      confirmText: '保存',
      success: (r) => {
        if (r.confirm) util.showToast('权限已保存', 'success');
      }
    });
  },

  onExportLog() {
    util.showToast('日志导出功能开发中');
  }
});
