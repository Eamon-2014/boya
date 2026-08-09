// src/app/layout.ts - 根布局
export const metadata = {
  title: '教育管理 API',
  description: '语言教培管理系统 - 后端 API 服务',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
