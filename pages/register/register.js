// pages/register/register.js
const app = getApp();
const api = require('../../utils/api.js');
const i18n = require('../../utils/i18n.js');
const util = require('../../utils/util.js');

Page({
  data: {
    texts: {},
    themeColors: {},
    form: {
      account: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
      role: 'teacher',
      authCode: ''
    },
    roleOptions: [],
    roleLabel: '',
    roleIndex: 0,
    loading: false,
    showAuthCode: false
  },

  onLoad() {
    this.loadTexts();
    this.loadThemeColors();
  },

  onShow() {
    i18n.setPageTitle('register');
    this.loadTexts();
    this.loadThemeColors();
  },

  loadTexts() {
    const t = i18n;
    const texts = {
      welcome: t.t('auth.welcome'),
      appName: t.t('auth.appName'),
      appDesc: t.t('auth.appDesc'),
      account: t.t('auth.account'),
      password: t.t('auth.password'),
      confirmPassword: t.t('auth.confirmPassword'),
      name: t.t('auth.name'),
      phone: t.t('auth.phone'),
      role: t.t('auth.role'),
      accountPlaceholder: t.t('auth.accountPlaceholder'),
      passwordPlaceholder: t.t('auth.passwordPlaceholder'),
      confirmPasswordPlaceholder: t.t('auth.confirmPasswordPlaceholder'),
      namePlaceholder: t.t('auth.namePlaceholder'),
      phonePlaceholder: t.t('auth.phonePlaceholder'),
      registerBtn: t.t('auth.registerBtn'),
      toLogin: t.t('auth.toLogin'),
      accountRequired: t.t('auth.accountRequired'),
      passwordRequired: t.t('auth.passwordRequired'),
      passwordMismatch: t.t('auth.passwordMismatch'),
      nameRequired: t.t('auth.nameRequired'),
      phoneRequired: t.t('auth.phoneRequired'),
      accountExists: t.t('auth.accountExists'),
      registerSuccess: t.t('auth.registerSuccess'),
      authCode: t.t('auth.adminCode'),
      authCodePlaceholder: t.t('auth.adminCodePlaceholder'),
      authCodeRequired: t.t('auth.adminCodeRequired'),
      authCodeError: t.t('auth.adminCodeError')
    };
    const roleOptions = [
      { value: 'teacher', label: t.t('auth.roleTeacher') },
      { value: 'manager', label: t.t('auth.roleManager') },
      { value: 'admin', label: t.t('auth.roleAdmin') }
    ];
    this.setData({ texts, roleOptions, roleLabel: roleOptions[0].label });
  },

  loadThemeColors() {
    const themeColors = app.getThemeColors();
    this.setData({ themeColors });
  },

  onAccountInput(e) {
    this.setData({ 'form.account': e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ 'form.password': e.detail.value });
  },

  onConfirmPasswordInput(e) {
    this.setData({ 'form.confirmPassword': e.detail.value });
  },

  onNameInput(e) {
    this.setData({ 'form.name': e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ 'form.phone': e.detail.value });
  },

  onAuthCodeInput(e) {
    this.setData({ 'form.authCode': e.detail.value });
  },

  toggleAuthCode() {
    this.setData({ showAuthCode: !this.data.showAuthCode });
  },

  onRoleChange(e) {
    const idx = e.detail.value;
    this.setData({
      'form.role': this.data.roleOptions[idx].value,
      roleLabel: this.data.roleOptions[idx].label,
      roleIndex: idx
    });
  },

  // 注册
  onRegister() {
    const { form, loading } = this.data;
    if (loading) return;

    // 表单校验
    if (!form.account.trim()) {
      util.showToast(this.data.texts.accountRequired);
      return;
    }
    if (!form.password.trim()) {
      util.showToast(this.data.texts.passwordRequired);
      return;
    }
    if (form.password !== form.confirmPassword) {
      util.showToast(this.data.texts.passwordMismatch);
      return;
    }
    if (!form.name.trim()) {
      util.showToast(this.data.texts.nameRequired);
      return;
    }
    if (!form.phone.trim()) {
      util.showToast(this.data.texts.phoneRequired);
      return;
    }
    if (!form.authCode.trim()) {
      util.showToast(this.data.texts.authCodeRequired);
      return;
    }

    this.setData({ loading: true });

    // 调用后端 API 注册
    const roleLabel = this.data.roleOptions.find(r => r.value === form.role)?.label || '教师';
    api.register({
      account: form.account,
      password: form.password,
      name: form.name,
      phone: form.phone,
      role: roleLabel,
      authCode: form.authCode
    })
      .then(user => {
        this.setData({ loading: false });
        util.showToast(this.data.texts.registerSuccess, 'success');
        // 注册成功后自动登录
        app.setLoggedIn(user);
        setTimeout(() => {
          wx.switchTab({ url: '/pages/dashboard/dashboard' });
        }, 1500);
      })
      .catch(err => {
        this.setData({ loading: false });
        util.showToast(err.message || '注册失败');
      });
  },

  // 返回登录
  onGoLogin() {
    wx.navigateBack();
  }
});
