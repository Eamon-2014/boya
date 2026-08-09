// pages/customer-detail/customer-detail.js
const api = require('../../utils/api.js');
const util = require('../../utils/util.js');
const constants = require('../../utils/constants.js');
const i18n = require('../../utils/i18n.js');

Page({
  data: {
    customerId: '',
    customer: null,
    avatarColor: '',
    initial: '',
    languageLabel: '',
    languageColor: '',
    statusLabel: '',
    statusColor: '',
    statusBg: '',
    maskedPhone: '',
    relatedAssignments: [],
    relatedReports: [],
    activeTab: 'info',
    tabs: [],
    followRecords: [],
    showAddFollow: false,
    newFollowContent: '',
    newFollowType: 'phone',
    followTypes: [],
    texts: {}
  },

  loadI18nTexts() {
    const texts = {
      deleteCustomer: i18n.t('customerDetail.deleteCustomer'),
      tabInfo: i18n.t('customerDetail.tabInfo'),
      tabFollow: i18n.t('customerDetail.tabFollow'),
      tabHistory: i18n.t('customerDetail.tabHistory')
    };
    const tabs = [
      { key: 'info', label: texts.tabInfo },
      { key: 'follow', label: texts.tabFollow },
      { key: 'history', label: texts.tabHistory }
    ];
    const followTypes = [
      { key: 'phone', label: i18n.t('customerDetail.followTypePhone'), icon: '📞' },
      { key: 'wechat', label: i18n.t('customerDetail.followTypeWechat'), icon: '💬' },
      { key: 'meeting', label: i18n.t('customerDetail.followTypeMeeting'), icon: '🤝' },
      { key: 'trial', label: i18n.t('customerDetail.followTypeTrial'), icon: '🎧' },
      { key: 'other', label: i18n.t('customerDetail.followTypeOther'), icon: '📝' }
    ];
    this.setData({ texts, tabs, followTypes });
  },

  onLoad(options) {
    this.loadI18nTexts();
    const id = options.id;
    this.setData({ customerId: id });
    this.loadCustomer(id);

    // 支持通过 URL 参数自动切换 tab 并打开新增跟进弹窗
    if (options.tab) {
      this.setData({ activeTab: options.tab });
    }
    if (options.addFollow === '1') {
      // 预设跟进类型
      const followType = options.followType || 'phone';
      this.setData({
        showAddFollow: true,
        newFollowType: followType
      });
      // 预设跟进内容
      if (options.followContent) {
        this.setData({ newFollowContent: decodeURIComponent(options.followContent) });
      }
    }
  },

  onShow() {
    this.loadI18nTexts();
    if (this.data.customerId) {
      this.loadCustomer(this.data.customerId);
    }
  },

  loadCustomer(id) {
    // 并行加载客户详情、跟进记录、关联分配、关联报告
    Promise.all([
      api.getCustomer(id),
      api.listFollowRecords(id),
      api.listAssignments({ customerId: id }),
      api.listReports({ customerId: id })
    ]).then(([customer, followRecords, assignments, reports]) => {
      if (!customer) {
        wx.showToast({ title: '客户不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1000);
        return;
      }

      const avatarColor = constants.getAvatarColor(customer.name);
      const initial = util.getInitials(customer.name);
      const languageLabel = i18n.t('lang.' + customer.language);
      const languageColor = constants.LANGUAGES[customer.language]?.color || '#6B7280';
      const statusLabel = constants.CUSTOMER_STATUS[customer.status]?.label || customer.status;
      const statusColor = constants.CUSTOMER_STATUS[customer.status]?.color || '#6B7280';
      const statusBg = constants.CUSTOMER_STATUS[customer.status]?.bg || 'rgba(156, 163, 175, 0.15)';
      const maskedPhone = util.maskPhone(customer.phone);

      const relatedAssignments = (assignments || []).map(a => ({
        ...a,
        statusLabel: constants.ASSIGNMENT_STATUS[a.status]?.label || a.status,
        assignedAtText: util.formatRelativeTime(a.assignedAt)
      }));

      const relatedReports = (reports || []).map(r => ({
        ...r,
        statusLabel: constants.REPORT_STATUS[r.status]?.label || r.status,
        statusColor: constants.REPORT_STATUS[r.status]?.color || '#9CA3AF',
        createdAtText: util.formatRelativeTime(r.createdAt),
        scoreLevel: util.getScoreLevel(r.overallScore)
      }));

      // 标记最新跟进记录并补全相对时间文案
      const processedFollow = (followRecords || []).map((r, i) => ({
        ...r,
        timeText: util.formatRelativeTime(r.createdAt),
        isLatest: i === 0
      }));

      this.setData({
        customer,
        avatarColor,
        initial,
        languageLabel,
        languageColor,
        statusLabel,
        statusColor,
        statusBg,
        maskedPhone,
        relatedAssignments,
        relatedReports,
        followRecords: processedFollow
      });

      wx.setNavigationBarTitle({ title: `${customer.name}的档案` });
    }).catch(err => {
      console.error('[CustomerDetail] 加载失败:', err);
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    });
  },

  // 删除一条跟进记录
  onDeleteFollowRecord(e) {
    const recordId = e.currentTarget.dataset.id;
    const { customerId } = this.data;

    wx.showModal({
      title: i18n.t('customerDetail.deleteFollowTitle'),
      content: i18n.t('customerDetail.deleteFollowContent'),
      confirmText: i18n.t('common.confirm'),
      cancelText: i18n.t('common.cancel'),
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return;

        api.deleteFollowRecord(customerId, recordId).then(() => {
          // 重新从后端加载以获取最新数据
          this.loadCustomer(customerId);
          wx.showToast({ title: i18n.t('customerDetail.deleteFollowSuccess'), icon: 'success' });
        }).catch(err => {
          console.error('[CustomerDetail] 删除跟进记录失败:', err);
          wx.showToast({ title: err.message || '删除失败', icon: 'none' });
        });
      }
    });
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  onCallPhone() {
    wx.makePhoneCall({
      phoneNumber: this.data.customer.phone,
      fail: () => {
        wx.showToast({ title: '拨打失败', icon: 'none' });
      }
    });
  },

  onCopyPhone() {
    wx.setClipboardData({
      data: this.data.customer.phone,
      success: () => wx.showToast({ title: '电话号码已复制', icon: 'success' })
    });
  },

  onShowAddFollow() {
    this.setData({ showAddFollow: true });
  },

  onHideAddFollow() {
    this.setData({ showAddFollow: false, newFollowContent: '', newFollowType: 'phone' });
  },

  onFollowTypeChange(e) {
    this.setData({ newFollowType: e.currentTarget.dataset.type });
  },

  onFollowContentInput(e) {
    this.setData({ newFollowContent: e.detail.value });
  },

  onSubmitFollow() {
    const { newFollowContent, newFollowType, customerId } = this.data;
    if (!newFollowContent.trim()) {
      wx.showToast({ title: '请填写跟进内容', icon: 'none' });
      return;
    }

    const typeInfo = this.data.followTypes.find(f => f.key === newFollowType);
    const data = {
      type: newFollowType,
      typeLabel: typeInfo.label,
      icon: typeInfo.icon,
      content: newFollowContent.trim()
    };

    api.addFollowRecord(customerId, data).then(() => {
      this.setData({
        showAddFollow: false,
        newFollowContent: ''
      });
      // 重新从后端加载以获取最新数据
      this.loadCustomer(customerId);
      wx.showToast({ title: '跟进记录已添加', icon: 'success' });
    }).catch(err => {
      console.error('[CustomerDetail] 添加跟进记录失败:', err);
      wx.showToast({ title: err.message || '添加失败', icon: 'none' });
    });
  },

  onAssignSurvey() {
    wx.navigateTo({ url: `/pages/survey-assign/survey-assign?customerId=${this.data.customerId}` });
  },

  onViewReport(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/report-detail/report-detail?id=${id}` });
  },

  onEditCustomer() {
    wx.showToast({ title: '编辑功能即将上线', icon: 'none' });
  },

  onChangeStatus() {
    const { customer } = this.data;
    const statuses = Object.keys(constants.CUSTOMER_STATUS);
    const labels = statuses.map(s => constants.CUSTOMER_STATUS[s].label);
    wx.showActionSheet({
      itemList: labels,
      success: (res) => {
        const newStatus = statuses[res.tapIndex];
        const statusInfo = constants.CUSTOMER_STATUS[newStatus];
        // 乐观更新 UI
        this.setData({
          customer: { ...customer, status: newStatus },
          statusLabel: statusInfo.label,
          statusColor: statusInfo.color,
          statusBg: statusInfo.bg
        });

        // 同步状态变更到后端
        api.updateCustomer(customer.id, { status: newStatus }).catch(err => {
          console.error('[CustomerDetail] 更新客户状态失败:', err);
          wx.showToast({ title: err.message || '更新失败', icon: 'none' });
        });

        wx.showToast({ title: `${i18n.t('customerDetail.statusChanged')}${statusInfo.label}`, icon: 'success' });
      }
    });
  },

  onDeleteCustomer() {
    const { customer } = this.data;

    wx.showModal({
      title: i18n.t('customers.deleteConfirmTitle'),
      content: i18n.t('customers.deleteConfirmContent', [customer.name]),
      confirmText: i18n.t('common.confirm'),
      cancelText: i18n.t('common.cancel'),
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return;

        api.deleteCustomer(customer.id).then(() => {
          wx.showToast({ title: i18n.t('customers.deleteSuccess'), icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1000);
        }).catch(err => {
          console.error('[CustomerDetail] 删除客户失败:', err);
          wx.showToast({ title: err.message || '删除失败', icon: 'none' });
        });
      }
    });
  }
});
