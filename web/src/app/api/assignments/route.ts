// GET /api/assignments - 问卷分配列表 / POST - 新建问卷分配
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { visibleScope } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';
  const customerId = url.searchParams.get('customerId') || '';

  const where: any = { ...visibleScope(user, 'assignedBy') };
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: { assignedAt: 'desc' },
  });

  return ok(assignments);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const {
      templateId,
      templateName,
      customerId,
      customerName,
      parentName,
      parentPhone,
      status,
      expireAt,
    } = body;

    if (!templateId?.trim()) return fail('请选择问卷模板');
    if (!customerId?.trim()) return fail('请选择客户');

    // 校验模板与客户存在
    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) return fail('问卷模板不存在', 404);

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.isDeleted) return fail('客户不存在', 404);

    const assignment = await prisma.assignment.create({
      data: {
        id: `asg-${Date.now()}`,
        templateId,
        templateName: templateName || template.name,
        customerId,
        customerName: customerName || customer.name,
        parentName: parentName || null,
        parentPhone: parentPhone || null,
        status: status || 'pending',
        assignedBy: user!.id,
        assignedByName: user!.name,
        assignedAt: new Date(),
        completedAt: null,
        expireAt: expireAt ? new Date(expireAt) : null,
      },
    });

    return ok(assignment, '分配成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
