// PUT /api/todos/[id] - 更新待办
// DELETE /api/todos/[id] - 删除待办
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { canModify } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { notifySecurityDenial } from '@/lib/notify';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const existing = await prisma.todo.findUnique({ where: { id: params.id } });
    if (!existing) {
      return fail('待办不存在', 404);
    }
    if (!canModify(existing, user, 'userId')) {
      notifySecurityDenial(prisma, user, '修改', '待办', params.id);
      return fail('无权修改该待办', 403);
    }

    const updateData: any = {};

    if (body.title !== undefined) {
      const title = (body.title || '').trim();
      if (!title) return fail('标题不能为空', 400);
      updateData.title = title;
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }
    if (body.priority !== undefined) {
      const priority = ['high', 'medium', 'low'].includes(body.priority) ? body.priority : 'medium';
      updateData.priority = priority;
    }
    if (body.dueAt !== undefined) {
      let dueAt: Date | null = null;
      if (body.dueAt) {
        const d = new Date(body.dueAt);
        if (!isNaN(d.getTime())) dueAt = d;
      }
      updateData.dueAt = dueAt;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
      // 标记为已完成时记录完成时间
      if (body.status === 'completed' && !existing.completedAt) {
        updateData.completedAt = new Date();
      }
      // 重新设为待办时清空完成时间
      if (body.status === 'pending') {
        updateData.completedAt = null;
      }
    }

    const todo = await prisma.todo.update({
      where: { id: params.id },
      data: updateData,
    });

    return ok(todo, '更新成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const existing = await prisma.todo.findUnique({ where: { id: params.id } });
    if (!existing) {
      return fail('待办不存在', 404);
    }
    if (!canModify(existing, user, 'userId')) {
      notifySecurityDenial(prisma, user, '删除', '待办', params.id);
      return fail('无权删除该待办', 403);
    }

    await prisma.todo.delete({ where: { id: params.id } });

    return ok(null, '删除成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
