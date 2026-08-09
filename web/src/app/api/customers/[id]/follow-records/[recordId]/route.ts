// DELETE /api/customers/[id]/follow-records/[recordId]
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { canModify } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { notifySecurityDenial } from '@/lib/notify';

export async function DELETE(req: NextRequest, { params }: { params: { id: string; recordId: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  // 先校验客户归属（写操作要求 canModify）
  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!customer || customer.isDeleted) {
    return fail('客户不存在', 404);
  }
  if (!canModify(customer, user, 'ownerId')) {
    notifySecurityDenial(prisma, user, '删除', '跟进记录', params.recordId);
    return fail('无权删除该客户的跟进记录', 403);
  }

  const record = await prisma.followRecord.findUnique({
    where: { id: params.recordId },
  });

  if (!record || record.customerId !== params.id) {
    return fail('跟进记录不存在', 404);
  }

  await prisma.followRecord.delete({ where: { id: params.recordId } });

  // 更新客户跟进次数（复用前面已查到的 customer）
  if (customer && customer.followCount > 0) {
    await prisma.customer.update({
      where: { id: params.id },
      data: {
        followCount: customer.followCount - 1,
        updatedAt: new Date(),
      },
    });
  }

  return ok(null, '删除成功');
}
