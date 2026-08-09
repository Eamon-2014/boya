// data/aiTeachers.js - AI教师Mock数据

const aiTeachers = [
  {
    id: 'ai-001',
    name: '英语-王老师',
    description: '复刻自王牌英语教师王老师，擅长剑桥证书考试体系和青少年英语教学',
    language: 'en',
    specialties: ['KET/PET/FCE', '剑桥体系', '青少年英语', '雅思入门'],
    originalTeacherId: 't-001',
    originalTeacherName: '王老师',
    status: 'ready',
    trainingProgress: 100,
    knowledgeCount: 86,
    reportCount: 156,
    avgRating: 4.8,
    createdAt: '2026-04-15T10:00:00Z',
    lastTrainedAt: '2026-07-30T18:00:00Z',
    knowledgeBase: [
      {
        id: 'k1',
        type: 'methodology',
        title: '青少年英语能力评估方法论V2.0',
        content: '评估维度：1.词汇量（按欧洲语言共同参考框架CEFR分级对照）2.语法掌握（时态、句型、词性变化正确率）3.听力（对话理解、细节抓取、主旨推断）4.阅读（信息定位、推断、主旨）5.口语（流利度、词汇广度、发音、语法准确性）6.写作（任务完成度、语法词汇、连贯性）。综合评分权重：词汇25%+语法15%+听20%+读15%+说15%+写10%=100%。',
        createdAt: '2026-04-15T10:00:00Z'
      },
      {
        id: 'k2',
        type: 'sales',
        title: '英语课程转化话术-家长痛点分析',
        content: '家长常见痛点及应对：1.「孩子校内成绩已经不错」→ 校内≠能力，展示CEFR对标和实际听说能力案例；2.「太忙没时间上课」→ 灵活排课+线上线下混合+AI辅助课后练习；3.「价格太贵」→ 拆解长期班单次课时费+展示提分数据+老学员口碑案例。',
        createdAt: '2026-05-10T10:00:00Z'
      },
      {
        id: 'k3',
        type: 'analysis',
        title: '英语问卷分析逻辑-词汇量维度',
        content: '词汇量评估依据：问卷中自报学习年限+词汇量自评打分+课内课外学习组合。换算公式：预估词汇量 = (自评打分/10) × 年级基准词汇 × (1 + 课外系数)。',
        createdAt: '2026-05-20T10:00:00Z'
      }
    ]
  },
  {
    id: 'ai-002',
    name: '法语-李老师',
    description: '复刻自法语教学专家李老师，擅长法语启蒙和DELF A1-A2教学',
    language: 'fr',
    specialties: ['法语启蒙', 'DELF A1/A2', '少儿法语', '法国文化'],
    originalTeacherId: 't-003',
    originalTeacherName: '李老师',
    status: 'ready',
    trainingProgress: 100,
    knowledgeCount: 52,
    reportCount: 68,
    avgRating: 4.7,
    createdAt: '2026-05-20T10:00:00Z',
    lastTrainedAt: '2026-07-25T14:00:00Z',
    knowledgeBase: []
  },
  {
    id: 'ai-003',
    name: '德语-张老师',
    description: '复刻自德福名师张老师，专注德语留学备考和德福冲刺教学',
    language: 'de',
    specialties: ['德福考试', '留学德语', '歌德证书', 'B1/B2冲刺'],
    originalTeacherId: 't-004',
    originalTeacherName: '张老师',
    status: 'ready',
    trainingProgress: 100,
    knowledgeCount: 64,
    reportCount: 42,
    avgRating: 4.9,
    createdAt: '2026-05-01T10:00:00Z',
    lastTrainedAt: '2026-07-28T20:00:00Z',
    knowledgeBase: []
  },
  {
    id: 'ai-004',
    name: '英语-陈老师',
    description: '复刻自陈老师，擅长雅思7+高分和学术英语写作',
    language: 'en',
    specialties: ['雅思高分', '学术写作', '留学面试', '英联邦留学'],
    originalTeacherId: 't-005',
    originalTeacherName: '陈老师',
    status: 'training',
    trainingProgress: 68,
    knowledgeCount: 34,
    reportCount: 0,
    avgRating: 0,
    createdAt: '2026-07-28T10:00:00Z',
    lastTrainedAt: '2026-07-31T16:00:00Z',
    knowledgeBase: []
  },
  {
    id: 'ai-005',
    name: '多语种顾问',
    description: '综合型AI顾问，负责小语种启蒙兴趣评估和课程匹配',
    language: 'other',
    specialties: ['小语种启蒙', '课程匹配咨询', '学习兴趣评估'],
    originalTeacherId: 'system',
    originalTeacherName: '系统默认',
    status: 'ready',
    trainingProgress: 100,
    knowledgeCount: 28,
    reportCount: 18,
    avgRating: 4.6,
    createdAt: '2026-06-10T10:00:00Z',
    lastTrainedAt: '2026-07-15T10:00:00Z',
    knowledgeBase: []
  }
];

module.exports = {
  aiTeachers
};
