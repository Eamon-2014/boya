const util = require('../../utils/util.js');
const i18n = require('../../utils/i18n.js');

const TEAM_MEMBERS = [
  {
    id: 't-001', name: '李老师', role: '校区主管',
    email: 'li@language.com', phone: '138****0001',
    status: 'active', avatarColor: '#2563EB',
    joinDate: '2023-03-15', studentCount: 128, conversionRate: 32,
    permissions: ['customer', 'report', 'template', 'ai_teacher', 'team']
  },
  {
    id: 't-002', name: '王老师', role: '高级教师',
    email: 'wang@language.com', phone: '139****0002',
    status: 'active', avatarColor: '#10B981',
    joinDate: '2023-06-20', studentCount: 86, conversionRate: 24,
    permissions: ['customer', 'report', 'template']
  },
  {
    id: 't-003', name: '张老师', role: 'AI训练师',
    email: 'zhang@language.com', phone: '137****0003',
    status: 'active', avatarColor: '#8B5CF6',
    joinDate: '2024-01-10', studentCount: 45, conversionRate: 18,
    permissions: ['report', 'ai_teacher']
  },
  {
    id: 't-004', name: '陈老师', role: '课程顾问',
    email: 'chen@language.com', phone: '136****0004',
    status: 'leave', avatarColor: '#F59E0B',
    joinDate: '2023-11-05', studentCount: 62, conversionRate: 15,
    permissions: ['customer']
  },
  {
    id: 't-005', name: '刘老师', role: '实习教师',
    email: 'liu@language.com', phone: '135****0005',
    status: 'inactive', avatarColor: '#EF4444',
    joinDate: '2025-07-01', studentCount: 12, conversionRate: 3,
    permissions: ['customer']
  }
];

const ROLE_MAP = {
  admin: { label: '管理员', color: '#EF4444' },
  manager: { label: '校区主管', color: '#2563EB' },
  teacher: { label: '高级教师', color: '#10B981' },
  trainer: { label: 'AI训练师', color: '#8B5CF6' },
  consultant: { label: '课程顾问', color: '#F59E0B' },
  intern: { label: '实习教师', color: '#6B7280' }
};

const STATUS_MAP = {
  active: { label: '在职', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  leave: { label: '请假', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  inactive: { label: '停用', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.15)' }
};

Page({
  data: {
    members: [],
    filteredMembers: [],
    search: '',
    filterStatus: 'all',
    filterRole: 'all',
    stats: { total: 0, active: 0, leave: 0, inactive: 0 },
    roles: Object.entries(ROLE_MAP).map(([key, v]) => ({ key, label: v.label })),
    statuses: [
      { key: 'all', label: '全部' },
      { key: 'active', label: '在职' },
      { key: 'leave', label: '请假' },
      { key: 'inactive', label: '停用' }
    ],
    showAddModal: false
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    i18n.setPageTitle('teamMembers');
  },

  loadData() {
    const members = TEAM_MEMBERS.map(m => {
      const roleInfo = ROLE_MAP[m.role] || { label: m.role, color: '#6B7280' };
      const statusInfo = STATUS_MAP[m.status] || STATUS_MAP.active;
      return {
        ...m,
        roleLabel: roleInfo.label,
        roleColor: roleInfo.color,
        statusLabel: statusInfo.label,
        statusColor: statusInfo.color,
        statusBg: statusInfo.bg,
        initial: m.name.substring(0, 1)
      };
    });

    const stats = {
      total: members.length,
      active: members.filter(m => m.status === 'active').length,
      leave: members.filter(m => m.status === 'leave').length,
      inactive: members.filter(m => m.status === 'inactive').length
    };

    this.setData({ members, stats });
    this.applyFilter();
  },

  applyFilter() {
    const { members, search, filterStatus, filterRole } = this.data;
    let list = members;

    if (filterStatus !== 'all') {
      list = list.filter(m => m.status === filterStatus);
    }
    if (filterRole !== 'all') {
      list = list.filter(m => m.role === filterRole);
    }
    if (search) {
      list = list.filter(m =>
        m.name.includes(search) ||
        m.email.includes(search) ||
        m.roleLabel.includes(search)
      );
    }

    this.setData({ filteredMembers: list });
  },

  onSearchInput(e) {
    this.setData({ search: e.detail.value });
    this.applyFilter();
  },

  onFilterStatus(e) {
    this.setData({ filterStatus: e.currentTarget.dataset.status });
    this.applyFilter();
  },

  onFilterRole(e) {
    this.setData({ filterRole: e.currentTarget.dataset.role });
    this.applyFilter();
  },

  onMemberTap(e) {
    const member = e.currentTarget.dataset.member;
    wx.showActionSheet({
      itemList: ['查看详情', '编辑信息', '重置密码', '调整权限'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            util.showToast('查看详情功能开发中');
            break;
          case 1:
            util.showToast('编辑功能开发中');
            break;
          case 2:
            wx.showModal({
              title: '重置密码',
              content: `确认重置「${member.name}」的登录密码？将发送临时密码到其邮箱。`,
              success: (r) => {
                if (r.confirm) util.showToast('密码已重置', 'success');
              }
            });
            break;
          case 3:
            util.showToast('权限调整功能开发中');
            break;
        }
      }
    });
  },

  onAddMember() {
    this.setData({ showAddModal: true });
  },

  onCloseModal() {
    this.setData({ showAddModal: false });
  },

  onQuickAdd(e) {
    const role = e.currentTarget.dataset.role;
    this.setData({ showAddModal: false });
    util.showToast(`添加${ROLE_MAP[role]?.label || ''}（开发中）`);
  },

  onPullDownRefresh() {
    this.loadData();
    setTimeout(() => wx.stopPullDownRefresh(), 800);
  }
});
