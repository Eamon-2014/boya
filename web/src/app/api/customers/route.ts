// GET /api/customers - 客户列表 / POST - 新建客户
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { visibleScope } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';

// 序列化客户数据（JSON.parse tags）
function serializeCustomer(c: any) {
  return {
    ...c,
    tags: c.tags ? JSON.parse(c.tags) : [],
  };
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';
  const language = url.searchParams.get('language') || '';
  const keyword = url.searchParams.get('keyword') || '';

  const where: any = { isDeleted: false, ...visibleScope(user, 'ownerId') };
  if (status) where.status = status;
  if (language) where.language = language;
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { phone: { contains: keyword } },
      { childName: { contains: keyword } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });

  return ok(customers.map(serializeCustomer));
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { name, phone, wechatId, childName, childAge, childGrade, language, targetExam, source, tags, remark } = body;

    if (!name?.trim()) return fail('请输入客户姓名');
    if (!phone?.trim()) return fail('请输入手机号');

    const customer = await prisma.customer.create({
      data: {
        id: `cust-${Date.now()}`,
        name,
        phone,
        wechatId: wechatId || null,
        childName: childName || null,
        childAge: childAge ? parseInt(childAge) : null,
        childGrade: childGrade || null,
        language: language || 'en',
        targetExam: targetExam || null,
        status: 'new',
        source: source || null,
        tags: JSON.stringify(tags || []),
        remark: remark || null,
        ownerId: user!.id,
        isBuiltin: false,
        followCount: 0,
      },
    });

    return ok(serializeCustomer(customer), '创建成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
