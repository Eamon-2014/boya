// POST /api/auth/impersonate - 管理员伪装登录（以目标用户身份登录，无需密码）
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, signToken, isAllowedRole } from '@/lib/auth';
import { isAdmin } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { notifySecurityDenial } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  // 仅管理员可伪装登录
  if (!isAdmin(user)) {
    notifySecurityDenial(prisma, user, '访问', '伪装登录', '');
    return fail('无权操作，仅管理员可伪装登录', 403);
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return fail('请指定要登录的目标用户');
    }

    // 不能伪装成自己
    if (userId === user!.id) {
      return fail('无需伪装成自己，请直接使用管理员账号');
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return fail('目标用户不存在', 404);
    }

    // 角色白名单检查：家长/学生不可使用本系统，无需伪装
    if (!isAllowedRole(targetUser.role)) {
      return fail(`${targetUser.name}（${targetUser.role}）无权使用本系统，仅管理员和教师可登录，无需伪装`, 403);
    }

    // 签发目标用户的 JWT（与管理员真实登录该账号效果一致）
    const token = signToken({
      id: targetUser.id,
      account: targetUser.account,
      role: targetUser.role,
    });

    return ok({
      token,
      user: {
        id: targetUser.id,
        account: targetUser.account,
        name: targetUser.name,
        role: targetUser.role,
        phone: targetUser.phone,
        avatar: targetUser.avatar,
      },
      impersonatedBy: user!.id,
      impersonatedByName: user!.name,
    }, `已切换为 ${targetUser.name} 的身份`);
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
