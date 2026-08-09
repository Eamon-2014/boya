// GET /api/todos - 待办列表（支持 ?status= 筛选）
// POST /api/todos - 创建待办
import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { visibleScopeNoBuiltin } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const where: any = { ...visibleScopeNoBuiltin(user, 'userId') };
    if (status) where.status = status;

    const list = await prisma.todo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

    const priority = ['high', 'medium', 'low'].includes(body.priority) ? body.priority : 'medium';

    // 解析截止时间
    let dueAt: Date | null = null;
    if (body.dueAt) {
      const d = new Date(body.dueAt);
      if (!isNaN(d.getTime())) dueAt = d;
    }

    const todo = await prisma.todo.create({
      data: {
        id: randomUUID(),
        type: (body.type || 'manual').trim(),
        title,
        description: body.description?.trim() || null,
        priority,
        status: 'pending',
        dueAt,
        userId: user!.id,
      },
    });

    return ok(todo);
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
