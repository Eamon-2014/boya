// components/stat-card/stat-card.js
Component({
  properties: {
    label: { type: String, value: '' },
    value: { type: null, value: '' },
    suffix: { type: String, value: '' },
    subtext: { type: String, value: '' },
    accentColor: {
      type: String,
      value: 'primary'
    },
    trendType: { type: String, value: '' },
    trendValue: { type: String, value: '' }
  },
  data: {
    accentColorMap: {
      primary: '#2563EB',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      ai: '#8B5CF6'
    }
  },
  methods: {}
});
