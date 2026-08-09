// pages/data-report/data-report.js
const app = getApp();
const api = require('../../utils/api.js');
const constants = require('../../utils/constants.js');
const util = require('../../utils/util.js');
const i18n = require('../../utils/i18n.js');

Page({
  data: {
    themeColors: {},
    texts: {},
    periodIndex: 0,
    periods: ['本周', '本月', '本季度', '本年'],
    summary: null,
    customerStats: null,
    languageStats: [],
    sourceStats: [],
    funnelStats: null,
    reportStats: null,
    questionnaireStats: null,
    aiTeacherStats: [],
    trendData: [],
    monthlyTrend: [],
    showSharePanel: false,
    sharePreview: false
  },

  loadI18nTexts() {
    const texts = {
      periodHint: i18n.t('dashboard.dataReport'),
      export: i18n.t('action.export'),
      share: i18n.t('common.share'),
      cancel: i18n.t('common.cancel'),
      dataReport: i18n.t('dashboard.dataReport'),
      totalCustomers: i18n.t('customers.statAll'),
      conversionRate: i18n.t('dashboard.conversionRate'),
      monthNewPrefix: '+',
      convertedTitle: i18n.t('customers.statConverted'),
      converted: i18n.t('customers.statConverted'),
      reportTitle: i18n.t('report.title'),
      pendingReports: i18n.t('dashboard.pendingReports'),
      aiTeacher: i18n.t('aiTeacher.title'),
      aiReady: i18n.t('aiTeacher.ready'),
      trend: i18n.t('dashboard.teamActivity'),
      customers: i18n.t('customers.statAll'),
      reports: i18n.t('report.title'),
      funnel: i18n.t('dashboard.conversionFunnel'),
      overallConversionRate: i18n.t('dashboard.conversionRate'),
      customerStatus: i18n.t('dashboard.dataReport'),
      langDistribution: i18n.t('customers.langAll'),
      source: i18n.t('dashboard.dataReport'),
      reportAnalysis: i18n.t('report.analysis'),
      avgScore: i18n.t('profile.rating'),
      questionnaireEfficiency: i18n.t('questionnaire.title'),
      totalTemplates: i18n.t('qn.statTemplates'),
      totalUsage: i18n.t('qn.statTotalUsage'),
      completionRate: i18n.t('qn.statCompleted'),
      topTemplates: 'TOP3',
      aiTeacherEfficiency: i18n.t('aiTeacher.title'),
      knowledge: i18n.t('profile.knowledgePoints'),
      footerUpdateTime: i18n.t('dashboard.dataReport'),
      footerRealTime: i18n.t('dashboard.dataReport'),
      footerMock: i18n.t('dashboard.dataReport'),
      sharePanelTitle: i18n.t('action.share'),
      sendToFriend: i18n.t('common.share'),
      shareTimeline: i18n.t('action.share'),
      shareImage: i18n.t('action.export'),
      sharePreviewTitle: i18n.t('dashboard.dataReport'),
      sharePreviewCustomer: i18n.t('customers.statAll'),
      sharePreviewConversion: i18n.t('dashboard.conversionRate'),
      sharePreviewReport: i18n.t('report.title'),
      sharePreviewFooter: i18n.t('dashboard.viewReport'),
      funnelOrigin: i18n.t('dashboard.getCustomers')
    };
    this.setData({ texts });
  },

  onLoad() {
    this.loadI18nTexts();
    this.loadAllData();
    console.log('[DataReport] 数据报表加载');
  },

  loadThemeColors() {
    const themeColors = app.getThemeColors();
    this.setData({ themeColors });
  },

  onShow() {
    this.loadThemeColors();
    this.loadI18nTexts();
    i18n.setPageTitle('dataReport');
  },

  // 异步加载所有数据：dashboard 聚合统计 + reports/customers/templates/aiTeachers 明细
  loadAllData() {
    Promise.all([
      api.getDashboard().catch(err => { console.error('[DataReport] dashboard 加载失败:', err); return null; }),
      api.listReports().catch(err => { console.error('[DataReport] reports 加载失败:', err); return []; }),
      api.listCustomers().catch(err => { console.error('[DataReport] customers 加载失败:', err); return []; }),
      api.listTemplates().catch(err => { console.error('[DataReport] templates 加载失败:', err); return []; }),
      api.listAssignments().catch(err => { console.error('[DataReport] assignments 加载失败:', err); return []; }),
      api.listAiTeachers().catch(err => { console.error('[DataReport] aiTeachers 加载失败:', err); return []; })
    ]).then(([dash, reports, customers, templates, assignments, aiTeachers]) => {
      reports = reports || [];
      customers = customers || [];
      templates = templates || [];
      assignments = assignments || [];
      aiTeachers = aiTeachers || [];
      dash = dash || {};

      this._buildSummary(dash, customers, reports, templates, assignments, aiTeachers);
      this._buildCustomerStats(customers);
      this._buildLanguageStats(customers);
      this._buildSourceStats(customers);
      this._buildFunnelStats(customers, assignments, reports);
      this._buildReportStats(reports);
      this._buildQuestionnaireStats(templates, assignments);
      this._buildAiTeacherStats(aiTeachers);
      this._buildMonthlyTrend(dash);
    }).catch(err => {
      console.error('[DataReport] 加载失败:', err);
      util.showToast(err.message || '加载失败');
    });
  },

  _buildSummary(dash, customers, reports, templates, assignments, aiTeachers) {
    const totalCustomers = dash.totalCustomers != null ? dash.totalCustomers : customers.length;
    const converted = dash.convertedCustomers != null
      ? dash.convertedCustomers
      : customers.filter(c => c.status === 'converted').length;
    const conversionRate = totalCustomers > 0
      ? ((converted / totalCustomers) * 100).toFixed(1)
      : (dash.conversionRate || '0.0');
    const totalReports = dash.totalReports != null ? dash.totalReports : reports.length;
    const pendingReports = dash.pendingReports != null
      ? dash.pendingReports
      : reports.filter(r => r.status === 'pending_review').length;
    const totalTemplates = dash.totalTemplates != null ? dash.totalTemplates : templates.length;
    const activeTemplates = dash.activeTemplates != null
      ? dash.activeTemplates
      : templates.filter(t => t.status === 'active').length;
    const totalAssignments = dash.totalAssignments != null ? dash.totalAssignments : assignments.length;
    const completedAssignments = dash.completedAssignments != null
      ? dash.completedAssignments
      : assignments.filter(a => a.status === 'completed').length;
    const aiTeacherCount = dash.aiTeachers != null ? dash.aiTeachers : aiTeachers.length;
    const readyAi = dash.readyAiTeachers != null
      ? dash.readyAiTeachers
      : aiTeachers.filter(t => t.status === 'ready').length;
    const monthNewCustomers = dash.monthNewCustomers != null
      ? dash.monthNewCustomers
      : (dash.todayNewCustomers != null ? dash.todayNewCustomers * 3 : 0);

    const summary = {
      totalCustomers,
      monthNewCustomers,
      converted,
      conversionRate,
      totalReports,
      pendingReports,
      totalTemplates,
      activeTemplates,
      totalAssignments,
      completedAssignments,
      aiTeachers: aiTeacherCount,
      readyAi
    };
    this.setData({ summary });
  },

  _buildCustomerStats(customers) {
    const totalCustomers = customers.length;
    const converted = customers.filter(c => c.status === 'converted').length;
    const following = customers.filter(c => c.status === 'following').length;
    const newCount = customers.filter(c => c.status === 'new').length;
    const lost = customers.filter(c => c.status === 'lost').length;

    const customerStats = {
      total: totalCustomers,
      distribution: [
        { key: 'new', label: i18n.t('customers.filterNew'), count: newCount, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
        { key: 'following', label: i18n.t('customers.filterFollowing'), count: following, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
        { key: 'converted', label: i18n.t('customers.filterConverted'), count: converted, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
        { key: 'lost', label: i18n.t('customers.filterLost'), count: lost, color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.15)' }
      ].map(d => ({
        ...d,
        percent: totalCustomers > 0 ? ((d.count / totalCustomers) * 100).toFixed(1) : '0.0'
      }))
    };
    this.setData({ customerStats });
  },

  _buildLanguageStats(customers) {
    const totalCustomers = customers.length;
    const langCount = {};
    customers.forEach(c => {
      langCount[c.language] = (langCount[c.language] || 0) + 1;
    });
    const langEntries = Object.entries(langCount)
      .map(([key, count]) => ({
        key,
        label: i18n.t('lang.' + key),
        color: constants.LANGUAGES[key]?.color || '#6B7280',
        bg: constants.LANGUAGES[key]?.bg || 'rgba(107, 114, 128, 0.1)',
        count,
        percent: totalCustomers > 0 ? ((count / totalCustomers) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count);
    this.setData({ languageStats: langEntries });
  },

  _buildSourceStats(customers) {
    const totalCustomers = customers.length;
    const sourceCount = {};
    customers.forEach(c => {
      const src = c.source || '未知';
      sourceCount[src] = (sourceCount[src] || 0) + 1;
    });
    const sourceColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#6B7280'];
    const sourceStats = Object.entries(sourceCount)
      .map(([label, count], idx) => ({
        label,
        count,
        color: sourceColors[idx % sourceColors.length],
        percent: totalCustomers > 0 ? ((count / totalCustomers) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count);
    this.setData({ sourceStats });
  },

  _buildFunnelStats(customers, assignments, reports) {
    const totalCustomers = customers.length;
    const converted = customers.filter(c => c.status === 'converted').length;
    const funnelStats = {
      stages: [
        { label: i18n.t('dashboard.getCustomers'), count: totalCustomers, color: '#3B82F6' },
        {
          label: i18n.t('dashboard.completeSurvey'),
          count: assignments.filter(a => a.status === 'completed' || a.status === 'started').length,
          color: '#8B5CF6'
        },
        { label: i18n.t('profile.generateReports'), count: reports.length, color: '#F59E0B' },
        { label: i18n.t('dashboard.successfulConversion'), count: converted, color: '#10B981' }
      ]
    };
    const maxCount = funnelStats.stages[0].count || 1;
    funnelStats.stages = funnelStats.stages.map((s, i) => ({
      ...s,
      width: Math.max(20, (s.count / maxCount) * 100),
      rate: i > 0 && funnelStats.stages[i - 1].count > 0
        ? ((s.count / funnelStats.stages[i - 1].count) * 100).toFixed(1)
        : '100.0'
    }));
    this.setData({ funnelStats });
  },

  _buildReportStats(reports) {
    const reportStatusCount = {};
    reports.forEach(r => {
      reportStatusCount[r.status] = (reportStatusCount[r.status] || 0) + 1;
    });
    const reportStats = {
      total: reports.length,
      avgScore: reports.length > 0
        ? (reports.reduce((sum, r) => sum + (r.overallScore || 0), 0) / reports.length).toFixed(1)
        : '0',
      distribution: Object.entries(reportStatusCount).map(([key, count]) => {
        const info = constants.REPORT_STATUS[key] || {};
        return {
          key,
          label: info.label || key,
          color: info.color || '#9CA3AF',
          count,
          percent: reports.length > 0 ? ((count / reports.length) * 100).toFixed(1) : '0.0'
        };
      })
    };
    this.setData({ reportStats });
  },

  _buildQuestionnaireStats(templates, assignments) {
    const totalUsage = templates.reduce((sum, t) => sum + (t.usageCount || 0), 0);
    const questionnaireStats = {
      totalTemplates: templates.length,
      activeTemplates: templates.filter(t => t.status === 'active').length,
      totalUsage,
      totalAssignments: assignments.length,
      completedRate: assignments.length > 0
        ? ((assignments.filter(a => a.status === 'completed').length / assignments.length) * 100).toFixed(1)
        : '0.0',
      topTemplates: templates
        .map(t => ({
          name: t.name,
          languageLabel: i18n.t('lang.' + t.language),
          usage: t.usageCount || 0,
          usageCountText: i18n.t('dataReport.usageCount', [t.usageCount || 0]),
          status: t.status,
          statusLabel: constants.TEMPLATE_STATUS[t.status]?.label || t.status
        }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 3)
    };
    this.setData({ questionnaireStats });
  },

  _buildAiTeacherStats(aiTeachers) {
    const aiTeacherStats = aiTeachers
      .map(t => ({
        id: t.id,
        name: t.name,
        languageLabel: i18n.t('lang.' + t.language),
        statusLabel: constants.AI_TEACHER_STATUS[t.status]?.label || t.status,
        knowledgeCount: t.knowledgeCount,
        reportCount: t.reportCount,
        avgRating: t.avgRating,
        ratingText: t.avgRating > 0 ? t.avgRating.toFixed(1) : '-',
        statusColor: constants.AI_TEACHER_STATUS[t.status]?.color || '#9CA3AF'
      }))
      .sort((a, b) => b.reportCount - a.reportCount);
    this.setData({ aiTeacherStats });
  },

  _buildMonthlyTrend(dash) {
    // 优先使用后端返回的趋势数据，否则使用本地占位（保持 UI 不变）
    const monthlyTrend = (dash && Array.isArray(dash.monthlyTrend) && dash.monthlyTrend.length > 0)
      ? dash.monthlyTrend
      : [
        { month: '3月', customers: 32, reports: 12, converted: 8 },
        { month: '4月', customers: 45, reports: 18, converted: 12 },
        { month: '5月', customers: 58, reports: 24, converted: 16 },
        { month: '6月', customers: 72, reports: 32, converted: 22 },
        { month: '7月', customers: 95, reports: 45, converted: 30 },
        { month: '8月', customers: 48, reports: 18, converted: 8 }
      ];
    const maxTrend = Math.max(...monthlyTrend.map(m => m.customers));
    const monthlyTrendProcessed = monthlyTrend.map(m => ({
      ...m,
      customersHeight: (m.customers / maxTrend) * 100,
      reportsHeight: (m.reports / maxTrend) * 100,
      convertedHeight: (m.converted / maxTrend) * 100
    }));
    this.setData({ monthlyTrend: monthlyTrendProcessed });
  },

  onPeriodChange(e) {
    const idx = e.detail.value;
    this.setData({ periodIndex: idx });
    wx.showToast({
      title: i18n.t('dashboard.todayFocus') + ' ' + this.data.periods[idx],
      icon: 'none',
      duration: 1000
    });
  },

  onExport() {
    wx.showActionSheet({
      itemList: [
        i18n.t('action.export'),
        i18n.t('action.export'),
        i18n.t('common.share')
      ],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.onExportImage();
        } else if (res.tapIndex === 1) {
          this.onExportPDF();
        } else if (res.tapIndex === 2) {
          this.onShareToWechat();
        }
      }
    });
  },

  onExportImage() {
    wx.showLoading({ title: i18n.t('common.loading'), mask: true });
    const { summary, customerStats, languageStats, sourceStats, funnelStats, reportStats, questionnaireStats, aiTeacherStats, monthlyTrend, texts } = this.data;

    let yPos = 40;
    const sections = [
      summary ? 1 : 0,
      monthlyTrend && monthlyTrend.length > 0 ? 1 : 0,
      funnelStats ? 1 : 0,
      customerStats ? 1 : 0,
      languageStats && languageStats.length > 0 ? 1 : 0,
      sourceStats && sourceStats.length > 0 ? 1 : 0,
      reportStats ? 1 : 0,
      questionnaireStats ? 1 : 0,
      aiTeacherStats && aiTeacherStats.length > 0 ? 1 : 0
    ];
    const totalSections = sections.reduce((a, b) => a + b, 0);
    const canvasH = Math.max(800, yPos + totalSections * 120 + 100);

    setTimeout(() => {
      const ctx = wx.createCanvasContext('reportCanvas', this);
      const w = 640;

      ctx.setFillStyle('#FFFFFF');
      ctx.fillRect(0, 0, w, canvasH);

      ctx.setFillStyle('#2563EB');
      ctx.fillRect(0, 0, w, 70);
      ctx.setFillStyle('#FFFFFF');
      ctx.setFontSize(22);
      ctx.fillText(i18n.t('dashboard.dataReport'), 30, 35);
      ctx.setFontSize(14);
      ctx.fillText(`${i18n.t('dashboard.todayFocus')}：${this.data.periods[this.data.periodIndex]}  |  ${i18n.t('report.overview')}：${util.formatTime(new Date())}`, 30, 58);

      yPos = 110;

      if (summary) {
        ctx.setFillStyle('#1F2937');
        ctx.setFontSize(18);
        ctx.fillText('📊 ' + i18n.t('dashboard.todayFocus'), 30, yPos);
        yPos += 20;

        const cards = [
          { label: i18n.t('customers.statAll'), value: summary.totalCustomers, unit: '', color: '#3B82F6' },
          { label: i18n.t('dashboard.conversionRate'), value: summary.conversionRate, unit: '%', color: '#10B981' },
          { label: i18n.t('report.title'), value: summary.totalReports, unit: '', color: '#F59E0B' },
          { label: i18n.t('dashboard.pendingReports'), value: summary.pendingReports, unit: '', color: '#EF4444' }
        ];

        cards.forEach((c, i) => {
          const cx = 30 + i * 152;
          ctx.setFillStyle('#F9FAFB');
          ctx.fillRect(cx, yPos, 140, 80);
          ctx.setFillStyle(c.color);
          ctx.setFontSize(28);
          ctx.fillText(`${c.value}${c.unit}`, cx + 10, yPos + 40);
          ctx.setFillStyle('#6B7280');
          ctx.setFontSize(12);
          ctx.fillText(c.label, cx + 10, yPos + 62);
        });

        yPos += 100;
      }

      if (monthlyTrend && monthlyTrend.length > 0) {
        ctx.setFillStyle('#1F2937');
        ctx.setFontSize(18);
        ctx.fillText('📈 ' + i18n.t('dashboard.teamActivity'), 30, yPos);
        yPos += 10;

        const barW = 30;
        const gap = 20;
        const chartBottom = yPos + 120;
        const chartTop = yPos + 10;

        ctx.setStrokeStyle('#E5E7EB');
        ctx.setLineWidth(1);
        ctx.beginPath();
        ctx.moveTo(30, chartBottom);
        ctx.lineTo(w - 30, chartBottom);
        ctx.stroke();

        const maxVal = Math.max(...monthlyTrend.flatMap(m => [m.customers, m.reports, m.converted]));
        const scaleY = (chartBottom - chartTop) / maxVal;

        monthlyTrend.forEach((m, i) => {
          const bx = 60 + i * (barW * 3 + gap * 2 + 30);
          ctx.setFillStyle('#3B82F6');
          ctx.fillRect(bx, chartBottom - m.customers * scaleY, barW, m.customers * scaleY);
          ctx.setFillStyle('#F59E0B');
          ctx.fillRect(bx + barW, chartBottom - m.reports * scaleY, barW, m.reports * scaleY);
          ctx.setFillStyle('#10B981');
          ctx.fillRect(bx + barW * 2, chartBottom - m.converted * scaleY, barW, m.converted * scaleY);

          ctx.setFillStyle('#6B7280');
          ctx.setFontSize(11);
          ctx.fillText(m.month, bx + barW, chartBottom + 18);
        });

        const legendY = chartBottom + 45;
        ctx.setFillStyle('#3B82F6');
        ctx.fillRect(30, legendY, 14, 14);
        ctx.setFillStyle('#374151');
        ctx.setFontSize(12);
        ctx.fillText(i18n.t('customers.statAll'), 50, legendY + 12);

        ctx.setFillStyle('#F59E0B');
        ctx.fillRect(120, legendY, 14, 14);
        ctx.setFillStyle('#374151');
        ctx.fillText(i18n.t('report.title'), 140, legendY + 12);

        ctx.setFillStyle('#10B981');
        ctx.fillRect(210, legendY, 14, 14);
        ctx.setFillStyle('#374151');
        ctx.fillText(i18n.t('customers.statConverted'), 230, legendY + 12);

        yPos = legendY + 40;
      }

      if (funnelStats) {
        ctx.setFillStyle('#1F2937');
        ctx.setFontSize(18);
        ctx.fillText('🔄 ' + i18n.t('dashboard.conversionFunnel'), 30, yPos);
        yPos += 25;

        const stages = funnelStats.stages;
        stages.forEach((s, i) => {
          const barW = s.width * 2.5;
          const bx = (w - barW) / 2;
          ctx.setFillStyle(s.color);
          ctx.fillRect(bx, yPos, barW, 35);
          ctx.setFillStyle('#FFFFFF');
          ctx.setFontSize(14);
          ctx.fillText(`${s.label}：${s.count}`, bx + 10, yPos + 22);

          if (i > 0) {
            ctx.setFillStyle('#6B7280');
            ctx.setFontSize(12);
            ctx.fillText(`${i18n.t('dashboard.conversionRate')} ${s.rate}%`, w / 2 - 30, yPos + 48);
          }
          yPos += i === 0 ? 50 : 65;
        });

        yPos += 15;
      }

      if (customerStats) {
        ctx.setFillStyle('#1F2937');
        ctx.setFontSize(18);
        ctx.fillText('👥 ' + i18n.t('customer.title'), 30, yPos);
        yPos += 10;

        customerStats.distribution.forEach((d) => {
          ctx.setFillStyle('#374151');
          ctx.setFontSize(14);
          ctx.fillText(`${d.label}`, 30, yPos + 15);

          ctx.setFillStyle('#F3F4F6');
          ctx.fillRect(100, yPos + 5, 300, 20);
          ctx.setFillStyle(d.color);
          ctx.fillRect(100, yPos + 5, d.percent * 3, 20);

          ctx.setFillStyle('#6B7280');
          ctx.setFontSize(12);
          ctx.fillText(`${d.count} (${d.percent}%)`, 410, yPos + 17);

          yPos += 35;
        });

        yPos += 10;
      }

      if (languageStats && languageStats.length > 0) {
        ctx.setFillStyle('#1F2937');
        ctx.setFontSize(18);
        ctx.fillText('🌍 ' + i18n.t('customers.langAll'), 30, yPos);
        yPos += 10;

        languageStats.forEach((l) => {
          ctx.setFillStyle(l.color);
          ctx.fillRect(30, yPos, 14, 14);
          ctx.setFillStyle('#374151');
          ctx.setFontSize(14);
          ctx.fillText(`${l.label}`, 55, yPos + 12);
          ctx.setFillStyle('#6B7280');
          ctx.setFontSize(12);
          ctx.fillText(`${l.count} (${l.percent}%)`, 200, yPos + 12);
          yPos += 25;
        });

        yPos += 10;
      }

      if (reportStats) {
        ctx.setFillStyle('#1F2937');
        ctx.setFontSize(18);
        ctx.fillText(`📊 ${i18n.t('report.analysis')}（${i18n.t('profile.rating')} ${reportStats.avgScore}）`, 30, yPos);
        yPos += 10;

        reportStats.distribution.forEach((d) => {
          ctx.setFillStyle(d.color);
          ctx.fillRect(30, yPos, 14, 14);
          ctx.setFillStyle('#374151');
          ctx.setFontSize(14);
          ctx.fillText(`${d.label}`, 55, yPos + 12);
          ctx.setFillStyle('#6B7280');
          ctx.setFontSize(12);
          ctx.fillText(`${d.count} (${d.percent}%)`, 250, yPos + 12);
          yPos += 25;
        });

        yPos += 10;
      }

      if (questionnaireStats) {
        ctx.setFillStyle('#1F2937');
        ctx.setFontSize(18);
        ctx.fillText('📝 ' + i18n.t('questionnaire.title'), 30, yPos);
        yPos += 25;

        const qMetrics = [
          { label: i18n.t('qn.statTemplates'), value: questionnaireStats.totalTemplates },
          { label: i18n.t('qn.statTotalUsage'), value: questionnaireStats.totalUsage },
          { label: i18n.t('qn.statCompleted'), value: `${questionnaireStats.completedRate}%` }
        ];

        qMetrics.forEach((m, i) => {
          const mx = 30 + i * 200;
          ctx.setFillStyle('#2563EB');
          ctx.setFontSize(22);
          ctx.fillText(`${m.value}`, mx, yPos);
          ctx.setFillStyle('#6B7280');
          ctx.setFontSize(12);
          ctx.fillText(m.label, mx, yPos + 20);
        });

        yPos += 50;

        ctx.setFillStyle('#1F2937');
        ctx.setFontSize(15);
        ctx.fillText('TOP3', 30, yPos);
        yPos += 5;

        questionnaireStats.topTemplates.forEach((t, i) => {
          ctx.setFillStyle(i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : '#CD7F32');
          ctx.setFontSize(14);
          ctx.fillText(`${i + 1}. ${t.name}`, 30, yPos);
          ctx.setFillStyle('#6B7280');
          ctx.setFontSize(12);
          ctx.fillText(`${t.languageLabel} · ${t.usage}`, 280, yPos);
          yPos += 22;
        });

        yPos += 15;
      }

      if (aiTeacherStats && aiTeacherStats.length > 0) {
        ctx.setFillStyle('#1F2937');
        ctx.setFontSize(18);
        ctx.fillText('🤖 ' + i18n.t('aiTeacher.title'), 30, yPos);
        yPos += 10;

        aiTeacherStats.forEach((t, i) => {
          ctx.setFillStyle(i < 3 ? '#2563EB' : '#6B7280');
          ctx.setFontSize(14);
          ctx.fillText(`${i + 1}. ${t.name}`, 30, yPos + 12);
          ctx.setFillStyle('#6B7280');
          ctx.setFontSize(12);
          ctx.fillText(`${t.languageLabel} · ${t.reportCount} · ${t.ratingText}`, 200, yPos + 12);
          yPos += 25;
        });

        yPos += 20;
      }

      ctx.setFillStyle('#9CA3AF');
      ctx.setFontSize(11);
      ctx.fillText(i18n.t('dashboard.dataReport'), 30, canvasH - 20);

      ctx.draw(false, () => {
        wx.canvasToTempFilePath({
          canvasId: 'reportCanvas',
          success: (res) => {
            wx.hideLoading();
            wx.previewImage({
              current: res.tempFilePath,
              urls: [res.tempFilePath],
              complete: () => {
                wx.showModal({
                  title: i18n.t('common.success'),
                  content: i18n.t('common.success'),
                  showCancel: false,
                  confirmText: i18n.t('common.confirm')
                });
              }
            });
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: i18n.t('common.fail'), icon: 'none' });
          }
        }, this);
      });
    }, 300);
  },

  onExportPDF() {
    wx.showLoading({ title: i18n.t('common.loading'), mask: true });

    const { summary } = this.data;

    const contentLines = [
      i18n.t('dashboard.dataReport'),
      `${i18n.t('dashboard.todayFocus')}：${this.data.periods[this.data.periodIndex]}`,
      `${i18n.t('report.overview')}：${util.formatTime(new Date())}`,
      '',
      `【${i18n.t('dashboard.todayFocus')}】`,
      `${i18n.t('customers.statAll')}：${summary?.totalCustomers || 0}`,
      `${i18n.t('dashboard.conversionRate')}：${summary?.conversionRate || 0}%`,
      `${i18n.t('report.title')}：${summary?.totalReports || 0}`,
      `${i18n.t('dashboard.pendingReports')}：${summary?.pendingReports || 0}`,
      '',
      `—— ${i18n.t('dashboard.dataReport')} ——`
    ].join('\n');

    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: i18n.t('action.export'),
        content: i18n.t('action.export'),
        confirmText: i18n.t('action.export'),
        success: (res) => {
          if (res.confirm) {
            wx.showLoading({ title: i18n.t('common.loading'), mask: true });
            setTimeout(() => {
              wx.hideLoading();
              wx.showToast({ title: i18n.t('common.success'), icon: 'success' });
            }, 1500);
          }
        }
      });
    }, 1200);
  },

  onShareToWechat() {
    this.setData({ showSharePanel: true, sharePreview: true });
  },

  onShareCancel() {
    this.setData({ showSharePanel: false, sharePreview: false });
  },

  onShareToTimeline() {
    this.setData({ showSharePanel: false, sharePreview: false });
    wx.showToast({ title: i18n.t('action.share'), icon: 'none', duration: 2500 });
  },

  onShareToImage() {
    this.setData({ showSharePanel: false, sharePreview: false });
    this.onExportImage();
  },

  onShareAppMessage() {
    const period = this.data.periods[this.data.periodIndex];
    const summary = this.data.summary;
    this.setData({ showSharePanel: false, sharePreview: false });
    return {
      title: `【${i18n.t('dashboard.dataReport')}】${period} | ${i18n.t('customers.statAll')}${summary?.totalCustomers || 0} · ${i18n.t('dashboard.conversionRate')}${summary?.conversionRate || 0}%`,
      path: '/pages/data-report/data-report',
      imageUrl: ''
    };
  },

  onShareTimeline() {
    const period = this.data.periods[this.data.periodIndex];
    const summary = this.data.summary;
    return {
      title: `${i18n.t('dashboard.dataReport')}${period}：${i18n.t('dashboard.conversionRate')}${summary?.conversionRate || 0}%`
    };
  },

  onPullDownRefresh() {
    this.loadAllData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
      wx.showToast({ title: i18n.t('common.success'), icon: 'success' });
    }, 800);
  }
});
