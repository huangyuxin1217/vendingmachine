// pages/product/detail.js
Page({
  data: {
    product: null,
    quantity: 1,
    isLoading: true
  },

  onLoad(options) {
    const productId = parseInt(options.id);
    // 模拟从服务器获取数据
    this.getProductDetail(productId);
  },

  getProductDetail(productId) {
    // 模拟API请求
    wx.request({
      url: 'http://47.108.141.135:5001/product',
      data: { id: productId },
      success: (res) => {
        // 由于API可能不存在，这里使用本地数据模拟
        const products = getApp().globalData.products || [
          { id: 1, name: "农夫山泉", price: 2.0, img: "/images/water.jpg", stock: 15, description: "天然矿泉水，口感纯正，富含矿物质，健康饮用首选。" },
          { id: 2, name: "可口可乐", price: 3.0, img: "/images/cola.jpg", stock: 20, description: "经典碳酸饮料，畅爽口感，瞬间提神，激发活力。" },
          { id: 3, name: "东鹏特饮", price: 5.0, img: "/images/dongpeng.jpg", stock: 8, description: "强劲能量饮料，添加多种维生素，快速补充体力。" },
          { id: 4, name: "乐事薯片青瓜味", price: 7.0, img: "/images/leshi.jpg", stock: 12, description: "精选马铃薯，青瓜风味，香脆可口，休闲零食必备。" }
        ];
        
        const product = products.find(p => p.id === productId);
        
        if (product) {
          this.setData({
            product,
            isLoading: false
          });
        } else {
          wx.showToast({
            title: '商品不存在',
            icon: 'error'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      },
      fail: () => {
        // 失败时模拟数据
        const products = [
          { id: 1, name: "农夫山泉", price: 2.0, img: "/images/water.jpg", stock: 15, description: "天然矿泉水，口感纯正，富含矿物质，健康饮用首选。" },
          { id: 2, name: "可口可乐", price: 3.0, img: "/images/cola.jpg", stock: 20, description: "经典碳酸饮料，畅爽口感，瞬间提神，激发活力。" },
          { id: 3, name: "东鹏特饮", price: 5.0, img: "/images/dongpeng.jpg", stock: 8, description: "强劲能量饮料，添加多种维生素，快速补充体力。" },
          { id: 4, name: "乐事薯片青瓜味", price: 7.0, img: "/images/leshi.jpg", stock: 12, description: "精选马铃薯，青瓜风味，香脆可口，休闲零食必备。" }
        ];
        
        const product = products.find(p => p.id === productId) || products[0];
        
        this.setData({
          product,
          isLoading: false
        });
      }
    });
  },

  decreaseQuantity() {
    if (this.data.quantity > 1) {
      this.setData({
        quantity: this.data.quantity - 1
      });
    }
  },

  increaseQuantity() {
    if (this.data.quantity < this.data.product.stock) {
      this.setData({
        quantity: this.data.quantity + 1
      });
    } else {
      wx.showToast({
        title: '库存不足',
        icon: 'none'
      });
    }
  },

  addToCart() {
    const app = getApp();
    const product = this.data.product;
    const quantity = this.data.quantity;
    
    // 获取购物车
    const cartItems = app.globalData.cartItems || [];
    
    // 查找是否已存在
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      // 已存在则增加数量
      existingItem.quantity += quantity;
    } else {
      // 不存在则添加
      cartItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        img: product.img,
        quantity: quantity,
        selected: true
      });
    }
    
    // 更新全局购物车
    app.globalData.cartItems = cartItems;
    
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    });
  },

  buyNow() {
    const app = getApp();
    const product = this.data.product;
    const quantity = this.data.quantity;
    
    // 清空购物车
    app.globalData.cartItems = [{
      id: product.id,
      name: product.name,
      price: product.price,
      img: product.img,
      quantity: quantity,
      selected: true
    }];
    
    // 跳转到购物车
    wx.navigateTo({
      url: '/pages/cart/index?checkout=true'
    });
  }
})