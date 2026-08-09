// utils/api.js - 后端 API 封装
// 所有小程序页面通过此文件调用后端 API

const DEFAULT_BASE = 'http://localhost:3000';

// 获取 API 基础地址（优先从设置读取）
function getBaseUrl() {
  const cfg = wx.getStorageSync('api_config') || {};
  return cfg.apiBaseUrl || DEFAULT_BASE;
}

// Token 管理
function getToken() {
  return wx.getStorageSync('auth_token') || '';
}

function setToken(token) {
  if (token) {
    wx.setStorageSync('auth_token', token);
  } else {
    wx.removeStorageSync('auth_token');
  }
}

// 构建查询字符串
function toQuery(params) {
  if (!params) return '';
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return q ? '?' + q : '';
}

// 核心 request 方法
function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = getBaseUrl() + '/api' + path;
    wx.request({
      url,
      method,
      data: body,
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      timeout: 10000,
      success: (res) => {
        const json = res.data || {};
        if (res.statusCode === 401) {
          setToken(null);
          wx.reLaunch({ url: '/pages/login/login' });
          reject(new Error('未登录或登录已过期'));
          return;
        }
        if (!json.success) {
          reject(new Error(json.message || '请求失败'));
          return;
        }
        resolve(json.data);
      },
      fail: (err) => {
        console.error('[API] 请求失败:', url, err);
        let msg = '网络请求失败';
        if (err && err.errMsg) {
          if (err.errMsg.indexOf('fail timeout') !== -1) {
            msg = '连接超时，后端服务未响应';
          } else if (err.errMsg.indexOf('fail') !== -1) {
            msg = '网络请求失败，请检查后端服务是否启动';
          }
        }
        reject(new Error(msg));
      }
    });
  });
}

module.exports = {
  // ===== Token 管理 =====
  setToken,
  getToken,
  hasToken: () => !!getToken(),

  // ===== 认证 =====
  login: (account, password) => {
    return request('POST', '/auth/login', { account, password }).then(d => {
      setToken(d.token);
      return d.user;
    });
  },

  register: (form) => {
    return request('POST', '/auth/register', form).then(d => {
      setToken(d.token);
      return d.user;
    });
  },

  logout: () => {
    setToken(null);
    return Promise.resolve();
  },

  me: () => request('GET', '/auth/me'),
  changeRole: (role, code) => request('PUT', '/auth/me/role', { role, code }),

  // ===== 客户管理 =====
  listCustomers: (params) => request('GET', '/customers' + toQuery(params)),
  getCustomer: (id) => request('GET', '/customers/' + id),
  createCustomer: (data) => request('POST', '/customers', data),
  updateCustomer: (id, data) => request('PUT', '/customers/' + id, data),
  deleteCustomer: (id) => request('DELETE', '/customers/' + id),

  // 跟进记录
  listFollowRecords: (customerId) => request('GET', '/customers/' + customerId + '/follow-records'),
  addFollowRecord: (customerId, data) => request('POST', '/customers/' + customerId + '/follow-records', data),
  deleteFollowRecord: (customerId, recordId) => request('DELETE', '/customers/' + customerId + '/follow-records/' + recordId),

  // ===== 评估报告 =====
  listReports: (params) => request('GET', '/reports' + toQuery(params)),
  getReport: (id) => request('GET', '/reports/' + id),
  createReport: (data) => request('POST', '/reports', data),
  updateReport: (id, data) => request('PUT', '/reports/' + id, data),
  deleteReport: (id) => request('DELETE', '/reports/' + id),
  reviewReport: (id, data) => request('PATCH', '/reports/' + id + '/review', data),
  sendReport: (id, data) => request('POST', '/reports/' + id + '/send', data),
  // AI 生成报告（调用阿里云百炼智能体）
  generateReport: (data) => request('POST', '/reports/generate', data),

  // ===== AI 教师 =====
  listAiTeachers: (params) => request('GET', '/ai-teachers' + toQuery(params)),
  getAiTeacher: (id) => request('GET', '/ai-teachers/' + id),
  createAiTeacher: (data) => request('POST', '/ai-teachers', data),
  updateAiTeacher: (id, data) => request('PUT', '/ai-teachers/' + id, data),
  deleteAiTeacher: (id) => request('DELETE', '/ai-teachers/' + id),
  trainAiTeacher: (id) => request('POST', '/ai-teachers/' + id + '/train'),

  // ===== AI 教师评分 =====
  getAiTeacherRating: (id) => request('GET', '/ai-teachers/' + id + '/rating'),
  rateAiTeacher: (id, data) => request('POST', '/ai-teachers/' + id + '/rating', data),

  // ===== 用户评分 =====
  getUserRating: (id) => request('GET', '/users/' + id + '/rating'),
  rateUser: (id, data) => request('POST', '/users/' + id + '/rating', data),

  // ===== 问卷模板 =====
  listTemplates: (params) => request('GET', '/templates' + toQuery(params)),
  getTemplate: (id) => request('GET', '/templates/' + id),
  createTemplate: (data) => request('POST', '/templates', data),
  updateTemplate: (id, data) => request('PUT', '/templates/' + id, data),
  deleteTemplate: (id) => request('DELETE', '/templates/' + id),
  duplicateTemplate: (id) => request('POST', '/templates/' + id + '/duplicate'),

  // ===== 问卷分配 =====
  listAssignments: (params) => request('GET', '/assignments' + toQuery(params)),
  getAssignment: (id) => request('GET', '/assignments/' + id),
  createAssignment: (data) => request('POST', '/assignments', data),
  updateAssignment: (id, data) => request('PATCH', '/assignments/' + id, data),
  deleteAssignment: (id) => request('DELETE', '/assignments/' + id),

  // ===== 通知 =====
  listNotifications: (params) => request('GET', '/notifications' + toQuery(params)),
  markNotificationRead: (id) => request('PATCH', '/notifications/' + id + '/read'),
  markAllNotificationsRead: () => request('PATCH', '/notifications/read-all'),
  deleteNotification: (id) => request('DELETE', '/notifications/' + id),
  clearNotifications: () => request('DELETE', '/notifications'),

  // ===== 工作台 =====
  getDashboard: () => request('GET', '/dashboard'),
  getActivities: () => request('GET', '/dashboard/activities'),
  createActivity: (data) => request('POST', '/dashboard/activities', data),
  deleteActivity: (id) => request('DELETE', '/dashboard/activities' + toQuery({ id })),

  // ===== 待办 =====
  listTodos: (params) => request('GET', '/todos' + toQuery(params)),
  createTodo: (data) => request('POST', '/todos', data),
  updateTodo: (id, data) => request('PUT', '/todos/' + id, data),
  deleteTodo: (id) => request('DELETE', '/todos/' + id),
  completeTodo: (id) => request('POST', '/todos/' + id + '/complete'),

  // ===== 设置 =====
  getSettings: () => request('GET', '/settings'),
  updateSettings: (data) => request('PUT', '/settings', data),
  getApiConfig: () => request('GET', '/settings/api-config'),
  updateApiConfig: (data) => request('PUT', '/settings/api-config', data),

  // ===== 用户管理（管理员专用）=====
  listUsers: () => request('GET', '/users'),
  impersonate: (userId) => request('POST', '/auth/impersonate', { userId }).then(d => {
    setToken(d.token);
    return d;
  }),

  // ===== 管理员 token 备份/恢复（用于伪装登录切回）=====
  saveAdminToken: () => wx.setStorageSync('admin_token', getToken()),
  restoreAdminToken: () => {
    const t = wx.getStorageSync('admin_token');
    if (t) { setToken(t); wx.removeStorageSync('admin_token'); return true; }
    return false;
  },
  hasAdminToken: () => !!wx.getStorageSync('admin_token'),
  clearAdminToken: () => wx.removeStorageSync('admin_token'),
};
