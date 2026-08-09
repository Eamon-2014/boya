// GET /api/ai-teachers - AI 教师列表 / POST - 新建 AI 教师
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { visibleScope } from '@/lib/visibility';
import { ok, fail } from '@/lib/response';

// 序列化 AI 教师数据（JSON.parse specialties / knowledgeBase）
function serializeAiTeacher(t: any) {
  return {
    ...t,
    specialties: t.specialties ? JSON.parse(t.specialties) : [],
    knowledgeBase: t.knowledgeBase ? JSON.parse(t.knowledgeBase) : [],
  };
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';
  const language = url.searchParams.get('language') || '';

  const where: any = { ...visibleScope(user, 'creatorId') };
  if (status) where.status = status;
  if (language) where.language = language;

  const aiTeachers = await prisma.aiTeacher.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });

  return ok(aiTeachers.map(serializeAiTeacher));
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const {
      name,
      description,
      language,
      specialties,
      originalTeacherId,
      originalTeacherName,
      knowledgeBase,
    } = body;

    if (!name?.trim()) return fail('请输入 AI 教师名称');

    const aiTeacher = await prisma.aiTeacher.create({
      data: {
        id: `ai-${Date.now()}`,
        name,
        description: description || null,
        language: language || 'en',
        specialties: JSON.stringify(specialties || []),
        originalTeacherId: originalTeacherId || null,
        originalTeacherName: originalTeacherName || null,
        status: 'training',
        trainingProgress: 0,
        knowledgeCount: 0,
        reportCount: 0,
        avgRating: 2.5,
        ratingCount: 0,
        knowledgeBase: JSON.stringify(knowledgeBase || []),
        creatorId: user!.id,
        isBuiltin: false,
      },
    });

    return ok(serializeAiTeacher(aiTeacher), '创建成功');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
