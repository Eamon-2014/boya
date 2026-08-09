// GET /api/templates - 问卷模板列表 / POST - 新建问卷模板
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { visibleScope } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';

// 序列化模板数据（JSON.parse questions）
function serializeTemplate(t: any) {
  return {
    ...t,
    questions: t.questions ? JSON.parse(t.questions) : [],
  };
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';
  const language = url.searchParams.get('language') || '';

  const where: any = { ...visibleScope(user, 'creatorId') };
  if (status) where.status = status;
  if (language) where.language = language;

  const templates = await prisma.template.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });

  return ok(templates.map(serializeTemplate));
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { name, description, language, category, status, usageCount, questions } = body;

    if (!name?.trim()) return fail('请输入模板名称');

    const template = await prisma.template.create({
      data: {
        id: `tpl-custom-${Date.now()}`,
        name,
        description: description || null,
        language: language || 'en',
        category: category || null,
        status: status || 'draft',
        usageCount: usageCount !== undefined ? parseInt(usageCount) : 0,
        questions: JSON.stringify(questions || []),
        creatorId: user!.id,
        creatorName: user!.name,
        isBuiltin: false,
      },
    });

    return ok(serializeTemplate(template), '创建成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
