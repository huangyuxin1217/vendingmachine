// pages/cart/index.js
Page({
  data: {
    cartItems: [],
    totalPrice: 0,
    allSelected: true,
    isEmpty: true,
    isCheckout: false
  },

  onLoad(options) {
    this.setData({
      isCheckout: options.checkout === 'true'
    });
  },
  
  onShow() {
    const app = getApp();
    const cartItems = app.globalData.cartItems || [];
    
    this.setData({
      cartItems,
      isEmpty: cartItems.length === 0
    });
    
    this.calculateTotalPrice();
    this.checkAllSelected();
  },
  
  calculateTotalPrice() {
    let total = 0;
    this.data.cartItems.forEach(item => {
      if (item.selected) {
        total += item.price * item.quantity;
      }
    });
    
    this.setData({
      totalPrice: total.toFixed(2)
    });
  },
  
  checkAllSelected() {
    const allSelected = this.data.cartItems.length > 0 && 
      this.data.cartItems.every(item => item.selected);
    
    this.setData({ allSelected });
  },
  
  onItemSelect(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.cartItems[index];
    item.selected = !item.selected;
    
    this.setData({
      [`cartItems[${index}].selected`]: item.selected
    });
    
    this.calculateTotalPrice();
    this.checkAllSelected();
    
    // 更新全局数据
    getApp().globalData.cartItems = this.data.cartItems;
  },
  
  onSelectAll() {
    const newAllSelected = !this.data.allSelected;
    const cartItems = this.data.cartItems.map(item => {
      return { ...item, selected: newAllSelected };
    });
    
    this.setData({
      cartItems,
      allSelected: newAllSelected
    });
    
    this.calculateTotalPrice();
    
    // 更新全局数据
    getApp().globalData.cartItems = this.data.cartItems;
  },
  
  decreaseQuantity(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.cartItems[index];
    
    if (item.quantity > 1) {
      item.quantity -= 1;
      
      this.setData({
        [`cartItems[${index}].quantity`]: item.quantity
      });
      
      this.calculateTotalPrice();
      
      // 更新全局数据
      getApp().globalData.cartItems = this.data.cartItems;
    }
  },
  
  increaseQuantity(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.cartItems[index];
    
    item.quantity += 1;
    
    this.setData({
      [`cartItems[${index}].quantity`]: item.quantity
    });
    
    this.calculateTotalPrice();
    
    // 更新全局数据
    getApp().globalData.cartItems = this.data.cartItems;
  },
  
  removeItem(e) {
    const index = e.currentTarget.dataset.index;
    const cartItems = this.data.cartItems.filter((_, i) => i !== index);
    
    this.setData({
      cartItems,
      isEmpty: cartItems.length === 0
    });
    
    this.calculateTotalPrice();
    this.checkAllSelected();
    
    // 更新全局数据
    getApp().globalData.cartItems = this.data.cartItems;
    
    wx.showToast({
      title: '已移除商品',
      icon: 'success'
    });
  },
  
  goToCheckout() {
    if (this.data.totalPrice <= 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      });
      return;
    }
    
    // 过滤已选商品
    const selectedItems = this.data.cartItems.filter(item => item.selected);
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '创建订单中...'
    });
    
    // 为每个选中的商品创建订单
    const createOrderPromises = selectedItems.map(item => {
      return app.createOrder(
        userInfo.userId,
        item.id,
        item.quantity,
        1  // 这里可能需要动态获取售货机ID，暂时使用默认值1
      );
    });
    
    // 处理所有订单创建请求
    Promise.all(createOrderPromises)
      .then(results => {
        wx.hideLoading();
        
        // 从购物车中移除已购买商品
        const remainingItems = this.data.cartItems.filter(item => !item.selected);
        app.globalData.cartItems = remainingItems;
        
        // 获取第一个订单的ID用于展示
        const firstOrderId = results[0]?.order_id;
        
        wx.showModal({
          title: '订单已创建',
          content: '是否立即付款？',
          confirmText: '立即付款',
          cancelText: '稍后付款',
          success: (res) => {
            if (res.confirm) {
              // 立即付款 - 跳转到订单详情页
              wx.navigateTo({
                url: `/pages/order/detail?id=${firstOrderId}`
              });
            } else {
              // 稍后付款 - 跳转到订单列表
              wx.navigateTo({
                url: `/pages/order/list?type=pending`
              });
            }
          }
        });
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: err || '创建订单失败',
          icon: 'none'
        });
      });
  }
})