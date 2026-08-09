// data/dashboard.js - 工作台Mock数据

const stats = {
  todayNewCustomers: 12,
  todayFollowTasks: 8,
  pendingQuestionnaires: 6,
  pendingReports: 4,
  monthConvertedCustomers: 38,
  monthConversionRate: 32.5,
  totalCustomers: 486,
  activeAITeachers: 5
};

const todos = [
  {
    id: 'todo-1',
    type: 'follow',
    title: '跟进王小明家长',
    description: '英语B1级别意向客户，上次沟通后需确认试听时间',
    priority: 'high',
    dueAt: '2026-08-01T15:00:00Z',
    relatedId: 'cust-001',
    status: 'pending'
  },
  {
    id: 'todo-2',
    type: 'review_report',
    title: '审核评估报告',
    description: '李思琪 - 法语A2水平评估报告待审核',
    priority: 'high',
    relatedId: 'report-001',
    status: 'pending'
  },
  {
    id: 'todo-3',
    type: 'send_questionnaire',
    title: '推送问卷',
    description: '向张婉清家长推送英语入学测评问卷',
    priority: 'medium',
    relatedId: 'cust-005',
    status: 'pending'
  },
  {
    id: 'todo-4',
    type: 'ai_training',
    title: 'AI教师训练',
    description: '「英语-王老师」AI模型有12条新知识待训练',
    priority: 'medium',
    relatedId: 'ai-001',
    status: 'pending'
  },
  {
    id: 'todo-5',
    type: 'follow',
    title: '回访陈博文家长',
    description: '德语试听课后满意度回访',
    priority: 'low',
    status: 'pending'
  }
];

const activities = [
  {
    id: 'act-1',
    type: 'customer_new',
    title: '新增潜在客户',
    description: '刘思远家长通过渠道码扫码添加，意向：德语B1',
    operatorName: '王老师',
    createdAt: '2026-08-01T10:24:00Z'
  },
  {
    id: 'act-2',
    type: 'questionnaire_complete',
    title: '问卷已提交',
    description: '赵梓涵家长完成了法语A1评估问卷',
    operatorName: '家长端',
    createdAt: '2026-08-01T09:58:00Z'
  },
  {
    id: 'act-3',
    type: 'report_generated',
    title: '报告已生成',
    description: 'AI教师「法语-李老师」完成评估报告生成',
    operatorName: 'AI系统',
    createdAt: '2026-08-01T09:42:00Z'
  },
  {
    id: 'act-4',
    type: 'customer_convert',
    title: '客户转化成功',
    description: '孙悦桐家长签约英语B2长期班课程',
    operatorName: '李老师',
    createdAt: '2026-08-01T08:30:00Z'
  },
  {
    id: 'act-5',
    type: 'follow_record',
    title: '添加跟进记录',
    description: '周雨彤家长沟通中，已发送课程资料包',
    operatorName: '张老师',
    createdAt: '2026-07-31T18:15:00Z'
  },
  {
    id: 'act-6',
    type: 'report_sent',
    title: '报告已推送',
    description: '吴俊豪英语测评报告已通过服务通知推送家长',
    operatorName: '李老师',
    createdAt: '2026-07-31T17:20:00Z'
  }
];

module.exports = {
  stats,
  todos,
  activities
};
