// GET /api/settings/api-config - 获取 API 配置
// PUT /api/settings/api-config - 更新 API 配置
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail } from '@/lib/response';

// GET - 返回 apiBaseUrl / apiKey / apiSecret
export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId: user!.id },
      update: {},
      create: { userId: user!.id },
      select: { apiBaseUrl: true, apiKey: true, apiSecret: true },
    });

    return ok(settings);
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}

// PUT - 更新 apiBaseUrl / apiKey / apiSecret
export async function PUT(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const { apiBaseUrl, apiKey, apiSecret } = await req.json();

    const data: any = {};
    if (apiBaseUrl !== undefined) data.apiBaseUrl = apiBaseUrl;
    if (apiKey !== undefined) data.apiKey = apiKey;
    if (apiSecret !== undefined) data.apiSecret = apiSecret;

    const settings = await prisma.userSettings.upsert({
      where: { userId: user!.id },
      update: data,
      create: { userId: user!.id, ...data },
      select: { apiBaseUrl: true, apiKey: true, apiSecret: true },
    });

    return ok(settings, 'API 配置已保存');
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
