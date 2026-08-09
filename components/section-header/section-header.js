// components/section-header/section-header.js
Component({
  properties: {
    title: { type: String, value: '' },
    count: { type: null, value: '' },
    actionText: { type: String, value: '' },
    showArrow: { type: Boolean, value: true }
  },
  methods: {
    onActionTap() {
      this.triggerEvent('action');
    }
  }
});
