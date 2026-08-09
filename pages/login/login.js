// pages/login/login.js
const app = getApp();
const api = require('../../utils/api.js');
const i18n = require('../../utils/i18n.js');
const util = require('../../utils/util.js');
const { DEMO_ACCOUNTS } = require('../../utils/accounts.js');

Page({
  data: {
    texts: {},
    themeColors: {},
    account: '',
    password: '',
    displayPassword: '',
    showPassword: false,
    loading: false
  },

  onLoad() {
    this.loadTexts();
    this.loadThemeColors();
  },

  onShow() {
    i18n.setPageTitle('login');
    this.loadTexts();
    this.loadThemeColors();
    // 如果已登录，直接跳转首页
    if (app.globalData.isLoggedIn) {
      wx.switchTab({ url: '/pages/dashboard/dashboard' });
    }
  },

  loadTexts() {
    const t = i18n;
    const texts = {
      welcome: t.t('auth.welcome'),
      appName: t.t('auth.appName'),
      appDesc: t.t('auth.appDesc'),
      account: t.t('auth.account'),
      password: t.t('auth.password'),
      accountPlaceholder: t.t('auth.accountPlaceholder'),
      passwordPlaceholder: t.t('auth.passwordPlaceholder'),
      loginBtn: t.t('auth.loginBtn'),
      toRegister: t.t('auth.toRegister'),
      accountRequired: t.t('auth.accountRequired'),
      passwordRequired: t.t('auth.passwordRequired'),
      loginFail: t.t('auth.loginFail'),
      loginSuccess: t.t('auth.loginSuccess'),
      welcomeBack: t.t('auth.welcomeBack')
    };
    this.setData({ texts });
  },

  loadThemeColors() {
    const themeColors = app.getThemeColors();
    this.setData({ themeColors });
  },

  onAccountInput(e) {
    this.setData({ account: e.detail.value });
  },

  onPasswordInput(e) {
    const password = e.detail.value;
    const displayPassword = this.data.showPassword ? password : '•'.repeat(password.length);
    this.setData({ password, displayPassword });
  },

  // 切换密码显示/隐藏
  togglePassword() {
    const showPassword = !this.data.showPassword;
    const displayPassword = showPassword
      ? this.data.password
      : '•'.repeat(this.data.password.length);
    this.setData({ showPassword, displayPassword });
  },

  // 登录
  onLogin() {
    const { account, password, loading } = this.data;
    if (loading) return;

    // 表单校验
    if (!account.trim()) {
      util.showToast(this.data.texts.accountRequired);
      return;
    }
    if (!password.trim()) {
      util.showToast(this.data.texts.passwordRequired);
      return;
    }

    this.setData({ loading: true });

    // 调用后端 API 登录
    api.login(account, password)
      .then(user => {
        // 内置账号补充密码字段（供个人页面显示）
        const demoAcc = DEMO_ACCOUNTS.find(a => a.account === account);
        if (demoAcc) {
          user.password = demoAcc.password;
        }
        app.setLoggedIn(user);
        util.showToast(this.data.texts.loginSuccess, 'success');
        setTimeout(() => {
          wx.switchTab({ url: '/pages/dashboard/dashboard' });
        }, 800);
      })
      .catch(err => {
        this.setData({ loading: false });
        util.showToast(err.message || this.data.texts.loginFail);
      });
  },

  // 跳转注册
  onGoRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  }
});
