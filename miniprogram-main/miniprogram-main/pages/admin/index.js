// pages/admin/index.js
Page({
  data: {
    salesData: [],
    isLoading: true
  },

  onLoad() {
    this.loadSalesData()
  },

  loadSalesData() {
    wx.showLoading({
      title: '加载中...'
    })
    
    wx.request({
      url: 'http://47.108.141.135:5001/data',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({
            salesData: res.data.map(item => ({
              ...item,
              time: this.formatTime(item.timestamp)
            })),
            isLoading: false
          })
        } else {
          wx.showToast({ 
            title: '数据格式错误', 
            icon: 'none' 
          })
          this.setData({ isLoading: false })
        }
      },
      fail: (err) => {
        wx.showToast({ 
          title: '数据加载失败', 
          icon: 'none' 
        })
        this.setData({ isLoading: false })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const util = require('../../utils/util.js')
    return util.formatTime(date)
  }
})