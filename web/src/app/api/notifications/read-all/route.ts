// PATCH /api/notifications/read-all - 将当前用户所有未读通知标记为已读
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail } from '@/lib/response';

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const result = await prisma.notification.updateMany({
      where: {
        read: false,
        OR: [{ userId: user!.id }, { userId: null }],
      },
      data: { read: true },
    });

    return ok({ count: result.count }, `已标记 ${result.count} 条通知为已读`);
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
