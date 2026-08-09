// POST /api/ai-teachers/[id]/train - 触发 AI 教师训练完成
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail } from '@/lib/response';

// 序列化 AI 教师数据（JSON.parse specialties / knowledgeBase）
function serializeAiTeacher(t: any) {
  return {
    ...t,
    specialties: t.specialties ? JSON.parse(t.specialties) : [],
    knowledgeBase: t.knowledgeBase ? JSON.parse(t.knowledgeBase) : [],
  };
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const existing = await prisma.aiTeacher.findUnique({ where: { id: params.id } });
    if (!existing) {
      return fail('AI 教师不存在', 404);
    }

    const aiTeacher = await prisma.aiTeacher.update({
      where: { id: params.id },
      data: {
        trainingProgress: 100,
        lastTrainedAt: new Date(),
        status: 'ready',
        updatedAt: new Date(),
      },
    });

    return ok(serializeAiTeacher(aiTeacher), '训练完成');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
