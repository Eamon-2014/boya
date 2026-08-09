// src/lib/response.ts - 统一 API 响应封装
import { NextResponse } from 'next/server';

export function ok(data: any, message = '成功') {
  return NextResponse.json({ success: true, data, message });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, data: null, message }, { status });
}
