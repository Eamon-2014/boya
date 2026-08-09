// GET /api/settings - 获取当前用户设置（不存在则创建默认）
// PUT /api/settings - 更新当前用户设置
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail } from '@/lib/response';

// 允许更新的字段白名单
const ALLOWED_FIELDS = [
  'language',
  'theme',
  'campus',
  'timezone',
  'pushEnabled',
  'soundEnabled',
  'vibrationEnabled',
  'quietHour',
  'autoBackup',
  'dataSync',
  'logLevel',
  'lastBackup',
  'apiBaseUrl',
  'apiKey',
  'apiSecret',
] as const;

// GET - 获取用户设置，不存在则创建默认记录
export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId: user!.id },
      update: {},
      create: { userId: user!.id },
    });

    return ok(settings);
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}

// PUT - 更新用户设置
export async function PUT(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const body = await req.json();

    // 仅提取白名单内的字段
    const data: any = {};
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) {
        data[key] = body[key];
      }
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: user!.id },
      update: data,
      create: { userId: user!.id, ...data },
    });

    return ok(settings, '设置已保存');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
