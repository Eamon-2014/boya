// pages/todo-list/todo-list.js
const app = getApp();
const api = require('../../utils/api.js');
const util = require('../../utils/util.js');
const i18n = require('../../utils/i18n.js');

const TYPE_STYLES = {
  follow: { icon: '💬', color: '#0891B2', bg: 'rgba(8, 145, 178, 0.1)' },
  review_report: { icon: '📋', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  send_questionnaire: { icon: '📨', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
  ai_training: { icon: '🤖', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  default: { icon: '📌', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' }
};

const PRIORITY_STYLES = {
  high: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  medium: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  low: { color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.15)' }
};

const FILTER_KEYS = ['all', 'pending', 'done', 'high'];

Page({
  data: {
    themeColors: {},
    activeFilter: 'all',
    filters: [],
    allTodos: [],
    filteredTodos: [],
    summary: {
      total: 0,
      pending: 0,
      done: 0,
      high: 0
    },
    typeStyles: TYPE_STYLES,
    priorityStyles: PRIORITY_STYLES,
    texts: {},
    showAddModal: false,
    addForm: {
      title: '',
      description: '',
      priority: 'medium',
      dueDate: ''
    },
    priorityOptions: [
      { key: 'high', label: '高优先级', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
      { key: 'medium', label: '中优先级', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
      { key: 'low', label: '低优先级', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.15)' }
    ],
    todayDate: '',
    adding: false
  },

  loadI18nTexts() {
    const texts = {
      myTodos: i18n.t('dashboard.myTodos'),
      all: i18n.t('customers.filterAll'),
      pending: i18n.t('status.pending'),
      done: i18n.t('status.completed'),
      high: i18n.t('dashboard.urgentFollow'),
      followType: i18n.t('customers.follow'),
      reviewType: i18n.t('report.overview'),
      sendType: i18n.t('action.push'),
      aiType: i18n.t('aiTeacher.train'),
      otherType: i18n.t('common.more'),
      highPriority: i18n.t('dashboard.urgentFollow'),
      mediumPriority: i18n.t('status.pending'),
      lowPriority: i18n.t('common.more'),
      confirm: i18n.t('common.confirm'),
      cancel: i18n.t('common.cancel'),
      success: i18n.t('common.success'),
      deadline: i18n.t('dashboard.deadline'),
      noTodos: i18n.t('dashboard.noTodos'),
      noDone: i18n.t('dashboard.noTodos'),
      noHigh: i18n.t('dashboard.noTodos'),
      allDoneMsg: i18n.t('dashboard.noTodos'),
      switchFilter: i18n.t('common.more'),
      completeAll: i18n.t('status.completed'),
      clearDone: i18n.t('action.delete'),
      totalLabel: i18n.t('customers.statAll'),
      pendingLabel: i18n.t('status.pending'),
      doneLabel: i18n.t('status.completed'),
      highLabel: i18n.t('dashboard.urgentFollow'),
      completedStatus: i18n.t('status.completed'),
      restored: i18n.t('common.refresh'),
      overdue: i18n.t('todo.overdue'),
      itemUnit: i18n.t('todo.itemUnit')
    };
    const filters = FILTER_KEYS.map(key => {
      let label = texts[key];
      if (key === 'all') label = texts.all;
      if (key === 'pending') label = texts.pending;
      if (key === 'done') label = texts.done;
      if (key === 'high') label = texts.high;
      return { key, label };
    });
    this.setData({ texts, filters });
  },

  getTypeLabel(type) {
    const map = {
      follow: this.data.texts.followType,
      review_report: this.data.texts.reviewType,
      send_questionnaire: this.data.texts.sendType,
      ai_training: this.data.texts.aiType
    };
    return map[type] || this.data.texts.otherType;
  },

  getPriorityLabel(priority) {
    const map = {
      high: this.data.texts.highPriority,
      medium: this.data.texts.mediumPriority,
      low: this.data.texts.lowPriority
    };
    return map[priority] || priority;
  },

  onLoad() {
    this.loadI18nTexts();
    this.loadTodos();
    // 设置今天日期，作为 picker 起始值
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    this.setData({
      todayDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    });
  },

  loadThemeColors() {
    const themeColors = app.getThemeColors();
    this.setData({ themeColors });
  },

  onShow() {
    this.loadThemeColors();
    i18n.setPageTitle('todoList');
    this.loadI18nTexts();
    this.loadTodos();
  },

  // 从后端拉取所有待办，然后在前端做过滤分组
  loadTodos() {
    // 先拉取未完成与已完成两类，合并展示
    Promise.all([
      api.listTodos({ status: 'pending' }).catch(err => {
        console.error('[待办] 加载未完成失败:', err);
        return [];
      }),
      api.listTodos({ status: 'done' }).catch(err => {
        console.error('[待办] 加载已完成失败:', err);
        return [];
      })
    ]).then(([pending, done]) => {
      const rawTodos = [].concat(pending || [], done || []);
      this._applyTodos(rawTodos);
    }).catch(err => {
      console.error('[待办] 加载失败:', err);
      util.showToast(err.message || '加载失败');
    });
  },

  _applyTodos(rawTodos) {
    const processed = rawTodos.map(t => {
      const typeStyle = TYPE_STYLES[t.type] || TYPE_STYLES.default;
      const priorityStyle = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.low;
      const isDone = t.status === 'done' || t.completed;
      return {
        ...t,
        typeLabel: this.getTypeLabel(t.type),
        typeIcon: typeStyle.icon,
        typeColor: typeStyle.color,
        typeBg: typeStyle.bg,
        priorityLabel: this.getPriorityLabel(t.priority),
        priorityColor: priorityStyle.color,
        priorityBg: priorityStyle.bg,
        dueTimeText: t.dueAt ? util.formatTime(t.dueAt, 'MM-DD HH:mm') : '',
        isOverdue: t.dueAt && !isDone && (new Date(t.dueAt).getTime() < Date.now()),
        isDone
      };
    });

    const summary = {
      total: processed.length,
      pending: processed.filter(t => !t.isDone).length,
      done: processed.filter(t => t.isDone).length,
      high: processed.filter(t => !t.isDone && t.priority === 'high').length
    };

    this.setData({ allTodos: processed, summary });
    this.applyFilter();
  },

  applyFilter() {
    const { activeFilter, allTodos } = this.data;
    let filtered = [];
    if (activeFilter === 'all') {
      filtered = allTodos;
    } else if (activeFilter === 'pending') {
      filtered = allTodos.filter(t => !t.isDone);
    } else if (activeFilter === 'done') {
      filtered = allTodos.filter(t => t.isDone);
    } else if (activeFilter === 'high') {
      filtered = allTodos.filter(t => t.priority === 'high');
    }
    filtered.sort((a, b) => {
      if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.dueAt && b.dueAt) return new Date(a.dueAt) - new Date(b.dueAt);
      return 0;
    });
    this.setData({ filteredTodos: filtered });
  },

  onFilterChange(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeFilter: key });
    this.applyFilter();
  },

  // 切换完成状态：未完成 → 调用 completeTodo；已完成 → 不允许恢复（如后端支持可补充）
  onToggleDone(e) {
    const id = e.currentTarget.dataset.id;
    const todo = this.data.allTodos.find(t => t.id === id);
    if (!todo) return;

    if (todo.isDone) {
      // 已完成，目前后端只提供 complete 接口，不支持恢复，给提示
      util.showToast(i18n.t('common.refresh'), 'none');
      return;
    }

    util.showLoading();
    api.completeTodo(id)
      .then(() => {
        util.hideLoading();
        util.showToast(i18n.t('status.completed'), 'success');
        this.loadTodos();
      })
      .catch(err => {
        util.hideLoading();
        console.error('[待办] 完成失败:', err);
        util.showToast(err.message || '操作失败');
      });
  },

  onTodoClick(e) {
    const todo = e.currentTarget.dataset.todo;
    if (todo.isDone) {
      return;
    }
    if (todo.type === 'follow' && todo.relatedId) {
      wx.navigateTo({ url: `/pages/customer-detail/customer-detail?id=${todo.relatedId}` });
    } else if (todo.type === 'review_report' && todo.relatedId) {
      wx.navigateTo({ url: `/pages/report-detail/report-detail?id=${todo.relatedId}` });
    } else if (todo.type === 'send_questionnaire' && todo.relatedId) {
      wx.navigateTo({ url: `/pages/survey-assign/survey-assign?customerId=${todo.relatedId}` });
    } else if (todo.type === 'ai_training' && todo.relatedId) {
      wx.navigateTo({ url: `/pages/ai-teacher-edit/ai-teacher-edit?id=${todo.relatedId}` });
    } else {
      util.showToast(i18n.t('common.more'));
    }
  },

  // 一键完成所有未完成待办
  onCompleteAll() {
    const { pending } = this.data.summary;
    if (pending === 0) {
      util.showToast(i18n.t('dashboard.noPending'));
      return;
    }
    wx.showModal({
      title: i18n.t('status.completed'),
      content: i18n.t('dashboard.noTodos'),
      confirmText: i18n.t('common.confirm'),
      cancelText: i18n.t('common.cancel'),
      success: (res) => {
        if (!res.confirm) return;
        const pendingTodos = this.data.allTodos.filter(t => !t.isDone);
        util.showLoading();
        Promise.all(pendingTodos.map(t => api.completeTodo(t.id)))
          .then(() => {
            util.hideLoading();
            this.loadTodos();
            util.showToast(i18n.t('common.success'), 'success');
          })
          .catch(err => {
            util.hideLoading();
            console.error('[待办] 批量完成失败:', err);
            util.showToast(err.message || '操作失败');
            this.loadTodos();
          });
      }
    });
  },

  // 清空已完成（前端过滤即可，后端如提供接口可替换）
  onClearDone() {
    const { done } = this.data.summary;
    if (done === 0) {
      util.showToast(i18n.t('dashboard.noTodos'));
      return;
    }
    wx.showModal({
      title: i18n.t('action.delete'),
      content: i18n.t('settings.confirmClear'),
      confirmText: i18n.t('common.confirm'),
      confirmColor: '#EF4444',
      cancelText: i18n.t('common.cancel'),
      success: (res) => {
        if (!res.confirm) return;
        // 仅在前端隐藏已完成项；后端如需真删可补充 API
        const remaining = this.data.allTodos.filter(t => !t.isDone);
        this._applyTodos(remaining);
        util.showToast(i18n.t('common.success'), 'success');
      }
    });
  },

  // ============ 添加待办 ============
  onOpenAddModal() {
    this.setData({
      showAddModal: true,
      addForm: {
        title: '',
        description: '',
        priority: 'medium',
        dueDate: ''
      },
      adding: false
    });
  },

  noop() {},

  onAddTitleInput(e) {
    this.setData({ 'addForm.title': e.detail.value });
  },

  onAddDescInput(e) {
    this.setData({ 'addForm.description': e.detail.value });
  },

  onAddPrioritySelect(e) {
    const priority = e.currentTarget.dataset.key;
    this.setData({ 'addForm.priority': priority });
  },

  onAddDueDateChange(e) {
    this.setData({ 'addForm.dueDate': e.detail.value });
  },

  onAddDueDateClear() {
    this.setData({ 'addForm.dueDate': '' });
  },

  onCloseAddModal() {
    if (this.data.adding) return;
    this.setData({ showAddModal: false });
  },

  onSubmitAddTodo() {
    const { title, description, priority, dueDate } = this.data.addForm;
    if (!title.trim()) {
      util.showToast('请输入待办标题', 'none');
      return;
    }

    const payload = {
      type: 'manual',
      title: title.trim(),
      description: description.trim(),
      priority
    };
    if (dueDate) {
      // 截止到当天 23:59
      payload.dueAt = new Date(dueDate + 'T23:59:59').toISOString();
    }

    this.setData({ adding: true });
    api.createTodo(payload)
      .then(() => {
        this.setData({ showAddModal: false, adding: false });
        util.showToast('待办已创建', 'success');
        this.loadTodos();
      })
      .catch(err => {
        this.setData({ adding: false });
        util.showToast(err.message || '创建失败', 'none');
      });
  },

  onPullDownRefresh() {
    this.loadTodos();
    setTimeout(() => wx.stopPullDownRefresh(), 600);
  }
});
