// src/lib/notify.ts - 管理员通知辅助函数
// 用于安全事件、异常操作等场景，向管理员发送通知
import { PrismaClient } from '@prisma/client';

/**
 * 给管理员发送通知
 * @param prisma PrismaClient 实例
 * @param type 通知类型（system/security/report/customer/ai）
 * @param title 通知标题
 * @param content 通知内容
 * @param opts 可选参数 { icon, color, targetUrl, broadcast }
 *   - broadcast: true 时为全站广播（userId=null），否则发给所有管理员
 */
export async function notifyAdmin(
  prisma: PrismaClient,
  type: string,
  title: string,
  content: string,
  opts?: { icon?: string; color?: string; targetUrl?: string; broadcast?: boolean },
) {
  try {
    if (opts?.broadcast) {
      // 全站广播（userId = null）
      await prisma.notification.create({
        data: {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: null,
          type,
          title,
          content,
          time: new Date().toLocaleString('zh-CN'),
          read: false,
          icon: opts.icon || '🔔',
          color: opts.color || '#2563EB',
          targetUrl: opts.targetUrl || null,
          isTab: false,
          isBuiltin: false,
        },
      });
    } else {
      // 发给所有管理员
      const admins = await prisma.user.findMany({
        where: { role: '管理员' },
        select: { id: true },
      });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            id: `notif-${Date.now()}-${admin.id}-${Math.random().toString(36).slice(2, 6)}`,
            userId: admin.id,
            type,
            title,
            content,
            time: new Date().toLocaleString('zh-CN'),
            read: false,
            icon: opts?.icon || '🔔',
            color: opts?.color || '#2563EB',
            targetUrl: opts?.targetUrl || null,
            isTab: false,
            isBuiltin: false,
          },
        });
      }
    }
  } catch (e) {
    // 通知发送失败不应影响主业务流程，仅记录日志
    console.error('[notifyAdmin] 发送通知失败:', e);
  }
}

/**
 * 越权访问告警：当某用户尝试访问/修改不属于自己的资源时，向管理员发送安全通知。
 * fire-and-forget：不阻塞主流程，不抛异常。
 *
 * @param prisma PrismaClient 实例
 * @param user 当前用户（已通过认证）
 * @param action 操作描述，如 "读取客户"、"删除报告"
 * @param resourceType 资源类型，如 "客户"、"报告"
 * @param resourceId 资源 ID
 */
export function notifySecurityDenial(
  prisma: PrismaClient,
  user: { id: string; name?: string; account?: string; role?: string } | null | undefined,
  action: string,
  resourceType: string,
  resourceId: string,
) {
  if (!user) return;
  const userName = user.name || user.account || user.id;
  const userRole = user.role || '未知';
  const time = new Date().toLocaleString('zh-CN');
  const content = `用户「${userName}」（角色：${userRole}）于 ${time} 尝试${action}不属于自己的${resourceType}（ID: ${resourceId}）。该操作已被拒绝。`;
  // 不 await：fire-and-forget，避免阻塞响应
  notifyAdmin(prisma, 'security', `⚠️ 越权访问告警`, content, {
    icon: '🛡️',
    color: '#DC2626',
  }).catch(() => {});
}
