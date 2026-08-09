// GET /api/users - 用户列表（仅管理员）
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { isAdmin } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { notifySecurityDenial } from '@/lib/notify';

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  // 仅管理员可查看用户列表
  if (!isAdmin(user)) {
    notifySecurityDenial(prisma, user, '访问', '用户列表', '');
    return fail('无权访问，仅管理员可查看用户列表', 403);
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        account: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        isBuiltin: true,
        createdAt: true,
        updatedAt: true,
        // 不返回 password 字段
      },
      orderBy: { createdAt: 'asc' },
    });

    return ok(users);
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
