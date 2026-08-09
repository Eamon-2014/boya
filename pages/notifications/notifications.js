const util = require('../../utils/util.js');
const i18n = require('../../utils/i18n.js');
const api = require('../../utils/api.js');
const app = getApp();

const TYPE_FILTER_KEYS = ['all', 'unread', 'system', 'report', 'customer', 'ai'];

Page({
  data: {
    themeColors: {},
    notifications: [],
    filteredList: [],
    filterKey: 'all',
    unreadCount: 0,
    typeFilters: [],
    texts: {},
    showDetailModal: false,
    detailItem: null
  },

  loadI18nTexts() {
    const texts = {
      title: i18n.t('notification.title'),
      all: i18n.t('notification.all'),
      unread: i18n.t('notification.unread'),
      markAll: i18n.t('notification.markAll'),
      clearAll: i18n.t('notification.clearAll'),
      empty: i18n.t('notification.empty'),
      system: i18n.t('notification.system'),
      report: i18n.t('notification.report'),
      customer: i18n.t('notification.customer'),
      ai: i18n.t('notification.ai'),
      template: i18n.t('notification.template'),
      viewDetail: i18n.t('notification.viewDetail'),
      emptySub: i18n.t('notification.emptySub'),
      confirm: i18n.t('common.confirm'),
      cancel: i18n.t('common.cancel'),
      success: i18n.t('common.success')
    };
    const typeFilters = TYPE_FILTER_KEYS.map(key => ({
      key,
      label: texts[key]
    }));
    this.setData({ texts, typeFilters });
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
    i18n.setPageTitle('notifications');
    this.loadI18nTexts();
    this.loadData();
  },

  loadData() {
    return api.listNotifications().then(list => {
      const notifications = (list || []).map(n => ({
        ...n,
        // 兼容后端返回 createdAt 时间戳；若已有 time 字段则保留
        time: n.createdAt ? util.formatRelativeTime(n.createdAt) : (n.time || '')
      }));
      const unreadCount = notifications.filter(n => !n.read).length;
      this.setData({ notifications, unreadCount });
      this.applyFilter();
    }).catch(err => {
      console.error('[Notifications] 加载失败:', err);
      util.showToast(err.message || '加载失败');
    });
  },

  applyFilter() {
    const { notifications, filterKey } = this.data;
    let list = notifications;
    if (filterKey === 'unread') {
      list = list.filter(n => !n.read);
    } else if (filterKey !== 'all') {
      list = list.filter(n => n.type === filterKey);
    }
    this.setData({ filteredList: list });
  },

  onFilter(e) {
    this.setData({ filterKey: e.currentTarget.dataset.key });
    this.applyFilter();
  },

  onNotificationTap(e) {
    const id = e.currentTarget.dataset.id;
    const { notifications } = this.data;
    const target = notifications.find(n => n.id === id);
    if (!target) return;

    // 仅在原本未读时才标记已读并扣减未读数
    if (!target.read) {
      api.markNotificationRead(id).then(() => {
        const list = notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        const unreadCount = list.filter(n => !n.read).length;
        this.setData({ notifications: list, unreadCount });
        this.applyFilter();
      }).catch(err => {
        util.showToast(err.message || '操作失败');
      });
    }

    // 弹出详情弹窗
    this.setData({ showDetailModal: true, detailItem: target });
  },

  noop() {},

  onCloseDetailModal() {
    this.setData({ showDetailModal: false, detailItem: null });
  },

  onDetailNavigate() {
    const { detailItem } = this.data;
    if (!detailItem || !detailItem.targetUrl) return;
    const url = detailItem.targetUrl;
    // 跳转到自身没有意义，直接关闭弹窗
    if (url === '/pages/notifications/notifications') {
      this.setData({ showDetailModal: false });
      return;
    }
    if (detailItem.isTab) {
      wx.switchTab({ url });
    } else {
      wx.navigateTo({
        url,
        fail: () => {
          wx.switchTab({ url });
        }
      });
    }
    this.setData({ showDetailModal: false });
  },

  onDeleteNotification() {
    const { detailItem } = this.data;
    if (!detailItem) return;

    wx.showModal({
      title: '删除通知',
      content: '确定要删除这条通知吗？删除后不可恢复。',
      confirmText: '删除',
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return;
        api.deleteNotification(detailItem.id)
          .then(() => {
            // 从列表移除
            const list = this.data.notifications.filter(n => n.id !== detailItem.id);
            const unreadCount = list.filter(n => !n.read).length;
            this.setData({
              notifications: list,
              unreadCount,
              showDetailModal: false,
              detailItem: null
            });
            this.applyFilter();
            util.showToast('已删除', 'success');
          })
          .catch(err => {
            util.showToast(err.message || '删除失败');
          });
      }
    });
  },

  onMarkAllRead() {
    const { notifications } = this.data;
    if (notifications.every(n => n.read)) {
      util.showToast(i18n.t('notification.markAll'));
      return;
    }
    api.markAllNotificationsRead().then(() => {
      const list = notifications.map(n => ({ ...n, read: true }));
      this.setData({ notifications: list, unreadCount: 0 });
      this.applyFilter();
      util.showToast(i18n.t('notification.markAll'), 'success');
    }).catch(err => {
      util.showToast(err.message || '操作失败');
    });
  },

  onClearAll() {
    wx.showModal({
      title: i18n.t('notification.clearAll'),
      content: i18n.t('settings.confirmClear'),
      confirmText: i18n.t('common.confirm'),
      cancelText: i18n.t('common.cancel'),
      success: (r) => {
        if (r.confirm) {
          api.clearNotifications().then(() => {
            this.setData({ notifications: [], unreadCount: 0, filteredList: [] });
            util.showToast(i18n.t('common.success'), 'success');
          }).catch(err => {
            util.showToast(err.message || '操作失败');
          });
        }
      }
    });
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      setTimeout(() => wx.stopPullDownRefresh(), 800);
    });
  }
});
