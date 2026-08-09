// pages/profile/profile.js
const app = getApp();
const util = require('../../utils/util.js');
const constants = require('../../utils/constants.js');
const i18n = require('../../utils/i18n.js');
const api = require('../../utils/api.js');
const { DEMO_ACCOUNTS } = require('../../utils/accounts.js');

Page({
  data: {
    themeColors: {},
    texts: {},
    currentUser: {},
    isAdmin: false,
    roleCampusText: '',
    teachers: [],
    totalCustomers: 0,
    convertedCustomers: 0,
    conversionRate: '0',
    readyAiCount: 0,
    totalReports: 0,
    trainingCount: 0,
    avatarText: '',
    showPassword: false,
    menuGroups: []
  },

  onLoad() {
    this.loadI18nTexts();
    this.loadData();
  },

  loadThemeColors() {
    const themeColors = app.getThemeColors();
    this.setData({ themeColors });
  },

  onShow() {
    this.loadThemeColors();
    // 同步管理员身份（控制用户管理入口的显隐）
    this.setData({ isAdmin: app.globalData.currentUser?.role === '管理员' });
    i18n.setPageTitle('profile');
    setTimeout(() => {
      i18n.setPageTitle('profile');
      const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;
      if (tabBar && tabBar.refreshTexts) tabBar.refreshTexts();
    }, 50);
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.loadI18nTexts();
    // 每次页面展示时刷新通知徽章（处理从通知页返回的情况）
    if (this.data.menuGroups.length > 0) {
      this.updateNotificationBadge();
    }
    // 每次进入页面都重新加载 AI 教师列表（确保新增的教师能显示）
    this.loadData();
  },

  loadI18nTexts() {
    const texts = {
      followCustomers: i18n.t('profile.followCustomers'),
      monthConvert: i18n.t('profile.monthConvert'),
      totalCustomers: i18n.t('profile.totalCustomers'),
      convertedCustomers: i18n.t('profile.convertedCustomers'),
      conversionRate: i18n.t('profile.conversionRate'),
      readyAITeachers: i18n.t('profile.readyAITeachers'),
      trainingCenter: i18n.t('profile.trainingCenter'),
      addTeacher: i18n.t('profile.addTeacher'),
      teacherReady: i18n.t('profile.teacherReady'),
      teacherTotal: i18n.t('profile.teacherTotal'),
      reportGenerated: i18n.t('profile.reportGenerated'),
      allTrained: i18n.t('profile.allTrained'),
      teacherManagement: i18n.t('profile.teacherManagement'),
      addNew: i18n.t('profile.addNew'),
      knowledgePoints: i18n.t('profile.knowledgePoints'),
      generateReports: i18n.t('profile.generateReports'),
      dataAnalysis: i18n.t('profile.dataAnalysis'),
      systemManagement: i18n.t('profile.systemManagement'),
      adminSection: i18n.t('profile.adminSection'),
      accountInfo: i18n.t('profile.accountInfo'),
      accountLabel: i18n.t('profile.accountLabel'),
      passwordLabel: i18n.t('profile.passwordLabel'),
      fullNameLabel: i18n.t('profile.fullNameLabel'),
      roleLabel: i18n.t('profile.roleLabel'),
      userIdLabel: i18n.t('profile.userIdLabel')
    };

    const roleCampusText = i18n.t('profile.roleCampus', [app.globalData.currentUser?.role || '']);

    // 管理员专用菜单项：用户管理（以此用户登录查看）
    const adminMenu = app.globalData.currentUser?.role === '管理员'
      ? [{
          icon: '👤',
          iconBg: '#DBEAFE',
          iconColor: '#2563EB',
          title: i18n.t('profile.menuUserMgmt.title'),
          subtitle: i18n.t('profile.menuUserMgmt.subtitle'),
          badge: 0,
          action: 'userManagement'
        }]
      : [];

    const menuGroups = [
      [
        {
          icon: '📊',
          iconBg: '#DBEAFE',
          iconColor: '#2563EB',
          title: i18n.t('profile.menuReport.title'),
          subtitle: i18n.t('profile.menuReport.subtitle'),
          badge: 0,
          action: 'report'
        },
        {
          icon: '📈',
          iconBg: '#D1FAE5',
          iconColor: '#10B981',
          title: i18n.t('profile.menuWorkflow.title'),
          subtitle: i18n.t('profile.menuWorkflow.subtitle'),
          badge: 0,
          action: 'workflow'
        },
        {
          icon: '📁',
          iconBg: '#FEF3C7',
          iconColor: '#F59E0B',
          title: i18n.t('profile.menuQAnalysis.title'),
          subtitle: i18n.t('profile.menuQAnalysis.subtitle'),
          badge: 0,
          action: 'questionnaire-analysis'
        }
      ],
      [
        {
          icon: '👥',
          iconBg: '#FCE7F3',
          iconColor: '#EC4899',
          title: i18n.t('profile.menuTeam.title'),
          subtitle: i18n.t('profile.menuTeam.subtitle'),
          badge: 0,
          action: 'team'
        },
        {
          icon: '🔐',
          iconBg: '#EDE9FE',
          iconColor: '#8B5CF6',
          title: i18n.t('profile.menuSecurity.title'),
          subtitle: i18n.t('profile.menuSecurity.subtitle'),
          badge: 0,
          action: 'security'
        },
        {
          icon: '🔔',
          iconBg: '#CFFAFE',
          iconColor: '#0891B2',
          title: i18n.t('profile.menuNotif.title'),
          subtitle: i18n.t('profile.menuNotif.subtitle'),
          badge: 3,
          action: 'notification'
        },
        {
          icon: '⚙️',
          iconBg: '#F3F4F6',
          iconColor: '#6B7280',
          title: i18n.t('profile.menuSettings.title'),
          subtitle: i18n.t('profile.menuSettings.subtitle'),
          badge: 0,
          action: 'settings'
        }
      ],
      // 管理员专用分组（仅管理员有内容，非管理员为空数组）
      adminMenu,
      [
        {
          icon: '🚪',
          iconBg: '#FEE2E2',
          iconColor: '#EF4444',
          title: i18n.t('profile.menuLogout.title'),
          subtitle: i18n.t('profile.menuLogout.subtitle'),
          badge: 0,
          action: 'logout'
        }
      ]
    ];

    this.setData({ texts, roleCampusText, menuGroups });
  },

  refreshTeacherDisplayTexts() {
    const teachers = this.data.teachers.map(t => ({
      ...t,
      lastTrainedText: t.lastTrainedAt ? util.formatRelativeTime(t.lastTrainedAt) : i18n.t('aiTeacher.noTraining'),
      cloneFromText: i18n.t('profile.cloneFrom', [t.originalTeacherName]),
      trainingProgressText: i18n.t('profile.trainingProgress', [t.trainingProgress || 0]),
      trainNowText: i18n.t('profile.trainNow')
    }));
    this.setData({ teachers });
  },

  loadData() {
    this.loadI18nTexts();
    return Promise.all([
      api.listAiTeachers(),
      api.listReports(),
      api.listCustomers()
    ]).then(([teachersList, reportsList, customersList]) => {
      const teachers = (teachersList || []).map(t => ({
        ...t,
        languageLabel: i18n.t('lang.' + t.language),
        languageColor: constants.LANGUAGES[t.language]?.color || '#6B7280',
        languageBg: constants.LANGUAGES[t.language]?.bg || 'rgba(107, 114, 128, 0.1)',
        statusLabel: i18n.t('aiTeacher.' + t.status),
        statusColor: constants.AI_TEACHER_STATUS[t.status]?.color || '#9CA3AF',
        statusBg: constants.AI_TEACHER_STATUS[t.status]?.bg || 'rgba(156, 163, 175, 0.15)',
        lastTrainedText: t.lastTrainedAt ? util.formatRelativeTime(t.lastTrainedAt) : i18n.t('aiTeacher.noTraining'),
        ratingText: t.avgRating > 0 ? `${t.avgRating.toFixed(1)}⭐` : '暂无评分',
        ratingCountText: t.ratingCount > 0 ? `${t.ratingCount}人评分` : '',
        topSpecialties: (t.specialties || []).slice(0, 4),
        cloneFromText: i18n.t('profile.cloneFrom', [t.originalTeacherName]),
        trainingProgressText: i18n.t('profile.trainingProgress', [t.trainingProgress || 0]),
        trainNowText: i18n.t('profile.trainNow')
      }));

      const allCustomers = customersList || [];
      const totalCustomers = allCustomers.length;
      const convertedCustomers = allCustomers.filter(c => c.status === 'converted').length;
      const conversionRate = totalCustomers ? ((convertedCustomers / totalCustomers) * 100).toFixed(1) : '0';
      const readyAiCount = teachers.filter(t => t.status === 'ready').length;
      const totalReports = (reportsList || []).length;
      const trainingCount = teachers.filter(t => t.status === 'training').length;
      const avatarText = (app.globalData.currentUser?.name || '').substring(0, 1);

      // 查找完整用户信息（包括密码），兼容旧版本登录数据
      // 内置账号通过 DEMO_ACCOUNTS 查密码；已注册账号仍从本地 registered_users 读取
      let currentUser = app.globalData.currentUser || {};
      if (currentUser.account && !currentUser.password) {
        const demoUser = DEMO_ACCOUNTS.find(u => u.account === currentUser.account);
        if (demoUser) {
          currentUser = { ...currentUser, password: demoUser.password };
          console.log('[Profile] 从 DEMO_ACCOUNTS 补充密码，长度:', demoUser.password.length);
        } else {
          const registeredUsers = wx.getStorageSync('registered_users') || [];
          const regUser = registeredUsers.find(u => u.account === currentUser.account);
          if (regUser) {
            currentUser = { ...currentUser, password: regUser.password };
            console.log('[Profile] 从 registered_users 补充密码');
          } else {
            console.warn('[Profile] 未找到密码信息，currentUser.account:', currentUser.account);
          }
        }
      } else if (currentUser.password) {
        console.log('[Profile] 密码已存在，长度:', currentUser.password.length);
      }

      // 根据密码长度生成对应数量的圆点（确保不少于实际密码长度）
      const pwdLen = (currentUser.password || '').length;
      const dotChar = '•';
      const passwordDots = pwdLen > 0 ? dotChar.repeat(pwdLen) : '';

      this.setData({
        currentUser,
        avatarText,
        teachers,
        totalCustomers,
        convertedCustomers,
        conversionRate,
        readyAiCount,
        totalReports,
        trainingCount,
        passwordDots
      });

      // 刷新通知徽章（通过 API 获取未读数）
      this.updateNotificationBadge();

      console.log('[Profile] 数据加载完成');
    }).catch(err => {
      console.error('[Profile] 加载失败:', err);
      util.showToast(err.message || '加载失败');
    });
  },

  // 通过 API 获取通知未读数，更新「通知与消息」徽章
  updateNotificationBadge() {
    api.listNotifications().then(list => {
      const unreadCount = (list || []).filter(n => !n.read).length;

      const menuGroups = this.data.menuGroups.map(group =>
        group.map(item => {
          if (item.action === 'notification') {
            return { ...item, badge: unreadCount };
          }
          return item;
        })
      );

      this.setData({ menuGroups });
    }).catch(err => {
      console.error('[Profile] 通知徽章刷新失败:', err);
    });
  },

  onMenuItem(e) {
    const action = e.currentTarget.dataset.action;
    console.log('[Profile] 菜单点击:', action);
    switch (action) {
      case 'report':
        wx.navigateTo({ url: '/pages/data-report/data-report' });
        break;
      case 'workflow':
        wx.navigateTo({ url: '/pages/workflow-tracking/workflow-tracking' });
        break;
      case 'questionnaire-analysis':
        wx.navigateTo({ url: '/pages/questionnaire-analysis/questionnaire-analysis' });
        break;
      case 'team':
        wx.navigateTo({ url: '/pages/team-members/team-members' });
        break;
      case 'security':
        wx.navigateTo({ url: '/pages/security/security' });
        break;
      case 'notification':
        wx.navigateTo({ url: '/pages/notifications/notifications' });
        break;
      case 'settings':
        wx.navigateTo({ url: '/pages/settings/settings' });
        break;
      case 'userManagement':
        wx.navigateTo({ url: '/pages/user-management/user-management' });
        break;
      case 'logout':
        this.onLogout();
        break;
      default:
        util.showToast('功能开发中');
    }
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: i18n.t('auth.logout'),
      content: i18n.t('auth.logoutConfirm'),
      confirmText: i18n.t('auth.logout'),
      cancelText: i18n.t('common.cancel'),
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return;
        app.logout();
      }
    });
  },

  onAITeacherClick(e) {
    const teacher = e.currentTarget.dataset.teacher;
    wx.navigateTo({ url: `/pages/ai-teacher-edit/ai-teacher-edit?id=${teacher.id}` });
  },

  onAddAITeacher() {
    wx.showModal({
      title: i18n.t('profile.createAITitle'),
      content: i18n.t('profile.createAIContent'),
      confirmText: i18n.t('profile.createAIConfirm'),
      success: (r) => {
        if (r.confirm) {
          wx.navigateTo({ url: '/pages/ai-teacher-edit/ai-teacher-edit' });
        }
      }
    });
  },

  onTraining(e) {
    const teacher = e.currentTarget.dataset.teacher;
    if (teacher.status === 'training') {
      util.showToast(i18n.t('profile.training'));
      return;
    }
    if (teacher.trainingProgress >= 100) {
      util.showToast(i18n.t('profile.trainedAlready'));
      return;
    }
    util.showLoading(i18n.t('profile.startTraining'));
    setTimeout(() => {
      const newProgress = Math.min(100, teacher.trainingProgress + 12);
      const newStatus = newProgress >= 100 ? 'ready' : 'training';
      const teachers = this.data.teachers.map(t =>
        t.id === teacher.id
          ? {
            ...t,
            trainingProgress: newProgress,
            status: newStatus,
            statusLabel: i18n.t('aiTeacher.' + newStatus),
            statusColor: constants.AI_TEACHER_STATUS[newStatus].color,
            statusBg: constants.AI_TEACHER_STATUS[newStatus].bg,
            trainingProgressText: i18n.t('profile.trainingProgress', [newProgress])
          }
          : t
      );
      this.setData({ teachers });
      util.hideLoading();
      util.showToast(i18n.t('profile.plus12pct'), 'success');
    }, 1000);
  },

  onSettingClick() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  // 切换密码显示/隐藏
  onTogglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      setTimeout(() => wx.stopPullDownRefresh(), 800);
    });
  }
});
