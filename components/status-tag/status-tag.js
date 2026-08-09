// components/status-tag/status-tag.js
Component({
  properties: {
    // 类型：primary/success/warning/danger/info/ai/gray
    type: {
      type: String,
      value: 'primary'
    },
    // 文本内容
    text: {
      type: String,
      value: ''
    },
    // 是否圆角
    rounded: {
      type: Boolean,
      value: false
    },
    // 自定义背景色（优先级最高）
    bgColor: {
      type: String,
      value: ''
    },
    // 自定义文字色
    color: {
      type: String,
      value: ''
    }
  },
  data: {},
  methods: {}
});
