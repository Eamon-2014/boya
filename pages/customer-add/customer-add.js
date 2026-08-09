// pages/customer-add/customer-add.js
const api = require('../../utils/api.js');
const { LANGUAGES, CUSTOMER_STATUS } = require('../../utils/constants.js');
const i18n = require('../../utils/i18n.js');

const SOURCES = ['朋友圈广告', '朋友推荐', '公立学校合作', '线下活动', '官网咨询', '电话营销', '其他'];
const GRADES = ['幼儿园', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三', '成人'];
const STATUS_LIST = ['new', 'following', 'converted', 'lost'];

Page({
  data: {
    languages: [],
    languageLabels: [],
    languageIndex: 0,
    sourceIndex: 0,
    gradeIndex: 0,
    statusIndex: 0,
    sources: SOURCES,
    grades: GRADES,
    statusLabels: [],
    
    form: {
      name: '',
      phone: '',
      wechatId: '',
      childName: '',
      childAge: '',
      childGrade: '',
      language: 'en',
      targetExam: '',
      source: '',
      status: 'new',
      remark: ''
    },
    
    submitting: false
  },

  onLoad() {
    const langList = Object.keys(LANGUAGES).map(key => ({ key, label: i18n.t('lang.' + key) }));
    const langLabels = langList.map(l => l.label);
    const statusLabels = STATUS_LIST.map(s => CUSTOMER_STATUS[s]?.label || s);

    this.setData({
      languages: langList,
      languageLabels: langLabels,
      statusLabels
    });
  },

  onShow() {
    i18n.setPageTitle('customerAdd');
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onLanguageChange(e) {
    const idx = parseInt(e.detail.value);
    this.setData({
      languageIndex: idx,
      'form.language': this.data.languages[idx].key
    });
  },

  onSourceChange(e) {
    const idx = parseInt(e.detail.value);
    this.setData({
      sourceIndex: idx,
      'form.source': this.data.sources[idx]
    });
  },

  onGradeChange(e) {
    const idx = parseInt(e.detail.value);
    this.setData({
      gradeIndex: idx,
      'form.childGrade': this.data.grades[idx]
    });
  },

  onStatusChange(e) {
    const idx = parseInt(e.detail.value);
    this.setData({
      statusIndex: idx,
      'form.status': STATUS_LIST[idx]
    });
  },

  validate() {
    const { form } = this.data;
    if (!form.name.trim()) return '请填写家长姓名';
    if (!form.phone.trim()) return '请填写联系电话';
    if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) return '请输入正确的手机号码';
    if (!form.childName.trim()) return '请填写孩子姓名';
    if (form.childAge && (parseInt(form.childAge) < 1 || parseInt(form.childAge) > 100)) return '请输入正确的年龄';
    return null;
  },

  onSubmit() {
    const error = this.validate();
    if (error) {
      wx.showToast({ title: error, icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中...' });

    const { form } = this.data;
    // 由后端生成 id、tags、followCount、时间戳等字段
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      wechatId: form.wechatId.trim(),
      childName: form.childName.trim(),
      childAge: form.childAge ? parseInt(form.childAge) : null,
      childGrade: form.childGrade,
      language: form.language,
      targetExam: form.targetExam.trim(),
      status: form.status,
      source: form.source,
      remark: form.remark.trim()
    };

    api.createCustomer(payload).then(newCustomer => {
      wx.hideLoading();
      this.setData({ submitting: false });

      wx.showToast({
        title: i18n.t('customerAdd.success'),
        icon: 'success',
        duration: 1500
      });

      // 创建成功后返回客户列表
      setTimeout(() => {
        wx.navigateBack({
          fail: () => {
            wx.switchTab({ url: '/pages/customers/customers' });
          }
        });
      }, 1000);
    }).catch(err => {
      wx.hideLoading();
      this.setData({ submitting: false });
      console.error('[CustomerAdd] 创建客户失败:', err);
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    });
  },

  onReset() {
    wx.showModal({
      title: '确认重置',
      content: '将清空所有已填写的信息，是否继续？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            form: {
              name: '',
              phone: '',
              wechatId: '',
              childName: '',
              childAge: '',
              childGrade: '',
              language: 'en',
              targetExam: '',
              source: '',
              status: 'new',
              remark: ''
            },
            languageIndex: 0,
            sourceIndex: 0,
            gradeIndex: 0,
            statusIndex: 0
          });
        }
      }
    });
  }
});
