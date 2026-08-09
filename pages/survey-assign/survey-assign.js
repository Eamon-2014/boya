// pages/survey-assign/survey-assign.js
const app = getApp();
const api = require('../../utils/api.js');
const util = require('../../utils/util.js');
const constants = require('../../utils/constants.js');
const i18n = require('../../utils/i18n.js');

Page({
  data: {
    step: 1, // 1:选客户 2:选模板 3:配置
    // 客户选择
    customers: [],
    selectedCustomer: null,
    customerSearch: '',
    filteredCustomers: [],
    // 模板选择
    templates: [],
    selectedTemplate: null,
    // AI教师
    aiTeachers: [],
    selectedAiTeacher: null,
    // 表单
    deadline: '',
    deadlineIndex: 2, // 默认7天
    deadlineOptions: ['3天', '5天', '7天', '14天', '30天'],
    message: '',
    submitting: false
  },

  onLoad(options) {
    this._pendingOptions = options || {};

    // 预填截止日期（默认7天后）
    this.setDeadline(7);

    // 并行加载客户、模板、AI 教师
    Promise.all([
      this.loadCustomers(),
      this.loadTemplates(),
      this.loadAiTeachers()
    ]).then(() => {
      // 数据加载完成后处理预选
      const options = this._pendingOptions || {};
      if (options.customerId) {
        const customer = this.data.customers.find(c => c.id === options.customerId);
        if (customer) {
          this.selectCustomer(customer);
        }
      }
      if (options.templateId) {
        const template = this.data.templates.find(t => t.id === options.templateId);
        if (template) {
          this.selectTemplate(template);
        }
      }
    });
  },

  onShow() {
    i18n.setPageTitle('surveyAssign');
  },

  loadCustomers() {
    return api.listCustomers()
      .then(list => {
        const customers = (list || []).map(c => ({
          ...c,
          initial: util.getInitials(c.name),
          avatarColor: constants.getAvatarColor(c.name),
          languageLabel: i18n.t('lang.' + c.language),
          languageColor: constants.LANGUAGES[c.language]?.color || '#6B7280',
          statusLabel: i18n.t('customerStatus.' + c.status) !== ('customerStatus.' + c.status) ? i18n.t('customerStatus.' + c.status) : (constants.CUSTOMER_STATUS[c.status]?.label || c.status),
          maskedPhone: util.maskPhone(c.phone)
        }));
        this.setData({ customers, filteredCustomers: customers });
      })
      .catch(err => {
        console.error('[问卷分配] 加载客户失败:', err);
        util.showToast(err.message || '客户加载失败');
      });
  },

  loadTemplates() {
    return api.listTemplates({ status: 'active' })
      .then(list => {
        const templates = (list || []).map(t => ({
          ...t,
          languageLabel: i18n.t('lang.' + t.language),
          languageColor: constants.LANGUAGES[t.language]?.color || '#6B7280',
          languageBg: constants.LANGUAGES[t.language]?.bg || 'rgba(107, 114, 128, 0.1)',
          questionCount: t.questions ? t.questions.length : 0
        }));
        this.setData({ templates });
      })
      .catch(err => {
        console.error('[问卷分配] 加载模板失败:', err);
        util.showToast(err.message || '模板加载失败');
      });
  },

  loadAiTeachers() {
    return api.listAiTeachers({ status: 'ready' })
      .then(list => {
        const teachers = (list || []).map(t => ({
          ...t,
          languageLabel: i18n.t('lang.' + t.language),
          languageColor: constants.LANGUAGES[t.language]?.color || '#6B7280'
        }));
        this.setData({ aiTeachers: teachers });
      })
      .catch(err => {
        console.error('[问卷分配] 加载AI教师失败:', err);
        util.showToast(err.message || 'AI教师加载失败');
      });
  },

  // ===== 客户搜索 =====
  onCustomerSearch(e) {
    const keyword = e.detail.value;
    const filtered = this.data.customers.filter(c =>
      c.name.includes(keyword) ||
      (c.childName || '').includes(keyword) ||
      (c.phone || '').includes(keyword)
    );
    this.setData({ customerSearch: keyword, filteredCustomers: filtered });
  },

  // ===== 选择客户 =====
  selectCustomer(e) {
    const customer = e.currentTarget ? e.currentTarget.dataset.customer : e;
    this.setData({
      selectedCustomer: customer,
      step: 2
    });
  },

  // ===== 选择模板 =====
  selectTemplate(e) {
    const template = e.currentTarget ? e.currentTarget.dataset.template : e;
    this.setData({
      selectedTemplate: template,
      step: 3
    });

    // 智能匹配AI教师（按语言）
    const matched = this.data.aiTeachers.find(t => t.language === template.language);
    if (matched) {
      this.setData({ selectedAiTeacher: matched });
    }
  },

  // ===== AI教师选择 =====
  onAiTeacherSelect(e) {
    const teacher = e.currentTarget.dataset.teacher;
    this.setData({ selectedAiTeacher: teacher });
  },

  // ===== 截止日期 =====
  onDeadlineChange(e) {
    const idx = e.detail.value;
    const days = parseInt(this.data.deadlineOptions[idx].replace('天', ''));
    this.setData({ deadlineIndex: idx });
    this.setDeadline(days);
  },

  setDeadline(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    this.setData({ deadline: `${y}-${m}-${d}` });
  },

  // ===== 留言 =====
  onMessageInput(e) {
    this.setData({ message: e.detail.value });
  },

  // ===== 步骤导航 =====
  goToStep(e) {
    const step = e.currentTarget.dataset.step;
    // 不允许跳过未完成的步骤
    if (step === 2 && !this.data.selectedCustomer) return;
    if (step === 3 && (!this.data.selectedCustomer || !this.data.selectedTemplate)) return;
    this.setData({ step });
  },

  // ===== 提交推送 =====
  onSubmit() {
    const { selectedCustomer, selectedTemplate, selectedAiTeacher, deadline, message } = this.data;

    if (!selectedCustomer) {
      util.showToast('请先选择客户');
      return;
    }
    if (!selectedTemplate) {
      util.showToast('请选择问卷模板');
      return;
    }

    this.setData({ submitting: true });
    util.showLoading('正在推送问卷...');

    const payload = {
      templateId: selectedTemplate.id,
      customerId: selectedCustomer.id,
      deadline: deadline + 'T23:59:59Z',
      aiTeacherId: selectedAiTeacher ? selectedAiTeacher.id : '',
      message: message || ''
    };

    api.createAssignment(payload)
      .then(() => {
        util.hideLoading();
        this.setData({ submitting: false });

        // 显示成功弹窗
        wx.showModal({
          title: '推送成功',
          content: `已向「${selectedCustomer.name}」推送「${selectedTemplate.name}」问卷${selectedAiTeacher ? '，将由' + selectedAiTeacher.name + '生成报告' : ''}。`,
          showCancel: false,
          confirmText: '查看发放记录',
          success: () => {
            wx.navigateBack();
          }
        });
      })
      .catch(err => {
        util.hideLoading();
        this.setData({ submitting: false });
        console.error('[问卷分配] 推送失败:', err);
        util.showToast(err.message || '推送失败');
      });
  },

  onCancel() {
    wx.navigateBack();
  }
});
