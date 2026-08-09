// src/middleware.ts - API 鉴权中间件
import { NextRequest, NextResponse } from 'next/server';

// 白名单路径（无需登录）
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 仅拦截 /api 路径
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 白名单放行
  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  // 检查 Authorization
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, data: null, message: '未登录或登录已过期' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
