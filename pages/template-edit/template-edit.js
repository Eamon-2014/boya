// pages/template-edit/template-edit.js
const api = require('../../utils/api.js');
const { LANGUAGES } = require('../../utils/constants.js');
const i18n = require('../../utils/i18n.js');
const util = require('../../utils/util.js');
const app = getApp();

const QUESTION_TYPES = [
  { key: 'single', labelKey: 'tplEdit.typeSingle', icon: '◉', needOptions: true },
  { key: 'multiple', labelKey: 'tplEdit.typeMultiple', icon: '☑', needOptions: true },
  { key: 'text', labelKey: 'tplEdit.typeText', icon: '✏️', needOptions: false },
  { key: 'rating', labelKey: 'tplEdit.typeRating', icon: '⭐', needOptions: false },
  { key: 'scale', labelKey: 'tplEdit.typeScale', icon: '📏', needOptions: false }
];

Page({
  data: {
    themeColors: {},
    texts: {},
    templateId: '',
    mode: 'create', // create | edit
    languages: [],
    languageLabels: [],
    categories: [],
    questionTypes: [],
    typeKeyMap: {},
    languageIndex: 0,
    categoryIndex: 0,
    editingIndex: -1,

    template: {
      name: '',
      description: '',
      language: 'en',
      category: '',
      questions: []
    },

    isPreviewMode: false
  },

  loadThemeColors() {
    const themeColors = app.getThemeColors();
    this.setData({ themeColors });
  },

  loadI18nTexts() {
    const texts = {
      basicInfo: i18n.t('tplEdit.basicInfo'),
      nameLabel: i18n.t('tplEdit.nameLabel'),
      namePlaceholder: i18n.t('tplEdit.namePlaceholder'),
      descLabel: i18n.t('tplEdit.descLabel'),
      descPlaceholder: i18n.t('tplEdit.descPlaceholder'),
      language: i18n.t('tplEdit.language'),
      category: i18n.t('tplEdit.category'),
      questionList: i18n.t('tplEdit.questionList'),
      unnamedQuestion: i18n.t('tplEdit.unnamedQuestion'),
      collapse: i18n.t('tplEdit.collapse'),
      expand: i18n.t('tplEdit.expand'),
      questionContent: i18n.t('tplEdit.questionContent'),
      questionContentPlaceholder: i18n.t('tplEdit.questionContentPlaceholder'),
      questionType: i18n.t('tplEdit.questionType'),
      optionSettings: i18n.t('tplEdit.optionSettings'),
      optionPlaceholder: i18n.t('tplEdit.optionPlaceholder'),
      optionScore: i18n.t('tplEdit.optionScore'),
      addOption: i18n.t('tplEdit.addOption'),
      ratingRange: i18n.t('tplEdit.ratingRange'),
      minValue: i18n.t('tplEdit.minValue'),
      maxValue: i18n.t('tplEdit.maxValue'),
      scaleSettings: i18n.t('tplEdit.scaleSettings'),
      scaleValuePlaceholder: i18n.t('tplEdit.scaleValuePlaceholder'),
      scaleLabelPlaceholder: i18n.t('tplEdit.scaleLabelPlaceholder'),
      addScale: i18n.t('tplEdit.addScale'),
      required: i18n.t('tplEdit.required'),
      optional: i18n.t('tplEdit.optional'),
      moveUp: i18n.t('tplEdit.moveUp'),
      moveDown: i18n.t('tplEdit.moveDown'),
      delete: i18n.t('tplEdit.delete'),
      emptyTitle: i18n.t('tplEdit.emptyTitle'),
      addQuestion: i18n.t('tplEdit.addQuestion'),
      preview: i18n.t('tplEdit.preview'),
      exitPreview: i18n.t('tplEdit.exitPreview'),
      save: i18n.t('tplEdit.save'),
      publishTitle: i18n.t('tplEdit.publishTitle'),
      publishContent: i18n.t('tplEdit.publishContent'),
      previewTitle: i18n.t('tplEdit.previewTitle'),
      previewTextPlaceholder: i18n.t('tplEdit.previewTextPlaceholder'),
      newQuestion: i18n.t('tplEdit.newQuestion'),
      deleteConfirmTitle: i18n.t('tplEdit.deleteConfirmTitle'),
      deleteConfirmContent: i18n.t('tplEdit.deleteConfirmContent'),
      validateName: i18n.t('tplEdit.validateName'),
      validateQuestions: i18n.t('tplEdit.validateQuestions'),
      validateTitleEmpty: i18n.t('tplEdit.validateTitleEmpty'),
      validateOptionsCount: i18n.t('tplEdit.validateOptionsCount'),
      validateOptionEmpty: i18n.t('tplEdit.validateOptionEmpty'),
      saving: i18n.t('tplEdit.saving'),
      createSuccess: i18n.t('tplEdit.createSuccess'),
      saveSuccess: i18n.t('tplEdit.saveSuccess')
    };

    const categories = [
      i18n.t('tplEdit.catEnroll'),
      i18n.t('tplEdit.catStarter'),
      i18n.t('tplEdit.catStudyAbroad'),
      i18n.t('tplEdit.catCert'),
      i18n.t('tplEdit.catLevel'),
      i18n.t('tplEdit.catOther')
    ];

    const questionTypes = QUESTION_TYPES.map(t => ({
      ...t,
      label: i18n.t(t.labelKey)
    }));

    this.setData({ texts, categories, questionTypes });
  },

  noop() {},

  onLoad(options) {
    this.loadThemeColors();
    this.loadI18nTexts();

    const langList = Object.keys(LANGUAGES).map(key => ({ key, label: i18n.t('lang.' + key) }));
    const langLabels = langList.map(l => l.label);
    const typeKeyMap = {};
    QUESTION_TYPES.forEach(t => { typeKeyMap[t.key] = { ...t, label: i18n.t(t.labelKey) }; });

    const templateId = options.id || '';
    const mode = templateId ? 'edit' : 'create';

    const defaultCategory = this.data.categories[0] || '入学测评';

    let template = {
      name: '',
      description: '',
      language: 'en',
      category: defaultCategory,
      questions: []
    };

    let languageIndex = 0;
    let categoryIndex = 0;

    // 先设置基础结构，便于页面渲染
    this.setData({
      templateId,
      mode,
      languages: langList,
      languageLabels: langLabels,
      typeKeyMap,
      template,
      languageIndex,
      categoryIndex
    });

    // 编辑模式：异步从后端加载模板
    if (templateId) {
      util.showLoading();
      api.getTemplate(templateId)
        .then(existing => {
          util.hideLoading();
          if (!existing) return;
          template = {
            name: existing.name,
            description: existing.description || '',
            language: existing.language,
            category: existing.category || defaultCategory,
            questions: (existing.questions || []).map(q => this._cloneQuestion(q))
          };
          languageIndex = Math.max(0, langList.findIndex(l => l.key === template.language));
          categoryIndex = Math.max(0, this.data.categories.indexOf(template.category));
          this.setData({ template, languageIndex, categoryIndex });
        })
        .catch(err => {
          util.hideLoading();
          console.error('[模板编辑] 加载失败:', err);
          wx.showToast({ title: err.message || '加载失败', icon: 'none' });
        });
    }
  },

  onShow() {
    this.loadThemeColors();
    this.loadI18nTexts();
    i18n.setPageTitle('templateEdit');
  },

  _cloneQuestion(q) {
    const copy = {
      id: q.id || this._generateId('q'),
      type: q.type,
      title: q.title || '',
      required: !!q.required
    };
    if (q.needOptions !== false && (q.type === 'single' || q.type === 'multiple')) {
      copy.options = (q.options || []).map(o => ({
        id: o.id || this._generateId('o'),
        label: o.label || '',
        score: o.score != null ? o.score : 0
      }));
    } else if (q.type === 'rating') {
      copy.maxValue = q.maxValue || 5;
      copy.minValue = q.minValue || 1;
    } else if (q.type === 'scale') {
      copy.scaleOptions = (q.scaleOptions || [
        { id: this._generateId('so'), label: '非常差', value: 1 },
        { id: this._generateId('so'), label: '一般', value: 3 },
        { id: this._generateId('so'), label: '非常好', value: 5 }
      ]).map(o => ({ ...o }));
    }
    return copy;
  },

  _generateId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  },

  onInputName(e) {
    this.setData({ 'template.name': e.detail.value });
  },

  onInputDesc(e) {
    this.setData({ 'template.description': e.detail.value });
  },

  onLanguageChange(e) {
    const idx = parseInt(e.detail.value);
    this.setData({
      languageIndex: idx,
      'template.language': this.data.languages[idx].key
    });
  },

  onCategoryChange(e) {
    const idx = parseInt(e.detail.value);
    this.setData({
      categoryIndex: idx,
      'template.category': this.data.categories[idx]
    });
  },

  toggleRequired(e) {
    const i = parseInt(e.currentTarget.dataset.index);
    const key = `template.questions[${i}].required`;
    this.setData({ [key]: !this.data.template.questions[i].required });
  },

  toggleEditing(e) {
    const i = parseInt(e.currentTarget.dataset.index);
    this.setData({ editingIndex: this.data.editingIndex === i ? -1 : i });
  },

  onQuestionTitleInput(e) {
    const i = parseInt(e.currentTarget.dataset.index);
    this.setData({ [`template.questions[${i}].title`]: e.detail.value });
  },

  onQuestionTypeChange(e) {
    const i = parseInt(e.currentTarget.dataset.index);
    const typeKey = e.currentTarget.dataset.type;
    const typeDef = this.data.typeKeyMap[typeKey];

    const key = `template.questions[${i}]`;
    const updates = {};
    updates[`${key}.type`] = typeKey;

    if (typeKey === 'single' || typeKey === 'multiple') {
      if (!this.data.template.questions[i].options || this.data.template.questions[i].options.length === 0) {
        updates[`${key}.options`] = [
          { id: this._generateId('o'), label: '选项1', score: 0 },
          { id: this._generateId('o'), label: '选项2', score: 0 }
        ];
      }
    } else if (typeKey === 'rating') {
      updates[`${key}.minValue`] = this.data.template.questions[i].minValue || 1;
      updates[`${key}.maxValue`] = this.data.template.questions[i].maxValue || 5;
      updates[`${key}.options`] = undefined;
    } else if (typeKey === 'scale') {
      const existing = this.data.template.questions[i].scaleOptions;
      if (!existing || existing.length === 0) {
        updates[`${key}.scaleOptions`] = [
          { id: this._generateId('so'), label: '非常差', value: 1 },
          { id: this._generateId('so'), label: '一般', value: 3 },
          { id: this._generateId('so'), label: '非常好', value: 5 }
        ];
      }
      updates[`${key}.options`] = undefined;
    } else {
      updates[`${key}.options`] = undefined;
      updates[`${key}.scaleOptions`] = undefined;
    }

    this.setData(updates);
  },

  onOptionLabelInput(e) {
    const { qi, oi } = e.currentTarget.dataset;
    this.setData({
      [`template.questions[${qi}].options[${oi}].label`]: e.detail.value
    });
  },

  onOptionScoreInput(e) {
    const { qi, oi } = e.currentTarget.dataset;
    this.setData({
      [`template.questions[${qi}].options[${oi}].score`]: e.detail.value
    });
  },

  addOption(e) {
    const i = parseInt(e.currentTarget.dataset.index);
    const questions = [...this.data.template.questions];
    const q = questions[i];
    if (!q.options) q.options = [];
    q.options.push({ id: this._generateId('o'), label: `选项${q.options.length + 1}`, score: 0 });
    this.setData({ 'template.questions': questions });
  },

  removeOption(e) {
    const { qi, oi } = e.currentTarget.dataset;
    const questions = [...this.data.template.questions];
    questions[qi].options.splice(oi, 1);
    this.setData({ 'template.questions': questions });
  },

  onScaleOptionLabelInput(e) {
    const { qi, oi } = e.currentTarget.dataset;
    this.setData({
      [`template.questions[${qi}].scaleOptions[${oi}].label`]: e.detail.value
    });
  },

  onScaleOptionValueInput(e) {
    const { qi, oi } = e.currentTarget.dataset;
    this.setData({
      [`template.questions[${qi}].scaleOptions[${oi}].value`]: e.detail.value
    });
  },

  addScaleOption(e) {
    const i = parseInt(e.currentTarget.dataset.index);
    const questions = [...this.data.template.questions];
    const q = questions[i];
    if (!q.scaleOptions) q.scaleOptions = [];
    const nextVal = q.scaleOptions.length > 0 ? q.scaleOptions[q.scaleOptions.length - 1].value + 1 : 1;
    q.scaleOptions.push({ id: this._generateId('so'), label: `选项${q.scaleOptions.length + 1}`, value: nextVal });
    this.setData({ 'template.questions': questions });
  },

  removeScaleOption(e) {
    const { qi, oi } = e.currentTarget.dataset;
    const questions = [...this.data.template.questions];
    questions[qi].scaleOptions.splice(oi, 1);
    this.setData({ 'template.questions': questions });
  },

  onRatingRangeInput(e) {
    const { qi, field } = e.currentTarget.dataset;
    this.setData({ [`template.questions[${qi}].${field}`]: e.detail.value });
  },

  addQuestion() {
    const questions = [...this.data.template.questions];
    const newQ = {
      id: this._generateId('q'),
      type: 'single',
      title: '新题目',
      required: true,
      options: [
        { id: this._generateId('o'), label: '选项1', score: 0 },
        { id: this._generateId('o'), label: '选项2', score: 0 }
      ]
    };
    questions.push(newQ);
    this.setData({
      'template.questions': questions,
      editingIndex: questions.length - 1
    });
  },

  removeQuestion(e) {
    const i = parseInt(e.currentTarget.dataset.index);
    wx.showModal({
      title: i18n.t('tplEdit.deleteConfirmTitle'),
      content: i18n.t('tplEdit.deleteConfirmContent'),
      success: (res) => {
        if (res.confirm) {
          const questions = [...this.data.template.questions];
          questions.splice(i, 1);
          this.setData({
            'template.questions': questions,
            editingIndex: -1
          });
        }
      }
    });
  },

  moveQuestion(e) {
    const { index, direction } = e.currentTarget.dataset;
    const questions = [...this.data.template.questions];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= questions.length) return;
    [questions[index], questions[target]] = [questions[target], questions[index]];
    this.setData({ 'template.questions': questions });
  },

  togglePreview() {
    this.setData({ isPreviewMode: !this.data.isPreviewMode });
  },

  validateAndSave() {
    const { template } = this.data;
    if (!template.name.trim()) {
      wx.showToast({ title: i18n.t('tplEdit.validateName'), icon: 'none' });
      return;
    }
    if (template.questions.length === 0) {
      wx.showToast({ title: i18n.t('tplEdit.validateQuestions'), icon: 'none' });
      return;
    }

    for (let i = 0; i < template.questions.length; i++) {
      const q = template.questions[i];
      if (!q.title.trim()) {
        wx.showToast({ title: i18n.t('tplEdit.validateTitleEmpty', [i + 1]), icon: 'none' });
        return;
      }
      if ((q.type === 'single' || q.type === 'multiple') && (!q.options || q.options.length < 2)) {
        wx.showToast({ title: i18n.t('tplEdit.validateOptionsCount', [i + 1]), icon: 'none' });
        return;
      }
      if ((q.type === 'single' || q.type === 'multiple')) {
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].label.trim()) {
            wx.showToast({ title: i18n.t('tplEdit.validateOptionEmpty', [i + 1, j + 1]), icon: 'none' });
            return;
          }
        }
      }
    }

    this._saveTemplate();
  },

  // 保存模板到后端
  _saveTemplate() {
    const { template, templateId, mode } = this.data;

    wx.showLoading({ title: i18n.t('tplEdit.saving') });

    // 构造干净的模板数据（去除内部临时字段）
    const cleanQuestions = template.questions.map((q, idx) => {
      const cleanQ = {
        id: q.id,
        type: q.type,
        title: q.title.trim(),
        required: !!q.required,
        sortOrder: idx + 1
      };
      if (q.type === 'single' || q.type === 'multiple') {
        cleanQ.options = (q.options || []).map(o => ({
          id: o.id,
          label: o.label.trim(),
          value: o.id,
          score: Number(o.score) || 0
        }));
      } else if (q.type === 'rating') {
        cleanQ.minValue = Number(q.minValue) || 1;
        cleanQ.maxValue = Number(q.maxValue) || 5;
      } else if (q.type === 'scale') {
        cleanQ.options = (q.scaleOptions || []).map(o => ({
          id: o.id,
          label: o.label.trim(),
          value: Number(o.value) || 0
        }));
      }
      return cleanQ;
    });

    const payload = {
      name: template.name.trim(),
      description: template.description.trim(),
      language: template.language,
      category: template.category,
      questions: cleanQuestions
    };

    const request = mode === 'create'
      ? api.createTemplate({ ...payload, status: 'active' })
      : api.updateTemplate(templateId, payload);

    request
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: i18n.t(mode === 'create' ? 'tplEdit.createSuccess' : 'tplEdit.saveSuccess'),
          icon: 'success'
        });
        setTimeout(() => wx.navigateBack(), 1000);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('[模板编辑] 保存失败:', err);
        wx.showToast({ title: err.message || i18n.t('common.fail'), icon: 'none' });
      });
  },

  publishTemplate() {
    wx.showModal({
      title: i18n.t('tplEdit.publishTitle'),
      content: i18n.t('tplEdit.publishContent'),
      success: (res) => {
        if (res.confirm) {
          this.validateAndSave();
        }
      }
    });
  }
});
