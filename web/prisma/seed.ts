// prisma/seed.ts - 数据库播种脚本
// 运行: npm run db:seed (需要先 npm install && npx prisma db push)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 导入种子数据（CommonJS 模块，tsx 支持）
// 种子数据位于项目根 data/ 目录（与小程序共用），相对路径从 prisma/ 计算
const { DEMO_ACCOUNTS } = require('../../data/accounts');
const { customers: seedCustomers } = require('../../data/customers');
const { reports: seedReports } = require('../../data/reports');
const { aiTeachers: seedAiTeachers } = require('../../data/aiTeachers');
const { templates: seedTemplates, assignments: seedAssignments } = require('../../data/questionnaires');
const { todos: seedTodos, activities: seedActivities } = require('../../data/dashboard');
const { NOTIFICATIONS } = require('../../data/notifications');

// Mock 数据中的旧 teacher ID → 真实 User ID 映射
// data/ 里的 mock 数据用的是 t-001/t-003/t-004/t-005 这种假 ID，
// 但 User 表用 accounts.js 里的真实 ID（admin-001 / t-li-teacher / t-wang-teacher）
const TEACHER_ID_MAP: Record<string, string> = {
  't-001': 't-wang-teacher',   // 王老师
  't-003': 't-li-teacher',     // 李老师
  't-004': 't-wang-teacher',   // 张老师（mock 里没有对应账号，归到王老师）
  't-005': 't-li-teacher',     // 陈老师（同上）
  'admin-001': 'admin-001',
  'admin': 'admin-001',
};
// 把 mock 里的 teacher ID 转成真实 User ID；找不到的就返回 null（避免外键冲突）
function mapTeacherId(id: string | undefined | null): string | null {
  if (!id) return null;
  return TEACHER_ID_MAP[id] || null;
}

async function main() {
  console.log('🌱 开始播种数据库...');

  // 清空所有数据
  console.log('  🧹 清空旧数据...');
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.followRecord.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.report.deleteMany();
  await prisma.template.deleteMany();
  await prisma.aiTeacher.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemConfig.deleteMany();

  // 1. 用户
  console.log('  👤 创建用户...');
  for (const acc of DEMO_ACCOUNTS) {
    const hashedPassword = await bcrypt.hash(acc.password, 10);
    await prisma.user.create({
      data: {
        id: acc.id,
        account: acc.account,
        password: hashedPassword,
        name: acc.name,
        role: acc.role,
        isBuiltin: true,
        settings: { create: {} },
      },
    });
  }

  // 2. 系统配置（授权码）
  console.log('  🔧 创建系统配置...');
  await prisma.systemConfig.create({
    data: { key: 'REGISTER_AUTH_CODE', value: process.env.REGISTER_AUTH_CODE || '320684' },
  });

  // 3. 客户
  console.log('  👥 创建客户...');
  for (const c of seedCustomers) {
    await prisma.customer.create({
      data: {
        id: c.id,
        name: c.name,
        phone: c.phone,
        wechatId: c.wechatId || null,
        childName: c.childName || null,
        childAge: c.childAge || null,
        childGrade: c.childGrade || null,
        language: c.language,
        targetExam: c.targetExam || null,
        status: c.status,
        source: c.source || null,
        tags: JSON.stringify(c.tags || []),
        teacherId: c.teacherId || null,
        followCount: c.followCount || 0,
        lastFollowAt: c.lastFollowAt ? new Date(c.lastFollowAt) : null,
        remark: c.remark || null,
        isBuiltin: true,
        isDeleted: false,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      },
    });
  }

  // 4. 评估报告
  console.log('  📊 创建评估报告...');
  for (const r of seedReports) {
    await prisma.report.create({
      data: {
        id: r.id,
        customerId: r.customerId,
        customerName: r.customerName,
        childName: r.childName || null,
        language: r.language,
        templateId: r.templateId || null,
        templateName: r.templateName || null,
        answerId: r.answerId || null,
        aiTeacherId: r.aiTeacherId || null,
        aiTeacherName: r.aiTeacherName || null,
        status: r.status || 'pending_review',
        overallScore: r.overallScore || 0,
        overallLevel: r.overallLevel || null,
        dimensions: JSON.stringify(r.dimensions || []),
        strengths: JSON.stringify(r.strengths || []),
        weaknesses: JSON.stringify(r.weaknesses || []),
        suggestions: JSON.stringify(r.suggestions || []),
        studyPlan: JSON.stringify(r.studyPlan || []),
        isBuiltin: true,
        isDeleted: false,
      },
    });
  }

  // 5. AI 教师
  console.log('  🤖 创建 AI 教师...');
  const aiTeachersData = seedAiTeachers || [];
  for (const t of aiTeachersData) {
    await prisma.aiTeacher.create({
      data: {
        id: t.id,
        name: t.name,
        description: t.description || null,
        language: t.language,
        specialties: JSON.stringify(t.specialties || []),
        originalTeacherId: t.originalTeacherId || null,
        originalTeacherName: t.originalTeacherName || null,
        status: t.status || 'ready',
        trainingProgress: t.trainingProgress || 100,
        knowledgeCount: t.knowledgeCount || 0,
        reportCount: t.reportCount || 0,
        avgRating: t.avgRating || 0,
        knowledgeBase: JSON.stringify(t.knowledgeBase || []),
        isBuiltin: true,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        lastTrainedAt: t.lastTrainedAt ? new Date(t.lastTrainedAt) : null,
      },
    });
  }

  // 6. 问卷模板
  console.log('  📝 创建问卷模板...');
  for (const tpl of seedTemplates) {
    await prisma.template.create({
      data: {
        id: tpl.id,
        name: tpl.name,
        description: tpl.description || null,
        language: tpl.language,
        category: tpl.category || null,
        status: tpl.status || 'active',
        usageCount: tpl.usageCount || 0,
        questions: JSON.stringify(tpl.questions || []),
        creatorId: mapTeacherId(tpl.creatorId),
        creatorName: tpl.creatorName || null,
        isBuiltin: true,
        createdAt: tpl.createdAt ? new Date(tpl.createdAt) : new Date(),
        updatedAt: tpl.updatedAt ? new Date(tpl.updatedAt) : new Date(),
      },
    });
  }

  // 7. 问卷分配
  console.log('  📋 创建问卷分配...');
  for (const a of seedAssignments) {
    await prisma.assignment.create({
      data: {
        id: a.id,
        templateId: a.templateId,
        templateName: a.templateName,
        customerId: a.customerId,
        customerName: a.customerName,
        parentName: a.parentName || null,
        parentPhone: a.parentPhone || null,
        status: a.status || 'pending',
        assignedBy: mapTeacherId(a.assignedBy),
        assignedByName: a.assignedByName || null,
        assignedAt: a.assignedAt ? new Date(a.assignedAt) : new Date(),
        completedAt: a.completedAt ? new Date(a.completedAt) : null,
        expireAt: a.expireAt ? new Date(a.expireAt) : null,
      },
    });
  }

  // 8. 通知
  console.log('  🔔 创建通知...');
  for (const n of NOTIFICATIONS) {
    await prisma.notification.create({
      data: {
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.content,
        time: n.time,
        read: n.read || false,
        icon: n.icon || null,
        color: n.color || null,
        targetUrl: n.targetUrl || null,
        isTab: n.isTab || false,
        isBuiltin: true,
        createdAt: new Date(),
      },
    });
  }

  // 9. 待办
  console.log('  ✅ 创建待办...');
  for (const t of seedTodos) {
    await prisma.todo.create({
      data: {
        id: t.id,
        type: t.type,
        title: t.title,
        description: t.description || null,
        priority: t.priority || 'medium',
        status: t.status || 'pending',
        dueAt: t.dueAt ? new Date(t.dueAt) : null,
        relatedId: t.relatedId || null,
      },
    });
  }

  // 10. 活动
  console.log('  📱 创建活动...');
  for (const a of seedActivities) {
    await prisma.activity.create({
      data: {
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description || null,
        operatorName: a.operatorName || null,
        createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
      },
    });
  }

  console.log('\n✅ 播种完成!');
  console.log(`  用户: ${DEMO_ACCOUNTS.length}`);
  console.log(`  客户: ${seedCustomers.length}`);
  console.log(`  报告: ${seedReports.length}`);
  console.log(`  AI教师: ${aiTeachersData.length}`);
  console.log(`  模板: ${seedTemplates.length}`);
  console.log(`  分配: ${seedAssignments.length}`);
  console.log(`  通知: ${NOTIFICATIONS.length}`);
  console.log(`  待办: ${seedTodos.length}`);
  console.log(`  活动: ${seedActivities.length}`);
}

main()
  .catch((e) => {
    console.error('❌ 播种失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
