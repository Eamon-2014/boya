const util = require('../../utils/util.js');
const i18n = require('../../utils/i18n.js');
const api = require('../../utils/api.js');
const app = getApp();

const SETTINGS_STORAGE_KEY = 'app_settings';

// 保留在本地存储的设备偏好项（主题、界面语言随设备切换）
const DEVICE_KEYS = ['language', 'theme'];

// 选项值翻译映射（中文原值作为稳定 code -> 各语言翻译）
// language 项不翻译（语言名称本身即为其母语显示）
const OPTION_VALUE_I18N = {
  // theme
  '默认蓝': { 'zh-CN': '默认蓝', 'en': 'Default Blue', 'ja': 'デフォルト青', 'ko': '기본 파랑', 'fr': 'Bleu par défaut', 'de': 'Standard Blau' },
  '极光紫': { 'zh-CN': '极光紫', 'en': 'Aurora Purple', 'ja': 'オーロラ紫', 'ko': '오로라 보라', 'fr': 'Violet Aurora', 'de': 'Aurora Violett' },
  '森林绿': { 'zh-CN': '森林绿', 'en': 'Forest Green', 'ja': 'フォレストグリーン', 'ko': '포레스트 그린', 'fr': 'Vert Forêt', 'de': 'Waldgrün' },
  // campus
  '主校区': { 'zh-CN': '主校区', 'en': 'Main Campus', 'ja': 'メインキャンパス', 'ko': '메인 캠퍼스', 'fr': 'Campus principal', 'de': 'Hauptcampus' },
  '分校区A': { 'zh-CN': '分校区A', 'en': 'Branch A', 'ja': '分校A', 'ko': '분교 A', 'fr': 'Campus B A', 'de': 'Nebencampus A' },
  '分校区B': { 'zh-CN': '分校区B', 'en': 'Branch B', 'ja': '分校B', 'ko': '분교 B', 'fr': 'Campus B B', 'de': 'Nebencampus B' },
  // timezone
  'GMT+8 北京': { 'zh-CN': 'GMT+8 北京', 'en': 'GMT+8 Beijing', 'ja': 'GMT+8 北京', 'ko': 'GMT+8 베이징', 'fr': 'GMT+8 Pékin', 'de': 'GMT+8 Peking' },
  'GMT+0 伦敦': { 'zh-CN': 'GMT+0 伦敦', 'en': 'GMT+0 London', 'ja': 'GMT+0 ロンドン', 'ko': 'GMT+0 런던', 'fr': 'GMT+0 Londres', 'de': 'GMT+0 London' },
  'GMT-5 纽约': { 'zh-CN': 'GMT-5 纽约', 'en': 'GMT-5 New York', 'ja': 'GMT-5 ニューヨーク', 'ko': 'GMT-5 뉴욕', 'fr': 'GMT-5 New York', 'de': 'GMT-5 New York' },
  // quietHour
  '不开启': { 'zh-CN': '不开启', 'en': 'Off', 'ja': 'オフ', 'ko': '끔', 'fr': 'Désactivé', 'de': 'Aus' },
  // logLevel
  '调试': { 'zh-CN': '调试', 'en': 'Debug', 'ja': 'デバッグ', 'ko': '디버그', 'fr': 'Débogage', 'de': 'Debug' },
  '信息': { 'zh-CN': '信息', 'en': 'Info', 'ja': '情報', 'ko': '정보', 'fr': 'Info', 'de': 'Info' },
  '警告': { 'zh-CN': '警告', 'en': 'Warning', 'ja': '警告', 'ko': '경고', 'fr': 'Avertissement', 'de': 'Warnung' },
  '错误': { 'zh-CN': '错误', 'en': 'Error', 'ja': 'エラー', 'ko': '오류', 'fr': 'Erreur', 'de': 'Fehler' }
};

// 翻译选项值（正向：中文 code -> 当前语言显示文本）
function translateOptionValue(code) {
  if (!code) return code;
  const lang = i18n.getLang();
  const entry = OPTION_VALUE_I18N[code];
  if (entry && entry[lang]) return entry[lang];
  return code;
}

// 反向映射：当前语言显示文本 -> 中文 code（用于保存）
function reverseOptionValue(displayText, options) {
  if (!displayText) return displayText;
  const lang = i18n.getLang();
  // 先检查是否直接是中文 code
  if (OPTION_VALUE_I18N[displayText]) return displayText;
  // 反向查找
  for (const code of options) {
    const entry = OPTION_VALUE_I18N[code];
    if (entry && entry[lang] === displayText) return code;
  }
  return displayText;
}

// 语言名称到 i18n code 的映射
const LANG_NAME_TO_CODE = {
  '简体中文': 'zh-CN',
  '繁體中文': 'zh-CN',
  'English': 'en',
  '日本語': 'ja',
  '한국어': 'ko',
  'Français': 'fr',
  'Deutsch': 'de',
  'Español': 'en',
  'Português': 'en',
  'Italiano': 'en',
  'Русский': 'en',
  'العربية': 'en',
  'ไทย': 'en',
  'Tiếng Việt': 'en',
  'Bahasa Indonesia': 'en',
  'Bahasa Melayu': 'en',
  'Türkçe': 'en',
  'Nederlands': 'en',
  'Polski': 'en',
  'Svenska': 'en',
  'Dansk': 'en',
  'Suomi': 'en',
  'Norsk': 'en',
  'Čeština': 'en',
  'Magyar': 'en',
  'Română': 'en',
  'Bulgar': 'en',
  'Ελληνικά': 'en',
  'עברית': 'en',
  'فارسی': 'en',
  'हिन्दी': 'en',
  'বাংলা': 'en',
  'தமிழ்': 'en',
  'తెలుగు': 'en',
  'मराठी': 'en',
  'गुजराती': 'en'
};

const DEFAULT_GROUPS = [
  {
    key: 'general',
    title: '通用设置',
    titleKey: 'settings.general',
    items: [
      {
        key: 'language', type: 'picker',
        label: '界面语言', icon: '🌐',
        labelKey: 'settings.language',
        value: '简体中文', options: ['简体中文', '繁體中文', 'English', '日本語', '한국어', 'Français', 'Deutsch', 'Español', 'Português', 'Italiano', 'Русский', 'العربية', 'ไทย', 'Tiếng Việt', 'Bahasa Indonesia', 'Bahasa Melayu', 'Türkçe', 'Nederlands', 'Polski', 'Svenska', 'Dansk', 'Suomi', 'Norsk', 'Čeština', 'Magyar', 'Română', 'Bulgar', 'Ελληνικά', 'עברית', 'فارسی', 'हिन्दी', 'বাংলা', 'தமிழ்', 'తెలుగు', 'मराठी', 'गुजराती', '中文(粤语)', '客家话', '藏文', '蒙古语', 'Uzbek', 'Қазақша', 'Азербайджан', 'Gürcüce', 'Հայերեն', 'қыргызча', 'Тоҷикӣ', 'کوردی', 'Sorani', 'Kurmanji', 'Zarma', 'Kanuri', 'Hausa', 'Igbo', 'Yorùbá', 'Amharic', 'Oromoo', 'Tigrinya', 'Swahili', 'Kiswahili', 'Luganda', 'Zulu', 'Xhosa', 'Afrikaans', 'isiNdebele', 'Sesotho', 'isiZulu', 'isiXhosa', 'Setswana', 'Sepedi', 'Tswana', 'Lingala', 'Mongolian', 'Tibetan', 'Burmese', 'Khmer', 'Lao', 'Tagalog', 'Cebuano', 'Ilocano', 'Waray', 'Hiligaynon', 'Pangasinan', 'Bicolano', 'Maguindanao', 'Cotabato', 'Maranao', 'Chavacano', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Arabic', 'Turkish', 'Dutch', 'Polish', 'Swedish', 'Finnish', 'Norwegian', 'Danish', 'Czech', 'Hungarian', 'Romanian', 'Bulgarian', 'Greek', 'Hebrew', 'Persian', 'Urdu', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Punjabi', 'Malayalam', 'Kannada', 'Odia', 'Assamese', 'Maithili', 'Santali', 'Kashmiri', 'Dogri', 'Kannada', 'Konkani', 'Sindhi', 'Rajasthani', 'Bhojpuri', 'Chattisgarhi', 'Haryanvi', 'Garhwali', 'Kumaoni', 'Pahari', 'Ladakhi', 'Balti', 'Purik', 'Ladakhi']
      },
      {
        key: 'theme', type: 'picker',
        label: '主题风格', icon: '🎨',
        labelKey: 'settings.theme',
        value: '默认蓝', options: ['默认蓝', '极光紫', '森林绿']
      },
      {
        key: 'campus', type: 'picker',
        label: '默认校区', icon: '📍',
        labelKey: 'settings.campus',
        value: '主校区', options: ['主校区', '分校区A', '分校区B']
      },
      {
        key: 'timezone', type: 'picker',
        label: '时区设置', icon: '🕐',
        labelKey: 'settings.timezone',
        value: 'GMT+8 北京', options: ['GMT+8 北京', 'GMT+0 伦敦', 'GMT-5 纽约']
      }
    ]
  },
  {
    key: 'notification',
    title: '通知设置',
    titleKey: 'settings.notification',
    items: [
      {
        key: 'pushEnabled', type: 'switch',
        label: '推送通知', icon: '📨',
        labelKey: 'settings.pushEnabled',
        desc: '接收系统和业务提醒推送', enabled: true
      },
      {
        key: 'soundEnabled', type: 'switch',
        label: '提示音', icon: '🔔',
        labelKey: 'settings.soundEnabled',
        desc: '收到新通知时播放提示音', enabled: true
      },
      {
        key: 'vibrationEnabled', type: 'switch',
        label: '振动提醒', icon: '📳',
        labelKey: 'settings.vibrationEnabled',
        desc: '重要通知开启振动提醒', enabled: true
      },
      {
        key: 'quietHour', type: 'picker',
        label: '免打扰时段', icon: '🌙',
        labelKey: 'settings.quietHour',
        value: '22:00 - 08:00', options: ['20:00 - 08:00', '22:00 - 08:00', '23:00 - 07:00', '不开启']
      }
    ]
  },
  {
    key: 'data',
    title: '数据与备份',
    titleKey: 'settings.data',
    items: [
      {
        key: 'autoBackup', type: 'switch',
        label: '自动备份', icon: '💾',
        labelKey: 'settings.autoBackup',
        desc: '每日凌晨自动备份数据', enabled: true
      },
      {
        key: 'dataSync', type: 'switch',
        label: '多端同步', icon: '🔄',
        labelKey: 'settings.dataSync',
        desc: '在移动设备间实时同步数据', enabled: false
      },
      {
        key: 'lastBackup', type: 'info',
        label: '上次备份时间', icon: '📅',
        labelKey: 'settings.lastBackup',
        value: '2025-08-01 03:00'
      }
    ]
  },
  {
    key: 'advanced',
    title: '高级设置',
    titleKey: 'settings.advanced',
    items: [
      {
        key: 'apiConfig', type: 'action',
        label: '接口配置', icon: '🔌',
        labelKey: 'settings.apiConfig',
        desc: 'API地址、密钥等对接配置'
      },
      {
        key: 'changeRole', type: 'action',
        label: '更改身份', icon: '🪪',
        labelKey: 'settings.changeRole',
        desc: '切换为管理员需输入授权码'
      },
      {
        key: 'logLevel', type: 'picker',
        label: '日志级别', icon: '📋',
        labelKey: 'settings.logLevel',
        value: '警告', options: ['调试', '信息', '警告', '错误']
      },
      {
        key: 'clearCache', type: 'action',
        label: '清除缓存', icon: '🧹',
        labelKey: 'settings.clearCache',
        desc: '释放本地存储空间（已用 128MB）'
      },
      {
        key: 'about', type: 'info',
        label: '关于系统', icon: 'ℹ️',
        labelKey: 'settings.about',
        value: 'v2.3.1 (Build 2025.08.01)'
      }
    ]
  }
];

// 需要保留的 storage key（清除缓存时不删这些）
const PRESERVED_KEYS = [
  SETTINGS_STORAGE_KEY,
  'notifications_data',
  'ai_teachers_data',
  'customers_data',
  'reports_data',
  'questionnaires_data',
  'current_user',
  'app_lang'
];

Page({
  data: {
    groups: [],
    pageTitle: '',
    showPicker: false,
    pickerTitle: '',
    pickerOptions: [],
    pickerGroupIdx: -1,
    pickerItemIdx: -1,
    showApiModal: false,
    apiBaseUrl: '',
    apiKey: '',
    apiSecret: '',
    showRoleModal: false,
    currentRole: '',
    selectedRole: '管理员',
    roleOptions: ['管理员', '校区主管', '教师'],
    roleCode: '',
    changingRole: false,
    themeColors: {}
  },

  loadThemeColors() {
    const themeColors = app.getThemeColors();
    this.setData({ themeColors });
  },

  onLoad() {
    this.loadThemeColors();
    this.loadSettings();
    this.refreshI18n();
  },

  onShow() {
    this.loadThemeColors();
    this.refreshI18n();
  },

  refreshI18n() {
    // theme/language 从本地存储读取（设备偏好），其余从后端设置读取
    const localSaved = wx.getStorageSync(SETTINGS_STORAGE_KEY) || {};
    const apiSaved = this._apiSettings || {};
    const groups = DEFAULT_GROUPS.map(group => ({
      ...group,
      title: i18n.t(group.titleKey || 'settings.general'),
      items: group.items.map(item => {
        // 应用 i18n 翻译
        const translated = {
          ...item,
          label: item.labelKey ? i18n.t(item.labelKey) : item.label
        };
        // 合并已保存的值（theme/language 用本地，其余用 API）
        const isDeviceKey = DEVICE_KEYS.indexOf(item.key) !== -1;
        const savedItem = isDeviceKey ? localSaved[item.key] : apiSaved[item.key];
        if (savedItem !== undefined) {
          if (item.type === 'switch') {
            translated.enabled = savedItem;
          } else if (item.type === 'picker') {
            translated.value = savedItem;
          }
        }
        // 翻译 picker 的 value 和 options（language 项除外，语言名称保持原样）
        if (item.type === 'picker' && item.key !== 'language') {
          translated.value = translateOptionValue(translated.value);
          translated.options = (translated.options || []).map(opt => translateOptionValue(opt));
        }
        return translated;
      })
    }));
    this.setData({
      groups,
      pageTitle: i18n.t('settings.title'),
      logoutText: app.globalData.isLoggedIn ? i18n.t('settings.logout') : i18n.t('auth.login') + '/' + i18n.t('auth.register'),
      apiConfigTitle: i18n.t('settings.apiConfigTitle'),
      apiBaseUrlLabel: i18n.t('settings.apiBaseUrlLabel'),
      apiKeyLabel: i18n.t('settings.apiKeyLabel'),
      apiSecretLabel: i18n.t('settings.apiSecretLabel'),
      cancelText: i18n.t('settings.cancel'),
      saveText: i18n.t('settings.save'),
      enterApiKey: i18n.t('settings.enterApiKey'),
      enterApiSecret: i18n.t('settings.enterApiSecret')
    });
    wx.setNavigationBarTitle({ title: i18n.t('settings.title') });
  },

  // 从后端加载设置，再刷新 UI
  loadSettings() {
    // 先用本地 theme/language 兜底刷新 UI（立即可见）
    this.refreshI18n();
    api.getSettings().then(saved => {
      this._apiSettings = saved || {};
      this.refreshI18n();
    }).catch(err => {
      console.error('[Settings] 加载设置失败:', err);
      this._apiSettings = this._apiSettings || {};
    });
  },

  // 保存单项设置：theme/language 写本地（设备偏好），其余写后端
  saveSetting(key, value) {
    if (DEVICE_KEYS.indexOf(key) !== -1) {
      const saved = wx.getStorageSync(SETTINGS_STORAGE_KEY) || {};
      saved[key] = value;
      wx.setStorageSync(SETTINGS_STORAGE_KEY, saved);
      return;
    }
    this._apiSettings = { ...(this._apiSettings || {}), [key]: value };
    api.updateSettings({ [key]: value }).catch(err => {
      console.error('[Settings] 保存失败:', key, err);
      util.showToast(err.message || '保存失败');
    });
  },

  onItemTap(e) {
    const { item } = e.currentTarget.dataset;
    if (item.type === 'switch') {
      this.onToggleSwitch(item.key);
    } else if (item.type === 'picker') {
      this.openPicker(item.key);
    } else if (item.type === 'action') {
      this.onAction(item.key);
    } else if (item.type === 'info') {
      if (item.key === 'about') {
        this.showAbout();
      } else {
        util.showToast(`${item.label}：${item.value}`);
      }
    }
  },

  onToggleSwitch(itemKey) {
    const { groups } = this.data;
    const groupsCopy = groups.map(g => ({
      ...g,
      items: g.items.map(it =>
        it.key === itemKey ? { ...it, enabled: !it.enabled } : it
      )
    }));
    this.setData({ groups: groupsCopy });
    const item = groupsCopy.find(g => g.items.some(i => i.key === itemKey)).items.find(i => i.key === itemKey);
    this.saveSetting(itemKey, item.enabled);
    util.showToast(`${item.label}${item.enabled ? '→' : '✗'}`);
  },

  openPicker(itemKey) {
    const { groups } = this.data;
    let groupIdx = -1, itemIdx = -1, item = null;
    groups.forEach((g, gi) => {
      g.items.forEach((it, ii) => {
        if (it.key === itemKey) {
          groupIdx = gi; itemIdx = ii; item = it;
        }
      });
    });
    if (!item) return;
    this.setData({
      showPicker: true,
      pickerTitle: item.label,
      pickerOptions: item.options,
      pickerGroupIdx: groupIdx,
      pickerItemIdx: itemIdx
    });
  },

  onPickerSelect(e) {
    const optIdx = e.currentTarget.dataset.idx;
    const { pickerGroupIdx, pickerItemIdx, pickerOptions, groups } = this.data;
    const selectedDisplay = pickerOptions[optIdx];
    const currentItem = groups[pickerGroupIdx].items[pickerItemIdx];
    
    // language 项：直接保存语言名称（即显示文本）
    // 其他 picker 项：反向映射回中文 code 保存，显示用翻译文本
    let valueToSave, valueToDisplay;
    if (currentItem.key === 'language') {
      valueToSave = selectedDisplay;
      valueToDisplay = selectedDisplay;
    } else {
      // 从 DEFAULT_GROUPS 取原始中文 options 做反向映射
      const originalItem = DEFAULT_GROUPS.find(g => g.items.some(i => i.key === currentItem.key))
        .items.find(i => i.key === currentItem.key);
      valueToSave = reverseOptionValue(selectedDisplay, originalItem.options);
      valueToDisplay = selectedDisplay;
    }
    
    const groupsCopy = [...groups];
    const newItem = {
      ...currentItem,
      value: valueToDisplay
    };
    groupsCopy[pickerGroupIdx].items.splice(pickerItemIdx, 1, newItem);
    this.setData({ groups: groupsCopy, showPicker: false });
    this.saveSetting(currentItem.key, valueToSave);
    
    if (currentItem.key === 'language') {
      const langCode = LANG_NAME_TO_CODE[selectedDisplay] || 'zh-CN';
      console.log('[DEBUG] 用户选择语言:', selectedDisplay, '-> langCode:', langCode);
      i18n.setLang(langCode);
      console.log('[DEBUG] setLang 后, getLang()=', i18n.getLang(), 'app.globalData.currentLang=', app.globalData.currentLang, 'storage=', wx.getStorageSync('app_lang'));
      console.log('[DEBUG] 翻译测试: page.dashboard=', i18n.t('page.dashboard'), 'tab.dashboard=', i18n.t('tab.dashboard'));
      this.refreshI18n();
      wx.showToast({ title: i18n.t('common.success'), icon: 'success' });
      // 强制刷新所有已打开页面
      setTimeout(() => {
        const pages = getCurrentPages();
        console.log('[DEBUG] 当前页面栈:', pages.map(p => p.route));
        pages.forEach(page => {
          if (!page.route) return;
          const route = page.route.replace('pages/', '').replace(/\/index$/, '');
          const pageKey = this._getPageKeyByRoute(route);
          if (pageKey) {
            try {
              const title = i18n.t('page.' + pageKey);
              console.log('[DEBUG] 强制设置页面', route, '标题=', title);
              wx.setNavigationBarTitle({ title });
              if (typeof page.getTabBar === 'function' && page.getTabBar()) {
                page.getTabBar().refreshTexts();
              }
            } catch (e) {
              console.error('[DEBUG] 刷新失败', route, e);
            }
          }
        });
      }, 300);
    } else if (currentItem.key === 'theme') {
      // 应用主题
      app.applyTheme(valueToSave);
      // 强制刷新所有已打开页面的主题
      setTimeout(() => {
        const pages = getCurrentPages();
        pages.forEach(page => {
          if (!page.route) return;
          try {
            if (page.loadThemeColors) {
              page.loadThemeColors();
            } else if (page.onShow) {
              page.onShow();
            }
          } catch (e) {
            console.error('[DEBUG] 主题刷新失败', page.route, e);
          }
        });
      }, 100);
      wx.showToast({ title: i18n.t('common.success'), icon: 'success' });
    } else {
      util.showToast(i18n.t('common.success'), 'success');
    }
  },

  _getPageKeyByRoute(route) {
    const map = {
      'dashboard': 'dashboard',
      'customers': 'customers',
      'questionnaire': 'questionnaire',
      'profile': 'profile',
      'notifications': 'notifications',
      'report-detail': 'reportDetail',
      'todo-list': 'todoList',
      'data-report': 'dataReport',
      'security': 'security',
      'team-members': 'teamMembers',
      'survey-assign': 'surveyAssign',
      'customer-add': 'customerAdd',
      'customer-detail': 'customerDetail',
      'template-edit': 'templateEdit',
      'ai-teacher-edit': 'aiTeacherEdit',
      'settings': 'settings'
    };
    return map[route] || null;
  },

  onClosePicker() {
    this.setData({ showPicker: false });
  },

  onAction(itemKey) {
    if (itemKey === 'clearCache') {
      this.onClearCache();
    } else if (itemKey === 'apiConfig') {
      this.onOpenApiConfig();
    } else if (itemKey === 'changeRole') {
      this.onOpenRoleModal();
    }
  },

  // ============ 更改身份 ============
  onOpenRoleModal() {
    const currentRole = (app.globalData.currentUser && app.globalData.currentUser.role) || '教师';
    const roleOptions = [
      { key: '管理员', label: i18n.t('settings.roleAdmin') },
      { key: '校区主管', label: i18n.t('settings.roleCampusManager') },
      { key: '教师', label: i18n.t('settings.roleTeacher') }
    ];
    this.setData({
      showRoleModal: true,
      currentRole,
      currentRoleLabel: roleOptions.find(r => r.key === currentRole)?.label || currentRole,
      selectedRole: currentRole,
      roleOptions,
      roleCode: '',
      changingRole: false,
      showRoleCode: false,
      roleModalTitle: i18n.t('settings.changeRole'),
      settings_currentRoleText: i18n.t('settings.currentRole'),
      roleCodeLabel: i18n.t('settings.roleCode'),
      roleCodePlaceholder: i18n.t('settings.roleCodePlaceholder'),
      roleCodeTip: i18n.t('settings.roleCodeTip'),
      roleConfirmBtn: i18n.t('settings.confirmChangeRole'),
      roleCancelBtn: i18n.t('common.cancel'),
      roleChangingText: i18n.t('common.loading')
    });
  },

  onRoleSelect(e) {
    const role = e.currentTarget.dataset.role;
    this.setData({ selectedRole: role, roleCode: '' });
  },

  onRoleCodeInput(e) {
    this.setData({ roleCode: e.detail.value });
  },

  toggleRoleCode() {
    this.setData({ showRoleCode: !this.data.showRoleCode });
  },

  onCloseRoleModal() {
    if (this.data.changingRole) return;
    this.setData({ showRoleModal: false });
  },

  noop() {},

  onSubmitRoleChange() {
    const { selectedRole, roleCode, currentRole, changingRole } = this.data;
    if (changingRole) return;
    if (selectedRole === currentRole) {
      util.showToast(i18n.t('settings.roleSameAsCurrent'), 'none');
      return;
    }
    // 切换为管理员必须输入授权码
    if (selectedRole === '管理员' && !roleCode.trim()) {
      util.showToast(i18n.t('settings.roleCodeRequired'), 'none');
      return;
    }

    this.setData({ changingRole: true });
    api.changeRole(selectedRole, roleCode.trim())
      .then(user => {
        // 同步更新本地登录用户信息
        app.setLoggedIn(user);
        this.setData({
          showRoleModal: false,
          changingRole: false,
          currentRole: user.role
        });
        util.showToast(i18n.t('settings.roleChanged'), 'success');
      })
      .catch(err => {
        this.setData({ changingRole: false });
        const msg = err && err.message;
        if (msg && msg.indexOf('授权码') !== -1) {
          util.showToast(i18n.t('settings.roleCodeInvalid'), 'none');
        } else {
          util.showToast(i18n.t('settings.roleChangeFailed'), 'none');
        }
      });
  },

  onClearCache() {
    wx.showModal({
      title: i18n.t('settings.clearCache'),
      content: '将清除临时缓存数据（设置、通知等重要数据会保留），确定继续？',
      confirmText: i18n.t('common.confirm'),
      confirmColor: '#EF4444',
      success: (r) => {
        if (!r.confirm) return;
        wx.showLoading({ title: i18n.t('common.loading') });
        try {
          const info = wx.getStorageInfoSync();
          const keysToRemove = info.keys.filter(k => !PRESERVED_KEYS.includes(k));
          keysToRemove.forEach(k => {
            wx.removeStorageSync(k);
          });
          wx.hideLoading();
          const { groups } = this.data;
          const groupsCopy = groups.map(g => ({
            ...g,
            items: g.items.map(it => {
              if (it.key === 'lastBackup') {
                const now = new Date();
                const pad = n => String(n).padStart(2, '0');
                const value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
                return { ...it, value };
              }
              if (it.key === 'clearCache') {
                return { ...it, desc: '释放本地存储空间（已用 0MB）' };
              }
              return it;
            })
          }));
          this.setData({ groups: groupsCopy });
          util.showToast(i18n.t('common.success'), 'success');
        } catch (e) {
          wx.hideLoading();
          util.showToast('Error: ' + e.message, 'none');
        }
      }
    });
  },

  onOpenApiConfig() {
    api.getApiConfig().then(saved => {
      saved = saved || {};
      this.setData({
        showApiModal: true,
        apiBaseUrl: saved.baseUrl || saved.apiBaseUrl || 'https://api.example.com',
        apiKey: saved.apiKey || '',
        apiSecret: saved.apiSecret || ''
      });
    }).catch(err => {
      console.error('[Settings] 加载 API 配置失败:', err);
      this.setData({
        showApiModal: true,
        apiBaseUrl: 'https://api.example.com',
        apiKey: '',
        apiSecret: ''
      });
    });
  },

  onApiBaseUrlInput(e) {
    this.setData({ apiBaseUrl: e.detail.value });
  },

  onApiKeyInput(e) {
    this.setData({ apiKey: e.detail.value });
  },

  onApiSecretInput(e) {
    this.setData({ apiSecret: e.detail.value });
  },

  onApiCancel() {
    this.setData({ showApiModal: false });
  },

  onApiSave() {
    const { apiBaseUrl, apiKey, apiSecret } = this.data;
    if (!apiBaseUrl) {
      util.showToast('Please fill in API URL');
      return;
    }
    api.updateApiConfig({
      baseUrl: apiBaseUrl,
      apiKey,
      apiSecret
    }).then(() => {
      this.setData({ showApiModal: false });
      util.showToast(i18n.t('common.success'), 'success');
    }).catch(err => {
      util.showToast(err.message || '保存失败');
    });
  },

  showAbout() {
    wx.showModal({
      title: i18n.t('settings.about'),
      content: '语言教培管理系统\n版本：v2.3.1\n构建：2025.08.01\n\n© 2025 教育科技有限公司',
      showCancel: false,
      confirmText: i18n.t('common.close')
    });
  },

  onLogout() {
    // 未登录 → 跳转登录/注册页
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    // 已登录 → 退出登录
    wx.showModal({
      title: i18n.t('settings.logout'),
      content: i18n.t('auth.logoutConfirm'),
      confirmText: i18n.t('auth.logout'),
      cancelText: i18n.t('common.cancel'),
      confirmColor: '#EF4444',
      success: (r) => {
        if (!r.confirm) return;
        app.logout();
      }
    });
  }
});
