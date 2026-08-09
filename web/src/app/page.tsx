// src/app/page.tsx - API 列表 / 健康检查
export default function Home() {
  const apis = [
    { method: 'POST', path: '/api/auth/login', desc: '登录' },
    { method: 'POST', path: '/api/auth/register', desc: '注册（需授权码）' },
    { method: 'GET', path: '/api/auth/me', desc: '获取当前用户' },
    { method: 'GET', path: '/api/customers', desc: '客户列表' },
    { method: 'POST', path: '/api/customers', desc: '新建客户' },
    { method: 'GET', path: '/api/customers/:id', desc: '客户详情' },
    { method: 'PUT', path: '/api/customers/:id', desc: '更新客户' },
    { method: 'DELETE', path: '/api/customers/:id', desc: '删除客户' },
    { method: 'GET', path: '/api/reports', desc: '报告列表' },
    { method: 'GET', path: '/api/reports/:id', desc: '报告详情' },
    { method: 'GET', path: '/api/ai-teachers', desc: 'AI教师列表' },
    { method: 'GET', path: '/api/templates', desc: '问卷模板列表' },
    { method: 'GET', path: '/api/assignments', desc: '问卷分配列表' },
    { method: 'GET', path: '/api/notifications', desc: '通知列表' },
    { method: 'GET', path: '/api/dashboard', desc: '工作台数据' },
    { method: 'GET', path: '/api/todos', desc: '待办列表' },
    { method: 'GET', path: '/api/settings', desc: '用户设置' },
  ];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <h1>🎓 教育管理 API 服务</h1>
      <p style={{ color: '#666' }}>后端服务运行中 · SQLite + Prisma + JWT</p>
      <h2>API 端点</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>Method</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Path</th>
            <th style={{ padding: 8, textAlign: 'left' }}>说明</th>
          </tr>
        </thead>
        <tbody>
          {apis.map((api, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>
                <code style={{ background: '#e3f2fd', padding: '2px 8px', borderRadius: 4, color: '#1565c0' }}>
                  {api.method}
                </code>
              </td>
              <td style={{ padding: 8 }}><code>{api.path}</code></td>
              <td style={{ padding: 8, color: '#666' }}>{api.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
