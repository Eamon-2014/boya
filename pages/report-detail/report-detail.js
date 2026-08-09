// pages/report-detail/report-detail.js
const app = getApp();
const util = require('../../utils/util.js');
const constants = require('../../utils/constants.js');
const i18n = require('../../utils/i18n.js');
const api = require('../../utils/api.js');

Page({
  data: {
    themeColors: {},
    texts: {},
    report: null,
    activeSection: 'overview',
    sections: [
      { key: 'overview', label: '概览' },
      { key: 'dimensions', label: '能力分析' },
      { key: 'suggestions', label: '建议方案' }
    ],
    radarPoints: []
  },

  loadI18nTexts() {
    const texts = {
      title: i18n.t('report.title'),
      overview: i18n.t('report.overview'),
      analysis: i18n.t('report.analysis'),
      suggestions: i18n.t('report.suggestions'),
      radar: i18n.t('report.radar'),
      strengths: i18n.t('report.strengths'),
      weaknesses: i18n.t('report.weaknesses'),
      dimensions: i18n.t('report.dimensions'),
      personalSuggestions: i18n.t('report.personalSuggestions'),
      studyPlan: i18n.t('report.studyPlan'),
      share: i18n.t('report.share'),
      delete: i18n.t('report.delete'),
      deleteConfirmTitle: i18n.t('report.deleteConfirmTitle'),
      deleteConfirmContent: i18n.t('report.deleteConfirmContent'),
      deleteSuccess: i18n.t('report.deleteSuccess'),
      commonShare: i18n.t('common.share'),
      commonConfirm: i18n.t('common.confirm'),
      commonCancel: i18n.t('common.cancel'),
      notFound: i18n.t('common.fail'),
      scoreUnit: i18n.t('report.scoreUnit'),
      generateTime: i18n.t('report.generateTime'),
      aiTeacher: i18n.t('report.aiTeacher'),
      planFocus: i18n.t('report.planFocus')
    };
    this.setData({
      texts,
      sections: [
        { key: 'overview', label: texts.overview },
        { key: 'dimensions', label: texts.analysis },
        { key: 'suggestions', label: texts.suggestions }
      ]
    });
  },

  onLoad(options) {
    this.loadI18nTexts();
    const id = options.id;
    this.loadReport(id);
  },

  loadThemeColors() {
    const themeColors = app.getThemeColors();
    this.setData({ themeColors });
  },

  onShow() {
    this.loadThemeColors();
    this.loadI18nTexts();
    // 如果正在删除中，不要重新加载报告（避免删除后立即触发 loadReport 找不到报告）
    if (this._deleting) {
      console.log('[报告详情 onShow] 正在删除中，跳过 loadReport');
      return;
    }
    if (this.data.report && this.data.report.id) {
      this.loadReport(this.data.report.id);
    }
  },

  loadReport(id) {
    api.getReport(id).then(raw => {
      if (!raw) {
        wx.showToast({ title: i18n.t('common.fail'), icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1000);
        return;
      }

      const processed = {
        ...raw,
        languageLabel: i18n.t('lang.' + raw.language),
        levelColor: util.getScoreLevel(raw.overallScore).color,
        generatedAtText: util.formatTime(raw.generatedAt || raw.createdAt),
        dimensions: (raw.dimensions || []).map(d => ({
          ...d,
          percent: Math.round((d.score / d.maxScore) * 100),
          levelColor: util.getScoreLevel(d.score, d.maxScore).color
        }))
      };

      const radarPoints = this.calcRadarPoints(processed.dimensions);

      this.setData({
        report: processed,
        radarPoints
      });

      wx.setNavigationBarTitle({ title: `${raw.childName}${i18n.t('report.title')}` });
    }).catch(err => {
      console.error('[报告详情] 加载失败:', err);
      wx.showToast({ title: err.message || i18n.t('common.fail'), icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
    });
  },

  calcRadarPoints(dimensions) {
    const cx = 150, cy = 150;
    const maxR = 100;
    const count = dimensions.length;
    if (count === 0) return [];

    return dimensions.map((d, i) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const r = (d.score / d.maxScore) * maxR;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        labelX: cx + (maxR + 20) * Math.cos(angle),
        labelY: cy + (maxR + 20) * Math.sin(angle)
      };
    });
  },

  switchSection(e) {
    this.setData({ activeSection: e.currentTarget.dataset.section });
  },

  // 分享给微信好友
  onShareAppMessage() {
    const { report } = this.data;
    if (!report) {
      return {
        title: i18n.t('report.title'),
        path: '/pages/questionnaire/questionnaire'
      };
    }
    return {
      title: `${report.childName}${report.templateName}${i18n.t('report.title')} · ${report.overallScore}${this.data.texts.scoreUnit || i18n.t('report.scoreUnit')}`,
      path: `/pages/report-detail/report-detail?id=${report.id}`,
      imageUrl: ''
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { report } = this.data;
    if (!report) {
      return { title: i18n.t('report.title') };
    }
    return {
      title: `${report.childName}${i18n.t('report.title')} · ${report.overallScore}${this.data.texts.scoreUnit || i18n.t('report.scoreUnit')}`,
      query: `id=${report.id}`
    };
  },

  // 删除报告
  onDeleteReport() {
    const { report } = this.data;
    if (!report) {
      console.log('[删除报告] report 为空，无法删除');
      return;
    }
    if (!report.id) {
      console.log('[删除报告] report.id 为空，无法删除');
      wx.showToast({ title: '删除失败：报告ID为空', icon: 'none' });
      return;
    }

    console.log('[删除报告] 准备删除报告，ID:', report.id);

    wx.showModal({
      title: this.data.texts.deleteConfirmTitle || '删除报告',
      content: (this.data.texts.deleteConfirmContent || '确定要删除这份报告吗？此操作不可恢复。'),
      confirmText: this.data.texts.commonConfirm || '确定',
      cancelText: this.data.texts.commonCancel || '取消',
      confirmColor: '#EF4444',
      success: (res) => {
        console.log('[删除报告] showModal 结果:', res);
        if (!res.confirm) {
          console.log('[删除报告] 用户取消删除');
          return;
        }
        this._doDeleteReport(report.id);
      },
      fail: (err) => {
        console.log('[删除报告] showModal 失败:', err);
      }
    });
  },

  _doDeleteReport(reportId) {
    if (!reportId) {
      wx.showToast({ title: '删除失败：报告ID为空', icon: 'none' });
      return;
    }

    // 设置删除标志，防止 onShow 重新加载报告
    this._deleting = true;
    console.log('[删除报告] 开始删除，ID:', reportId);

    api.deleteReport(reportId).then(() => {
      console.log('[删除报告] 删除成功');
      wx.showToast({
        title: this.data.texts.deleteSuccess || '删除成功',
        icon: 'success'
      });
      setTimeout(() => wx.navigateBack(), 1000);
    }).catch(err => {
      console.error('[删除报告] 删除失败:', err);
      this._deleting = false;
      wx.showToast({ title: err.message || '删除失败', icon: 'none' });
    });
  }
});
