// PATCH /api/reports/[id]/review - 审核报告（通过/驳回）
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { isAdmin } from '@/lib/visibility';
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    // 仅管理员可审核报告
    if (!isAdmin(user)) {
      notifySecurityDenial(prisma, user, '审核', '报告审核', params.id);
      return fail('仅管理员可审核报告', 403);
    }

    const body = await req.json();
    const { action, comment, rejectReason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return fail('请指定有效的审核操作（approve/reject）');
    }

    const existing = await prisma.report.findUnique({ where: { id: params.id } });
    if (!existing || existing.isDeleted) {
      return fail('报告不存在', 404);
    }

    const updateData: any = { updatedAt: new Date() };

    if (action === 'approve') {
      updateData.status = 'approved';
      updateData.reviewerId = user!.id;
      updateData.reviewerName = user!.name;
      updateData.reviewedAt = new Date();
      updateData.reviewComment = comment || null;
    } else {
      // reject
      if (!rejectReason?.trim()) {
        return fail('请填写驳回原因');
      }
      updateData.status = 'rejected';
      updateData.rejectReason = rejectReason;
      updateData.rejectedAt = new Date();
      updateData.reviewerId = user!.id;
      updateData.reviewerName = user!.name;
    }

    const report = await prisma.report.update({
      where: { id: params.id },
      data: updateData,
    });

    return ok(
      serializeReport(report),
      action === 'approve' ? '审核通过' : '已驳回',
    );
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
