// GET /api/auth/me - 获取当前用户信息
import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { ok, fail } from '@/lib/response';

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  return ok({
    id: user!.id,
    account: user!.account,
    name: user!.name,
    role: user!.role,
    phone: user!.phone,
    avatar: user!.avatar,
  });
}
