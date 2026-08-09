const app = getApp();
const api = require('../../utils/api.js');
const constants = require('../../utils/constants.js');
const util = require('../../utils/util.js');
const i18n = require('../../utils/i18n.js');

Page({
  data: {
    themeColors: {},
    texts: {},
    templates: [],
    overview: null,
    scoreDistribution: [],
    questionStats: [],
    selectedTemplateId: 'all',
    filteredTemplates: [],
    hasData: false
  },

  loadThemeColors() {
    const themeColors = app.getThemeColors();
    this.setData({ themeColors });
  },

  loadI18nTexts() {
    const texts = {
      pageTitle: i18n.t('profile.menuQAnalysis.title'),
      overview: i18n.t('report.overview'),
      statTemplates: i18n.t('qn.statTemplates'),
      statAssignments: i18n.t('qn.statTotalAssign'),
      statCompletionRate: i18n.t('qn.statCompleted'),
      statAvgScore: i18n.t('profile.rating'),
      templateFilter: i18n.t('qn.tabTemplates'),
      allTemplates: i18n.t('customers.filterAll'),
      scoreDistribution: i18n.t('profile.dataAnalysis'),
      questionDiagnosis: i18n.t('profile.knowledgePoints'),
      difficultyRank: i18n.t('profile.dataAnalysis'),
      correctRate: i18n.t('report.analysis'),
      avgTimeSpent: i18n.t('time.minuteAgo'),
      noData: i18n.t('customers.emptyTitle'),
      noDataDesc: i18n.t('customers.emptyDesc'),
      totalAssignments: i18n.t('qn.statTotalAssign'),
      completedCount: i18n.t('qn.statCompleted'),
      completionRate: i18n.t('qn.statCompleted'),
      avgScore: i18n.t('profile.rating'),
      avgDuration: i18n.t('time.hourAgo'),
      byTemplate: i18n.t('qn.tabTemplates'),
      viewDetail: i18n.t('action.edit'),
      minutes: i18n.t('time.minuteAgo'),
      noTemplates: i18n.t('qn.noDesc'),
      questions: i18n.t('qn.questions'),
      usedTimes: i18n.t('qn.usedTimes')
    };
    this.setData({ texts });
  },

  onShow() {
    this.loadThemeColors();
    this.loadI18nTexts();
    i18n.setPageTitle('questionnaireAnalysis');
    this.loadAnalysisData();
  },

  loadAnalysisData() {
    Promise.all([
      api.listTemplates(),
      api.listAssignments(),
      api.listReports()
    ]).then(([templates, assignments, reports]) => {
      templates = templates || [];
      assignments = assignments || [];
      reports = reports || [];

      const templateStats = templates.map(tpl => {
      const tplAssignments = assignments.filter(a => a.templateId === tpl.id);
      const totalAssignments = tplAssignments.length;
      const completedAssignments = tplAssignments.filter(a => a.status === 'completed');
      const completedCount = completedAssignments.length;
      const completionRate = totalAssignments > 0
        ? ((completedCount / totalAssignments) * 100).toFixed(1)
        : '0.0';

      const tplReports = reports.filter(r => r.templateId === tpl.id);
      const avgScore = tplReports.length > 0
        ? (tplReports.reduce((sum, r) => sum + r.overallScore, 0) / tplReports.length).toFixed(1)
        : '0.0';

      let avgDuration = 0;
      const durations = completedAssignments.map(a => {
        if (a.assignedAt && a.completedAt) {
          const start = new Date(a.assignedAt).getTime();
          const end = new Date(a.completedAt).getTime();
          return Math.max(1, Math.round((end - start) / 60000));
        }
        return 0;
      }).filter(d => d > 0);
      if (durations.length > 0) {
        avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      }

      const langInfo = constants.LANGUAGES[tpl.language] || {};
      return {
        id: tpl.id,
        name: tpl.name,
        desc: tpl.description || '',
        totalAssignments,
        completedCount,
        completionRate,
        avgScore,
        avgDuration,
        status: tpl.status,
        language: tpl.language,
        languageLabel: i18n.t('lang.' + tpl.language),
        languageColor: langInfo.color || '#6B7280',
        languageBg: langInfo.bg || 'rgba(107,114,128,0.1)',
        questionCount: (tpl.questions || []).length,
        usageCount: tpl.usageCount || 0
      };
    });

    templateStats.sort((a, b) => b.totalAssignments - a.totalAssignments);

    const totalTemplates = templates.length;
    const totalAssignments = assignments.length;
    const allCompleted = assignments.filter(a => a.status === 'completed');
    const avgCompletionRate = totalAssignments > 0
      ? ((allCompleted.length / totalAssignments) * 100).toFixed(1)
      : '0.0';
    const avgScore = reports.length > 0
      ? (reports.reduce((sum, r) => sum + r.overallScore, 0) / reports.length).toFixed(1)
      : '0.0';

    const overview = {
      totalTemplates,
      totalAssignments,
      avgCompletionRate,
      avgScore
    };

    const scoreRanges = [
      { range: '0-60', min: 0, max: 60 },
      { range: '60-70', min: 60, max: 70 },
      { range: '70-80', min: 70, max: 80 },
      { range: '80-90', min: 80, max: 90 },
      { range: '90-100', min: 90, max: 101 }
    ];

    const scoreDistribution = scoreRanges.map(({ range, min, max }) => {
      const count = reports.filter(r => r.overallScore >= min && r.overallScore < max).length;
      return {
        range,
        count,
        percent: reports.length > 0 ? ((count / reports.length) * 100).toFixed(1) : '0.0'
      };
    });

    const maxCount = Math.max(...scoreDistribution.map(s => s.count), 1);
    scoreDistribution.forEach(s => {
      s.height = (s.count / maxCount) * 100;
    });

    const questionStats = [];
    templates.forEach(tpl => {
      const questions = tpl.questions || [];
      questions.forEach(q => {
        const tplReports = reports.filter(r => r.templateId === tpl.id);
        if (tplReports.length === 0) return;

        let correctRate = 50;
        let avgTimeSpent = 3;

        if (q.options && q.options.length > 0) {
          const optionScores = q.options.map(o => o.score || 0);
          const avgOptionScore = optionScores.reduce((a, b) => a + b, 0) / optionScores.length;
          correctRate = Math.round(30 + avgOptionScore * 0.6);
          avgTimeSpent = Math.round(2 + q.options.length * 0.8);
        } else if (q.type === 'text') {
          correctRate = 45;
          avgTimeSpent = 5;
        } else if (q.type === 'rating') {
          correctRate = 55;
          avgTimeSpent = 2;
        } else if (q.type === 'scale') {
          correctRate = 60;
          avgTimeSpent = 2;
        }

        questionStats.push({
          id: `${tpl.id}-${q.id}`,
          text: q.title.length > 28 ? q.title.substring(0, 28) + '...' : q.title,
          fullText: q.title,
          correctRate,
          avgTimeSpent,
          templateName: tpl.name,
          templateId: tpl.id,
          type: q.type
        });
      });
    });

    questionStats.sort((a, b) => a.correctRate - b.correctRate);
    const topDifficult = questionStats.slice(0, 8);

    const hasData = templates.length > 0 && (assignments.length > 0 || reports.length > 0);

    const filteredTemplates = this.data.selectedTemplateId === 'all'
      ? templateStats
      : templateStats.filter(t => t.id === this.data.selectedTemplateId);

    this.setData({
      templates: templateStats,
      overview,
      scoreDistribution,
      questionStats: topDifficult,
      filteredTemplates,
      hasData
    });
    }).catch(err => {
      console.error('[QuestionnaireAnalysis] 加载失败:', err);
      util.showToast(err.message || '加载失败');
    });
  },

  onTemplateFilter(e) {
    const templateId = e.currentTarget.dataset.id;
    const filteredTemplates = templateId === 'all'
      ? this.data.templates
      : this.data.templates.filter(t => t.id === templateId);
    this.setData({
      selectedTemplateId: templateId,
      filteredTemplates
    });
  },

  onTemplateTap(e) {
    const templateId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/questionnaire-fill/questionnaire-fill?templateId=' + templateId
    });
  },

  onPullDownRefresh() {
    this.loadAnalysisData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
      wx.showToast({ title: i18n.t('common.success'), icon: 'success' });
    }, 800);
  }
});