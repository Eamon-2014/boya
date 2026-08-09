// PATCH /api/notifications/[id]/read - 将单条通知标记为已读
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail } from '@/lib/response';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const { id } = params;

    // 仅允许操作当前用户可见的通知（本人私有 + 全站广播）
    const existing = await prisma.notification.findFirst({
      where: { id, OR: [{ userId: user!.id }, { userId: null }] },
    });
    if (!existing) {
      return fail('通知不存在', 404);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return ok(updated, '已标记为已读');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
