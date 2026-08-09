// GET/PUT/DELETE /api/templates/[id]
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { canRead, canModify } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { notifySecurityDenial } from '@/lib/notify';

// 序列化模板数据（JSON.parse questions）
function serializeTemplate(t: any) {
  return {
    ...t,
    questions: t.questions ? JSON.parse(t.questions) : [],
  };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const template = await prisma.template.findUnique({ where: { id: params.id } });
  if (!template) {
    return fail('模板不存在', 404);
  }
  if (!canRead(template, user, 'creatorId')) {
    notifySecurityDenial(prisma, user, '读取', '模板', params.id);
    return fail('模板不存在', 404); // 不暴露存在性
  }

  return ok(serializeTemplate(template));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const existing = await prisma.template.findUnique({ where: { id: params.id } });
    if (!existing) {
      return fail('模板不存在', 404);
    }
    if (!canModify(existing, user, 'creatorId')) {
      notifySecurityDenial(prisma, user, '修改', '模板', params.id);
      return fail('无权修改该模板', 403);
    }

    const updateData: any = { updatedAt: new Date() };
    const fields = ['name', 'description', 'language', 'category', 'status'];
    for (const f of fields) {
      if (body[f] !== undefined) {
        updateData[f] = body[f];
      }
    }
    if (body.usageCount !== undefined) {
      updateData.usageCount = body.usageCount !== null ? parseInt(body.usageCount) : 0;
    }
    if (body.questions !== undefined) {
      updateData.questions = JSON.stringify(body.questions || []);
    }

    const template = await prisma.template.update({
      where: { id: params.id },
      data: updateData,
    });

    return ok(serializeTemplate(template), '更新成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const template = await prisma.template.findUnique({ where: { id: params.id } });
  if (!template) {
    return fail('模板不存在', 404);
  }
  if (!canModify(template, user, 'creatorId')) {
    notifySecurityDenial(prisma, user, '删除', '模板', params.id);
    return fail('无权删除该模板', 403);
  }

  // 仅非内置模板可删除
  if (template.isBuiltin) {
    return fail('内置模板不可删除', 400);
  }

  // 事务：先删除关联的问卷分配，再删除模板
  await prisma.$transaction([
    prisma.assignment.deleteMany({ where: { templateId: params.id } }),
    prisma.template.delete({ where: { id: params.id } }),
  ]);

  return ok(null, '删除成功');
}
