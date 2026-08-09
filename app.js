// app.js - 小程序入口（API 版本）

const { DEMO_ACCOUNTS } = require('./utils/accounts.js');

// 主题颜色配置
const THEMES = {
  '默认蓝': {
    primary: '#2563EB',
    primaryLight: '#3B82F6',
    primaryDark: '#1D4ED8',
    primaryGradient: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
    primaryBg: 'rgba(37, 99, 235, 0.08)',
    navBg: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)'
  },
  '极光紫': {
    primary: '#8B5CF6',
    primaryLight: '#A78BFA',
    primaryDark: '#7C3AED',
    primaryGradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    primaryBg: 'rgba(139, 92, 246, 0.08)',
    navBg: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)'
  },
  '森林绿': {
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    primaryGradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    primaryBg: 'rgba(16, 185, 129, 0.08)',
    navBg: 'linear-gradient(135deg, #059669 0%, #34D399 100%)'
  }
};

const api = require('./utils/api.js');

App({
  globalData: {
    currentUser: null,
    isLoggedIn: false,
    // 认证就绪 Promise（页面可 await 确保用户信息已加载）
    authReady: null,
    // 当前语言（i18n）
    currentLang: 'zh-CN',
    // 当前主题
    currentTheme: '默认蓝',
    themeColors: THEMES['默认蓝'],
    // 伪装登录状态
    isImpersonating: false,
    impersonatedBy: null,
    // 通知轮询
    notificationPollTimer: null,
    lastNotifTime: null,
    // 通知弹窗回调（由当前页面的 notification-toast 组件注册）
    notificationToastCallback: null
  },

  // 应用主题
  applyTheme(themeName) {
    const themes = THEMES;
    const colors = themes[themeName] || themes['默认蓝'];
    this.globalData.currentTheme = themeName;
    this.globalData.themeColors = colors;
    wx.setStorageSync('app_theme', themeName);
    return colors;
  },

  // 获取主题颜色
  getThemeColors() {
    return this.globalData.themeColors || THEMES['默认蓝'];
  },

  onLaunch() {
    console.log('[App] 小程序启动');
    const sysInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = sysInfo;

    // 初始化语言设置（设备偏好，保留本地存储）
    const savedLang = wx.getStorageSync('app_lang');
    if (savedLang) {
      this.globalData.currentLang = savedLang;
    }

    // 初始化主题设置（设备偏好，保留本地存储）
    const savedTheme = wx.getStorageSync('app_theme');
    if (savedTheme && THEMES[savedTheme]) {
      this.applyTheme(savedTheme);
    }

    // 检查登录状态：通过 JWT token 验证
    if (api.hasToken()) {
      // 有 token，异步验证
      this.globalData.isLoggedIn = true; // 乐观设置，防止页面误判
      this.globalData.authReady = api.me()
        .then(user => {
          // 从内置账号配置补充密码（用于个人中心显示）
          const demoAcc = DEMO_ACCOUNTS.find(a => a.account === user.account);
          if (demoAcc) {
            user.password = demoAcc.password;
          }
          this.globalData.currentUser = user;
          this.globalData.isLoggedIn = true;
          this.globalData.isImpersonating = api.hasAdminToken();
          console.log('[App] 登录状态已验证:', user.name);
          // 启动通知轮询
          this.startNotificationPolling();
        })
        .catch(err => {
          console.log('[App] Token 无效，跳转登录:', err.message);
          api.setToken(null);
          this.globalData.currentUser = null;
          this.globalData.isLoggedIn = false;
          wx.reLaunch({ url: '/pages/login/login' });
        });
    } else {
      console.log('[App] 未登录，跳转登录页');
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },

  // 登录成功后调用
  setLoggedIn(user) {
    this.globalData.currentUser = user;
    this.globalData.isLoggedIn = true;
    // 如果存在备份的管理员 token，说明当前是伪装登录状态
    this.globalData.isImpersonating = api.hasAdminToken();
    console.log('[App] 登录成功:', user.name, this.globalData.isImpersonating ? '(伪装登录)' : '');
    // 启动通知轮询
    this.startNotificationPolling();
  },

  // 退出登录
  logout() {
    // 保存设备偏好设置
    if (this.globalData.currentLang) {
      wx.setStorageSync('app_lang', this.globalData.currentLang);
    }
    if (this.globalData.currentTheme) {
      wx.setStorageSync('app_theme', this.globalData.currentTheme);
    }

    // 调用 API 登出（清除 token）
    api.logout();

    this.globalData.currentUser = null;
    this.globalData.isLoggedIn = false;
    this.globalData.isImpersonating = false;
    this.stopNotificationPolling();
    console.log('[App] 已退出登录');
    wx.reLaunch({ url: '/pages/login/login' });
  },

  // 退出伪装登录，切回管理员身份
  exitImpersonation() {
    if (!api.hasAdminToken()) {
      console.log('[App] 无管理员 token 备份，无法切回');
      return Promise.resolve(false);
    }
    // 恢复管理员 token
    api.restoreAdminToken();
    this.globalData.isImpersonating = false;
    // 重新获取管理员信息
    return api.me().then(user => {
      const demoAcc = DEMO_ACCOUNTS.find(a => a.account === user.account);
      if (demoAcc) user.password = demoAcc.password;
      this.globalData.currentUser = user;
      this.globalData.isLoggedIn = true;
      console.log('[App] 已切回管理员:', user.name);
      return true;
    }).catch(err => {
      console.error('[App] 切回管理员失败:', err);
      return false;
    });
  },

  // ===== 通知轮询 =====
  startNotificationPolling() {
    this.stopNotificationPolling();
    // 首次立即检查一次
    this.checkNewNotifications();
    // 每 30 秒轮询
    this.globalData.notificationPollTimer = setInterval(() => {
      this.checkNewNotifications();
    }, 30000);
    console.log('[App] 通知轮询已启动（30秒）');
  },

  stopNotificationPolling() {
    if (this.globalData.notificationPollTimer) {
      clearInterval(this.globalData.notificationPollTimer);
      this.globalData.notificationPollTimer = null;
    }
  },

  // 检查新通知
  checkNewNotifications() {
    if (!api.hasToken()) return;
    api.listNotifications().then(list => {
      if (!list || list.length === 0) return;
      // 获取最新通知的创建时间
      const latestNotif = list[0]; // 列表按 createdAt desc 排序
      const latestTime = latestNotif.createdAt || latestNotif.time;
      const lastTime = wx.getStorageSync('last_notif_time');
      // 找出比上次记录更新的未读通知
      const newNotifs = lastTime
        ? list.filter(n => {
            const t = n.createdAt || n.time;
            return t && t > lastTime && !n.read;
          })
        : [];
      // 首次记录最新时间，不弹窗（避免启动时弹一堆）
      if (!lastTime) {
        wx.setStorageSync('last_notif_time', latestTime);
        return;
      }
      if (newNotifs.length > 0) {
        // 更新最新时间
        wx.setStorageSync('last_notif_time', latestTime);
        // 触发弹窗：优先用自定义组件，否则 fallback 到 wx.showToast
        const latest = newNotifs[0];
        if (typeof this.globalData.notificationToastCallback === 'function') {
          this.globalData.notificationToastCallback(latest);
        } else {
          // fallback: 系统原生 toast
          wx.showToast({
            title: (latest.icon || '🔔') + ' ' + (latest.title || '新通知'),
            icon: 'none',
            duration: 3000,
          });
        }
        // 更新 tabbar 红点
        const unreadCount = list.filter(n => !n.read).length;
        if (unreadCount > 0) {
          wx.showTabBarRedDot({ index: 3 }); // 个人中心 tab（通知入口通常在个人中心）
        }
      }
    }).catch(err => {
      // 静默失败，不影响用户体验
      console.debug('[App] 通知轮询失败:', err.message);
    });
  },

  // 注册通知弹窗回调（由 notification-toast 组件调用）
  registerNotificationToast(callback) {
    this.globalData.notificationToastCallback = callback;
  },

  // 注销通知弹窗回调
  unregisterNotificationToast() {
    this.globalData.notificationToastCallback = null;
  },

  // ===== 以下方法保留为兼容存根（数据已迁移至后端 API）=====
  restorePersistedData() {
    // 数据已由后端 API 管理，无需从本地存储恢复
  },

  saveCompletedTodoIds() {},
  saveCustomers() {},
  saveDeletedBuiltinCustomerIds() {},
  saveAiTeachers() {},
  saveReports() {},
  saveDeletedBuiltinReportIds() {},

  onShow() {
    console.log('[App] 小程序进入前台');
    // 重新设置当前页面的导航栏标题
    try {
      const i18n = require('./utils/i18n.js');
      const pages = getCurrentPages();
      const topPage = pages[pages.length - 1];
      if (topPage && topPage.route) {
        const route = topPage.route.replace('pages/', '').replace(/\/index$/, '');
        const pageKeyMap = {
          'dashboard': 'dashboard', 'customers': 'customers', 'questionnaire': 'questionnaire',
          'profile': 'profile', 'notifications': 'notifications', 'report-detail': 'reportDetail',
          'todo-list': 'todoList', 'data-report': 'dataReport', 'workflow-tracking': 'workflowTracking',
          'security': 'security', 'team-members': 'teamMembers', 'survey-assign': 'surveyAssign',
          'customer-add': 'customerAdd', 'customer-detail': 'customerDetail',
          'template-edit': 'templateEdit', 'ai-teacher-edit': 'aiTeacherEdit',
          'settings': 'settings', 'login': 'login', 'register': 'register',
          'user-management': 'userManagement'
        };
        const pageKey = pageKeyMap[route];
        if (pageKey) {
          wx.setNavigationBarTitle({ title: i18n.t('page.' + pageKey) });
        }
      }
    } catch (e) {
      console.error('[App.onShow] set nav title failed:', e);
    }
  },

  onHide() {
    console.log('[App] 小程序进入后台');
  }
});
