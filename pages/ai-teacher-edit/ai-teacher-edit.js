// pages/ai-teacher-edit/ai-teacher-edit.js
const app = getApp();
const api = require('../../utils/api.js');
const util = require('../../utils/util.js');
const constants = require('../../utils/constants.js');
const i18n = require('../../utils/i18n.js');

const LANGUAGE_OPTIONS = [
  { key: 'en', label: '英语' },
  { key: 'fr', label: '法语' },
  { key: 'de', label: '德语' },
  { key: 'es', label: '西班牙语' },
  { key: 'ja', label: '日语' },
  { key: 'ko', label: '韩语' },
  { key: 'other', label: '其他' }
];

const KNOWLEDGE_TYPES = [
  { key: 'methodology', label: '教学方法论', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' },
  { key: 'sales', label: '销售话术', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  { key: 'analysis', label: '分析逻辑', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  { key: 'case', label: '典型案例', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  { key: 'other', label: '其他', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' }
];

const SPECIALTY_OPTIONS = [
  { name: '剑桥体系', selected: false },
  { name: '雅思考试', selected: false },
  { name: '托福考试', selected: false },
  { name: 'KET/PET/FCE', selected: false },
  { name: '少儿英语', selected: false },
  { name: '青少年英语', selected: false },
  { name: '商务英语', selected: false },
  { name: '学术写作', selected: false },
  { name: '法语启蒙', selected: false },
  { name: 'DELF A1/A2', selected: false },
  { name: '德福考试', selected: false },
  { name: '歌德证书', selected: false },
  { name: '西班牙语入门', selected: false },
  { name: '日语N3-N5', selected: false },
  { name: '韩语入门', selected: false },
  { name: '小语种启蒙', selected: false }
];

Page({
  data: {
    // 详情页相关
    teacherId: '',
    teacher: null,
    isPlaceholder: false,

    // 评分相关
    ratingData: null, // { avgRating, ratingCount, myRating, ratings }
    showRatingModal: false,
    ratingScore: 5,
    ratingComment: '',
    submittingRating: false,
    ratingStars: [1, 2, 3, 4, 5], // 评分星数选项

    // 创建页相关
    currentStep: 1,
    createSuccess: false,
    createdTeacher: null,

    // 表单数据
    form: {
      sourceTeacherId: '',
      sourceTeacherName: '',
      name: '',
      language: '',
      languageLabel: '',
      languageColor: '',
      languageBg: '',
      specialties: [],
      knowledgeList: []
    },
    customSpecialty: '',
    newKnowledge: {
      type: 'methodology',
      typeLabel: '教学方法论',
      color: '#2563EB',
      bg: 'rgba(37, 99, 235, 0.1)',
      title: '',
      content: ''
    },

    // 常量配置
    languageOptions: LANGUAGE_OPTIONS,
    knowledgeTypes: KNOWLEDGE_TYPES,
    specialtyOptions: SPECIALTY_OPTIONS,
    sourceTeachers: [],
    knowledgeTypeMap: {
      methodology: { label: '教学方法论', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' },
      sales: { label: '销售话术', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
      analysis: { label: '分析逻辑', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
      case: { label: '典型案例', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
      other: { label: '其他', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' }
    },

    // 计算属性
    canGoStep2: false,
    canAddKnowledge: false
  },

  onLoad(options) {
    const id = options.id;
    this.setData({ teacherId: id || '' });

    if (!id) {
      this.initCreateMode();
      return;
    }

    // 详情模式：从后端拉取教师数据
    util.showLoading();
    api.getAiTeacher(id)
      .then(teacher => {
        util.hideLoading();
        if (!teacher) {
          this.initCreateMode();
          return;
        }
        this.setData({ isPlaceholder: false });
        this.loadTeacherDetail(teacher);
      })
      .catch(err => {
        util.hideLoading();
        console.error('[AI教师详情] 加载失败:', err);
        util.showToast(err.message || '加载失败');
        this.initCreateMode();
      });
  },

  // 页面卸载时清理定时器（训练状态由后端管理，无需本地持久化）
  onUnload() {
    if (this._trainingTimer) {
      clearInterval(this._trainingTimer);
      this._trainingTimer = null;
    }
  },

  // 初始化创建模式
  initCreateMode() {
    // 构建可选原始教师列表（模拟的真实教师数据）
    const sourceTeachers = [
      {
        id: 't-001',
        name: '王老师',
        language: 'en',
        languageColor: '#2563EB',
        languageBg: 'rgba(37, 99, 235, 0.1)',
        specialtiesText: '剑桥体系 · 青少年英语',
        specialties: ['剑桥体系', '青少年英语', 'KET/PET/FCE']
      },
      {
        id: 't-002',
        name: '刘老师',
        language: 'en',
        languageColor: '#2563EB',
        languageBg: 'rgba(37, 99, 235, 0.1)',
        specialtiesText: '雅思 · 学术写作',
        specialties: ['雅思考试', '学术写作', '商务英语']
      },
      {
        id: 't-003',
        name: '李老师',
        language: 'fr',
        languageColor: '#EF4444',
        languageBg: 'rgba(239, 68, 68, 0.1)',
        specialtiesText: '法语启蒙 · DELF',
        specialties: ['法语启蒙', 'DELF A1/A2', '小语种启蒙']
      },
      {
        id: 't-004',
        name: '张老师',
        language: 'de',
        languageColor: '#F59E0B',
        languageBg: 'rgba(245, 158, 11, 0.1)',
        specialtiesText: '德福 · 歌德证书',
        specialties: ['德福考试', '歌德证书', '留学德语']
      },
      {
        id: 't-005',
        name: '陈老师',
        language: 'en',
        languageColor: '#2563EB',
        languageBg: 'rgba(37, 99, 235, 0.1)',
        specialtiesText: '托福 · 英联邦留学',
        specialties: ['托福考试', '英联邦留学', '学术写作']
      },
      {
        id: 't-006',
        name: '周老师',
        language: 'ja',
        languageColor: '#EC4899',
        languageBg: 'rgba(236, 72, 153, 0.1)',
        specialtiesText: '日语N3-N5 · 日本留学',
        specialties: ['日语N3-N5', '日本留学', '小语种启蒙']
      }
    ];

    this.setData({
      isPlaceholder: true,
      currentStep: 1,
      createSuccess: false,
      sourceTeachers,
      specialtyOptions: SPECIALTY_OPTIONS.map(o => ({ ...o, selected: false })),
      form: {
        sourceTeacherId: '',
        sourceTeacherName: '',
        name: '',
        language: '',
        languageLabel: '',
        languageColor: '',
        languageBg: '',
        specialties: [],
        knowledgeList: []
      }
    });

    wx.setNavigationBarTitle({ title: i18n.t('page.aiTeacherEdit') });
  },

  // 加载教师详情
  loadTeacherDetail(teacher) {
    const statusInfo = constants.AI_TEACHER_STATUS[teacher.status] || {};
    const langInfo = constants.LANGUAGES[teacher.language] || {};
    const statusBgMap = {
      training: 'rgba(245, 158, 11, 0.1)',
      ready: 'rgba(16, 185, 129, 0.1)',
      archived: 'rgba(156, 163, 175, 0.15)'
    };

    const knowledgeBase = (teacher.knowledgeBase || []).map(k => {
      const typeInfo = this.data.knowledgeTypeMap[k.type] || this.data.knowledgeTypeMap.other;
      return {
        ...k,
        typeLabel: typeInfo.label,
        typeColor: typeInfo.color,
        typeBg: typeInfo.bg,
        createdAtText: util.formatRelativeTime(k.createdAt)
      };
    });

    const processed = {
      ...teacher,
      languageLabel: i18n.t('lang.' + teacher.language),
      languageColor: langInfo.color || '#6B7280',
      languageBg: langInfo.bg || 'rgba(107, 114, 128, 0.1)',
      statusLabel: statusInfo.label || teacher.status,
      statusColor: statusInfo.color || '#9CA3AF',
      statusBg: statusBgMap[teacher.status] || 'rgba(156, 163, 175, 0.15)',
      lastTrainedText: teacher.lastTrainedAt ? util.formatRelativeTime(teacher.lastTrainedAt) : '未训练',
      createdAtText: util.formatTime(teacher.createdAt, 'YYYY-MM-DD'),
      specialtiesText: (teacher.specialties || []).join(' · '),
      knowledgeBase,
      isTraining: teacher.status === 'training',
      ratingText: teacher.avgRating > 0 ? teacher.avgRating.toFixed(1) : '暂无评分',
      ratingCountText: teacher.ratingCount > 0 ? `${teacher.ratingCount} 人评分` : '暂无评分'
    };

    this.setData({ teacher: processed });
    wx.setNavigationBarTitle({ title: `${teacher.name}` });

    // 加载评分数据
    this.loadRatingData();
  },

  // ============ 创建模式：步骤1 ============

  // 选择原始教师
  onSelectSourceTeacher(e) {
    const id = e.currentTarget.dataset.id;
    const teacher = this.data.sourceTeachers.find(t => t.id === id);
    if (!teacher) return;

    // 自动填充语种和名称
    const langInfo = constants.LANGUAGES[teacher.language] || LANGUAGE_OPTIONS.find(l => l.key === teacher.language);
    const langObj = constants.LANGUAGES[teacher.language] || { label: '其他', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' };

    const newSpecialties = teacher.specialties.slice(0, 4); // 最多选4个
    // 同步 specialtyOptions 的选中状态
    const updatedOptions = this.data.specialtyOptions.map(opt => ({
      ...opt,
      selected: newSpecialties.indexOf(opt.name) >= 0
    }));

    this.setData({
      'form.sourceTeacherId': id,
      'form.sourceTeacherName': teacher.name,
      'form.language': teacher.language,
      'form.languageLabel': i18n.t('lang.' + teacher.language),
      'form.languageColor': langObj.color,
      'form.languageBg': langObj.bg,
      'form.specialties': newSpecialties,
      specialtyOptions: updatedOptions,
      'form.name': `${i18n.t('lang.' + teacher.language)}-${teacher.name}（复刻版）`
    });
    this.checkCanGoStep2();
  },

  // 输入名称
  onInputName(e) {
    this.setData({ 'form.name': e.detail.value });
    this.checkCanGoStep2();
  },

  // 选择语种
  onSelectLanguage(e) {
    const key = e.currentTarget.dataset.key;
    const langInfo = constants.LANGUAGES[key] || constants.LANGUAGES.other;
    this.setData({
      'form.language': key,
      'form.languageLabel': i18n.t('lang.' + key),
      'form.languageColor': langInfo.color,
      'form.languageBg': langInfo.bg
    });
    this.checkCanGoStep2();
  },

  // 切换专长标签
  onToggleSpecialty(e) {
    const itemName = e.currentTarget.dataset.item;
    const specialties = this.data.form.specialties.slice();
    const idx = specialties.indexOf(itemName);
    let updatedSpecialties;
    if (idx >= 0) {
      updatedSpecialties = specialties.filter(s => s !== itemName);
    } else {
      if (specialties.length >= 6) {
        util.showToast('最多选择6个专长', 'none');
        return;
      }
      updatedSpecialties = [...specialties, itemName];
    }

    // 更新 specialtyOptions 中每项的 selected 状态
    const updatedOptions = this.data.specialtyOptions.map(opt => ({
      name: opt.name,
      selected: updatedSpecialties.indexOf(opt.name) >= 0
    }));

    this.setData({
      'form.specialties': updatedSpecialties,
      specialtyOptions: updatedOptions
    });
  },

  // 输入自定义专长
  onInputCustomSpecialty(e) {
    this.setData({ customSpecialty: e.detail.value });
  },

  // 添加自定义专长
  onAddCustomSpecialty() {
    const val = this.data.customSpecialty.trim();
    if (!val) return;
    const specialties = this.data.form.specialties.slice();
    if (specialties.includes(val)) {
      util.showToast('已存在', 'none');
      return;
    }
    if (specialties.length >= 6) {
      util.showToast('最多选择6个', 'none');
      return;
    }
    specialties.push(val);

    // 如果是新选项，也添加到 specialtyOptions 中作为自定义选项
    const existingOptions = this.data.specialtyOptions;
    const alreadyInOptions = existingOptions.some(o => o.name === val);
    let updatedOptions;
    if (alreadyInOptions) {
      updatedOptions = existingOptions.map(opt =>
        opt.name === val ? { ...opt, selected: true } : opt
      );
    } else {
      updatedOptions = [...existingOptions, { name: val, selected: true }];
    }

    this.setData({ 'form.specialties': specialties, specialtyOptions: updatedOptions, customSpecialty: '' });
  },

  // 检查是否可进入步骤2
  checkCanGoStep2() {
    const { form } = this.data;
    const canGo = !!(form.sourceTeacherId && form.name && form.language);
    this.setData({ canGoStep2: canGo });
  },

  // 进入步骤2
  onGoStep2() {
    if (!this.data.canGoStep2) {
      util.showToast('请完成必填项', 'none');
      return;
    }
    this.setData({ currentStep: 2 });
  },

  // ============ 创建模式：步骤2 ============

  // 选择知识类型
  onSelectKnowledgeType(e) {
    const key = e.currentTarget.dataset.key;
    const typeInfo = KNOWLEDGE_TYPES.find(t => t.key === key);
    this.setData({
      'newKnowledge.type': key,
      'newKnowledge.typeLabel': typeInfo.label,
      'newKnowledge.color': typeInfo.color,
      'newKnowledge.bg': typeInfo.bg
    });
    this.checkCanAddKnowledge();
  },

  // 输入知识标题
  onInputKnowledgeTitle(e) {
    this.setData({ 'newKnowledge.title': e.detail.value });
    this.checkCanAddKnowledge();
  },

  // 输入知识内容
  onInputKnowledgeContent(e) {
    this.setData({ 'newKnowledge.content': e.detail.value });
  },

  // 检查是否可添加知识
  checkCanAddKnowledge() {
    const { type, title, content } = this.data.newKnowledge;
    this.setData({ canAddKnowledge: !!(type && title.trim()) });
  },

  // 添加知识条目
  onAddKnowledgeItem() {
    if (!this.data.canAddKnowledge) {
      util.showToast('请填写标题', 'none');
      return;
    }
    const { newKnowledge, form } = this.data;
    const item = {
      id: 'k_' + Date.now(),
      type: newKnowledge.type,
      typeLabel: newKnowledge.typeLabel,
      typeColor: newKnowledge.color,
      typeBg: newKnowledge.bg,
      title: newKnowledge.title.trim(),
      content: newKnowledge.content.trim()
    };
    const knowledgeList = form.knowledgeList.concat([item]);
    this.setData({
      'form.knowledgeList': knowledgeList,
      newKnowledge: {
        type: 'methodology',
        typeLabel: '教学方法论',
        color: '#2563EB',
        bg: 'rgba(37, 99, 235, 0.1)',
        title: '',
        content: ''
      }
    });
    this.checkCanAddKnowledge();
    util.showToast('已添加', 'success');
  },

  // 删除知识条目
  onRemoveKnowledge(e) {
    const index = e.currentTarget.dataset.index;
    const knowledgeList = this.data.form.knowledgeList.slice();
    knowledgeList.splice(index, 1);
    this.setData({ 'form.knowledgeList': knowledgeList });
  },

  // 返回步骤1
  onBackToStep1() {
    this.setData({ currentStep: 1 });
  },

  // 进入步骤3
  onGoStep3() {
    // 从步骤2到步骤3不需要额外校验
    // 即使没有知识条目也可以创建（基础风格复刻）
    this.setData({ currentStep: 3 });
  },

  // 返回步骤2
  onBackToStep2() {
    this.setData({ currentStep: 2 });
  },

  // ============ 创建模式：步骤3 ============

  // 提交创建
  onSubmitCreate() {
    const { form } = this.data;
    wx.showModal({
      title: '确认创建',
      content: `将创建AI教师「${form.name}」，并立即开始训练。`,
      confirmText: '确认创建',
      confirmColor: '#2563EB',
      success: (res) => {
        if (res.confirm) {
          this.doCreateTeacher();
        }
      }
    });
  },

  // 执行创建（调用后端 API）
  doCreateTeacher() {
    const { form } = this.data;
    util.showLoading('创建中...');

    const payload = {
      name: form.name,
      description: `复刻自${form.sourceTeacherName}，语种为${form.languageLabel}，专长：${form.specialties.join('、') || '综合能力'}`,
      language: form.language,
      specialties: form.specialties,
      originalTeacherId: form.sourceTeacherId,
      originalTeacherName: form.sourceTeacherName,
      knowledgeBase: form.knowledgeList.map(k => ({
        type: k.type,
        title: k.title,
        content: k.content
      }))
    };

    api.createAiTeacher(payload)
      .then(newTeacher => {
        util.hideLoading();

        // 显示成功页，启动本地训练进度模拟
        const createdTeacher = {
          ...newTeacher,
          status: newTeacher.status || 'training',
          trainingProgress: newTeacher.trainingProgress || 15,
          knowledgeCount: (newTeacher.knowledgeBase || form.knowledgeList).length
        };

        this.setData({
          createSuccess: true,
          createdTeacher
        });

        this.simulateTrainingProgress();
      })
      .catch(err => {
        util.hideLoading();
        console.error('[AI教师] 创建失败:', err);
        util.showToast(err.message || '创建失败');
      });
  },

  // 模拟训练进度（仅 UI 展示，后端会异步完成训练）
  simulateTrainingProgress() {
    let progress = this.data.createdTeacher?.trainingProgress || 15;
    this._trainingTimer = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(this._trainingTimer);
        this._trainingTimer = null;
        this._completeTraining();
      }
      this.setData({
        'createdTeacher.trainingProgress': progress
      });
    }, 1500);
  },

  // 训练完成：同步状态到后端
  _completeTraining() {
    const teacherId = this.data.createdTeacher?.id;
    if (!teacherId) return;
    // 通知后端训练完成（如后端已异步处理，这里只是状态同步）
    api.updateAiTeacher(teacherId, {
      status: 'ready',
      trainingProgress: 100,
      lastTrainedAt: new Date().toISOString()
    }).catch(err => {
      console.warn('[AI教师] 同步训练完成状态失败:', err);
    });
    this.setData({
      'createdTeacher.status': 'ready',
      'createdTeacher.statusLabel': '已就绪'
    });
  },

  // 查看详情
  onGoDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.redirectTo({ url: `/pages/ai-teacher-edit/ai-teacher-edit?id=${id}` });
  },

  // 返回列表
  onBackToList() {
    wx.navigateBack({ delta: 1 });
  },

  // ============ 以下为详情页功能 ============

  // 重新训练（调用后端训练接口）
  onRetrain() {
    const { teacher } = this.data;
    if (!teacher) return;
    wx.showModal({
      title: '开始训练',
      content: `确认对「${teacher.name}」进行增量训练？预计耗时 3-5 分钟。`,
      confirmColor: '#2563EB',
      success: (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '提交训练任务...', mask: true });
        api.trainAiTeacher(teacher.id)
          .then(updated => {
            wx.hideLoading();
            wx.showToast({ title: '训练任务已提交', icon: 'success' });
            const merged = { ...this.data.teacher, ...(updated || {}), isTraining: true, status: 'training', statusLabel: '训练中', statusColor: '#F59E0B', statusBg: 'rgba(245, 158, 11, 0.1)' };
            this.setData({ teacher: merged });
          })
          .catch(err => {
            wx.hideLoading();
            console.error('[AI教师] 训练提交失败:', err);
            util.showToast(err.message || '训练提交失败');
          });
      }
    });
  },

  // 归档（调用后端更新接口）
  onArchive() {
    const { teacher } = this.data;
    if (!teacher) return;
    wx.showModal({
      title: '归档确认',
      content: `归档后「${teacher.name}」将不再用于新报告生成，可随时恢复。`,
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return;
        util.showLoading();
        api.updateAiTeacher(teacher.id, { status: 'archived' })
          .then(() => {
            util.hideLoading();
            wx.showToast({ title: '已归档', icon: 'success' });
            this.setData({
              'teacher.status': 'archived',
              'teacher.statusLabel': '已归档',
              'teacher.statusColor': '#9CA3AF',
              'teacher.statusBg': 'rgba(156, 163, 175, 0.15)',
              'teacher.isTraining': false
            });
          })
          .catch(err => {
            util.hideLoading();
            console.error('[AI教师] 归档失败:', err);
            util.showToast(err.message || '归档失败');
          });
      }
    });
  },

  // 添加知识
  onAddKnowledge() {
    wx.showActionSheet({
      itemList: ['教学方法论', '销售话术', '分析逻辑', '典型案例'],
      success: (res) => {
        const types = ['methodology', 'sales', 'analysis', 'case'];
        const type = types[res.tapIndex];
        const typeLabel = this.data.knowledgeTypeMap[type].label;
        wx.showToast({
          title: `添加${typeLabel}（开发中）`,
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 查看知识条目详情
  onKnowledgeClick(e) {
    const { id } = e.currentTarget.dataset;
    const { teacher } = this.data;
    const item = (teacher.knowledgeBase || []).find(k => k.id === id);
    if (!item) return;
    wx.showModal({
      title: item.title,
      content: item.content,
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#2563EB'
    });
  },

  // 预览生成报告
  onViewReports() {
    wx.showToast({ title: '查看关联报告（开发中）', icon: 'none' });
  },

  // 测试对话
  onTestChat() {
    wx.showToast({ title: 'AI对话测试（开发中）', icon: 'none' });
  },

  // ============ 评分功能 ============

  // 加载评分数据
  loadRatingData() {
    if (!this.data.teacherId) return;
    api.getAiTeacherRating(this.data.teacherId)
      .then(data => {
        this.setData({ ratingData: data });
      })
      .catch(err => {
        console.warn('[AI教师评分] 加载失败:', err);
      });
  },

  // 打开评分弹窗
  onOpenRatingModal() {
    const { ratingData } = this.data;
    this.setData({
      showRatingModal: true,
      ratingScore: ratingData?.myRating?.score || 5,
      ratingComment: ratingData?.myRating?.comment || ''
    });
  },

  // 关闭评分弹窗
  onCloseRatingModal() {
    this.setData({ showRatingModal: false });
  },

  // 选择评分
  onSelectRating(e) {
    const score = parseInt(e.currentTarget.dataset.score);
    this.setData({ ratingScore: score });
  },

  // 输入评论
  onRatingCommentInput(e) {
    this.setData({ ratingComment: e.detail.value });
  },

  // 提交评分
  onSubmitRating() {
    const { teacherId, ratingScore, ratingComment, submittingRating } = this.data;
    if (submittingRating) return;

    this.setData({ submittingRating: true });
    api.rateAiTeacher(teacherId, {
      score: ratingScore,
      comment: ratingComment
    })
      .then(result => {
        this.setData({ submittingRating: false, showRatingModal: false });
        util.showToast('评分成功', 'success');

        // 更新评分数据
        this.setData({
          'teacher.avgRating': result.avgRating,
          'teacher.ratingCount': result.ratingCount
        });

        // 重新加载评分详情
        this.loadRatingData();
      })
      .catch(err => {
        this.setData({ submittingRating: false });
        util.showToast(err.message || '评分失败');
      });
  },

  // 点击评分项阻止冒泡
  onRatingModalClick() {},

  // 点击评分弹窗背景关闭
  onRatingModalBgClick() {
    this.setData({ showRatingModal: false });
  }
});
