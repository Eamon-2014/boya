// pages/questionnaire/questionnaire.js
const app = getApp();
const api = require('../../utils/api.js');
const util = require('../../utils/util.js');
const constants = require('../../utils/constants.js');
const i18n = require('../../utils/i18n.js');

Page({
  data: {
    themeColors: {},
    texts: {},
    tab: 'templates',
    search: '',
    templates: [],
    assignments: [],
    reports: [],
    summary: {},
    tabs: [],
    loading: false
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
    i18n.setPageTitle('questionnaire');
    setTimeout(() => {
      i18n.setPageTitle('questionnaire');
      const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;
      if (tabBar && tabBar.refreshTexts) tabBar.refreshTexts();
    }, 50);
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.loadI18nTexts();
    // 从详情页返回时刷新（数据由后端管理，直接重新拉取）
    this.loadData();
  },

  loadI18nTexts() {
    const texts = {
      searchPlaceholder_template: i18n.t('qn.searchTemplate'),
      searchPlaceholder_assignment: i18n.t('qn.searchAssignment'),
      searchPlaceholder_report: i18n.t('qn.searchReport'),
      labelTemplates: i18n.t('qn.tabTemplates'),
      labelAssignments: i18n.t('qn.tabAssignments'),
      labelReports: i18n.t('qn.tabReports'),
      statTemplates: i18n.t('qn.statTemplates'),
      statPendingFill: i18n.t('qn.statPendingFill'),
      statPendingReview: i18n.t('qn.statPendingReview'),
      statActive: i18n.t('qn.statActive'),
      statCompleted: i18n.t('qn.statCompleted'),
      statTotalReports: i18n.t('qn.statTotalReports'),
      statTotalUsage: i18n.t('qn.statTotalUsage'),
      statTotalAssign: i18n.t('qn.statTotalAssign'),
      statSentParents: i18n.t('qn.statSentParents'),
      noDesc: i18n.t('qn.noDesc'),
      btnEdit: i18n.t('qn.btnEdit'),
      btnPush: i18n.t('qn.btnPush'),
      btnShare: i18n.t('qn.btnShare'),
      shareDefault: i18n.t('qn.shareDefault'),
      needSurveyFirst: i18n.t('qn.needSurveyFirst')
    };
    const tabs = [
      { key: 'templates', label: i18n.t('qn.tabTemplates') },
      { key: 'assignments', label: i18n.t('qn.tabAssignments') },
      { key: 'reports', label: i18n.t('qn.tabReports') }
    ];
    this.setData({ texts, tabs });
  },

  refreshDisplayTexts() {
    const templates = this.data.templates.map(t => ({
      ...t,
      descText: t.description || i18n.t('qn.noDesc'),
      questionsText: i18n.t('qn.questions', [(t.questions || []).length]),
      usedTimesText: i18n.t('qn.usedTimes', [t.usageCount || 0])
    }));
    const assignments = this.data.assignments.map(a => ({
      ...a,
      assignedByText: i18n.t('qn.assignedBy', [a.assignedByName]),
      completedAtTextLabel: a.completedAtText ? i18n.t('qn.completedAt', [a.completedAtText]) : ''
    }));
    const reports = this.data.reports.map(r => ({
      ...r,
      aiTeacherText: i18n.t('qn.aiTeacher', [r.aiTeacherName])
    }));
    this.setData({ templates, assignments, reports });
  },

  loadData() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    this.loadI18nTexts();

    // 三个 tab 的数据并行拉取
    Promise.all([
      api.listTemplates().catch(err => { console.error('[问卷页] 模板加载失败:', err); return []; }),
      api.listAssignments().catch(err => { console.error('[问卷页] 分配加载失败:', err); return []; }),
      api.listReports().catch(err => { console.error('[问卷页] 报告加载失败:', err); return []; })
    ]).then(([rawTemplates, rawAssignments, rawReports]) => {
      const templates = (rawTemplates || []).map(t => ({
        ...t,
        languageLabel: i18n.t('lang.' + t.language),
        languageColor: constants.LANGUAGES[t.language]?.color || '#6B7280',
        languageBg: constants.LANGUAGES[t.language]?.bg || 'rgba(107, 114, 128, 0.1)',
        statusLabel: i18n.t('templateStatus.' + t.status) !== ('templateStatus.' + t.status) ? i18n.t('templateStatus.' + t.status) : (constants.TEMPLATE_STATUS[t.status]?.label || t.status),
        statusColor: constants.TEMPLATE_STATUS[t.status]?.color || '#9CA3AF',
        statusBg: constants.TEMPLATE_STATUS[t.status]?.bg || 'rgba(156, 163, 175, 0.15)',
        descText: t.description || i18n.t('qn.noDesc'),
        questionsText: i18n.t('qn.questions', [(t.questions || []).length]),
        usedTimesText: i18n.t('qn.usedTimes', [t.usageCount || 0])
      }));

      const assignments = (rawAssignments || []).map(a => ({
        ...a,
        statusLabel: i18n.t('assignmentStatus.' + a.status) !== ('assignmentStatus.' + a.status) ? i18n.t('assignmentStatus.' + a.status) : (constants.ASSIGNMENT_STATUS[a.status]?.label || a.status),
        statusColor: constants.ASSIGNMENT_STATUS[a.status]?.color || '#9CA3AF',
        statusBg: constants.ASSIGNMENT_STATUS[a.status]?.bg || 'rgba(156, 163, 175, 0.15)',
        assignedAtText: util.formatDateShort(a.assignedAt),
        completedAtText: a.completedAt ? util.formatDateShort(a.completedAt) : '',
        phoneMasked: util.maskPhone(a.parentPhone),
        assignedByText: i18n.t('qn.assignedBy', [a.assignedByName]),
        completedAtTextLabel: a.completedAt ? i18n.t('qn.completedAt', [util.formatDateShort(a.completedAt)]) : ''
      }));

      const reports = (rawReports || []).map(r => ({
        ...r,
        languageLabel: i18n.t('lang.' + r.language),
        languageColor: constants.LANGUAGES[r.language]?.color || '#6B7280',
        languageBg: constants.LANGUAGES[r.language]?.bg || 'rgba(107, 114, 128, 0.1)',
        statusLabel: i18n.t('reportStatus.' + r.status) !== ('reportStatus.' + r.status) ? i18n.t('reportStatus.' + r.status) : (constants.REPORT_STATUS[r.status]?.label || r.status),
        statusColor: constants.REPORT_STATUS[r.status]?.color || '#9CA3AF',
        statusBg: constants.REPORT_STATUS[r.status]?.bg || 'rgba(156, 163, 175, 0.15)',
        levelColor: util.getScoreLevel(r.overallScore || 0).color,
        generatedAtText: util.formatDateShort(r.generatedAt || r.createdAt),
        aiTeacherText: i18n.t('qn.aiTeacher', [r.aiTeacherName]),
        topDimensions: (r.dimensions || []).slice(0, 4).map(d => ({
          ...d,
          percent: Math.round((d.score / (d.maxScore || 100)) * 100),
          levelColor: util.getScoreLevel(d.score, d.maxScore || 100).color
        }))
      }));

      const summary = {
        templates: templates.length,
        activeTemplates: templates.filter(t => t.status === 'active').length,
        totalUsage: templates.reduce((acc, t) => acc + (t.usageCount || 0), 0),
        pendingAssignments: assignments.filter(a => a.status === 'sent' || a.status === 'started').length,
        completedAssignments: assignments.filter(a => a.status === 'completed').length,
        totalAssignments: assignments.length,
        pendingReview: reports.filter(r => r.status === 'pending_review').length,
        totalReports: reports.length,
        sentReports: reports.filter(r => r.sentToParent).length
      };

      this.setData({ templates, assignments, reports, summary, loading: false });
    }).catch(err => {
      console.error('[问卷页] 加载失败:', err);
      this.setData({ loading: false });
      util.showToast(err.message || '加载失败');
    });
  },

  onTabChange(e) {
    this.setData({ tab: e.currentTarget.dataset.key });
  },

  onSearchChange(e) {
    this.setData({ search: e.detail.value });
  },

  onTemplateClick(e) {
    const template = e.currentTarget.dataset.template;
    if (template.status === 'draft') {
      wx.navigateTo({ url: `/pages/template-edit/template-edit?id=${template.id}` });
    } else {
      // 自定义模板可删除，内置模板不可删除
      const isCustom = template.isCustom === true;
      const itemList = isCustom
        ? [
            i18n.t('qn.tplAction1'),
            i18n.t('qn.tplAction2'),
            i18n.t('qn.tplAction3'),
            i18n.t('qn.tplAction4'),
            i18n.t('qn.tplAction5')
          ]
        : [
            i18n.t('qn.tplAction1'),
            i18n.t('qn.tplAction2'),
            i18n.t('qn.tplAction3'),
            i18n.t('qn.tplAction4')
          ];

      wx.showActionSheet({
        itemList,
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              wx.navigateTo({ url: `/pages/template-edit/template-edit?id=${template.id}&mode=view` });
              break;
            case 1:
              wx.navigateTo({ url: `/pages/survey-assign/survey-assign?templateId=${template.id}` });
              break;
            case 2:
              wx.navigateTo({ url: `/pages/template-edit/template-edit?id=${template.id}` });
              break;
            case 3:
              // 复制模板 → 由后端复制
              this._duplicateTemplate(template);
              break;
            case 4:
              // 删除模板（仅自定义模板）
              this._deleteTemplate(template);
              break;
          }
        }
      });
    }
  },

  // 复制模板（后端复制）
  _duplicateTemplate(template) {
    util.showLoading(i18n.t('common.loading'));
    api.duplicateTemplate(template.id)
      .then(() => {
        util.hideLoading();
        util.showToast(i18n.t('common.success'), 'success');
        this.loadData();
      })
      .catch(err => {
        util.hideLoading();
        console.error('[问卷页] 复制模板失败:', err);
        util.showToast(err.message || i18n.t('common.fail'));
      });
  },

  // 删除模板（后端删除）
  _deleteTemplate(template) {
    // 内置模板不可删除
    if (!template.isCustom) {
      util.showToast(i18n.t('qn.cannotDeleteBuiltin'));
      return;
    }

    wx.showModal({
      title: i18n.t('qn.deleteConfirmTitle'),
      content: i18n.t('qn.deleteConfirmContent'),
      confirmText: i18n.t('common.confirm'),
      cancelText: i18n.t('common.cancel'),
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return;
        util.showLoading(i18n.t('common.loading'));
        api.deleteTemplate(template.id)
          .then(() => {
            util.hideLoading();
            this.loadData();
            util.showToast(i18n.t('qn.deleteSuccess'), 'success');
          })
          .catch(err => {
            util.hideLoading();
            console.error('[问卷页] 删除模板失败:', err);
            util.showToast(err.message || i18n.t('common.fail'));
          });
      }
    });
  },

  onAssignmentClick(e) {
    const assignment = e.currentTarget.dataset.assignment;
    console.log('[Questionnaire] Assignment:', assignment.id);
    if (assignment.status === 'completed') {
      const matched = this.data.reports.find(
        r => r.customerId === assignment.customerId && r.templateId === assignment.templateId
      );
      if (matched) {
        wx.navigateTo({ url: `/pages/report-detail/report-detail?id=${matched.id}` });
      } else {
        wx.showModal({
          title: i18n.t('qn.generateTitle'),
          content: i18n.t('qn.generateContent'),
          confirmText: i18n.t('qn.generateConfirm'),
          success: (r) => {
            if (r.confirm) {
              util.showLoading(i18n.t('qn.analyzing'));
              setTimeout(() => {
                util.hideLoading();
                util.showToast(i18n.t('qn.reportGenerated'), 'success');
              }, 1500);
            }
          }
        });
      }
    } else if (assignment.status === 'pending') {
      util.showToast(i18n.t('qn.reminderSent'), 'success');
    } else {
      util.showToast(i18n.t('qn.waitParent'));
    }
  },

  onReportClick(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/report-detail/report-detail?id=${id}` });
  },

  // 分享给微信好友（点击「分享」按钮触发）
  onShareAppMessage(res) {
    // 从按钮的 data-id 获取报告
    let report = null;
    if (res && res.from === 'button' && res.target && res.target.dataset) {
      const id = res.target.dataset.id;
      report = this.data.reports.find(r => r.id === id);
    }

    if (report) {
      return {
        title: `${report.childName}的${report.templateName}评估报告 · ${report.overallScore}分`,
        path: `/pages/report-detail/report-detail?id=${report.id}`,
        imageUrl: ''
      };
    }

    return {
      title: i18n.t('qn.shareDefault'),
      path: '/pages/questionnaire/questionnaire'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: i18n.t('qn.shareDefault'),
      query: ''
    };
  },

  updateSummary() {
    const { reports, assignments, templates } = this.data;
    const summary = {
      templates: templates.length,
      activeTemplates: templates.filter(t => t.status === 'active').length,
      totalUsage: templates.reduce((acc, t) => acc + (t.usageCount || 0), 0),
      pendingAssignments: assignments.filter(a => a.status === 'sent' || a.status === 'started').length,
      completedAssignments: assignments.filter(a => a.status === 'completed').length,
      totalAssignments: assignments.length,
      pendingReview: reports.filter(r => r.status === 'pending_review').length,
      totalReports: reports.length,
      sentReports: reports.filter(r => r.sentToParent).length
    };
    this.setData({ summary });
  },

  onAssignTemplate() {
    wx.navigateTo({ url: '/pages/survey-assign/survey-assign' });
  },

  onFloatingClick() {
    if (this.data.tab === 'templates') {
      wx.navigateTo({ url: '/pages/template-edit/template-edit' });
    } else if (this.data.tab === 'assignments') {
      wx.navigateTo({ url: '/pages/survey-assign/survey-assign' });
    } else {
      util.showToast(i18n.t('qn.needSurveyFirst'));
    }
  },

  onPullDownRefresh() {
    this.loadData();
    setTimeout(() => wx.stopPullDownRefresh(), 800);
  }
});
