// components/search-bar/search-bar.js
Component({
  properties: {
    placeholder: { type: String, value: '搜索...' },
    value: { type: String, value: '' },
    actionText: { type: String, value: '' },
    showClear: { type: Boolean, value: true }
  },
  data: {
    innerValue: ''
  },
  observers: {
    'value': function (val) {
      this.setData({ innerValue: val });
    }
  },
  methods: {
    onInput(e) {
      const v = e.detail.value;
      this.setData({ innerValue: v });
      this.triggerEvent('change', { value: v });
    },
    onConfirm(e) {
      this.triggerEvent('search', { value: e.detail.value || this.data.innerValue });
    },
    onClear() {
      this.setData({ innerValue: '' });
      this.triggerEvent('change', { value: '' });
    },
    onAction() {
      this.triggerEvent('action');
    }
  }
});
