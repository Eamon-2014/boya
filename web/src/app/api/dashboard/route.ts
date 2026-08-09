// GET /api/dashboard - 仪表盘聚合统计（核心指标 + 焦点卡片 + 待办 + 漏斗）
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail } from '@/lib/response';

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const activeCustomerWhere = { isDeleted: false };

    // 并行查询各项统计指标
    const [
      todayNewCustomers,
      todayFollowTasks,
      pendingQuestionnaires,
      pendingReports,
      monthConvertedCustomers,
      monthNewCustomers,
      totalCustomers,
      activeAITeachers,
      followingCount,
      convertedCount,
      trialCustomers,
      pendingTodos,
    ] = await Promise.all([
      // 今日新增客户
      prisma.customer.count({
        where: { ...activeCustomerWhere, createdAt: { gte: startOfToday, lte: endOfToday } },
      }),
      // 今日跟进任务（今日产生的跟进记录）
      prisma.followRecord.count({
        where: { createdAt: { gte: startOfToday, lte: endOfToday } },
      }),
      // 待填问卷（pending 状态的分配）
      prisma.assignment.count({ where: { status: 'pending' } }),
      // 待处理报告（生成中 / 待审核）
      prisma.report.count({
        where: { isDeleted: false, status: { in: ['generating', 'pending'] } },
      }),
      // 本月转化客户（状态变更发生在本月）
      prisma.customer.count({
        where: { status: 'converted', updatedAt: { gte: startOfMonth, lte: endOfMonth } },
      }),
      // 本月新增客户（用于计算转化率）
      prisma.customer.count({
        where: { ...activeCustomerWhere, createdAt: { gte: startOfMonth, lte: endOfMonth } },
      }),
      // 客户总数
      prisma.customer.count({ where: activeCustomerWhere }),
      // 已就绪 AI 教师
      prisma.aiTeacher.count({ where: { status: 'ready' } }),
      // 跟进中客户数（漏斗）
      prisma.customer.count({ where: { ...activeCustomerWhere, status: 'following' } }),
      // 已转化客户数（漏斗）
      prisma.customer.count({ where: { ...activeCustomerWhere, status: 'converted' } }),
      // 体验课客户数（漏斗：拥有 trial 类型跟进记录的去重客户）
      prisma.followRecord.findMany({
        where: { type: 'trial' },
        select: { customerId: true },
        distinct: ['customerId'],
      }),
      // 待办事项
      prisma.todo.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const trialCount = trialCustomers.length;
    const monthConversionRate = monthNewCustomers > 0
      ? Math.round((monthConvertedCustomers / monthNewCustomers) * 1000) / 10
      : 0;

    const stats = {
      todayNewCustomers,
      todayFollowTasks,
      pendingQuestionnaires,
      pendingReports,
      monthConvertedCustomers,
      monthConversionRate,
      totalCustomers,
      activeAITeachers,
    };

    const focusCards = [
      {
        id: 'following',
        title: '待跟进客户',
        count: followingCount,
        icon: 'user-follow',
        color: 'blue',
        targetUrl: '/customers?status=following',
      },
      {
        id: 'pending-reports',
        title: '待处理报告',
        count: pendingReports,
        icon: 'document',
        color: 'orange',
        targetUrl: '/reports?status=pending',
      },
      {
        id: 'pending-questionnaires',
        title: '待填问卷',
        count: pendingQuestionnaires,
        icon: 'edit',
        color: 'green',
        targetUrl: '/questionnaires/assignments?status=pending',
      },
      {
        id: 'ai-teachers',
        title: 'AI 教师',
        count: activeAITeachers,
        icon: 'cpu',
        color: 'purple',
        targetUrl: '/ai-teachers?status=ready',
      },
    ];

    const todos = pendingTodos;

    const funnel = {
      total: totalCustomers,
      following: followingCount,
      trial: trialCount,
      converted: convertedCount,
    };

    return ok({ stats, focusCards, todos, funnel });
  } catch (e: any) {
    return fail(e.message || '服务器错误', 500);
  }
}
