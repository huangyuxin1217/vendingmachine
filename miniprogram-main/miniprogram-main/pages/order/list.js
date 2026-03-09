// pages/order/list.js
Page({
    data: {
      orders: [],
      activeTab: 'all', // 当前选中的标签: all, pending, completed, afterSale
      tabs: [
        { id: 'all', name: '全部' },
        { id: 'pending', name: '待付款' },
        { id: 'completed', name: '已完成' },
        { id: 'afterSale', name: '售后' }
      ],
      isLoading: true
    },
  
    onLoad(options) {
      console.log('订单列表页收到参数:', options);
      
      // 如果从其他页面传入了类型参数，则切换到对应标签
      if (options && options.type) {
        // 确保能正确映射类型
        const validTypes = ['all', 'pending', 'completed', 'afterSale'];
        const type = validTypes.includes(options.type) ? options.type : 'all';
        
        this.setData({
          activeTab: type
        });
      }
      
      // 立即加载一次数据
      this.loadOrders();
    },
  
    onShow() {
      this.loadOrders()
    },
  
    // 加载订单数据
    loadOrders() {
      this.setData({ isLoading: true });
      
      // 获取用户信息
      const userInfo = getApp().globalData.userInfo;
      if (!userInfo) {
        this.setData({ 
          orders: [],
          isLoading: false,
          isEmpty: true
        });
        return;
      }
      
      // 从API获取订单数据
      getApp().getOrders(userInfo.userId)
        .then(orders => {
          console.log('获取到订单数据:', orders);
          
          if (orders && orders.length > 0) {
            // 转换为页面需要的格式
            const formattedOrders = orders.map(order => {
              // 根据是否有payment_id字段判断订单状态
              const hasPayment = order.payment_id ? true : false;
              
              return {
                id: order.id,
                totalAmount: order.total_price,
                status: hasPayment ? 'completed' : 'pending',
                time: order.created_at,
                items: [{
                  id: order.id,
                  name: order.product_name,
                  quantity: order.quantity,
                  price: order.total_price / order.quantity,
                  img: getApp().getProductImage(order.product_name)
                }]
              };
            });
            
            // 根据当前选中的标签筛选订单
            let filteredOrders = formattedOrders;
            switch (this.data.activeTab) {
              case 'pending':
                filteredOrders = formattedOrders.filter(order => order.status === 'pending');
                break;
              case 'completed':
                filteredOrders = formattedOrders.filter(order => order.status === 'completed');
                break;
              case 'afterSale':
                filteredOrders = formattedOrders.filter(order => 
                  order.status === 'refund' || order.status === 'refunded');
                break;
              default:
                filteredOrders = formattedOrders;
            }
            
            this.setData({
              orders: filteredOrders,
              isLoading: false,
              isEmpty: filteredOrders.length === 0
            });
          } else {
            this.setData({
              orders: [],
              isLoading: false,
              isEmpty: true
            });
          }
        })
        .catch(err => {
          console.error('获取订单失败:', err);
          this.setData({ 
            isLoading: false,
            isEmpty: true,
            orders: []
          });
          wx.showToast({
            title: '获取订单数据失败',
            icon: 'none'
          });
        });
    },
  
    // 切换标签
    switchTab(e) {
      const tabId = e.currentTarget.dataset.id
      this.setData({
        activeTab: tabId
      })
      this.loadOrders()
    },
  
    // 查看订单详情
    viewOrderDetail(e) {
      const orderId = e.currentTarget.dataset.id
      wx.navigateTo({
        url: `/pages/order/detail?id=${orderId}`
      })
    },
  
    // 取消订单
    cancelOrder(e) {
      const orderId = e.currentTarget.dataset.id
      
      wx.showModal({
        title: '取消订单',
        content: '确定要取消该订单吗？',
        success: res => {
          if (res.confirm) {
            // 获取所有订单
            const allOrders = wx.getStorageSync('orders') || []
            
            // 更新订单状态
            const updatedOrders = allOrders.map(order => {
              if (order.id === orderId) {
                return {...order, status: 'canceled'}
              }
              return order
            })
            
            // 保存更新后的订单
            wx.setStorageSync('orders', updatedOrders)
            
            wx.showToast({
              title: '订单已取消',
              icon: 'success'
            })
            
            // 重新加载订单列表
            this.loadOrders()
          }
        }
      })
    },
  
    // 支付订单
    payOrder(e) {
      const orderId = e.currentTarget.dataset.id;
      const order = this.data.orders.find(o => o.id === orderId);
      
      if (!order) return;
      
      wx.showActionSheet({
        itemList: ['余额支付', '微信支付 (模拟)', '支付宝支付 (模拟)'],
        success: (res) => {
          // 用户选择了支付方式
          let payMethod = '';
          switch (res.tapIndex) {
            case 0: payMethod = 'balance'; break;
            case 1: payMethod = 'wechat'; break;
            case 2: payMethod = 'alipay'; break;
          }
          
          if (payMethod) {
            this.processPayment(orderId, order.totalAmount, payMethod);
          }
        }
      });
    },
  
    // 处理支付流程
    processPayment(orderId, amount, method) {
      // 获取用户信息
      const userInfo = getApp().globalData.userInfo;
      
      if (!userInfo) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      
      wx.showLoading({
        title: '支付处理中...'
      });
      
      // 调用支付API
      getApp().createPayment(
        userInfo.userId,
        orderId,
        method,
        amount
      ).then(res => {
        wx.hideLoading();
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        });
        
        // 强制清除缓存并重新加载
        wx.removeStorageSync('orderCache');
        
        // 直接检查支付状态
        this.checkOrderStatus(orderId, userInfo.userId);
        
        // 延迟后再次刷新列表
        setTimeout(() => {
          this.loadOrders();
        }, 2000);
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: err || '支付失败',
          icon: 'none'
        });
      });
    },

    // 新增：直接检查订单状态
    checkOrderStatus(orderId, userId) {
      wx.request({
        url: 'http://47.108.141.135:5001/api/order/status',
        method: 'GET',
        data: {
          order_id: orderId,
          user_id: userId
        },
        success: (res) => {
          if (res.data.code === 200 && res.data.data.status === "completed") {
            console.log("订单已完成支付:", res.data);
            // 强制刷新数据
            this.loadOrders();
          }
        }
      });
    },

    // 删除订单
    deleteOrder(e) {
      const orderId = e.currentTarget.dataset.id;
      
      wx.showModal({
        title: '删除订单',
        content: '确定要删除该订单吗？删除后无法恢复',
        success: res => {
          if (res.confirm) {
            // 获取所有订单
            const allOrders = wx.getStorageSync('orders') || [];
            
            // 过滤掉要删除的订单
            const updatedOrders = allOrders.filter(order => order.id !== orderId);
            
            // 保存更新后的订单
            wx.setStorageSync('orders', updatedOrders);
            
            wx.showToast({
              title: '订单已删除',
              icon: 'success'
            });
            
            // 重新加载订单列表
            this.loadOrders();
          }
        }
      });
    },

    // 再次购买
    rebuy(e) {
      const orderId = e.currentTarget.dataset.id;
      const allOrders = wx.getStorageSync('orders') || [];
      const order = allOrders.find(o => o.id === orderId);
      
      if (order) {
        const app = getApp();
        
        // 清空购物车
        app.globalData.cartItems = [];
        
        // 将订单商品添加到购物车
        order.items.forEach(item => {
          app.addToCart({
            id: item.id,
            name: item.name,
            price: item.price,
            img: item.img,
            stock: 999 // 假设库存充足
          }, item.quantity);
        });
        
        // 跳转到购物车
        wx.switchTab({
          url: '/pages/cart/index'
        });
      }
    },

    // 申请退款
    applyRefund(e) {
      const orderId = e.currentTarget.dataset.id;
      
      wx.showModal({
        title: '申请退款',
        content: '确定要申请退款吗？',
        success: res => {
          if (res.confirm) {
            // 获取所有订单
            const allOrders = wx.getStorageSync('orders') || [];
            
            // 更新订单状态
            const updatedOrders = allOrders.map(order => {
              if (order.id === orderId) {
                return {...order, status: 'refund'};
              }
              return order;
            });
            
            // 保存更新后的订单
            wx.setStorageSync('orders', updatedOrders);
            
            wx.showToast({
              title: '退款申请已提交',
              icon: 'success'
            });
            
            // 重新加载订单列表
            this.loadOrders();
          }
        }
      });
    },

    // 添加状态映射辅助方法
    mapOrderStatus(order) {
      // 根据业务逻辑映射状态
      // 这里需要根据实际订单数据调整
      if (order.payment_id) return 'completed';
      return 'pending';
    }
  })