// pages/location/index.js
Page({
  data: {
    longitude: 113.324520,
    latitude: 23.099994,
    markers: [{
      id: 1,
      longitude: 113.324520,
      latitude: 23.099994,
      iconPath: '/images/marker.png',
      width: 32,
      height: 32,
      callout: {
        content: '售货机001号',
        color: '#000000',
        fontSize: 14,
        borderRadius: 4,
        bgColor: '#ffffff',
        padding: 8,
        display: 'ALWAYS'
      }
    }],
    scale: 16,
    isLoading: false
  },

  onLoad() {
    this.getCurrentLocation()
  },

  getCurrentLocation() {
    this.setData({ isLoading: true })
    
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          longitude: res.longitude,
          latitude: res.latitude,
          isLoading: false
        })
        
        // 获取附近的售货机（模拟数据）
        this.getNearbyVendingMachines(res.longitude, res.latitude)
      },
      fail: (err) => {
        wx.showToast({
          title: '获取位置失败，请检查定位权限',
          icon: 'none'
        })
        this.setData({ isLoading: false })
      }
    })
  },
  
  getNearbyVendingMachines(longitude, latitude) {
    // 这里可以替换为真实的API调用
    const mockMachines = [
      {
        id: 1,
        longitude: longitude + 0.002,
        latitude: latitude + 0.001,
        name: '售货机001号',
        status: '正常营业'
      },
      {
        id: 2,
        longitude: longitude - 0.001,
        latitude: latitude + 0.002,
        name: '售货机002号',
        status: '正常营业'
      }
    ]
    
    // 生成标记点
    const markers = mockMachines.map(machine => ({
      id: machine.id,
      longitude: machine.longitude,
      latitude: machine.latitude,
      iconPath: '/images/marker.png',
      width: 32,
      height: 32,
      callout: {
        content: machine.name,
        color: '#000000',
        fontSize: 14,
        borderRadius: 4,
        bgColor: '#ffffff',
        padding: 8,
        display: 'ALWAYS'
      }
    }))
    
    this.setData({ markers })
  },

  refreshLocation() {
    this.getCurrentLocation()
  },
  
  onMarkerTap(e) {
    const markerId = e.markerId
    const machine = this.data.markers.find(item => item.id === markerId)
    if (machine) {
      wx.showModal({
        title: machine.callout.content,
        content: '是否查看此售货机商品?',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: `/pages/index/index?machine_id=${markerId}`
            })
          }
        }
      })
    }
  }
})