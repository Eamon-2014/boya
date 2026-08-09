// GET/PUT/DELETE /api/reports/[id]
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { canRead, canModify } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { notifySecurityDenial } from '@/lib/notify';

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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report || report.isDeleted) {
    return fail('报告不存在', 404);
  }
  if (!canRead(report, user, 'creatorId')) {
    notifySecurityDenial(prisma, user, '读取', '报告', params.id);
    return fail('报告不存在', 404); // 不暴露存在性
  }

  return ok(serializeReport(report));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const existing = await prisma.report.findUnique({ where: { id: params.id } });
    if (!existing || existing.isDeleted) {
      return fail('报告不存在', 404);
    }
    if (!canModify(existing, user, 'creatorId')) {
      notifySecurityDenial(prisma, user, '修改', '报告', params.id);
      return fail('无权修改该报告', 403);
    }

    const updateData: any = { updatedAt: new Date() };
    const fields = [
      'customerId',
      'customerName',
      'childName',
      'language',
      'templateId',
      'templateName',
      'answerId',
      'aiTeacherId',
      'aiTeacherName',
      'status',
      'overallLevel',
    ];
    for (const f of fields) {
      if (body[f] !== undefined) {
        updateData[f] = body[f];
      }
    }
    if (body.overallScore !== undefined) {
      updateData.overallScore = body.overallScore !== null ? parseInt(body.overallScore) : 0;
    }
    // 数组/对象字段统一 JSON.stringify
    const jsonFields = ['dimensions', 'strengths', 'weaknesses', 'suggestions', 'studyPlan'];
    for (const f of jsonFields) {
      if (body[f] !== undefined) {
        updateData[f] = JSON.stringify(body[f] || []);
      }
    }

    const report = await prisma.report.update({
      where: { id: params.id },
      data: updateData,
    });

    return ok(serializeReport(report), '更新成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report || report.isDeleted) {
    return fail('报告不存在', 404);
  }
  if (!canModify(report, user, 'creatorId')) {
    notifySecurityDenial(prisma, user, '删除', '报告', params.id);
    return fail('无权删除该报告', 403);
  }

  if (report.isBuiltin) {
    // 内置报告软删除
    await prisma.report.update({
      where: { id: params.id },
      data: { isDeleted: true, updatedAt: new Date() },
    });
  } else {
    // 自定义报告硬删除
    await prisma.report.delete({ where: { id: params.id } });
  }

  return ok(null, '删除成功');
}
