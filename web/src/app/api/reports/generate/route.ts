// POST /api/reports/generate
// 通过 AI 教师 + 问卷作答，调用阿里云百炼智能体生成评估报告并持久化
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { canRead } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { callBailianAgent, safeJsonParse } from '@/lib/ai/bailian';

// 语言代码 → 中文名
const LANG_ZH: Record<string, string> = {
  en: '英语',
  fr: '法语',
  de: '德语',
  ja: '日语',
  ko: '韩语',
  es: '西班牙语',
};

/**
 * 把问卷题目 + 作答拼成可读文本
 * answers 格式：[{ questionId, questionTitle, questionType, answer }]
 * questions 格式：Template.questions（JSON 解析后的数组）
 */
function buildAnswerBlock(
  answers: any[],
  questions: any[],
): string {
  // 构建 questionId → question 映射（用于查找选项文本）
  const qMap = new Map<string, any>();
  (questions || []).forEach((q) => qMap.set(q.id, q));

  return (answers || [])
    .map((a, i) => {
      const q = qMap.get(a.questionId) || {};
      let answerText = '';

      if (a.answer == null || a.answer === '' || (Array.isArray(a.answer) && a.answer.length === 0)) {
        answerText = '（未作答）';
      } else if (q.type === 'single' && q.options) {
        // 单选：把 optionId 翻译成选项文本
        const opt = q.options.find((o: any) => o.id === a.answer || o.value === a.answer);
        answerText = opt ? opt.label : String(a.answer);
      } else if (q.type === 'multiple' && q.options) {
        // 多选：把 optionId 数组翻译成选项文本
        const labels = (a.answer as any[]).map((oid) => {
          const opt = q.options.find((o: any) => o.id === oid || o.value === oid);
          return opt ? opt.label : oid;
        });
        answerText = labels.join('、');
      } else {
        answerText = String(a.answer);
      }

      return `Q${i + 1}. ${a.questionTitle || q.title || ''}
    作答：${answerText}`;
    })
    .join('\n\n');
}

/**
 * 组装发给百炼智能体的 prompt（包含完整指令，不依赖控制台 System Prompt）
 */
function buildPrompt(ctx: {
  childName: string;
  childAge: string;
  childGrade: string;
  parentName: string;
  learningGoals: string;
  weeklyHours: string;
  currentClass: string;
  templateName: string;
  category: string;
  languageZh: string;
  aiTeacherName: string;
  specialties: string;
  knowledgeSummary: string;
  answerBlock: string;
}): string {
  return `你是一位资深的语言培训教育专家，也是【${ctx.aiTeacherName}】的数字化分身。请根据以下学员的问卷作答，生成一份专业的语言能力评估报告。

【必须遵守的输出规范】
1. 所有输出必须是严格的 JSON 对象，不能有任何多余的解释、Markdown 标记、代码块。
2. 输出必须能直接被 JSON.parse() 解析成功，不允许出现注释或尾逗号。
3. 所有文字内容使用中文（CEFR 等级、教材名保留原文）。
4. overallScore 必须是 0-100 的整数。
5. 每个维度的 score 必须是整数，且不超过该维度的 maxScore。
6. strengths / weaknesses / suggestions 的条数必须在 3-5 条之间。
7. studyPlan 分阶段必须 2-4 个阶段。
8. 不得出现空字符串、null 值。

【CEFR 等级与 overallLevel 对应关系】
0-20 → 启蒙；21-40 → 入门；41-60 → 中等；61-75 → 良好；76-88 → 优秀；89-100 → 接近母语水平

【JSON Schema（严格按此结构输出）】
{
  "overallScore": 78,
  "overallLevel": "优秀",
  "cefr": "B2",
  "summary": "1-2 句话总评。语气中肯、专业，既要肯定亮点，也要点出核心差距。",
  "dimensions": [
    {
      "name": "维度名称，如：语音语调 / 词汇量 / 语法掌握 / 听力理解 / 口语表达 / 阅读 / 写作 / 学习兴趣 / 学习习惯",
      "score": 22,
      "maxScore": 25,
      "level": "优秀|良好|中等|待提升",
      "description": "1 句话说明该维度的具体表现，结合问卷答案，不空泛。"
    }
  ],
  "strengths": ["优势点1，结合问卷内容举例。", "优势点2...", "优势点3..."],
  "weaknesses": ["薄弱点1，具体说明差距。", "薄弱点2...", "薄弱点3..."],
  "suggestions": ["建议1：具体、可落地、能立刻执行的动作。", "建议2...", "建议3..."],
  "studyPlan": [
    {
      "phase": "第一阶段（1-3个月）",
      "duration": "3个月",
      "focus": "阶段核心突破方向",
      "content": ["任务1（具体动作+时间/频率）", "任务2（可衡量目标）", "任务3", "任务4"]
    }
  ],
  "recommendedCourse": {
    "name": "推荐课程名称",
    "reason": "1 句话说明为什么推荐这个课程。"
  }
}

【生成质量要求】
- 必须紧扣问卷作答内容，不写空话。
- 维度数量 3-6 个。
- 建议要具体，避免"多听多说多练"这种空话。
- 对家长语气：专业、耐心、共情。

【客户基本信息】
· 学员姓名：${ctx.childName}
· 学员年龄：${ctx.childAge}
· 年级：${ctx.childGrade}
· 家长姓名：${ctx.parentName}
· 学习目标：${ctx.learningGoals}
· 每周课外学习时间：${ctx.weeklyHours}小时
· 当前报班情况：${ctx.currentClass}

【问卷模板信息】
· 模板名称：${ctx.templateName}
· 模板类别：${ctx.category}
· 考察语言：${ctx.languageZh}

【AI 教师信息】
· AI 教师名称：${ctx.aiTeacherName}
· 擅长领域：${ctx.specialties}

【AI 教师知识库摘要（仅供风格/方法论参考，不必逐条复述）】
${ctx.knowledgeSummary}

【学员作答详情】
${ctx.answerBlock}

【最终指令】
请根据以上问卷作答，生成一份${ctx.languageZh}语言能力评估报告。仅输出 JSON，不要任何额外文字、解释或 Markdown 标记。`;
}

/**
 * 从 AiTeacher.knowledgeBase（JSON 字符串）提取摘要
 */
function buildKnowledgeSummary(kbRaw: string | null): string {
  if (!kbRaw) return '（无知识库，按通用教学风格输出）';
  try {
    const kb = JSON.parse(kbRaw);
    if (!Array.isArray(kb) || kb.length === 0) return '（无知识库，按通用教学风格输出）';
    return kb
      .slice(0, 8)
      .map((k: any, i: number) => {
        const title = k.title || k.name || `条目${i + 1}`;
        const content = k.summary || k.content || k.description || '';
        return `${i + 1}. [${k.type || '通用'}] ${title}\n   ${String(content).slice(0, 120)}`;
      })
      .join('\n');
  } catch {
    return '（知识库格式异常，按通用教学风格输出）';
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { templateId, customerId, aiTeacherId, answers } = body;

    if (!templateId) return fail('缺少 templateId');
    if (!customerId) return fail('缺少 customerId');
    if (!aiTeacherId) return fail('缺少 aiTeacherId');
    if (!Array.isArray(answers) || answers.length === 0) return fail('缺少问卷作答 answers');

    // 1. 并行拉取 Template / Customer / AiTeacher
    const [template, customer, aiTeacher] = await Promise.all([
      prisma.template.findUnique({ where: { id: templateId } }),
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.aiTeacher.findUnique({ where: { id: aiTeacherId } }),
    ]);

    if (!template) return fail('问卷模板不存在', 404);
    if (!customer || customer.isDeleted) return fail('客户不存在', 404);
    if (!aiTeacher) return fail('AI 教师不存在', 404);

    // 2. 权限检查（非管理员只能用自己的数据）
    if (!canRead(customer, user, 'ownerId')) return fail('无权限使用该客户数据', 403);
    if (!canRead(aiTeacher, user, 'creatorId')) return fail('无权限使用该 AI 教师', 403);

    // 3. 解析 questions JSON
    let questions: any[] = [];
    try {
      questions = template.questions ? JSON.parse(template.questions) : [];
    } catch {
      questions = [];
    }

    // 4. 组装 prompt
    const languageZh = LANG_ZH[template.language] || template.language;
    let specialties = '综合语言能力提升';
    try {
      const sp = aiTeacher.specialties ? JSON.parse(aiTeacher.specialties) : [];
      if (Array.isArray(sp) && sp.length > 0) specialties = sp.join('、');
    } catch {
      /* noop */
    }

    const prompt = buildPrompt({
      childName: customer.childName || customer.name,
      childAge: customer.childAge ? String(customer.childAge) + '岁' : '未注明',
      childGrade: customer.childGrade || '未注明',
      parentName: customer.name,
      learningGoals: customer.targetExam || '综合能力提升',
      weeklyHours: '3-5',
      currentClass: customer.status === 'converted' ? '已报班' : '未报班',
      templateName: template.name,
      category: template.category || '综合测评',
      languageZh,
      aiTeacherName: aiTeacher.name,
      specialties,
      knowledgeSummary: buildKnowledgeSummary(aiTeacher.knowledgeBase),
      answerBlock: buildAnswerBlock(answers, questions),
    });

    // 5. 调用百炼智能体
    const rawText = await callBailianAgent(prompt, { timeoutMs: 120_000 });
    const parsed = safeJsonParse(rawText) as any;

    if (!parsed || typeof parsed.overallScore !== 'number') {
      return fail('AI 返回内容不符合预期：' + JSON.stringify(parsed).slice(0, 300), 502);
    }

    // 6. 创建 Report 记录
    const reportId = `rpt-${Date.now()}`;
    const report = await prisma.report.create({
      data: {
        id: reportId,
        customerId,
        customerName: customer.name,
        childName: customer.childName || null,
        language: template.language,
        templateId,
        templateName: template.name,
        aiTeacherId,
        aiTeacherName: aiTeacher.name,
        status: 'pending_review',
        overallScore: Math.max(0, Math.min(100, Math.round(parsed.overallScore))),
        overallLevel: parsed.overallLevel || '待评估',
        dimensions: JSON.stringify(parsed.dimensions || []),
        strengths: JSON.stringify(parsed.strengths || []),
        weaknesses: JSON.stringify(parsed.weaknesses || []),
        suggestions: JSON.stringify(parsed.suggestions || []),
        studyPlan: JSON.stringify(parsed.studyPlan || []),
        creatorId: user!.id,
        isBuiltin: false,
        isDeleted: false,
      },
    });

    return ok({ reportId: report.id, overallScore: report.overallScore, overallLevel: report.overallLevel }, '报告生成成功');
  } catch (e: any) {
    console.error('[reports/generate] 百炼调用失败：', e);
    return fail('报告生成失败：' + (e?.message || String(e)), 502);
  }
}
