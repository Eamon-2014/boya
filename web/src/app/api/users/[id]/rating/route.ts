// GET/POST /api/users/[id]/rating - 用户评分
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail } from '@/lib/response';

// 获取用户的评分统计（包括当前用户是否已评分）
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, account: true },
    });

    if (!targetUser) {
      return fail('用户不存在', 404);
    }

    // 获取所有对该用户的评分
    const ratings = await prisma.userRating.findMany({
      where: { toUserId: params.id },
      include: {
        fromUser: {
          select: { id: true, name: true, account: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 计算平均分
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 2.5; // 默认 2.5

    // 当前用户对该用户的评分
    const myRating = ratings.find(r => r.fromUserId === user!.id);

    return ok({
      userId: params.id,
      userName: targetUser.name,
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
        fromUser: r.fromUser,
      })),
    });
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}

// 给用户评分（新增或更新）
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { score, comment } = body;

    // 验证目标用户
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return fail('用户不存在', 404);
    }

    // 不能给自己评分
    if (user!.id === params.id) {
      return fail('不能给自己评分');
    }

    // 验证分数范围
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 5) {
      return fail('评分必须在 1-5 分之间');
    }

    // 查找是否已有评分
    const existingRating = await prisma.userRating.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: user!.id,
          toUserId: params.id,
        },
      },
    });

    if (existingRating) {
      // 更新已有评分
      const updatedRating = await prisma.userRating.update({
        where: { id: existingRating.id },
        data: {
          score: scoreNum,
          comment: comment || null,
        },
      });

      // 重新计算目标用户的平均分
      const allRatings = await prisma.userRating.findMany({
        where: { toUserId: params.id },
      });
      const avgRating = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

      return ok({
        score: updatedRating.score,
        avgRating: parseFloat(avgRating.toFixed(1)),
        ratingCount: allRatings.length,
      }, '评分已更新');
    } else {
      // 创建新评分
      const newRating = await prisma.userRating.create({
        data: {
          fromUserId: user!.id,
          toUserId: params.id,
          score: scoreNum,
          comment: comment || null,
        },
      });

      // 重新计算目标用户的平均分
      const allRatings = await prisma.userRating.findMany({
        where: { toUserId: params.id },
      });
      const avgRating = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

      return ok({
        score: newRating.score,
        avgRating: parseFloat(avgRating.toFixed(1)),
        ratingCount: allRatings.length,
      }, '评分成功');
    }
  } catch (e: any) {
    if (e.code === 'P2002') {
      return fail('您已经评过分了');
    }
    return fail(e.message || '服务器错误', 500);
  }
}
