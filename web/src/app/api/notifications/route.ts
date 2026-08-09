// GET /api/notifications - 通知列表（支持 ?type= 筛选）
// DELETE /api/notifications - 清空当前用户可见通知
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail } from '@/lib/response';

// 当前用户可见通知：本人私有通知 + 全站广播通知（userId 为空）
function visibleWhere(userId: string, type?: string) {
  return {
    OR: [{ userId }, { userId: null }],
    ...(type ? { type } : {}),
  };
}

// GET - 获取通知列表，按创建时间倒序
export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;

    const list = await prisma.notification.findMany({
      where: visibleWhere(user!.id, type),
      orderBy: { createdAt: 'desc' },
    });

    return ok(list);
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}

// DELETE - 清空当前用户可见通知
export async function DELETE(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    await prisma.notification.deleteMany({
      where: visibleWhere(user!.id),
    });

    return ok(null, '已清空通知');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
