// POST /api/templates/[id]/duplicate - 复制模板为新的自定义模板
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { canRead } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { notifySecurityDenial } from '@/lib/notify';

// 序列化模板数据（JSON.parse questions）
function serializeTemplate(t: any) {
  return {
    ...t,
    questions: t.questions ? JSON.parse(t.questions) : [],
  };
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const existing = await prisma.template.findUnique({ where: { id: params.id } });
    if (!existing) {
      return fail('模板不存在', 404);
    }
    if (!canRead(existing, user, 'creatorId')) {
      notifySecurityDenial(prisma, user, '复制', '模板', params.id);
      return fail('模板不存在', 404); // 不暴露存在性
    }

    const newName = body.name?.trim() || `${existing.name} (副本)`;

    const template = await prisma.template.create({
      data: {
        id: `tpl-custom-${Date.now()}`,
        name: newName,
        description: existing.description,
        language: existing.language,
        category: existing.category,
        status: 'draft',
        usageCount: 0,
        questions: existing.questions, // 已经是 JSON 字符串，直接复用
        creatorId: user!.id,
        creatorName: user!.name,
        isBuiltin: false,
      },
    });

    return ok(serializeTemplate(template), '复制成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
