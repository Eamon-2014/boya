// GET/PUT/DELETE /api/customers/[id]
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { canRead, canModify } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { notifySecurityDenial } from '@/lib/notify';

function serializeCustomer(c: any) {
  return {
    ...c,
    tags: c.tags ? JSON.parse(c.tags) : [],
  };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!customer || customer.isDeleted) {
    return fail('客户不存在', 404);
  }
  if (!canRead(customer, user, 'ownerId')) {
    notifySecurityDenial(prisma, user, '读取', '客户', params.id);
    return fail('客户不存在', 404); // 不暴露存在性
  }

  return ok(serializeCustomer(customer));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const existing = await prisma.customer.findUnique({ where: { id: params.id } });
    if (!existing || existing.isDeleted) {
      return fail('客户不存在', 404);
    }
    if (!canModify(existing, user, 'ownerId')) {
      notifySecurityDenial(prisma, user, '修改', '客户', params.id);
      return fail('无权修改该客户', 403);
    }

    const updateData: any = { updatedAt: new Date() };
    const fields = ['name', 'phone', 'wechatId', 'childName', 'childAge', 'childGrade', 'language', 'targetExam', 'status', 'source', 'remark', 'teacherId'];
    for (const f of fields) {
      if (body[f] !== undefined) {
        updateData[f] = f === 'childAge' ? (body[f] ? parseInt(body[f]) : null) : body[f];
      }
    }
    if (body.tags !== undefined) {
      updateData.tags = JSON.stringify(body.tags || []);
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: updateData,
    });

    return ok(serializeCustomer(customer), '更新成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!customer || customer.isDeleted) {
    return fail('客户不存在', 404);
  }
  if (!canModify(customer, user, 'ownerId')) {
    notifySecurityDenial(prisma, user, '删除', '客户', params.id);
    return fail('无权删除该客户', 403);
  }

  if (customer.isBuiltin) {
    // 内置客户软删除
    await prisma.customer.update({
      where: { id: params.id },
      data: { isDeleted: true, updatedAt: new Date() },
    });
  } else {
    // 自定义客户硬删除：事务删除关联数据
    await prisma.$transaction([
      prisma.followRecord.deleteMany({ where: { customerId: params.id } }),
      prisma.assignment.deleteMany({ where: { customerId: params.id } }),
      prisma.report.deleteMany({ where: { customerId: params.id } }),
      prisma.customer.delete({ where: { id: params.id } }),
    ]);
  }

  return ok(null, '删除成功');
}
