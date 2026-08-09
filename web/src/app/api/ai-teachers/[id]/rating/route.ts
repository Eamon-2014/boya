// GET/POST /api/ai-teachers/[id]/rating - AI 教师评分
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail } from '@/lib/response';

// 获取 AI 教师的评分统计
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const aiTeacher = await prisma.aiTeacher.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    });

    if (!aiTeacher) {
      return fail('AI 教师不存在', 404);
    }

    // 获取所有对该 AI 教师的评分
    const ratings = await prisma.aiTeacherRating.findMany({
      where: { aiTeacherId: params.id },
      include: {
        user: {
          select: { id: true, name: true, account: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 计算平均分
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 2.5;

    // 当前用户对该 AI 教师的评分
    const myRating = ratings.find(r => r.userId === user!.id);

    return ok({
      aiTeacherId: params.id,
      aiTeacherName: aiTeacher.name,
      avgRating: parseFloat(avgRating.toFixed(1)),
      ratingCount: ratings.length,
      myRating: myRating ? {
        score: myRating.score,
        comment: myRating.comment,
        createdAt: myRating.createdAt,
      } : null,
      ratings: ratings.map(r => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt,
        user: r.user,
      })),
    });
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}

// 给 AI 教师评分
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { score, comment } = body;

    // 验证 AI 教师
    const aiTeacher = await prisma.aiTeacher.findUnique({
      where: { id: params.id },
    });

    if (!aiTeacher) {
      return fail('AI 教师不存在', 404);
    }

    // 验证分数范围
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 5) {
      return fail('评分必须在 1-5 分之间');
    }

    // 查找是否已有评分
    const existingRating = await prisma.aiTeacherRating.findUnique({
      where: {
        aiTeacherId_userId: {
          aiTeacherId: params.id,
          userId: user!.id,
        },
      },
    });

    if (existingRating) {
      // 更新已有评分
      const updatedRating = await prisma.aiTeacherRating.update({
        where: { id: existingRating.id },
        data: {
          score: scoreNum,
          comment: comment || null,
        },
      });

      // 重新计算平均分
      const allRatings = await prisma.aiTeacherRating.findMany({
        where: { aiTeacherId: params.id },
      });
      const avgRating = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

      // 更新 AI 教师表的 avgRating 和 ratingCount
      await prisma.aiTeacher.update({
        where: { id: params.id },
        data: {
          avgRating: parseFloat(avgRating.toFixed(1)),
          ratingCount: allRatings.length,
        },
      });

      return ok({
        score: updatedRating.score,
        avgRating: parseFloat(avgRating.toFixed(1)),
        ratingCount: allRatings.length,
      }, '评分已更新');
    } else {
      // 创建新评分
      const newRating = await prisma.aiTeacherRating.create({
        data: {
          aiTeacherId: params.id,
          userId: user!.id,
          score: scoreNum,
          comment: comment || null,
        },
      });

      // 重新计算平均分
      const allRatings = await prisma.aiTeacherRating.findMany({
        where: { aiTeacherId: params.id },
      });
      const avgRating = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

      // 更新 AI 教师表的 avgRating 和 ratingCount
      await prisma.aiTeacher.update({
        where: { id: params.id },
        data: {
          avgRating: parseFloat(avgRating.toFixed(1)),
          ratingCount: allRatings.length,
        },
      });

      return ok({
        score: newRating.score,
        avgRating: parseFloat(avgRating.toFixed(1)),
        ratingCount: allRatings.length,
      }, '评分成功');
    }
  } catch (e: any) {
    if (e.code === 'P2002') {
      return fail('您已经给该 AI 教师评过分了');
    }
    return fail(e.message || '服务器错误', 500);
  }
}
