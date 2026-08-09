// pages/user-management/user-management.js
const app = getApp();
const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    themeColors: {},
    users: [],
    loading: true,
    currentUser: null,
  },

  onLoad() {
    this.setData({ themeColors: app.getThemeColors() });
    this.loadUsers();
  },

  onShow() {
    this.setData({
      themeColors: app.getThemeColors(),
      currentUser: app.globalData.currentUser,
    });
  },

  loadUsers() {
    this.setData({ loading: true });
    api.listUsers().then(list => {
      const users = (list || []).map(u => ({
        ...u,
        createdAtText: u.createdAt ? util.formatTime(new Date(u.createdAt)) : '',
        isSelf: u.id === app.globalData.currentUser?.id,
        roleLabel: this.getRoleLabel(u.role),
        roleColor: this.getRoleColor(u.role),
      }));
      this.setData({ users, loading: false });
    }).catch(err => {
      this.setData({ loading: false });
      util.showToast(err.message || '加载失败');
      if (err.message && err.message.indexOf('无权') !== -1) {
        setTimeout(() => wx.navigateBack(), 1500);
      }
    });
  },

  getRoleLabel(role) {
    const map = { '管理员': '管理员', '校区主管': '校区主管', '教师': '教师' };
    return map[role] || role || '未知';
  },

  getRoleColor(role) {
    const map = {
      '管理员': '#DC2626',
      '校区主管': '#2563EB',
      '教师': '#10B981',
    };
    return map[role] || '#6B7280';
  },

  // 以此用户登录（伪装登录）
  onImpersonate(e) {
    const userId = e.currentTarget.dataset.id;
    const userName = e.currentTarget.dataset.name;
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return;

    // 不能伪装成自己
    if (userId === app.globalData.currentUser?.id) {
      util.showToast('无需伪装成自己');
      return;
    }

    wx.showModal({
      title: '确认切换身份',
      content: `将以「${userName}」的身份登录查看，操作完成后可一键切回管理员。`,
      confirmText: '确认切换',
      success: (res) => {
        if (!res.confirm) return;
        // 先备份管理员 token
        api.saveAdminToken();
        // 调用伪装登录 API
        api.impersonate(userId).then(data => {
          app.setLoggedIn(data.user);
          util.showToast(`已切换为 ${userName}`, 'success');
          setTimeout(() => {
            wx.switchTab({ url: '/pages/dashboard/dashboard' });
          }, 800);
        }).catch(err => {
          // 失败时恢复管理员 token
          api.clearAdminToken();
          util.showToast(err.message || '切换失败');
        });
      },
    });
  },
});
