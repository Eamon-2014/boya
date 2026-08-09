// pages/workflow-tracking/workflow-tracking.js
const i18n = require('../../utils/i18n.js');
const api = require('../../utils/api.js');

const app = getApp();

Page({
  data: {
    themeColors: {},
    texts: {},
    pipeline: [],
    overview: null,
    stageDetails: {},
    showStageDetail: false,
    currentStageKey: ''
  },

  loadThemeColors() {
    const themeColors = app.getThemeColors();
    this.setData({ themeColors });
  },

  loadI18nTexts() {
    const texts = {
      pageTitle: i18n.t('workflow.title'),
      overviewTitle: i18n.t('workflow.overview'),
      totalCustomers: i18n.t('workflow.totalCustomers'),
      totalReports: i18n.t('workflow.totalReports'),
      avgPipelineTime: i18n.t('workflow.avgPipelineTime'),
      bottleneckStage: i18n.t('workflow.bottleneckStage'),
      pipelineTitle: i18n.t('workflow.pipelineTitle'),
      stageLead: i18n.t('workflow.stageLead'),
      stageFollowup: i18n.t('workflow.stageFollowup'),
      stageQuestionnaire: i18n.t('workflow.stageQuestionnaire'),
      stageReport: i18n.t('workflow.stageReport'),
      avgTime: i18n.t('workflow.avgTime'),
      hours: i18n.t('workflow.hours'),
      customerList: i18n.t('workflow.customerList'),
      stayTime: i18n.t('workflow.stayTime'),
      viewDetail: i18n.t('workflow.viewDetail'),
      noData: i18n.t('workflow.noData'),
      bottleneck: i18n.t('workflow.bottleneck'),
      customers: i18n.t('customers.statAll'),
      statusNew: i18n.t('customers.filterNew'),
      statusFollowing: i18n.t('customers.filterFollowing'),
      statusConverted: i18n.t('customers.filterConverted'),
      statusLost: i18n.t('customers.filterLost'),
      close: i18n.t('common.close'),
      customerDetail: i18n.t('customer.title'),
      reportCount: i18n.t('report.title'),
      completionTime: i18n.t('workflow.completionTime'),
      noCustomers: i18n.t('workflow.noCustomers')
    };
    this.setData({ texts });
  },

  loadPipelineData() {
    Promise.all([
      api.listCustomers(),
      api.listReports(),
      api.listAssignments()
    ]).then(([customers, reports, assignments]) => {
      customers = customers || [];
      reports = reports || [];
      assignments = assignments || [];

      const now = new Date();

    const newCustomers = customers.filter(c => c.status === 'new');
    const followingCustomers = customers.filter(c => c.status === 'following');
    const convertedCustomers = customers.filter(c => c.status === 'converted');
    const lostCustomers = customers.filter(c => c.status === 'lost');

    const customersWithAssignments = assignments.map(a => a.customerId);
    const uniqueAssignmentCustomerIds = [...new Set(customersWithAssignments)];

    const customersWithReports = reports.map(r => r.customerId);
    const uniqueReportCustomerIds = [...new Set(customersWithReports)];

    const calcHours = (startDate, endDate) => {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : now;
      return Math.round((end - start) / 3600000);
    };

    const calcAvgHours = (items, getStart, getEnd) => {
      if (items.length === 0) return 0;
      const total = items.reduce((sum, item) => sum + calcHours(getStart(item), getEnd(item)), 0);
      return Math.round(total / items.length);
    };

    const leadCustomers = customers;
    const leadAvgTime = calcAvgHours(
      leadCustomers,
      c => c.createdAt,
      c => c.updatedAt || c.lastFollowAt
    );

    const followupStageCustomers = [...followingCustomers, ...convertedCustomers];
    const followupAvgTime = calcAvgHours(
      followingCustomers,
      c => c.createdAt,
      c => c.lastFollowAt
    );

    const completedAssignments = assignments.filter(a => a.status === 'completed');
    const questionnaireAvgTime = calcAvgHours(
      completedAssignments,
      a => a.assignedAt,
      a => a.completedAt
    );

    const reportAvgTime = calcAvgHours(
      reports.filter(r => r.status !== 'pending_review'),
      r => r.createdAt,
      r => r.generatedAt
    );

    const stageConfigs = [
      {
        key: 'lead',
        title: i18n.t('workflow.stageLead'),
        icon: '🎯',
        count: leadCustomers.length,
        color: '#3B82F6',
        bg: 'rgba(59, 130, 246, 0.1)',
        avgTime: leadAvgTime
      },
      {
        key: 'followup',
        title: i18n.t('workflow.stageFollowup'),
        icon: '💬',
        count: followupStageCustomers.length,
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.1)',
        avgTime: followupAvgTime
      },
      {
        key: 'questionnaire',
        title: i18n.t('workflow.stageQuestionnaire'),
        icon: '📝',
        count: uniqueAssignmentCustomerIds.length,
        color: '#8B5CF6',
        bg: 'rgba(139, 92, 246, 0.1)',
        avgTime: questionnaireAvgTime
      },
      {
        key: 'report',
        title: i18n.t('workflow.stageReport'),
        icon: '📊',
        count: uniqueReportCustomerIds.length,
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.1)',
        avgTime: reportAvgTime
      }
    ];

    const maxAvgTime = Math.max(...stageConfigs.map(s => s.avgTime));
    const bottleneckIndex = stageConfigs.findIndex(s => s.avgTime === maxAvgTime && s.avgTime > 0);
    stageConfigs.forEach((s, i) => {
      s.bottleneck = i === bottleneckIndex;
    });

    const totalPipelineTime = stageConfigs.reduce((sum, s) => sum + s.avgTime, 0);
    const avgPipelineTime = Math.round(totalPipelineTime / stageConfigs.length);

    const bottleneckStage = bottleneckIndex >= 0 ? stageConfigs[bottleneckIndex].title : '-';

    const overview = {
      totalCustomers: customers.length,
      totalReports: reports.length,
      avgPipelineTime,
      bottleneckStage
    };

    const stageDetails = {};

    stageDetails['lead'] = leadCustomers.map(c => ({
      id: c.id,
      name: c.name,
      childName: c.childName,
      status: c.status,
      statusLabel: this.getStatusLabel(c.status),
      stayHours: calcHours(c.createdAt, c.updatedAt || now),
      language: c.language
    }));

    stageDetails['followup'] = followupStageCustomers.map(c => ({
      id: c.id,
      name: c.name,
      childName: c.childName,
      status: c.status,
      statusLabel: this.getStatusLabel(c.status),
      stayHours: calcHours(c.createdAt, c.lastFollowAt || now),
      language: c.language,
      followCount: c.followCount || 0
    }));

    stageDetails['questionnaire'] = uniqueAssignmentCustomerIds.map(customerId => {
      const customer = customers.find(c => c.id === customerId);
      const assignment = assignments.find(a => a.customerId === customerId);
      if (!customer) return null;
      return {
        id: customer.id,
        name: customer.name,
        childName: customer.childName,
        status: assignment ? assignment.status : 'pending',
        statusLabel: this.getAssignmentStatusLabel(assignment ? assignment.status : 'pending'),
        stayHours: assignment ? calcHours(assignment.assignedAt, assignment.completedAt) : 0,
        language: customer.language
      };
    }).filter(Boolean);

    stageDetails['report'] = uniqueReportCustomerIds.map(customerId => {
      const customer = customers.find(c => c.id === customerId);
      const report = reports.find(r => r.customerId === customerId);
      if (!customer) return null;
      return {
        id: customer.id,
        name: customer.name,
        childName: customer.childName,
        status: report ? report.status : 'pending_review',
        statusLabel: this.getReportStatusLabel(report ? report.status : 'pending_review'),
        stayHours: report ? calcHours(report.createdAt, report.generatedAt) : 0,
        language: customer.language,
        overallScore: report ? report.overallScore : null
      };
    }).filter(Boolean);

    this.setData({
      pipeline: stageConfigs,
      overview,
      stageDetails
    });
    }).catch(err => {
      console.error('[WorkflowTracking] 加载失败:', err);
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    });
  },

  getStatusLabel(status) {
    const map = {
      new: i18n.t('customers.filterNew'),
      following: i18n.t('customers.filterFollowing'),
      converted: i18n.t('customers.filterConverted'),
      lost: i18n.t('customers.filterLost')
    };
    return map[status] || status;
  },

  getAssignmentStatusLabel(status) {
    const map = {
      sent: i18n.t('status.processing'),
      completed: i18n.t('status.completed'),
      pending: i18n.t('status.pending')
    };
    return map[status] || status;
  },

  getReportStatusLabel(status) {
    const map = {
      pending_review: i18n.t('status.pending'),
      approved: i18n.t('status.approved'),
      sent: i18n.t('status.completed'),
      rejected: i18n.t('status.rejected')
    };
    return map[status] || status;
  },

  onStageTap(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      showStageDetail: true,
      currentStageKey: key
    });
  },

  onCloseStageDetail() {
    this.setData({
      showStageDetail: false,
      currentStageKey: ''
    });
  },

  onCustomerTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/customer-detail/customer-detail?id=' + id
    });
  },

  onShow() {
    this.loadThemeColors();
    this.loadI18nTexts();
    this.loadPipelineData();
    i18n.setPageTitle('workflowTracking');
  },

  onPullDownRefresh() {
    this.loadPipelineData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
      wx.showToast({ title: i18n.t('common.success'), icon: 'success' });
    }, 800);
  }
});
