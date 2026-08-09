// data/accounts.js - 内置账号配置
// 注意：此文件仅用于 seed.ts 创建用户（密码仅以 bcrypt 哈希存入数据库）
// 实际登录通过后端 API 验证
const DEMO_ACCOUNTS = [
  {
    id: 'admin-001',
    account: 'admin',
    password: 'Eamon_20141027@admin',
    name: '王裔鸣',
    role: '管理员',
    phone: '13900000001',
  },
  {
    id: 't-li-teacher',
    account: 'li.teacher2024',
    password: 'Edu@2024#Secure',
    name: '李老师',
    role: '教师',
    phone: '13900000002',
  },
  {
    id: 't-wang-teacher',
    account: 'wang.teacher2024',
    password: 'Teach@2024#Pass',
    name: '王老师',
    role: '教师',
    phone: '13900000003',
  },
];

module.exports = {
  DEMO_ACCOUNTS,
};
