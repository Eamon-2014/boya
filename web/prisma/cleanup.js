// prisma/cleanup.js - 清理测试数据脚本
// 运行: node prisma/cleanup.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 开始清理测试数据...');

  // 先统计各表数据量
  const counts = {
    users: await prisma.user.count(),
    customers: await prisma.customer.count(),
    reports: await prisma.report.count(),
    aiTeachers: await prisma.aiTeacher.count(),
    templates: await prisma.template.count(),
    assignments: await prisma.assignment.count(),
    notifications: await prisma.notification.count(),
    todos: await prisma.todo.count(),
    activities: await prisma.activity.count(),
    followRecords: await prisma.followRecord.count(),
    userRatings: await prisma.userRating.count(),
    aiTeacherRatings: await prisma.aiTeacherRating.count(),
    systemConfigs: await prisma.systemConfig.count(),
    userSettings: await prisma.userSettings.count(),
  };

  console.log('\n📊 当前数据量:');
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // 保留：用户账号、系统配置（授权码）
  // 删除：所有业务测试数据
  console.log('\n🗑️  删除测试数据...');

  // 按依赖顺序删除（先删外键依赖）
  const del = await prisma.aiTeacherRating.deleteMany();
  console.log(`  AI教师评分: 删除 ${del.count} 条`);
  const del2 = await prisma.userRating.deleteMany();
  console.log(`  用户评分: 删除 ${del2.count} 条`);
  const del3 = await prisma.notification.deleteMany();
  console.log(`  通知: 删除 ${del3.count} 条`);
  const del4 = await prisma.activity.deleteMany();
  console.log(`  活动: 删除 ${del4.count} 条`);
  const del5 = await prisma.todo.deleteMany();
  console.log(`  待办: 删除 ${del5.count} 条`);
  const del6 = await prisma.followRecord.deleteMany();
  console.log(`  跟进记录: 删除 ${del6.count} 条`);
  const del7 = await prisma.assignment.deleteMany();
  console.log(`  问卷分配: 删除 ${del7.count} 条`);
  const del8 = await prisma.report.deleteMany();
  console.log(`  评估报告: 删除 ${del8.count} 条`);
  const del9 = await prisma.template.deleteMany();
  console.log(`  问卷模板: 删除 ${del9.count} 条`);
  const del10 = await prisma.aiTeacher.deleteMany();
  console.log(`  AI教师: 删除 ${del10.count} 条`);
  const del11 = await prisma.customer.deleteMany();
  console.log(`  客户: 删除 ${del11.count} 条`);

  console.log('\n✅ 保留数据:');
  console.log(`  用户账号: ${counts.users} 个`);
  console.log(`  系统配置: ${counts.systemConfigs} 条`);
  console.log(`  用户设置: ${counts.userSettings} 条`);

  console.log('\n✨ 清理完成!');
}

main()
  .catch((e) => {
    console.error('❌ 清理失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
