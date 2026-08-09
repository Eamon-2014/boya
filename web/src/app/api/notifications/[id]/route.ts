// DELETE /api/notifications/:id - 删除单条通知
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail } from '@/lib/response';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const { id } = params;
    if (!id) return fail('缺少通知 ID');

    // 查通知，校验权限：只能删自己的私有通知 + 全站广播通知
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) return fail('通知不存在或已删除');

    const canDelete = notif.userId === null || notif.userId === user!.id;
    if (!canDelete) return fail('无权删除该通知', 403);

    await prisma.notification.delete({ where: { id } });

    return ok(null, '已删除');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
