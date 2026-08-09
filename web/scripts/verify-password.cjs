// 验证密码
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { account: 'admin' } });
  console.log('账号:', user.account);
  console.log('姓名:', user.name);
  console.log('角色:', user.role);
  console.log('密码哈希:', user.password);
  
  // 验证密码
  const testPassword = 'Eamon_20141027@admin';
  const match = await bcrypt.compare(testPassword, user.password);
  console.log('\n验证密码 "Eamon_20141027@admin":');
  console.log(match ? '✅ 匹配成功（密码正确）' : '❌ 匹配失败（密码不正确）');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
