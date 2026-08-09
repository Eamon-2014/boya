// GET /api/reports - 评估报告列表 / POST - 新建评估报告
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { visibleScope } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';

// 序列化报告数据（JSON.parse 数组/对象字段）
function serializeReport(r: any) {
  return {
    ...r,
    dimensions: r.dimensions ? JSON.parse(r.dimensions) : [],
    strengths: r.strengths ? JSON.parse(r.strengths) : [],
    weaknesses: r.weaknesses ? JSON.parse(r.weaknesses) : [],
    suggestions: r.suggestions ? JSON.parse(r.suggestions) : [],
    studyPlan: r.studyPlan ? JSON.parse(r.studyPlan) : [],
  };
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';

  const where: any = { isDeleted: false, ...visibleScope(user, 'creatorId') };
  if (status) where.status = status;

  const reports = await prisma.report.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });

  return ok(reports.map(serializeReport));
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const {
      customerId,
      customerName,
      childName,
      language,
      templateId,
      templateName,
      answerId,
      aiTeacherId,
      aiTeacherName,
      status,
      overallScore,
      overallLevel,
      dimensions,
      strengths,
      weaknesses,
      suggestions,
      studyPlan,
    } = body;

    if (!customerId?.trim()) return fail('请选择客户');
    if (!customerName?.trim()) return fail('请输入客户姓名');

    const report = await prisma.report.create({
      data: {
        id: `rpt-${Date.now()}`,
        customerId,
        customerName,
        childName: childName || null,
        language: language || 'en',
        templateId: templateId || null,
        templateName: templateName || null,
        answerId: answerId || null,
        aiTeacherId: aiTeacherId || null,
        aiTeacherName: aiTeacherName || null,
        status: status || 'generating',
        overallScore: overallScore !== undefined ? parseInt(overallScore) : 0,
        overallLevel: overallLevel || null,
        dimensions: JSON.stringify(dimensions || []),
        strengths: JSON.stringify(strengths || []),
        weaknesses: JSON.stringify(weaknesses || []),
        suggestions: JSON.stringify(suggestions || []),
        studyPlan: JSON.stringify(studyPlan || []),
        creatorId: user!.id,
        isBuiltin: false,
        isDeleted: false,
      },
    });

    return ok(serializeReport(report), '创建成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
