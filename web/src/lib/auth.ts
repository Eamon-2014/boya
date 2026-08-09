// src/lib/auth.ts - JWT 认证 + bcrypt 密码
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES = '7d';

// 允许登录的角色白名单：只有管理员和教师可以使用本小程序
// 家长、学生等角色一律禁止登录
const ALLOWED_ROLES = ['管理员', '教师'];

/**
 * 检查角色是否允许登录/注册
 * 仅管理员、教师可使用本系统；家长、学生一律拒绝
 */
export function isAllowedRole(role: string | null | undefined): boolean {
  return !!role && ALLOWED_ROLES.includes(role);
}

// 密码哈希
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

// 密码校验
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// 签发 JWT
export function signToken(user: { id: string; account: string; role: string }): string {
  return jwt.sign({ sub: user.id, account: user.account, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });
}

// 从请求头解析 token 并返回用户
export async function getSession(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return null;
    return user;
  } catch {
    return null;
  }
}

// 要求登录，否则返回 401
// 同时做角色白名单检查：家长、学生等非白名单角色一律拒绝（即使 token 有效）
export async function requireUser(req: NextRequest) {
  const user = await getSession(req);
  if (!user) {
    return { user: null, error: Response.json({ success: false, data: null, message: '未登录或登录已过期' }, { status: 401 }) };
  }
  // 角色白名单：仅管理员、教师可调用任何 API
  if (!isAllowedRole(user.role)) {
    return { user: null, error: Response.json({ success: false, data: null, message: '该账号无权使用本系统，仅管理员和教师可登录' }, { status: 403 }) };
  }
  return { user, error: null };
}
