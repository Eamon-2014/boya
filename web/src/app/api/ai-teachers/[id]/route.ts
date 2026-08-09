// GET/PUT/DELETE /api/ai-teachers/[id]
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { canRead, canModify } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { notifySecurityDenial } from '@/lib/notify';

// 序列化 AI 教师数据（JSON.parse specialties / knowledgeBase）
function serializeAiTeacher(t: any) {
  return {
    ...t,
    specialties: t.specialties ? JSON.parse(t.specialties) : [],
    knowledgeBase: t.knowledgeBase ? JSON.parse(t.knowledgeBase) : [],
  };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const aiTeacher = await prisma.aiTeacher.findUnique({ where: { id: params.id } });
  if (!aiTeacher) {
    return fail('AI 教师不存在', 404);
  }
  if (!canRead(aiTeacher, user, 'creatorId')) {
    notifySecurityDenial(prisma, user, '读取', 'AI教师', params.id);
    return fail('AI 教师不存在', 404); // 不暴露存在性
  }

  return ok(serializeAiTeacher(aiTeacher));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const existing = await prisma.aiTeacher.findUnique({ where: { id: params.id } });
    if (!existing) {
      return fail('AI 教师不存在', 404);
    }
    if (!canModify(existing, user, 'creatorId')) {
      notifySecurityDenial(prisma, user, '修改', 'AI教师', params.id);
      return fail('无权修改该 AI 教师', 403);
    }

    const updateData: any = { updatedAt: new Date() };
    const fields = [
      'name',
      'description',
      'language',
      'originalTeacherId',
      'originalTeacherName',
      'status',
    ];
    for (const f of fields) {
      if (body[f] !== undefined) {
        updateData[f] = body[f];
      }
    }
    // 数值字段
    if (body.trainingProgress !== undefined) {
      updateData.trainingProgress = body.trainingProgress !== null ? parseInt(body.trainingProgress) : 0;
    }
    if (body.knowledgeCount !== undefined) {
      updateData.knowledgeCount = body.knowledgeCount !== null ? parseInt(body.knowledgeCount) : 0;
    }
    if (body.reportCount !== undefined) {
      updateData.reportCount = body.reportCount !== null ? parseInt(body.reportCount) : 0;
    }
    if (body.avgRating !== undefined) {
      updateData.avgRating = body.avgRating !== null ? parseFloat(body.avgRating) : 0;
    }
    // JSON 数组/对象字段
    if (body.specialties !== undefined) {
      updateData.specialties = JSON.stringify(body.specialties || []);
    }
    if (body.knowledgeBase !== undefined) {
      updateData.knowledgeBase = JSON.stringify(body.knowledgeBase || []);
    }
    if (body.lastTrainedAt !== undefined) {
      updateData.lastTrainedAt = body.lastTrainedAt ? new Date(body.lastTrainedAt) : null;
    }

    const aiTeacher = await prisma.aiTeacher.update({
      where: { id: params.id },
      data: updateData,
    });

    return ok(serializeAiTeacher(aiTeacher), '更新成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const aiTeacher = await prisma.aiTeacher.findUnique({ where: { id: params.id } });
  if (!aiTeacher) {
    return fail('AI 教师不存在', 404);
  }
  if (!canModify(aiTeacher, user, 'creatorId')) {
    notifySecurityDenial(prisma, user, '删除', 'AI教师', params.id);
    return fail('无权删除该 AI 教师', 403);
  }

  // 事务：先删除关联的评分，解除报告引用，再删除 AI 教师
  await prisma.$transaction([
    prisma.aiTeacherRating.deleteMany({ where: { aiTeacherId: params.id } }),
    prisma.report.updateMany({ where: { aiTeacherId: params.id }, data: { aiTeacherId: null, aiTeacherName: null } }),
    prisma.aiTeacher.delete({ where: { id: params.id } }),
  ]);

  return ok(null, '删除成功');
}
