// components/notification-toast/notification-toast.js
const app = getApp();

Component({
  properties: {},

  data: {
    visible: false,
    notification: null,
    animationData: null,
  },

  lifetimes: {
    attached() {
      // 注册回调：app 轮询发现新通知时调用本组件的 show 方法
      app.registerNotificationToast((notif) => {
        this.show(notif);
      });
    },
    detached() {
      app.unregisterNotificationToast();
      // 清除可能残留的定时器
      if (this._hideTimer) clearTimeout(this._hideTimer);
    },
  },

  methods: {
    // 显示通知弹窗（从顶部滑入，停留 4 秒，慢慢淡出）
    show(notif) {
      if (!notif) return;
      this.setData({ visible: true, notification: notif });

      // 滑入动画
      const animation = wx.createAnimation({
        duration: 400,
        timingFunction: 'ease-out',
      });
      animation.translateY(0).opacity(1).step();
      this.setData({ animationData: animation.export() });

      // 4 秒后慢慢淡出滑出
      if (this._hideTimer) clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(() => {
        this.hide();
      }, 4000);
    },

    // 淡出滑出
    hide() {
      const animation = wx.createAnimation({
        duration: 800,
        timingFunction: 'ease-in',
      });
      animation.translateY(-120).opacity(0).step();
      this.setData({ animationData: animation.export() });

      // 动画结束后隐藏
      setTimeout(() => {
        this.setData({ visible: false, notification: null });
      }, 800);
    },

    // 点击弹窗 → 跳转通知中心
    onTap() {
      this.hide();
      wx.navigateTo({ url: '/pages/notifications/notifications' });
    },
  },
});
