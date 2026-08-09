// data/questionnaires.js - 问卷Mock数据

const templates = [
  {
    id: 'tpl-001',
    name: '英语入学综合测评',
    description: '全面评估学员英语听、说、读、写基础能力，匹配对应级别课程',
    language: 'en',
    category: '入学测评',
    status: 'active',
    usageCount: 128,
    creatorId: 't-001',
    creatorName: '王老师',
    createdAt: '2026-05-10T10:00:00Z',
    updatedAt: '2026-07-20T15:00:00Z',
    questions: [
      {
        id: 'q1',
        type: 'single',
        title: '孩子目前的英语学习情况是？',
        options: [
          { id: 'q1o1', label: '未系统学习过', value: 'none', score: 0 },
          { id: 'q1o2', label: '仅在校学习', value: 'school', score: 20 },
          { id: 'q1o3', label: '在校+课外班1年以内', value: 'short', score: 40 },
          { id: 'q1o4', label: '在校+课外班1-3年', value: 'mid', score: 60 },
          { id: 'q1o5', label: '系统学习3年以上', value: 'long', score: 80 }
        ],
        required: true,
        sortOrder: 1
      },
      {
        id: 'q2',
        type: 'rating',
        title: '请为孩子的词汇量打分（1-10）',
        required: true,
        sortOrder: 2
      },
      {
        id: 'q3',
        type: 'single',
        title: '孩子日常英语听力理解程度如何？',
        options: [
          { id: 'q3o1', label: '完全听不懂', value: 'none', score: 0 },
          { id: 'q3o2', label: '能听懂简单单词', value: 'words', score: 25 },
          { id: 'q3o3', label: '能听懂简单句子', value: 'sentences', score: 50 },
          { id: 'q3o4', label: '能听懂短对话', value: 'dialogue', score: 75 },
          { id: 'q3o5', label: '能听懂较长对话/故事', value: 'advanced', score: 100 }
        ],
        required: true,
        sortOrder: 3
      },
      {
        id: 'q4',
        type: 'multiple',
        title: '孩子英语学习的主要目标是什么？（可多选）',
        options: [
          { id: 'q4o1', label: '提升校内成绩', value: 'school' },
          { id: 'q4o2', label: '备考英语等级证书', value: 'cert' },
          { id: 'q4o3', label: '提升口语交流能力', value: 'speak' },
          { id: 'q4o4', label: '为出国留学做准备', value: 'abroad' },
          { id: 'q4o5', label: '培养语言兴趣', value: 'interest' }
        ],
        required: true,
        sortOrder: 4
      },
      {
        id: 'q5',
        type: 'text',
        title: '请简要描述孩子在英语学习中遇到的主要困难',
        required: false,
        sortOrder: 5
      },
      {
        id: 'q6',
        type: 'scale',
        title: '每周可投入的英语课外学习时间（小时）',
        required: true,
        sortOrder: 6
      }
    ]
  },
  {
    id: 'tpl-002',
    name: '法语启蒙兴趣测评',
    description: '针对法语零基础学员，评估学习兴趣和语言天赋',
    language: 'fr',
    category: '启蒙测评',
    status: 'active',
    usageCount: 42,
    creatorId: 't-003',
    creatorName: '李老师',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-07-10T10:00:00Z',
    questions: [
      {
        id: 'fq1',
        type: 'single',
        title: '孩子之前是否接触过法语？',
        options: [
          { id: 'fq1o1', label: '完全没有', value: 'none' },
          { id: 'fq1o2', label: '听过简单歌曲/动画', value: 'exposure' },
          { id: 'fq1o3', label: '系统学习过基础发音', value: 'basic' }
        ],
        required: true,
        sortOrder: 1
      },
      {
        id: 'fq2',
        type: 'text',
        title: '为什么选择学习法语？',
        required: true,
        sortOrder: 2
      }
    ]
  },
  {
    id: 'tpl-003',
    name: '德语留学水平评估',
    description: '针对计划赴德留学的学员，评估当前德语水平并制定学习计划',
    language: 'de',
    category: '留学测评',
    status: 'active',
    usageCount: 36,
    creatorId: 't-004',
    creatorName: '张老师',
    createdAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-07-15T10:00:00Z',
    questions: []
  },
  {
    id: 'tpl-004',
    name: '英语KET备考测评',
    description: '剑桥KET考试专项测评，诊断薄弱环节',
    language: 'en',
    category: '证书备考',
    status: 'draft',
    usageCount: 0,
    creatorId: 't-001',
    creatorName: '王老师',
    createdAt: '2026-07-28T10:00:00Z',
    updatedAt: '2026-07-28T16:00:00Z',
    questions: []
  }
];

const assignments = [
  {
    id: 'asn-001',
    templateId: 'tpl-001',
    templateName: '英语入学综合测评',
    customerId: 'cust-001',
    customerName: '王建国',
    parentName: '王建国',
    parentPhone: '13800138001',
    status: 'sent',
    assignedBy: 't-001',
    assignedByName: '王老师',
    assignedAt: '2026-07-31T10:00:00Z',
    expireAt: '2026-08-07T23:59:59Z'
  },
  {
    id: 'asn-002',
    templateId: 'tpl-002',
    templateName: '法语启蒙兴趣测评',
    customerId: 'cust-002',
    customerName: '李芳',
    parentName: '李芳',
    parentPhone: '13800138002',
    status: 'completed',
    assignedBy: 't-003',
    assignedByName: '李老师',
    assignedAt: '2026-07-31T09:00:00Z',
    completedAt: '2026-08-01T09:58:00Z',
    expireAt: '2026-08-07T23:59:59Z'
  },
  {
    id: 'asn-003',
    templateId: 'tpl-001',
    templateName: '英语入学综合测评',
    customerId: 'cust-005',
    customerName: '赵敏',
    parentName: '赵敏',
    parentPhone: '13800138005',
    status: 'pending',
    assignedBy: 't-001',
    assignedByName: '王老师',
    assignedAt: '2026-08-01T08:00:00Z',
    expireAt: '2026-08-08T23:59:59Z'
  },
  {
    id: 'asn-004',
    templateId: 'tpl-003',
    templateName: '德语留学水平评估',
    customerId: 'cust-004',
    customerName: '陈静',
    parentName: '陈静',
    parentPhone: '13800138004',
    status: 'completed',
    assignedBy: 't-004',
    assignedByName: '张老师',
    assignedAt: '2026-07-20T10:00:00Z',
    completedAt: '2026-07-21T15:00:00Z',
    expireAt: '2026-07-27T23:59:59Z'
  },
  {
    id: 'asn-005',
    templateId: 'tpl-001',
    templateName: '英语入学综合测评',
    customerId: 'cust-007',
    customerName: '周华',
    parentName: '周华',
    parentPhone: '13800138007',
    status: 'completed',
    assignedBy: 't-001',
    assignedByName: '王老师',
    assignedAt: '2026-07-12T10:00:00Z',
    completedAt: '2026-07-13T20:00:00Z',
    expireAt: '2026-07-19T23:59:59Z'
  },
  {
    id: 'asn-006',
    templateId: 'tpl-001',
    templateName: '英语入学综合测评',
    customerId: 'cust-009',
    customerName: '孙丽',
    parentName: '孙丽',
    parentPhone: '13800138009',
    status: 'completed',
    assignedBy: 't-001',
    assignedByName: '王老师',
    assignedAt: '2026-06-02T10:00:00Z',
    completedAt: '2026-06-03T12:00:00Z',
    expireAt: '2026-06-09T23:59:59Z'
  }
];

module.exports = {
  templates,
  assignments
};
