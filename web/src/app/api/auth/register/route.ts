// POST /api/auth/register - 注册（需授权码）
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, isAllowedRole } from '@/lib/auth';
import { ok, fail } from '@/lib/response';

const RESERVED_ACCOUNTS = ['admin', 'li.teacher2024', 'wang.teacher2024'];
const ADMIN_CODE = '142857';

export async function POST(req: NextRequest) {
  try {
    const { account, password, name, phone, role, authCode } = await req.json();

    // 表单校验
    if (!account?.trim()) return fail('请输入账号');
    if (!password?.trim()) return fail('请输入密码');
    if (!name?.trim()) return fail('请输入姓名');
    if (!phone?.trim()) return fail('请输入手机号');
    if (!authCode?.trim()) return fail('请输入管理员码');

    // 验证管理员码
    if (authCode !== ADMIN_CODE) {
      return fail('管理员码错误');
    }

    // 角色白名单检查：仅允许注册管理员或教师，禁止注册家长/学生
    const finalRole = role || '教师';
    if (!isAllowedRole(finalRole)) {
      return fail('无权注册该角色，仅管理员和教师可使用本系统');
    }

    // 检查保留账号
    if (RESERVED_ACCOUNTS.includes(account)) {
      return fail('该账号已注册');
    }

    // 检查账号是否已存在
    const existing = await prisma.user.findUnique({ where: { account } });
    if (existing) {
      return fail('该账号已注册');
    }

    // 创建用户
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        account,
        password: hashedPassword,
        name,
        phone,
        role: finalRole,
        isBuiltin: false,
        settings: { create: {} },
      },
    });

    const token = signToken({ id: user.id, account: user.account, role: user.role });
    return ok({ token, user: { id: user.id, account: user.account, name: user.name, role: user.role, phone: user.phone } }, '注册成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
