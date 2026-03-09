// pages/profile/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: '',
    nickName: '',
    hasLogin: false,
    orders: [],
    orderType: '',
    isLoading: true,
    orderCounts: {
      completed: 0,
      pending: 0,
      afterSale: 0
    },
    isEditingName: false, // 是否正在编辑昵称
    newNickName: '' // 新昵称
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查是否已登录
    const userInfo = getApp().globalData.userInfo
    if (userInfo) {
      this.setData({
        avatarUrl: userInfo.avatarUrl || '/images/default-avatar.png',
        nickName: userInfo.nickName,
        newNickName: userInfo.nickName,
        hasLogin: true
      })
    }
    const type = options.type || 'all'
    this.setData({ orderType: type })
    wx.setNavigationBarTitle({
      title: this.getPageTitle(type)
    })
    this.loadOrders(type)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 检查是否已登录
    const userInfo = getApp().globalData.userInfo;
    if (userInfo) {
      this.setData({
        avatarUrl: userInfo.avatarUrl || '/images/default-avatar.png',
        nickName: userInfo.nickName,
        newNickName: userInfo.nickName,
        hasLogin: true
      });
      
      // 加载订单统计数据 - 确保每次显示页面时都刷新数据
      this.loadOrderCounts();
    } else {
      this.setData({
        orderCounts: {
          completed: 0,
          pending: 0,
          afterSale: 0
        }
      });
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 用户登录
   */
  login() {
    wx.navigateTo({
      url: '/pages/login/index'
    })
  },

  getPageTitle(type) {
    const titles = {
      'all': '全部订单',
      'completed': '已完成订单',
      'pending': '待付款订单',
      'after_sale': '售后订单'
    }
    return titles[type] || '订单列表'
  },

  loadOrders(type) {
    // 这里改为从API获取订单数据
    const userInfo = getApp().globalData.userInfo
    if (!userInfo) {
      this.setData({ isLoading: false })
      return
    }
    
    this.setData({ isLoading: true })
    
    getApp().getOrders(userInfo.userId)
      .then(orders => {
        this.setData({
          orders: orders,
          isLoading: false
        })
      })
      .catch(err => {
        console.error('获取订单失败', err)
        this.setData({ isLoading: false })
        wx.showToast({
          title: '获取订单失败',
          icon: 'none'
        })
      })
  },

  // 加载订单统计
  loadOrderCounts() {
    const userInfo = getApp().globalData.userInfo
    if (!userInfo) return
    
    getApp().getOrders(userInfo.userId)
      .then(orders => {
        // 计算各状态订单数量
        const completedCount = orders.filter(order => order.status === 'completed').length
        const pendingCount = orders.filter(order => order.status === 'pending').length
        const afterSaleCount = orders.filter(order => 
          order.status === 'refund' || order.status === 'refunded').length
        
        this.setData({
          orderCounts: {
            completed: completedCount,
            pending: pendingCount,
            afterSale: afterSaleCount
          }
        })
      })
      .catch(err => {
        console.error('获取订单统计失败', err)
      })
  },
  
  // 开始编辑昵称
  startEditName() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      isEditingName: true
    })
  },
  
  // 监听输入框变化
  onNicknameInput(e) {
    this.setData({
      newNickName: e.detail.value
    })
  },
  
  // 取消编辑
  cancelEdit() {
    this.setData({
      isEditingName: false,
      newNickName: this.data.nickName
    })
  },
  
  // 保存昵称修改
  saveNickname() {
    const { newNickName } = this.data
    if (!newNickName.trim()) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      })
      return
    }
    
    const userInfo = getApp().globalData.userInfo
    if (!userInfo) return
    
    wx.showLoading({
      title: '保存中...'
    })
    
    getApp().updateUserName(userInfo.userId, newNickName)
      .then(userData => {
        wx.hideLoading()
        
        this.setData({
          nickName: newNickName,
          isEditingName: false
        })
        
        wx.showToast({
          title: '昵称修改成功',
          icon: 'success'
        })
      })
      .catch(err => {
        wx.hideLoading()
        wx.showToast({
          title: err || '修改失败',
          icon: 'none'
        })
      })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 调用全局方法退出登录
          getApp().doLogout();
          
          // 更新页面状态
          this.setData({
            hasLogin: false,
            nickName: '',
            avatarUrl: '/images/default-avatar.png',
            orderCounts: {
              completed: 0,
              pending: 0,
              afterSale: 0
            }
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  }
})