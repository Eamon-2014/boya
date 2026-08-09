// POST /api/reports/[id]/send - 推送报告给家长
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { canModify } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';
import { notifySecurityDenial } from '@/lib/notify';

// 序列化报告数据（JSON.parse 数组/对象字段）
function serializeReport(r: any) {
  return {
    ...r,
    dimensions: r.dimensions ? JSON.parse(r.dimensions) : [],
    strengths: r.strengths ? JSON.parse(r.strengths) : [],
    weaknesses: r.weaknesses ? JSON.parse(r.weaknesses) : [],
    suggestions: r.suggestions ? JSON.parse(r.suggestions) : [],
    studyPlan: r.studyPlan ? JSON.parse(r.studyPlan) : [],
  };
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { channel, channelLabel } = body;

    if (!channel?.trim()) return fail('请选择推送渠道');

    const existing = await prisma.report.findUnique({ where: { id: params.id } });
    if (!existing || existing.isDeleted) {
      return fail('报告不存在', 404);
    }
    if (!canModify(existing, user, 'creatorId')) {
      notifySecurityDenial(prisma, user, '推送', '报告发送', params.id);
      return fail('无权推送该报告', 403);
    }

    const report = await prisma.report.update({
      where: { id: params.id },
      data: {
        sentToParent: true,
        sentAt: new Date(),
        pushChannel: channel,
        pushChannelLabel: channelLabel || null,
        status: 'sent',
        updatedAt: new Date(),
      },
    });

    return ok(serializeReport(report), '推送成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
