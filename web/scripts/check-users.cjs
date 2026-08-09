// 查询数据库里的所有用户
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, account: true, name: true, phone: true, role: true, password: true, createdAt: true }
  });
  console.log('数据库中的用户列表:');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
