// pages/dashboard/dashboard.js
const app = getApp();
const util = require('../../utils/util.js');
const constants = require('../../utils/constants.js');
const i18n = require('../../utils/i18n.js');
const api = require('../../utils/api.js');

// 焦点卡片元数据映射（后端 id → 展示用 action/图标/颜色/i18n）
const FOCUS_CARD_META = {
  'following':              { action: 'followUp',     icon: '👤', color: '#2563EB', bg: '#DBEAFE', titleKey: 'dashboard.urgentFollow',         descKey: 'dashboard.overdueFollow' },
  'pending-reports':        { action: 'reviewReport', icon: '📋', color: '#F59E0B', bg: '#FEF3C7', titleKey: 'dashboard.pendingReports',        descKey: 'dashboard.waitingReview' },
  'pending-questionnaires': { action: 'assignSurvey', icon: '📝', color: '#10B981', bg: '#D1FAE5', titleKey: 'dashboard.pendingQuestionnaires', descKey: 'dashboard.sentIncomplete' },
  'ai-teachers':            { action: 'aiTeacher',    icon: '🤖', color: '#8B5CF6', bg: '#EDE9FE', titleKey: 'dashboard.activeTeachers',        descKey: 'dashboard.activeTeachers' }
};

// 漏斗阶段 i18n + 颜色映射（按顺序：总客户 / 开始评估 / 完成体验 / 成功转化）
const FUNNEL_STAGE_I18N = [
  { key: 'dashboard.getCustomers',        color: '#3B82F6' },
  { key: 'dashboard.startEvaluation',     color: '#6366F1' },
  { key: 'dashboard.completeSurvey',      color: '#F59E0B' },
  { key: 'dashboard.successfulConversion', color: '#10B981' }
];

Page({
  data: {
    themeColors: {},
    currentUser: {},
    isImpersonating: false,
    stats: null,
    todos: [],
    activities: [],
    todayStr: '',
    focusCards: [],
    funnelData: null,
    showActivityDetail: false,
    selectedActivity: null,
    showActivityPublish: false,
    publishForm: { title: '', description: '' },
    publishing: false,
    quickEntries: [
      { icon: '👤', label: '新增客户', bg: '#DBEAFE', color: '#2563EB', action: 'addCustomer' },
      { icon: '📝', label: '创建问卷', bg: '#D1FAE5', color: '#10B981', action: 'createTemplate' },
      { icon: '🤖', label: 'AI教师', bg: '#EDE9FE', color: '#8B5CF6', action: 'aiTeacher' },
      { icon: '📊', label: '数据报表', bg: '#FEF3C7', color: '#F59E0B', action: 'dataReport' },
      { icon: '📨', label: '推送问卷', bg: '#FFEDD5', color: '#EA580C', action: 'assignSurvey' },
      { icon: '✅', label: '报告审核', bg: '#FCE7F3', color: '#DB2777', action: 'reviewReport' },
      { icon: '💬', label: '客户跟进', bg: '#CFFAFE', color: '#0891B2', action: 'followUp' }
    ]
  },

  onLoad() {
    this.refreshDate();
  },

  refreshDate() {
    const now = new Date();
    const lang = i18n.getLang();
    const weekDayMap = {
      'zh-CN': ['日', '一', '二', '三', '四', '五', '六'],
      'en': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      'ja': ['日', '月', '火', '水', '木', '金', '土'],
      'ko': ['일', '월', '화', '수', '목', '금', '토'],
      'fr': ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
      'de': ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    };
    const wd = (weekDayMap[lang] || weekDayMap['en'])[now.getDay()];
    const m = now.getMonth() + 1;
    const d = now.getDate();

    let todayStr;
    if (lang === 'zh-CN' || lang === 'ja' || lang === 'ko') {
      if (lang === 'zh-CN') todayStr = `${m}月${d}日 星期${wd}`;
      else if (lang === 'ja') todayStr = `${m}月${d}日 ${wd}曜日`;
      else todayStr = `${m}월 ${d}일 ${wd}요일`;
    } else {
      const monthNames = {
        'en': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        'fr': ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'],
        'de': ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
      };
      const mn = (monthNames[lang] || monthNames['en'])[now.getMonth()];
      todayStr = `${wd}, ${mn} ${d}`;
    }
    this.setData({ todayStr });
  },

  ready() {
    i18n.setPageTitle('dashboard');
  },

  loadThemeColors() {
    const themeColors = app.getThemeColors();
    this.setData({ themeColors });
  },

  onShow() {
    this.loadThemeColors();
    // 同步伪装登录状态（横幅依赖此字段）
    this.setData({
      isImpersonating: !!app.globalData.isImpersonating,
      currentUser: app.globalData.currentUser || {},
    });
    // 立即设置标题
    i18n.setPageTitle('dashboard');
    // 兜底：延迟 50ms 再设置一次
    setTimeout(() => {
      i18n.setPageTitle('dashboard');
      const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;
      if (tabBar && tabBar.refreshTexts) tabBar.refreshTexts();
    }, 50);
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
      this.getTabBar().refreshTexts && this.getTabBar().refreshTexts();
    }
    this.loadData();
  },

  loadData() {
    return Promise.all([api.getDashboard(), api.getActivities()])
      .then(([dashData, activities]) => {
        const rawStats = (dashData && dashData.stats) || {};
        const focusCards = (dashData && dashData.focusCards) || [];
        const todos = (dashData && dashData.todos) || [];
        const funnel = (dashData && dashData.funnel) || null;

        // 确保 stats 有完整的默认值，防止显示 null
        const stats = {
          todayNewCustomers: rawStats.todayNewCustomers || 0,
          todayFollowTasks: rawStats.todayFollowTasks || 0,
          pendingQuestionnaires: rawStats.pendingQuestionnaires || 0,
          pendingReports: rawStats.pendingReports || 0,
          monthConvertedCustomers: rawStats.monthConvertedCustomers || 0,
          monthConversionRate: rawStats.monthConversionRate || 0,
          totalCustomers: rawStats.totalCustomers || 0,
          activeAITeachers: rawStats.activeAITeachers || 0
        };

        const formattedTodos = (todos || []).map(t => ({
          ...t,
          dueTimeText: t.dueAt ? util.formatTime(t.dueAt, 'HH:mm') : '',
          priorityColor: this.getPriorityColor(t.priority)
        }));
        const formattedActivities = (activities || []).map(a => ({
          ...a,
          timeText: util.formatRelativeTime(a.createdAt)
        }));

        this.setData({
          currentUser: app.globalData.currentUser,
          stats,
          todos: formattedTodos,
          activities: formattedActivities,
          focusCards: this.buildFocusCards(focusCards || []),
          funnelData: this.buildFunnelData(funnel || null)
        });

        app.globalData.dashboardStats = stats;

        this.loadI18nTexts();
      })
      .catch(err => {
        console.error('[Dashboard] 加载失败:', err);
        util.showToast(err.message || '加载失败');
      });
  },

  // 将后端焦点卡片（{id,title,count,color,...}）重塑为 WXML 所需结构 {bg,action,icon,color,value,title,desc}
  buildFocusCards(cards) {
    if (!Array.isArray(cards)) return [];
    return cards.map(c => {
      const meta = FOCUS_CARD_META[c.id] || {};
      return {
        bg: meta.bg || '#DBEAFE',
        color: meta.color || '#2563EB',
        icon: meta.icon || '📊',
        action: meta.action || '',
        value: c.count != null ? c.count : 0,
        title: meta.titleKey ? i18n.t(meta.titleKey) : (c.title || ''),
        desc: meta.descKey ? i18n.t(meta.descKey) : ''
      };
    });
  },

  // 将后端漏斗（{total,following,trial,converted}）重塑为 WXML 所需 {conversionRate, stages:[{width,color,count,label}]}
  buildFunnelData(data) {
    if (!data) return null;
    const total = data.total || 0;
    const following = data.following || 0;
    const trial = data.trial || 0;
    const converted = data.converted || 0;
    const counts = [total, following, trial, converted];
    const max = total || Math.max.apply(null, counts.concat([1]));
    const stages = FUNNEL_STAGE_I18N.map((s, i) => ({
      count: counts[i] || 0,
      color: s.color,
      width: max > 0 ? Math.round(((counts[i] || 0) / max) * 100) : 0,
      label: i18n.t(s.key)
    }));
    const conversionRate = total > 0 ? Math.round((converted / total) * 1000) / 10 : 0;
    return { conversionRate, stages };
  },

  loadI18nTexts() {
    this.refreshDate();
    const hour = new Date().getHours();
    let greeting = i18n.t('dashboard.goodMorning');
    if (hour >= 12 && hour < 18) greeting = i18n.t('dashboard.goodAfternoon');
    else if (hour >= 18) greeting = i18n.t('dashboard.goodEvening');

    // todos/activities 标题使用 API 返回值，仅刷新时间文本
    const todos = this.data.todos.map(t => ({
      ...t,
      dueTimeText: t.dueAt ? util.formatTime(t.dueAt, 'HH:mm') : ''
    }));
    const activities = this.data.activities.map(a => ({
      ...a,
      timeText: util.formatRelativeTime(a.createdAt)
    }));

    // 直接用当前已转换好的 focusCards 和 funnelData（不需要重建）
    const focusCards = this.data.focusCards || [];
    const funnelData = this.data.funnelData || null;

    const quickEntries = this.data.quickEntries.map(q => {
      const labelMap = { '新增客户': 'dashboard.customerAdd', '创建问卷': 'dashboard.pendingQuestionnaires', 'AI教师': 'dashboard.activeTeachers', '数据报表': 'dashboard.dataReport', '推送问卷': 'dashboard.sentIncomplete', '报告审核': 'dashboard.pendingReports', '客户跟进': 'dashboard.myTodos' };
      return { ...q, label: labelMap[q.label] ? i18n.t(labelMap[q.label]) : q.label };
    });

    this.setData({
      'texts.greeting': greeting,
      'texts.wishWork': i18n.t('dashboard.wishWork'),
      'texts.todayNewCustomers': i18n.t('dashboard.todayNewCustomers'),
      'texts.todayFollow': i18n.t('dashboard.todayFollow'),
      'texts.monthConversion': i18n.t('dashboard.monthConversion'),
      'texts.todayFocus': i18n.t('dashboard.todayFocus'),
      'texts.pendingReports': i18n.t('dashboard.pendingReports'),
      'texts.pendingQuestionnaires': i18n.t('dashboard.pendingQuestionnaires'),
      'texts.monthConverted': i18n.t('dashboard.monthConverted'),
      'texts.activeTeachers': i18n.t('dashboard.activeTeachers'),
      'texts.suffixCustomer': i18n.t('dashboard.suffixCustomer'),
      'texts.suffixTeacher': i18n.t('dashboard.suffixTeacher'),
      'texts.conversionFunnel': i18n.t('dashboard.conversionFunnel'),
      'texts.fullAnalysis': i18n.t('dashboard.fullAnalysis'),
      'texts.conversionRate': i18n.t('dashboard.conversionRate'),
      'texts.viewReport': i18n.t('dashboard.viewReport'),
      'texts.quickActions': i18n.t('dashboard.quickActions'),
      'texts.myTodos': i18n.t('dashboard.myTodos'),
      'texts.viewAll': i18n.t('dashboard.viewAll'),
      'texts.noTodos': i18n.t('dashboard.noTodos'),
      'texts.deadline': i18n.t('dashboard.deadline'),
      'texts.teamActivity': i18n.t('dashboard.teamActivity'),
      todos,
      activities,
      focusCards,
      funnelData,
      quickEntries
    });
  },

  getPriorityColor(priority) {
    const map = { high: '#EF4444', medium: '#F59E0B', low: '#9CA3AF' };
    return map[priority] || '#9CA3AF';
  },

  onQuickAction(e) {
    const action = e.currentTarget.dataset.action;
    switch (action) {
      case 'addCustomer':
        wx.navigateTo({ url: '/pages/customer-add/customer-add' });
        break;
      case 'createTemplate':
        wx.navigateTo({ url: '/pages/template-edit/template-edit' });
        break;
      case 'aiTeacher':
        wx.switchTab({ url: '/pages/profile/profile' });
        break;
      case 'dataReport':
        wx.navigateTo({ url: '/pages/data-report/data-report' });
        break;
      case 'assignSurvey':
        wx.navigateTo({ url: '/pages/survey-assign/survey-assign' });
        break;
      case 'reviewReport':
        wx.switchTab({ url: '/pages/questionnaire/questionnaire' });
        break;
      case 'followUp':
        wx.switchTab({ url: '/pages/customers/customers' });
        break;
    }
  },

  onFocusCardTap(e) {
    this.onQuickAction(e);
  },

  onTodoDone(e) {
    const id = e.currentTarget.dataset.id;
    api.completeTodo(id).then(() => {
      const todos = this.data.todos.filter(t => t.id !== id);
      this.setData({ todos });
      util.showToast(i18n.t('status.completed'), 'success');
    }).catch(err => {
      util.showToast(err.message || '操作失败');
    });
  },

  onTodoClick(e) {
    const todo = e.currentTarget.dataset.todo;
    if (todo.relatedId && todo.type === 'follow') {
      wx.navigateTo({ url: `/pages/customer-detail/customer-detail?id=${todo.relatedId}` });
    } else if (todo.type === 'review_report' && todo.relatedId) {
      wx.navigateTo({ url: `/pages/report-detail/report-detail?id=${todo.relatedId}` });
    } else if (todo.type === 'send_questionnaire' && todo.relatedId) {
      wx.navigateTo({ url: `/pages/survey-assign/survey-assign?customerId=${todo.relatedId}` });
    } else if (todo.type === 'ai_training' && todo.relatedId) {
      wx.navigateTo({ url: `/pages/ai-teacher-edit/ai-teacher-edit?id=${todo.relatedId}` });
    } else {
      util.showToast('即将支持');
    }
  },

  onFunnelTap() {
    wx.navigateTo({ url: '/pages/data-report/data-report' });
  },

  onMoreTodos() {
    wx.navigateTo({ url: '/pages/todo-list/todo-list' });
  },

  // ============ 团队动态：查看详情 / 删除 / 分享 ============
  onActivityClick(e) {
    const activity = e.currentTarget.dataset.activity;
    this.setData({
      showActivityDetail: true,
      selectedActivity: activity
    });
  },

  onCloseActivityDetail() {
    this.setData({
      showActivityDetail: false,
      selectedActivity: null
    });
  },

  onDeleteActivity() {
    const activity = this.data.selectedActivity;
    if (!activity) return;
    wx.showModal({
      title: '删除确认',
      content: `确定删除这条「${activity.title}」动态吗？`,
      confirmText: '删除',
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return;
        util.showToast('删除中...', 'none', 1500);
        api.deleteActivity(activity.id)
          .then(() => {
            // 从本地列表移除
            const activities = this.data.activities.filter(a => a.id !== activity.id);
            this.setData({ activities });
            this.onCloseActivityDetail();
            util.showToast('已删除', 'success');
          })
          .catch(err => {
            util.showToast(err.message || '删除失败', 'none');
          });
      }
    });
  },

  onShareActivity() {
    const activity = this.data.selectedActivity;
    if (!activity) return;
    wx.showActionSheet({
      itemList: ['发送给朋友', '生成分享图片'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 直接通过右上角分享，提示用户
          util.showToast('请点击右上角分享给朋友', 'none', 2000);
        } else if (res.tapIndex === 1) {
          this._genShareImage(activity);
        }
      }
    });
  },

  _genShareImage(activity) {
    wx.showLoading({ title: '生成中...', mask: true });
    setTimeout(() => {
      const ctx = wx.createCanvasContext('activityShareCanvas', this);
      const w = 600, h = 400;
      // 背景
      ctx.setFillStyle('#FFFFFF');
      ctx.fillRect(0, 0, w, h);
      // 顶部装饰
      ctx.setFillStyle('#2563EB');
      ctx.fillRect(0, 0, w, 80);
      ctx.setFillStyle('#FFFFFF');
      ctx.setFontSize(20);
      ctx.fillText('团队动态', 30, 40);
      ctx.setFontSize(12);
      ctx.fillText(util.formatTime(new Date()), 30, 65);
      // 标题
      ctx.setFillStyle('#1F2937');
      ctx.setFontSize(22);
      const title = activity.title || '';
      ctx.fillText(title.length > 20 ? title.slice(0, 20) + '...' : title, 30, 140);
      // 描述
      ctx.setFillStyle('#6B7280');
      ctx.setFontSize(15);
      const desc = activity.description || '';
      // 简单换行
      const lines = [];
      for (let i = 0; i < desc.length; i += 25) {
        lines.push(desc.slice(i, i + 25));
      }
      lines.slice(0, 5).forEach((line, i) => {
        ctx.fillText(line, 30, 185 + i * 28);
      });
      // 底部操作人
      ctx.setFillStyle('#9CA3AF');
      ctx.setFontSize(13);
      ctx.fillText(`${activity.operatorName || ''}  ·  ${activity.timeText || ''}`, 30, h - 40);
      ctx.setFillStyle('#2563EB');
      ctx.fillRect(30, h - 25, 80, 18);
      ctx.setFillStyle('#FFFFFF');
      ctx.setFontSize(12);
      ctx.fillText('查看详情 →', 40, h - 12);

      ctx.draw(false, () => {
        wx.canvasToTempFilePath({
          canvasId: 'activityShareCanvas',
          success: (r) => {
            wx.hideLoading();
            wx.previewImage({
              current: r.tempFilePath,
              urls: [r.tempFilePath],
              complete: () => {
                wx.showModal({
                  title: '保存图片',
                  content: '是否保存到相册？',
                  confirmText: '保存',
                  success: (r2) => {
                    if (r2.confirm) {
                      wx.saveImageToPhotosAlbum({
                        filePath: r.tempFilePath,
                        success: () => util.showToast('已保存', 'success'),
                        fail: () => util.showToast('保存失败', 'none')
                      });
                    }
                  }
                });
              }
            });
          },
          fail: () => {
            wx.hideLoading();
            util.showToast('生成失败', 'none');
          }
        }, this);
      });
    }, 300);
  },

  onShareAppMessage() {
    const a = this.data.selectedActivity || {};
    this.onCloseActivityDetail();
    return {
      title: `【团队动态】${a.title || '查看最新动态'}`,
      path: '/pages/dashboard/dashboard'
    };
  },

  // ============ 团队动态：发布 ============
  noop() {},

  onPublishActivity() {
    this.setData({
      showActivityPublish: true,
      publishForm: { title: '', description: '' },
      publishing: false
    });
  },

  onPublishTitleInput(e) {
    this.setData({ 'publishForm.title': e.detail.value });
  },

  onPublishDescInput(e) {
    this.setData({ 'publishForm.description': e.detail.value });
  },

  onClosePublish() {
    if (this.data.publishing) return;
    this.setData({ showActivityPublish: false });
  },

  onSubmitPublish() {
    const { title, description } = this.data.publishForm;
    if (!title.trim()) {
      util.showToast('请输入动态标题', 'none');
      return;
    }
    this.setData({ publishing: true });
    api.createActivity({
      type: 'manual',
      title: title.trim(),
      description: description.trim()
    })
      .then(activity => {
        // 插入到列表顶部
        const newItem = {
          ...activity,
          timeText: util.formatRelativeTime(activity.createdAt)
        };
        const activities = [newItem, ...this.data.activities];
        this.setData({
          activities,
          showActivityPublish: false,
          publishing: false
        });
        util.showToast('发布成功', 'success');
      })
      .catch(err => {
        this.setData({ publishing: false });
        util.showToast(err.message || '发布失败', 'none');
      });
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      setTimeout(() => wx.stopPullDownRefresh(), 800);
    });
  },

  // 切回管理员身份（退出伪装登录）
  onExitImpersonation() {
    wx.showModal({
      title: '切回管理员',
      content: '将退出当前用户身份，切回管理员账号。',
      confirmText: '确认切回',
      success: (res) => {
        if (!res.confirm) return;
        util.showLoading('切换中...');
        app.exitImpersonation().then(ok => {
          util.hideLoading();
          if (ok) {
            this.setData({
              isImpersonating: false,
              currentUser: app.globalData.currentUser,
            });
            util.showToast('已切回管理员', 'success');
            // 重新加载当前用户视角的数据
            this.loadData();
          } else {
            util.showToast('切回失败，请重试');
          }
        });
      },
    });
  }
});
