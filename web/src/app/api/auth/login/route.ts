// POST /api/auth/login - 登录
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken, isAllowedRole } from '@/lib/auth';
import { ok, fail } from '@/lib/response';

export async function POST(req: NextRequest) {
  try {
    const { account, password } = await req.json();
    if (!account || !password) {
      return fail('请输入账号和密码');
    }

    const user = await prisma.user.findUnique({ where: { account } });
    if (!user) {
      return fail('账号或密码错误');
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return fail('账号或密码错误');
    }

    // 角色白名单检查：仅管理员、教师可登录；家长、学生一律拒绝
    if (!isAllowedRole(user.role)) {
      return fail('该账号无权使用本系统，仅管理员和教师可登录');
    }

    const token = signToken({ id: user.id, account: user.account, role: user.role });
    return ok({ token, user: { id: user.id, account: user.account, name: user.name, role: user.role, phone: user.phone, avatar: user.avatar } }, '登录成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
