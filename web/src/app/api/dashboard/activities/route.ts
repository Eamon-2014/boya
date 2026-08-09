// GET /api/dashboard/activities - 最近活动列表（默认 10 条）
// POST /api/dashboard/activities - 发布一条动态
// DELETE /api/dashboard/activities?id=xxx - 删除一条动态
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { isAdmin } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { notifySecurityDenial } from '@/lib/notify';

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50);

    const list = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return ok(list);
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const title = (body.title || '').trim();
    if (!title) return fail('标题不能为空', 400);

    const activity = await prisma.activity.create({
      data: {
        type: (body.type || 'manual').trim(),
        title,
        description: body.description?.trim() || null,
        operatorName: user.name || user.account,
        operatorId: user.id,
      },
    });

    return ok(activity);
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return fail('缺少动态 id', 400);

    // 仅允许删除自己的动态（管理员除外）
    const activity = await prisma.activity.findUnique({ where: { id } });
    if (!activity) return fail('动态不存在', 404);
    if (!isAdmin(user) && activity.operatorId && activity.operatorId !== user.id) {
      notifySecurityDenial(prisma, user, '删除', '团队动态', id);
      return fail('无权删除他人动态', 403);
    }

    await prisma.activity.delete({ where: { id } });
    return ok({ id });
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
