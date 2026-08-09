// PUT /api/auth/me/role - 更改当前用户身份
// body: { role, code? }
// 切换为「管理员」需要授权码 320684；切换为其他身份无需授权码
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail } from '@/lib/response';

const AUTH_CODE = '142857';
const VALID_ROLES = ['管理员', '校区主管', '教师'];

export async function PUT(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const role = (body.role || '').trim();
    if (!VALID_ROLES.includes(role)) {
      return fail('无效的身份类型', 400);
    }

    // 升级为管理员需要授权码
    if (role === '管理员') {
      const code = (body.code || '').trim();
      if (code !== AUTH_CODE) {
        return fail('授权码错误', 403);
      }
    }

    const updated = await prisma.user.update({
      where: { id: user!.id },
      data: { role },
      select: {
        id: true,
        account: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
      },
    });

    return ok(updated);
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
