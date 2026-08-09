// POST /api/auth/logout - 登出（前端清除 token 即可）
import { ok } from '@/lib/response';

export async function POST() {
  return ok(null, '已退出登录');
}
