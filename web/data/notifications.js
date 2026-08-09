// web/data/notifications.js - 通知种子数据
const NOTIFICATIONS = [
  {
    id: 'n-001', type: 'system', title: '系统维护通知',
    content: '系统将于2025年8月5日凌晨2:00-4:00进行升级维护，期间服务可能短暂中断。',
    time: '10分钟前', read: false,
    icon: '🔔', color: '#2563EB',
    targetUrl: '/pages/settings/settings', isTab: false
  },
  {
    id: 'n-002', type: 'report', title: '报告审核提醒',
    content: '有3份评估报告等待您的审核，请及时处理。',
    time: '30分钟前', read: false,
    icon: '📊', color: '#8B5CF6',
    targetUrl: '/pages/questionnaire/questionnaire', isTab: true
  },
  {
    id: 'n-003', type: 'customer', title: '新客户跟进',
    content: '王小明家长完成了问卷填写，等待您的回复。',
    time: '1小时前', read: false,
    icon: '👥', color: '#10B981',
    targetUrl: '/pages/customer-detail/customer-detail?id=cust-001', isTab: false
  },
  {
    id: 'n-004', type: 'ai', title: 'AI教师训练完成',
    content: '「法语-Sophie老师」已完成训练，可投入使用。',
    time: '3小时前', read: true,
    icon: '🤖', color: '#F59E0B',
    targetUrl: '/pages/profile/profile', isTab: true
  },
  {
    id: 'n-005', type: 'template', title: '问卷模板更新',
    content: '「英语入门评估V3」模板已更新至最新版本。',
    time: '昨天', read: true,
    icon: '📝', color: '#EA580C',
    targetUrl: '/pages/template-edit/template-edit?id=tpl-001', isTab: false
  },
  {
    id: 'n-006', type: 'system', title: '数据备份完成',
    content: '2025年7月数据已成功备份至云端存储。',
    time: '昨天', read: true,
    icon: '💾', color: '#6B7280',
    targetUrl: '/pages/settings/settings', isTab: false
  },
  {
    id: 'n-007', type: 'report', title: '报告生成完成',
    content: '「李雨桐」的评估报告已生成，可推送至家长。',
    time: '2天前', read: true,
    icon: '📄', color: '#2563EB',
    targetUrl: '/pages/report-detail/report-detail?id=report-001', isTab: false
  },
  {
    id: 'n-008', type: 'customer', title: '客户转化提醒',
    content: '王老师跟进的「张小红」已成功转化为正式学员。',
    time: '3天前', read: true,
    icon: '🎉', color: '#10B981',
    targetUrl: '/pages/customers/customers', isTab: true
  }
];

module.exports = { NOTIFICATIONS };
