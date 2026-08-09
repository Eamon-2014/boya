// pages/customers/customers.js
const app = getApp();
const api = require('../../utils/api.js');
const util = require('../../utils/util.js');
const constants = require('../../utils/constants.js');
const i18n = require('../../utils/i18n.js');

Page({
  data: {
    themeColors: {},
    texts: {},
    customers: [],
    searchText: '',
    statusFilter: 'all',
    langFilter: 'all',
    statusCounts: { all: 0, new: 0, following: 0, converted: 0, lost: 0 },
    languageOptions: [],
    statusFilters: []
  },

  onLoad() {
    this.loadI18nTexts();
    this.loadCustomers();
  },

  loadThemeColors() {
    const themeColors = app.getThemeColors();
    this.setData({ themeColors });
  },

  onShow() {
    this.loadThemeColors();
    i18n.setPageTitle('customers');
    setTimeout(() => {
      i18n.setPageTitle('customers');
      const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;
      if (tabBar && tabBar.refreshTexts) tabBar.refreshTexts();
    }, 50);
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this.loadI18nTexts();
    // 每次显示页面时从后端刷新客户列表
    this.loadCustomers();
  },

  loadI18nTexts() {
    const texts = {
      searchPlaceholder: i18n.t('customers.searchPlaceholder'),
      addAction: i18n.t('customers.addAction'),
      statAll: i18n.t('customers.statAll'),
      statNew: i18n.t('customers.statNew'),
      statFollowing: i18n.t('customers.statFollowing'),
      statConverted: i18n.t('customers.statConverted'),
      langAll: i18n.t('customers.langAll'),
      btnFollow: i18n.t('customers.btnFollow'),
      btnAssign: i18n.t('customers.btnAssign'),
      emptyTitle: i18n.t('customers.emptyTitle'),
      emptyDesc: i18n.t('customers.emptyDesc'),
      ageUnit: i18n.t('customer.ageUnit')
    };
    const statusFilters = [
      { key: 'all', label: i18n.t('customers.filterAll') },
      { key: 'new', label: i18n.t('customers.filterNew') },
      { key: 'following', label: i18n.t('customers.filterFollowing') },
      { key: 'converted', label: i18n.t('customers.filterConverted') },
      { key: 'lost', label: i18n.t('customers.filterLost') }
    ];
    this.setData({ texts, statusFilters });
  },

  refreshLastFollowTexts() {
    const customers = this.data.customers.map(c => ({
      ...c,
      lastFollowText: c.lastFollowAt ? util.formatRelativeTime(c.lastFollowAt) : i18n.t('customers.pendingFollow'),
      followCountText: i18n.t('customers.followCount', [c.followCount || 0]),
      sourceText: i18n.t('customers.source', [c.source])
    }));
    this.setData({ customers });
  },

  loadCustomers() {
    this.loadI18nTexts();
    // 从后端 API 加载全部客户，过滤与搜索仍由前端逻辑处理
    api.listCustomers().then(rawList => {
      const list = (rawList || []).map(c => ({
        ...c,
        avatarColor: constants.getAvatarColor(c.name),
        initial: util.getInitials(c.name),
        languageLabel: i18n.t('lang.' + c.language),
        languageColor: constants.LANGUAGES[c.language]?.color || '#6B7280',
        languageBg: constants.LANGUAGES[c.language]?.bg || 'rgba(107, 114, 128, 0.1)',
        statusLabel: constants.CUSTOMER_STATUS[c.status]?.label || c.status,
        statusColor: constants.CUSTOMER_STATUS[c.status]?.color || '#6B7280',
        statusBg: constants.CUSTOMER_STATUS[c.status]?.bg || 'rgba(156, 163, 175, 0.15)',
        phoneMasked: util.maskPhone(c.phone),
        lastFollowText: c.lastFollowAt ? util.formatRelativeTime(c.lastFollowAt) : i18n.t('customers.pendingFollow'),
        followCountText: i18n.t('customers.followCount', [c.followCount || 0]),
        sourceText: i18n.t('customers.source', [c.source]),
        visibleTags: (c.tags || []).slice(0, 2),
        extraTagCount: Math.max(0, (c.tags || []).length - 2)
      }));

      // 计算各状态数量
      const statusCounts = { all: list.length, new: 0, following: 0, converted: 0, lost: 0 };
      list.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });

      // 提取语言选项
      const langSet = {};
      list.forEach(c => {
        if (!langSet[c.language]) {
          langSet[c.language] = {
            key: c.language,
            label: constants.LANGUAGES[c.language]?.label || '其他'
          };
        }
      });

      this.setData({
        customers: list,
        statusCounts,
        languageOptions: Object.values(langSet)
      });

      console.log('[Customers] 加载', list.length, '位客户');
    }).catch(err => {
      console.error('[Customers] 加载失败:', err);
      util.showToast(err.message || '加载失败');
    });
  },

  onSearchChange(e) {
    this.setData({ searchText: e.detail.value });
  },

  onStatusFilter(e) {
    this.setData({ statusFilter: e.currentTarget.dataset.key });
  },

  onLangFilter(e) {
    this.setData({ langFilter: e.currentTarget.dataset.key });
  },

  onCustomerClick(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/customer-detail/customer-detail?id=${id}` });
  },

  onFollow(e) {
    const customer = e.currentTarget.dataset.customer;
    wx.showActionSheet({
      itemList: [
        i18n.t('customers.followOpt1'),
        i18n.t('customers.followOpt2'),
        i18n.t('customers.followOpt3'),
        i18n.t('customers.followOpt4')
      ],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 添加微信跟进记录 → 跳转详情页，自动打开跟进弹窗（微信类型）
            wx.navigateTo({
              url: `/pages/customer-detail/customer-detail?id=${customer.id}&tab=follow&addFollow=1&followType=wechat`
            });
            break;
          case 1:
            // 电话联系 → 直接拨打电话
            this._makePhoneCall(customer);
            break;
          case 2:
            // 预约到校 → 跳转详情页，自动打开跟进弹窗（面谈类型，预设内容）
            wx.navigateTo({
              url: `/pages/customer-detail/customer-detail?id=${customer.id}&tab=follow&addFollow=1&followType=meeting&followContent=${encodeURIComponent(i18n.t('customers.visitContent', [customer.childName || customer.name]))}`
            });
            break;
          case 3:
            // 标记状态
            this.showStatusPicker(customer);
            break;
        }
      }
    });
  },

  // 拨打客户电话
  _makePhoneCall(customer) {
    if (!customer.phone) {
      util.showToast(i18n.t('customers.noPhone'));
      return;
    }
    wx.makePhoneCall({
      phoneNumber: customer.phone,
      success: () => {
        // 拨打成功后，自动添加一条电话跟进记录
        this._addPhoneFollowRecord(customer);
      },
      fail: () => {
        util.showToast(i18n.t('customers.callFailed'));
      }
    });
  },

  // 添加电话跟进记录（通过后端 API 持久化）
  _addPhoneFollowRecord(customer) {
    const now = new Date().toISOString();
    const data = {
      type: 'phone',
      typeLabel: i18n.t('customerDetail.followTypePhone'),
      icon: '📞',
      content: i18n.t('customers.phoneFollowContent'),
      createdAt: now
    };
    api.addFollowRecord(customer.id, data).then(() => {
      // 刷新列表展示
      this.loadCustomers();
      util.showToast(i18n.t('customers.callRecorded'), 'success');
    }).catch(err => {
      console.error('[Customers] 添加跟进记录失败:', err);
      util.showToast(err.message || '添加跟进记录失败');
    });
  },

  showStatusPicker(customer) {
    wx.showActionSheet({
      itemList: [
        i18n.t('customers.statusOpt1'),
        i18n.t('customers.statusOpt2'),
        i18n.t('customers.statusOpt3'),
        i18n.t('customers.statusOpt4'),
        i18n.t('customers.deleteCustomer')
      ],
      success: (res) => {
        const statuses = ['new', 'following', 'converted', 'lost'];

        // 第5项：删除客户
        if (res.tapIndex === 4) {
          this._deleteCustomer(customer);
          return;
        }

        const newStatus = statuses[res.tapIndex];
        // 乐观更新 UI
        const customers = this.data.customers.map(c =>
          c.id === customer.id
            ? {
              ...c,
              status: newStatus,
              statusLabel: constants.CUSTOMER_STATUS[newStatus].label,
              statusColor: constants.CUSTOMER_STATUS[newStatus].color,
              statusBg: constants.CUSTOMER_STATUS[newStatus].bg
            }
            : c
        );
        this.setData({ customers });
        this.updateStatusCounts(customers);

        // 同步状态变更到后端
        this._syncCustomerStatus(customer.id, newStatus);

        util.showToast(i18n.t('customers.statusUpdated'), 'success');
      }
    });
  },

  // 同步客户状态变更到后端
  _syncCustomerStatus(customerId, newStatus) {
    api.updateCustomer(customerId, { status: newStatus }).catch(err => {
      console.error('[Customers] 更新客户状态失败:', err);
      util.showToast(err.message || '更新状态失败');
    });
  },

  // 删除客户（通过后端 API 删除）
  _deleteCustomer(customer) {
    wx.showModal({
      title: i18n.t('customers.deleteConfirmTitle'),
      content: i18n.t('customers.deleteConfirmContent', [customer.name]),
      confirmText: i18n.t('common.confirm'),
      cancelText: i18n.t('common.cancel'),
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return;

        api.deleteCustomer(customer.id).then(() => {
          // 从页面列表中移除
          const pageList = this.data.customers.filter(c => c.id !== customer.id);
          this.setData({ customers: pageList });
          this.updateStatusCounts(pageList);

          util.showToast(i18n.t('customers.deleteSuccess'), 'success');
        }).catch(err => {
          console.error('[Customers] 删除客户失败:', err);
          util.showToast(err.message || '删除失败');
        });
      }
    });
  },

  updateStatusCounts(customers) {
    const statusCounts = { all: customers.length, new: 0, following: 0, converted: 0, lost: 0 };
    customers.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });
    this.setData({ statusCounts });
  },

  onAssign(e) {
    const customer = e.currentTarget.dataset.customer;
    // 跳转到问卷分配页，预选该客户
    wx.navigateTo({
      url: `/pages/survey-assign/survey-assign?customerId=${customer.id}`
    });
  },

  onAddCustomer() {
    wx.navigateTo({ url: '/pages/customer-add/customer-add' });
  },

  onPullDownRefresh() {
    this.loadCustomers();
    setTimeout(() => wx.stopPullDownRefresh(), 800);
  }
});
