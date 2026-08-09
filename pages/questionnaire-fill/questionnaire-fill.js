// pages/questionnaire-fill/questionnaire-fill.js
const api = require('../../utils/api.js');
const { LANGUAGES } = require('../../utils/constants.js');
const i18n = require('../../utils/i18n.js');
const app = getApp();

const QUESTION_TYPE_LABELS = {
  single: '单选题',
  multiple: '多选题',
  text: '填空题',
  rating: '评分题',
  scale: '量表题'
};

Page({
  data: {
    templateId: '',
    template: null,
    currentIndex: 0,
    answers: {},
    answeredCount: 0,
    progress: 0,
    totalQuestions: 0,
    currentQuestion: null,
    currentQuestionIndexLabel: '',
    languageLabel: '',
    showSubmitConfirm: false,
    isSubmitting: false,
    questionCount: 0,
    allRequiredFilled: false,
    themeColors: {},
    // AI 评估相关
    customerList: [],
    customerIndex: -1,
    aiTeacherList: [],
    aiTeacherIndex: -1,
  },

  loadThemeColors() {
    const themeColors = app.getThemeColors();
    this.setData({ themeColors });
  },

  onLoad(options) {
    this.loadThemeColors();
    const templateId = options.id || 'tpl-001';
    this.loadTemplate(templateId);
    // 预加载客户列表和 AI 教师列表（用于提交时选择）
    this.loadCustomers();
    this.loadAiTeachers();
  },

  onShow() {
    this.loadThemeColors();
  },

  loadCustomers() {
    api.listCustomers().then(list => {
      const customers = (list || []).map(c => ({
        id: c.id,
        name: c.name + (c.childName ? '（' + c.childName + '）' : ''),
        language: c.language
      }));
      this.setData({ customerList: customers });
    }).catch(err => console.error('[QuestionnaireFill] 加载客户失败:', err));
  },

  loadAiTeachers() {
    api.listAiTeachers({ status: 'ready' }).then(list => {
      const teachers = (list || []).map(t => ({
        id: t.id,
        name: t.name,
        language: t.language
      }));
      this.setData({ aiTeacherList: teachers });
    }).catch(err => console.error('[QuestionnaireFill] 加载AI教师失败:', err));
  },

  onCustomerChange(e) {
    this.setData({ customerIndex: parseInt(e.detail.value) });
  },

  onAiTeacherChange(e) {
    this.setData({ aiTeacherIndex: parseInt(e.detail.value) });
  },

  loadTemplate(id) {
    api.getTemplate(id).then(template => {
      if (!template) {
        wx.showToast({ title: '问卷不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1000);
        return;
      }

      const questions = template.questions || [];
      const answers = {};
      questions.forEach(q => {
        if (q.type === 'multiple') {
          answers[q.id] = [];
        } else if (q.type === 'rating') {
          answers[q.id] = q.minValue || 3;
        } else {
          answers[q.id] = '';
        }
      });

      this.setData({
        templateId: id,
        template,
        totalQuestions: questions.length,
        questionCount: questions.length,
        languageLabel: i18n.t('lang.' + template.language),
        answers,
        currentIndex: 0
      });

      this.updateCurrentQuestion();
    }).catch(err => {
      wx.showToast({ title: err.message || '问卷不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
    });
  },

  updateCurrentQuestion() {
    const { template, currentIndex, answers } = this.data;
    if (!template || !template.questions) return;

    const question = template.questions[currentIndex];
    const answer = answers[question.id];
    
    this.setData({
      currentQuestion: {
        ...question,
        typeLabel: QUESTION_TYPE_LABELS[question.type] || question.type,
        currentAnswer: answer,
        isAnswered: this.checkAnswered(question, answer)
      },
      currentQuestionIndexLabel: `${currentIndex + 1} / ${this.data.totalQuestions}`
    });
    this.updateProgress();
  },

  checkAnswered(question, answer) {
    if (!question.required) return true;
    if (question.type === 'multiple') {
      return answer && answer.length > 0;
    }
    if (question.type === 'text') {
      return answer && answer.trim() !== '';
    }
    if (question.type === 'rating') {
      return answer != null;
    }
    if (question.type === 'single') {
      return answer && answer !== '';
    }
    if (question.type === 'scale') {
      return answer != null;
    }
    return answer != null && answer !== '';
  },

  updateProgress() {
    const { template, answers, totalQuestions } = this.data;
    if (!template || !template.questions) return;

    let answered = 0;
    template.questions.forEach(q => {
      if (this.checkAnswered(q, answers[q.id])) answered++;
    });

    const progress = totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;
    const allRequiredFilled = template.questions
      .filter(q => q.required)
      .every(q => this.checkAnswered(q, answers[q.id]));

    this.setData({
      answeredCount: answered,
      progress,
      allRequiredFilled
    });
  },

  onSingleSelect(e) {
    const optionId = e.currentTarget.dataset.id;
    const questionId = this.data.currentQuestion.id;
    this.setData({
      [`answers.${questionId}`]: optionId
    });
    this.updateCurrentQuestion();
  },

  onMultipleSelect(e) {
    const optionId = e.currentTarget.dataset.id;
    const questionId = this.data.currentQuestion.id;
    const current = this.data.answers[questionId] || [];
    
    let updated;
    if (current.includes(optionId)) {
      updated = current.filter(id => id !== optionId);
    } else {
      updated = [...current, optionId];
    }
    
    this.setData({ [`answers.${questionId}`]: updated });
    this.updateCurrentQuestion();
  },

  onTextInput(e) {
    const questionId = this.data.currentQuestion.id;
    this.setData({ [`answers.${questionId}`]: e.detail.value });
    this.updateCurrentQuestion();
  },

  onRatingChange(e) {
    const value = parseInt(e.detail.value);
    const questionId = this.data.currentQuestion.id;
    this.setData({ [`answers.${questionId}`]: value });
    this.updateCurrentQuestion();
  },

  onScaleSelect(e) {
    const value = parseInt(e.currentTarget.dataset.value);
    const questionId = this.data.currentQuestion.id;
    this.setData({ [`answers.${questionId}`]: value });
    this.updateCurrentQuestion();
  },

  goPrev() {
    if (this.data.currentIndex > 0) {
      this.setData({ currentIndex: this.data.currentIndex - 1 });
      this.updateCurrentQuestion();
    }
  },

  goNext() {
    const { currentIndex, totalQuestions, currentQuestion, answers } = this.data;
    if (!this.checkAnswered(currentQuestion, answers[currentQuestion.id]) && currentQuestion.required) {
      wx.showToast({ title: '请回答此题', icon: 'none' });
      return;
    }
    if (currentIndex < totalQuestions - 1) {
      this.setData({ currentIndex: currentIndex + 1 });
      this.updateCurrentQuestion();
    } else {
      this.showSubmitConfirm();
    }
  },

  goToQuestion(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({ currentIndex: index });
    this.updateCurrentQuestion();
  },

  showSubmitConfirm() {
    const { allRequiredFilled, answeredCount, totalQuestions } = this.data;
    if (!allRequiredFilled) {
      wx.showModal({
        title: '尚有必答题未完成',
        content: `已完成 ${answeredCount}/${totalQuestions} 题，确定要提交吗？`,
        success: (res) => {
          if (res.confirm) {
            this.submitAnswers();
          }
        }
      });
    } else {
      this.setData({ showSubmitConfirm: true });
    }
  },

  hideSubmitConfirm() {
    this.setData({ showSubmitConfirm: false });
  },

  async submitAnswers() {
    const { template, answers, customerList, customerIndex, aiTeacherList, aiTeacherIndex } = this.data;

    // 校验客户选择
    if (customerIndex < 0 || !customerList[customerIndex]) {
      wx.showToast({ title: '请选择学员客户', icon: 'none' });
      return;
    }
    // 校验 AI 教师选择
    if (aiTeacherIndex < 0 || !aiTeacherList[aiTeacherIndex]) {
      wx.showToast({ title: '请选择 AI 教师', icon: 'none' });
      return;
    }

    const customer = customerList[customerIndex];
    const aiTeacher = aiTeacherList[aiTeacherIndex];

    this.setData({ showSubmitConfirm: false, isSubmitting: true });
    wx.showLoading({ title: 'AI 正在生成报告...', mask: true });

    // 组装作答数据
    const answerList = template.questions.map(q => ({
      questionId: q.id,
      questionTitle: q.title,
      questionType: q.type,
      answer: answers[q.id]
    }));

    try {
      const result = await api.generateReport({
        templateId: template.id,
        customerId: customer.id,
        aiTeacherId: aiTeacher.id,
        answers: answerList
      });

      wx.hideLoading();
      this.setData({ isSubmitting: false });

      wx.showModal({
        title: '报告生成成功',
        content: `综合得分：${result.overallScore}分（${result.overallLevel}）\n是否立即查看报告？`,
        confirmText: '查看报告',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({ url: '/pages/report-detail/report-detail?id=' + result.reportId });
          } else {
            wx.navigateBack();
          }
        }
      });
    } catch (err) {
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      console.error('[QuestionnaireFill] 生成报告失败:', err);
      wx.showModal({
        title: '生成失败',
        content: err.message || 'AI 报告生成失败，请稍后重试',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  onJumpToQuestion(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({ currentIndex: index });
    this.updateCurrentQuestion();
  }
});
