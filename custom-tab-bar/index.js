const i18n = require('../utils/i18n.js');

Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/dashboard/dashboard', key: 'tab.dashboard', pageKey: 'dashboard', icon: '🏠' },
      { pagePath: '/pages/customers/customers', key: 'tab.customers', pageKey: 'customers', icon: '👥' },
      { pagePath: '/pages/questionnaire/questionnaire', key: 'tab.questionnaire', pageKey: 'questionnaire', icon: '📋' },
      { pagePath: '/pages/profile/profile', key: 'tab.profile', pageKey: 'profile', icon: '👤' }
    ],
    texts: ['工作台', '客户管理', '问卷评估', '管理中心']
  },

  attached() {
    this.refreshTexts();
  },

  pageLifetimes: {
    show() {
      this.refreshTexts();
    }
  },

  methods: {
    refreshTexts() {
      const texts = this.data.list.map(item => i18n.t(item.key));
      this.setData({ texts });
    },

    switchTab(e) {
      const idx = e.currentTarget.dataset.idx;
      const item = this.data.list[idx];
      // 先设置导航栏标题，确保即使页面 onShow 没触发也能生效
      const title = i18n.t('page.' + item.pageKey);
      wx.setNavigationBarTitle({ title });
      wx.switchTab({ url: item.pagePath });
    }
  }
});
