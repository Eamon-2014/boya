// data/reports.js - 评估报告Mock数据

const reports = [
  {
    id: 'report-001',
    customerId: 'cust-002',
    customerName: '李芳',
    childName: '李思琪',
    language: 'fr',
    templateId: 'tpl-002',
    templateName: '法语启蒙兴趣测评',
    answerId: 'ans-002',
    aiTeacherId: 'ai-002',
    aiTeacherName: '法语-李老师',
    status: 'pending_review',
    overallScore: 72,
    overallLevel: '良好',
    dimensions: [
      { name: '语音模仿能力', score: 18, maxScore: 25, level: '良好', description: '发音准确性较好，小舌音需练习' },
      { name: '词汇理解', score: 15, maxScore: 25, level: '中等', description: '基础词汇有一定认知，建议加强场景记忆' },
      { name: '学习兴趣度', score: 22, maxScore: 25, level: '优秀', description: '对法国文化和法语有浓厚兴趣，动机强' },
      { name: '语言敏感度', score: 17, maxScore: 25, level: '良好', description: '语感较好，句子结构理解较快' }
    ],
    strengths: [
      '学习兴趣浓厚，对法国文化有好奇心，内在动机强',
      '语音模仿能力好，能准确重复听到的法语发音',
      '家长重视语言教育，愿意配合课后学习安排'
    ],
    weaknesses: [
      '词汇积累较少，日常高频词掌握不足',
      '基础语法概念需要系统建立',
      '听力输入量有限，需要增加法语环境沉浸'
    ],
    suggestions: [
      '建议从《你好！法语》A1上册开始系统学习',
      '每日安排15-20分钟的法语动画/歌曲磨耳朵',
      '使用法语单词闪卡建立高频词基础',
      '每月参加一次法语文化沙龙，培养实际应用场景'
    ],
    studyPlan: [
      {
        phase: '第一阶段（1-3个月）',
        duration: '3个月',
        focus: '语音+启蒙词汇',
        content: [
          '掌握法语36个音素发音规则',
          '积累300+日常生活高频词',
          '学会50个常用交际句型',
          '建立法语学习兴趣和正反馈'
        ]
      },
      {
        phase: '第二阶段（4-6个月）',
        duration: '3个月',
        focus: 'A1基础语法',
        content: [
          '系统学习A1级别语法体系',
          '词汇量扩展至600+',
          '完成简单法语短文阅读',
          '能进行5-10分钟日常主题对话'
        ]
      },
      {
        phase: '第三阶段（7-12个月）',
        duration: '6个月',
        focus: 'A2能力提升',
        content: [
          '冲击DELF A2考试能力',
          '建立完善法语基础框架',
          '增强听说综合应用能力',
          '逐步过渡到自主学习模式'
        ]
      }
    ],
    reviewMode: 'manual',
    createdAt: '2026-08-01T09:42:00Z',
    generatedAt: '2026-08-01T09:42:00Z',
    sentToParent: false
  },
  {
    id: 'report-002',
    customerId: 'cust-004',
    customerName: '陈静',
    childName: '陈博文',
    language: 'de',
    templateId: 'tpl-003',
    templateName: '德语留学水平评估',
    answerId: 'ans-004',
    aiTeacherId: 'ai-003',
    aiTeacherName: '德语-张老师',
    status: 'sent',
    overallScore: 58,
    overallLevel: '中等',
    dimensions: [
      { name: '语音语调', score: 12, maxScore: 20, level: '中等', description: '发音基本准确，部分小舌音和变元音需加强' },
      { name: '词汇量', score: 20, maxScore: 40, level: '待提升', description: '当前词汇量约800，A1水平，需快速扩充' },
      { name: '语法掌握', score: 10, maxScore: 20, level: '中等', description: '基础时态和格有概念，但运用不熟练' },
      { name: '听说能力', score: 8, maxScore: 20, level: '待提升', description: '简单话题能沟通，但反应速度和表达流畅度不足' }
    ],
    strengths: [
      '学习目标明确（德福B1-B2留学），内在驱动力强',
      '逻辑思维能力好，对德语语法规则理解快',
      '能坚持每日学习，自律性较强'
    ],
    weaknesses: [
      '词汇积累量不足，离B1目标差距较大',
      '听力口语练习时间少，实际应用能力弱',
      '德语变元音和小舌音发音需要刻意纠正'
    ],
    suggestions: [
      '建议高强度集中班+一对一辅导双线进行',
      '使用Anki进行德福高频词每日背诵（50词/天）',
      '每日安排30分钟德语听力精听训练',
      '增加德福考试题型熟悉度和解题技巧训练'
    ],
    studyPlan: [
      {
        phase: '强化阶段（1-2个月）',
        duration: '2个月',
        focus: 'A2-B1过渡',
        content: [
          '高强度词汇突破：从800扩展到2500+',
          '系统学习B1语法体系',
          '德福听力阅读基础题型训练',
          '一对一外教口语纠音'
        ]
      },
      {
        phase: '冲刺阶段（3-5个月）',
        duration: '3个月',
        focus: '德福B1冲刺',
        content: [
          '德福四科（听说读写）专项强化',
          '每周完成2套完整德福模考',
          '德福写作模板和话题素材积累',
          '口语答题逻辑和素材背诵'
        ]
      }
    ],
    reviewMode: 'auto',
    reviewerId: 't-004',
    reviewerName: '张老师',
    reviewedAt: '2026-07-22T14:00:00Z',
    createdAt: '2026-07-21T18:00:00Z',
    generatedAt: '2026-07-21T18:30:00Z',
    sentToParent: true,
    sentAt: '2026-07-22T15:00:00Z',
    pushChannel: 'wechat',
    pushChannelLabel: '微信服务通知'
  },
  {
    id: 'report-003',
    customerId: 'cust-007',
    customerName: '周华',
    childName: '周雨彤',
    language: 'en',
    templateId: 'tpl-001',
    templateName: '英语入学综合测评',
    answerId: 'ans-005',
    aiTeacherId: 'ai-001',
    aiTeacherName: '英语-王老师',
    status: 'approved',
    overallScore: 78,
    overallLevel: '良好',
    dimensions: [
      { name: '词汇量', score: 28, maxScore: 35, level: '良好', description: '当前词汇量约2200，B1水平，继续扩充即可达标' },
      { name: '阅读理解', score: 18, maxScore: 20, level: '优秀', description: '文章理解能力强，能抓住主旨和细节' },
      { name: '听力水平', score: 15, maxScore: 20, level: '良好', description: '日常对话理解较好，长对话需抓重点训练' },
      { name: '口语表达', score: 8, maxScore: 15, level: '中等', description: '能表达基本意思，但流利度和地道性需提升' },
      { name: '写作基础', score: 9, maxScore: 10, level: '优秀', description: '句子结构正确，语法错误少' }
    ],
    strengths: [
      '阅读和写作基础扎实，语言输入能力强',
      '学习习惯好，有自主背单词和阅读习惯',
      '家长教育理念清晰，配合度高',
      '雅思目标明确，备考动力充足'
    ],
    weaknesses: [
      '口语流利度不足，开口表达意愿待加强',
      '雅思听力Section 3/4答题正确率不高',
      '写作逻辑连接词运用不够丰富'
    ],
    suggestions: [
      '推荐报读雅思强化班（目标6.5-7分）',
      '每日安排15分钟跟读模仿，改善语音语调',
      '雅思写作每周至少2篇大作文+1篇小作文训练',
      '听力真题精听训练，加强同义替换敏感度'
    ],
    studyPlan: [
      {
        phase: '基础夯实（1-2个月）',
        duration: '2个月',
        focus: '词汇语法+基础题型',
        content: [
          '雅思核心词汇3800掌握（每日50词+复习）',
          '雅思语法体系强化（长难句分析）',
          '听说读写各科基础题型熟悉',
          '口语素材库初步建立（Part 1-2）'
        ]
      },
      {
        phase: '能力提升（3-4个月）',
        duration: '2个月',
        focus: '题型技巧+综合运用',
        content: [
          '雅思各科解题技巧系统训练',
          '每周模考1-2次并详细复盘',
          '口语高频话题素材完善',
          '写作常见错误排查和表达升级'
        ]
      },
      {
        phase: '冲刺模考（第5个月）',
        duration: '1个月',
        focus: '真题冲刺+考试技巧',
        content: [
          '剑17-19真题完整模拟训练',
          '口语一对一模考练习',
          '预测题押题背诵',
          '考试心态和时间管理调整'
        ]
      }
    ],
    reviewMode: 'manual',
    reviewerId: 't-001',
    reviewerName: '王老师',
    reviewedAt: '2026-07-14T10:00:00Z',
    reviewComment: '评估较全面，建议在学习计划中增加具体每周课时安排',
    createdAt: '2026-07-13T22:00:00Z',
    generatedAt: '2026-07-13T22:30:00Z',
    sentToParent: false
  },
  {
    id: 'report-004',
    customerId: 'cust-009',
    customerName: '孙丽',
    childName: '孙悦桐',
    language: 'en',
    templateId: 'tpl-001',
    templateName: '英语入学综合测评',
    answerId: 'ans-006',
    aiTeacherId: 'ai-001',
    aiTeacherName: '英语-王老师',
    status: 'sent',
    overallScore: 68,
    overallLevel: '良好',
    dimensions: [
      { name: '词汇量', score: 22, maxScore: 35, level: '中等', description: '当前词汇量约1600，A2-B1过渡水平' },
      { name: '阅读理解', score: 14, maxScore: 20, level: '良好', description: '理解能力尚可，细节题易丢分' },
      { name: '听力水平', score: 12, maxScore: 20, level: '中等', description: '需加强精听训练，提高信息抓取能力' },
      { name: '口语表达', score: 10, maxScore: 15, level: '良好', description: '表达意愿强，发音基础不错' },
      { name: '写作基础', score: 10, maxScore: 10, level: '优秀', description: '语法基础扎实，写作条理清晰' }
    ],
    strengths: [
      '学习态度积极，课堂参与度高',
      '口语敢于开口表达，自信心好',
      '家长全力配合，课后辅导到位'
    ],
    weaknesses: [
      '词汇量距离B2目标还有较大差距',
      '听力同义替换反应慢',
      '阅读理解速度需要提升'
    ],
    suggestions: [
      '签约英语B2长期班，每周4课时+课后辅导',
      '配套使用剑桥词汇书系统学习',
      '每日20分钟英语新闻泛听'
    ],
    studyPlan: [
      {
        phase: '长期班（6个月）',
        duration: '6个月',
        focus: '剑桥B2 First系统备考',
        content: [
          'Complete B2教材系统学习',
          'FCE五大题型解题技巧训练',
          '每周FCE真题模考',
          '写作批改+口语外教课'
        ]
      }
    ],
    reviewMode: 'auto',
    createdAt: '2026-06-03T16:00:00Z',
    generatedAt: '2026-06-03T16:30:00Z',
    sentToParent: true,
    sentAt: '2026-06-04T09:00:00Z',
    pushChannel: 'sms',
    pushChannelLabel: '短信通知'
  },
  {
    id: 'report-005',
    customerId: 'cust-011',
    customerName: '吴敏',
    childName: '吴思远',
    language: 'ja',
    templateId: 'tpl-004',
    templateName: '日语入门兴趣测评',
    answerId: 'ans-007',
    aiTeacherId: 'ai-004',
    aiTeacherName: '日语-田中老师',
    status: 'rejected',
    overallScore: 65,
    overallLevel: '中等',
    dimensions: [
      { name: '五十音图掌握', score: 15, maxScore: 20, level: '良好', description: '基本掌握，部分浊音需巩固' },
      { name: '基础语法', score: 12, maxScore: 20, level: '中等', description: '助词使用和动词变形需加强' },
      { name: '听力理解', score: 10, maxScore: 20, level: '中等', description: '简单对话能听懂，长句理解较弱' },
      { name: '学习兴趣', score: 18, maxScore: 20, level: '优秀', description: '对日本动漫和文化有浓厚兴趣' }
    ],
    strengths: [
      '对日语学习有浓厚兴趣，喜欢日本动漫',
      '五十音图基础扎实，书写规范',
      '学习态度认真，能按时完成作业'
    ],
    weaknesses: [
      '动词变形和助词运用不够熟练',
      '听力反应速度慢，需要多听多练',
      '口语表达较少，开口意愿不强'
    ],
    suggestions: [
      '建议从《新标准日本语》初级上册开始学习',
      '每日30分钟NHK新闻听力训练',
      '利用动漫进行影子跟读练习',
      '参加日语角增加口语实践'
    ],
    studyPlan: [
      {
        phase: '入门阶段（1-3个月）',
        duration: '3个月',
        focus: '五十音+基础语法',
        content: [
          '掌握五十音图所有发音',
          '学习标准日本语初级上册',
          '积累基础词汇1000个',
          '每日跟读训练'
        ]
      },
      {
        phase: '进阶阶段（4-6个月）',
        duration: '3个月',
        focus: '中级语法+听力',
        content: [
          '学习标准日本语初级下册',
          'NHK新闻听力每日训练',
          '参加日语角口语练习',
          '准备N5考试'
        ]
      }
    ],
    reviewMode: 'manual',
    rejectReason: '建议补充孩子对日本文化的兴趣点分析，学习计划需要更具体的每周安排',
    rejectedAt: '2026-07-30T11:00:00Z',
    createdAt: '2026-07-29T15:00:00Z',
    generatedAt: '2026-07-29T15:30:00Z',
    sentToParent: false
  }
];

module.exports = {
  reports
};
