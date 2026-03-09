// pages/order/detail.js
Page({
    data: {
      order: null,
      isLoading: true
    },
  
    onLoad(options) {
      if (options && options.id) {
        this.loadOrderDetail(options.id)
      } else {
        wx.showToast({
          title: '订单不存在',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    },
  
    // 加载订单详情
    loadOrderDetail(orderId) {
      this.setData({ isLoading: true });
      
      const userInfo = getApp().globalData.userInfo;
      if (!userInfo) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        return;
      }
      
      // 从API获取订单详情
      wx.request({
        url: `http://47.108.141.135:5001/api/order/detail`,
        method: 'GET',
        data: {
          order_id: orderId,
          user_id: userInfo.userId
        },
        success: res => {
          console.log('订单详情:', res.data);
          
          if (res.data && res.data.code === 200 && res.data.data) {
            const orderData = res.data.data;
            
            // 格式化时间
            const formattedTime = this.formatTime(new Date(orderData.created_at));
            let formattedPayTime = '';
            if (orderData.paid_at) {
              formattedPayTime = this.formatTime(new Date(orderData.paid_at));
            }
            
            // 订单状态: 有payment_id表示已完成，否则为待付款
            const orderStatus = orderData.payment_id ? 'completed' : 'pending';
            
            this.setData({
              order: {
                id: orderData.id,
                status: orderStatus,
                totalAmount: orderData.total_price,
                formattedTime,
                formattedPayTime,
                items: [{
                  id: orderData.product_id,
                  name: orderData.product_name,
                  price: orderData.total_price / orderData.quantity,
                  quantity: orderData.quantity,
                  img: getApp().getProductImage(orderData.product_name)
                }]
              },
              isLoading: false
            });
          } else {
            wx.showToast({
              title: res.data ? res.data.message : '订单不存在',
              icon: 'none'
            });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }
        },
        fail: err => {
          console.error('获取订单详情失败:', err);
          this.setData({ isLoading: false });
          wx.showToast({
            title: '获取订单详情失败',
            icon: 'none'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
    },
  
    formatTime(date) {
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      const hour = date.getHours()
      const minute = date.getMinutes()
      const second = date.getSeconds()
  
      return `${[year, month, day].map(this.formatNumber).join('-')} ${[hour, minute, second].map(this.formatNumber).join(':')}`
    },
  
    formatNumber(n) {
      n = n.toString()
      return n[1] ? n : `0${n}`
    },
  
    // 取消订单
    cancelOrder() {
      wx.showModal({
        title: '取消订单',
        content: '确定要取消该订单吗？',
        success: res => {
          if (res.confirm) {
            // 获取所有订单
            const allOrders = wx.getStorageSync('orders') || []
            
            // 更新订单状态
            const updatedOrders = allOrders.map(order => {
              if (order.id === this.data.order.id) {
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
            
            // 重新加载订单详情
            this.loadOrderDetail(this.data.order.id)
          }
        }
      })
    },
  
    // 支付订单
    payOrder() {
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
            this.processPayment(payMethod);
          }
        }
      });
    },
  
    // 处理支付流程
    processPayment(method) {
      // 获取用户信息和订单信息
      const userInfo = getApp().globalData.userInfo;
      const order = this.data.order;
      
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
        order.id,
        method,
        order.totalAmount
      ).then(res => {
        wx.hideLoading();
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        });
        
        // 重新加载订单详情以更新状态
        setTimeout(() => {
          this.loadOrderDetail(order.id);
        }, 1500);
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: err || '支付失败',
          icon: 'none'
        });
      });
    },
  
    // 申请退款
    applyRefund() {
      wx.showModal({
        title: '申请退款',
        content: '确定要申请退款吗？',
        success: res => {
          if (res.confirm) {
            // 获取所有订单
            const allOrders = wx.getStorageSync('orders') || []
            
            // 更新订单状态
            const updatedOrders = allOrders.map(order => {
              if (order.id === this.data.order.id) {
                return {...order, status: 'refund'}
              }
              return order
            })
            
            // 保存更新后的订单
            wx.setStorageSync('orders', updatedOrders)
            
            wx.showToast({
              title: '退款申请已提交',
              icon: 'success'
            })
            
            // 重新加载订单详情
            this.loadOrderDetail(this.data.order.id)
          }
        }
      })
    },
  
    // 再次购买
    rebuy() {
      const app = getApp()
      
      // 清空购物车
      app.globalData.cartItems = []
      
      // 将订单商品添加到购物车
      this.data.order.items.forEach(item => {
        app.addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          img: item.img,
          stock: 999 // 假设库存充足
        }, item.quantity)
      })
      
      // 跳转到购物车
      wx.switchTab({
        url: '/pages/cart/index'
      })
    }
  })