// GET/PATCH /api/assignments/[id]
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { canRead, canModify } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { notifySecurityDenial } from '@/lib/notify';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const assignment = await prisma.assignment.findUnique({ where: { id: params.id } });
  if (!assignment) {
    return fail('分配记录不存在', 404);
  }
  if (!canRead(assignment, user, 'assignedBy')) {
    notifySecurityDenial(prisma, user, '读取', '问卷分配', params.id);
    return fail('分配记录不存在', 404); // 不暴露存在性
  }

  return ok(assignment);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const existing = await prisma.assignment.findUnique({ where: { id: params.id } });
    if (!existing) {
      return fail('分配记录不存在', 404);
    }
    if (!canModify(existing, user, 'assignedBy')) {
      notifySecurityDenial(prisma, user, '修改', '问卷分配', params.id);
      return fail('无权修改该分配记录', 403);
    }

    const updateData: any = {};
    // 主要用于更新状态
    if (body.status !== undefined) {
      updateData.status = body.status;
      // 完成状态时记录完成时间
      if (body.status === 'completed' && !existing.completedAt) {
        updateData.completedAt = new Date();
      }
    }
    if (body.parentName !== undefined) {
      updateData.parentName = body.parentName || null;
    }
    if (body.parentPhone !== undefined) {
      updateData.parentPhone = body.parentPhone || null;
    }
    if (body.expireAt !== undefined) {
      updateData.expireAt = body.expireAt ? new Date(body.expireAt) : null;
    }

    const assignment = await prisma.assignment.update({
      where: { id: params.id },
      data: updateData,
    });

    return ok(assignment, '更新成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const existing = await prisma.assignment.findUnique({ where: { id: params.id } });
    if (!existing) {
      return fail('分配记录不存在', 404);
    }
    if (!canModify(existing, user, 'assignedBy')) {
      notifySecurityDenial(prisma, user, '删除', '问卷分配', params.id);
      return fail('无权删除该分配记录', 403);
    }

    await prisma.assignment.delete({ where: { id: params.id } });

    return ok(null, '删除成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
