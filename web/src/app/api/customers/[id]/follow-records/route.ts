// GET/POST /api/customers/[id]/follow-records
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { canRead, canModify } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { notifySecurityDenial } from '@/lib/notify';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  // 先校验客户归属
  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!customer || customer.isDeleted) {
    return fail('客户不存在', 404);
  }
  if (!canRead(customer, user, 'ownerId')) {
    notifySecurityDenial(prisma, user, '读取', '客户跟进记录', params.id);
    return fail('客户不存在', 404); // 不暴露存在性
  }

  const records = await prisma.followRecord.findMany({
    where: { customerId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  return ok(records);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { type, typeLabel, icon, content } = body;

    // 校验客户归属（写操作要求 canModify）
    const customer = await prisma.customer.findUnique({ where: { id: params.id } });
    if (!customer || customer.isDeleted) {
      return fail('客户不存在', 404);
    }
    if (!canModify(customer, user, 'ownerId')) {
      notifySecurityDenial(prisma, user, '添加', '客户跟进记录', params.id);
      return fail('无权为该客户添加跟进记录', 403);
    }

    if (!content?.trim()) return fail('请输入跟进内容');

    const record = await prisma.followRecord.create({
      data: {
        customerId: params.id,
        type: type || 'phone',
        typeLabel: typeLabel || '电话',
        icon: icon || '📞',
        content,
        operatorId: user!.id,
      },
    });

    // 更新客户的跟进次数和最后跟进时间（复用前面已查到的 customer）
    if (customer) {
      await prisma.customer.update({
        where: { id: params.id },
        data: {
          followCount: (customer.followCount || 0) + 1,
          lastFollowAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return ok(record, '添加成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
