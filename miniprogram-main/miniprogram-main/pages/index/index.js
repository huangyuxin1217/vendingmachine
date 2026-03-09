// pages/index/index.js
Page({
  data: {
    products: [],
    isLoadingStock: false
  },
  
  onLoad() {
    this.getStockData()
  },
  
  // 启用下拉刷新
  onPullDownRefresh() {
    this.getStockData().then(() => {
      wx.stopPullDownRefresh() // 完成后停止刷新动画
    })
  },
  
  getStockData() {
    this.setData({ isLoadingStock: true })
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://47.108.141.135:5001/api/products/list',
        success: (res) => {
          console.log('API返回数据:', res.data);
          if (res.statusCode === 200 && res.data.code === 200) {
            const app = getApp();
            const productList = res.data.data.map(product => ({
              id: product.id,
              name: product.name,
              price: product.price,
              img: app.getProductImage(product.name),
              stock: product.stock,
              description: app.getProductDescription(product.name)
            }));
            
            this.setData({
              products: productList,
              isLoadingStock: false
            })
            resolve(productList)
          } else {
            console.error('获取库存失败:', res.data);
            wx.showToast({ 
              title: res.data.message || '获取库存失败', 
              icon: 'none' 
            })
            this.setData({ isLoadingStock: false })
            reject(res.data.message || '获取库存失败')
          }
        },
        fail: (err) => {
          console.error('网络请求失败:', err);
          wx.showToast({ 
            title: '网络连接失败', 
            icon: 'none' 
          })
          this.setData({ isLoadingStock: false })
          reject(err)
        }
      })
    })
  },
  
  onProductTap(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product/detail?id=${productId}`
    });
  },

  addToCart(e) {
    const product = e.currentTarget.dataset.product;
    
    // 检查库存
    if (product.stock <= 0) {
      wx.showToast({
        title: '商品库存不足',
        icon: 'none'
      });
      return;
    }
    
    // 调用全局方法添加到购物车
    const app = getApp();
    app.addToCart(product);
    
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    });
  }
})