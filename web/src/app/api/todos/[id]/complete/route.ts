// POST /api/todos/[id]/complete - 将待办标记为已完成
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { canModify } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { notifySecurityDenial } from '@/lib/notify';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const { id } = params;

    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      return fail('待办不存在', 404);
    }
    if (!canModify(existing, user, 'userId')) {
      notifySecurityDenial(prisma, user, '完成', '待办', id);
      return fail('无权操作该待办', 403);
    }

    const updated = await prisma.todo.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    return ok(updated, '已完成');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
