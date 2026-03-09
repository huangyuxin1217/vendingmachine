// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 检查用户登录状态
    this.checkLoginStatus()
    
    // 初始化商品数据 - 现在从API获取
    this.initProductData()
  },
  
  checkLoginStatus() {
    // 从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.hasLogin = true
      
      // 获取最新的用户信息
      this.getUserInfo(userInfo.userId)
    }
  },
  
  // 从API获取商品数据
  initProductData() {
    wx.request({
      url: 'http://47.108.141.135:5001/api/products/list',
      success: res => {
        if (res.data.code === 200) {
          this.globalData.products = res.data.data.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            stock: item.stock,
            location: item.location,
            img: this.getProductImage(item.name), // 图片路径映射
            description: this.getProductDescription(item.name) // 商品描述映射
          }))
        }
      },
      fail: err => {
        console.error('获取商品数据失败', err)
      }
    })
  },
  
  // 图片路径映射函数
  getProductImage(name) {
    const imageMap = {
      "农夫山泉": "/images/water.jpg",
      "可口可乐": "/images/cola.jpg",
      "东鹏特饮": "/images/dongpeng.jpg",
      "乐事薯片青瓜味": "/images/leshi.jpg",
      "卫龙大面筋": "/images/weilong.jpg",
      "旺仔牛奶": "/images/wangzai.jpg",
      "红牛罐装": "/images/hongniu.jpg",
      "奥利奥巧克力夹心": "/images/aoliao.jpg",
      "雀巢咖啡瓶装": "/images/kafei.jpg",
      "康师傅红烧牛肉面": "/images/mian.jpg",
      "维他柠檬茶": "/images/tea.jpg"
    }
    return imageMap[name] || "/images/default.jpg"
  },
  
  // 商品描述映射函数
  getProductDescription(name) {
    const descMap = {
      "农夫山泉": "天然矿泉水，口感纯正，富含矿物质，健康饮用首选。",
      "可口可乐": "经典碳酸饮料，畅爽口感，瞬间提神，激发活力。",
      "东鹏特饮": "强劲能量饮料，添加多种维生素，快速补充体力。",
      "乐事薯片青瓜味": "精选马铃薯，青瓜风味，香脆可口，休闲零食必备。",
      "卫龙大面筋": "辣味面筋，劲道有嚼劲，麻辣鲜香，越吃越过瘾。",
      "旺仔牛奶": "经典儿童牛奶，营养丰富，香甜可口，老少皆宜。",
      "红牛罐装": "提神能量饮料，缓解疲劳，增强体力，快速恢复活力。",
      "奥利奥巧克力夹心": "经典夹心饼干，香脆黑巧克力外壳，浓郁奶油夹心。",
      "雀巢咖啡瓶装": "香浓咖啡，醇厚口感，随时随地享受咖啡时光。",
      "康师傅红烧牛肉面": "方便面经典，红烧牛肉口味，汤汁浓郁，面条劲道。",
      "维他柠檬茶": "清爽柠檬茶，香气四溢，解渴提神，夏日必备。"
    }
    return descMap[name] || "暂无描述"
  },
  
  // 用户登录API
  doLogin(username, password) {
    return new Promise((resolve, reject) => {
      console.log(`尝试登录: 用户名=${username}, 密码=${password ? '已输入' : '未输入'}`);
      
      // 格式处理 - 如果是纯数字，可能尝试补零
      let formattedUsername = username;
      if (/^\d+$/.test(username) && username.length < 3) {
        formattedUsername = username.padStart(3, '0');
        console.log(`格式化用户名: ${username} -> ${formattedUsername}`);
      }
      
      wx.request({
        url: 'http://47.108.141.135:5001/api/user/login',
        method: 'POST',
        data: {
          username: formattedUsername,
          password: password
        },
        success: res => {
          console.log('登录接口返回:', res.data);
          if (res.data.code === 200) {
            // 保存用户信息到全局数据
            const userInfo = {
              userId: res.data.data.user_id,
              nickName: res.data.data.username,
              balance: res.data.data.balance
            }
            
            this.globalData.userInfo = userInfo
            this.globalData.hasLogin = true
            
            // 保存到本地存储
            wx.setStorageSync('userInfo', userInfo)
            
            resolve(userInfo)
          } else {
            console.error('登录失败:', res.data.message);
            reject(res.data.message || '登录失败')
          }
        },
        fail: err => {
          console.error('登录请求失败:', err);
          reject(err.errMsg || '网络错误')
        }
      })
    })
  },
  
  // 用户注册API
  doRegister(username, password) {
    return new Promise((resolve, reject) => {
      // 格式处理
      let formattedUsername = username;
      
      wx.request({
        url: 'http://47.108.141.135:5001/api/user/register',
        method: 'POST',
        data: {
          username: formattedUsername,
          password: password
        },
        success: res => {
          if (res.data.code === 200) {
            // 注册成功后自动登录
            this.doLogin(username, password)
              .then(userInfo => {
                resolve(userInfo)
              })
              .catch(err => {
                reject('注册成功但登录失败: ' + err)
              })
          } else {
            reject(res.data.message || '注册失败')
          }
        },
        fail: err => {
          reject(err.errMsg || '网络错误')
        }
      })
    })
  },
  
  // 获取用户信息
  getUserInfo(userId) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://47.108.141.135:5001/api/user/info',
        method: 'GET',
        data: {
          user_id: userId
        },
        success: res => {
          if (res.data.code === 200) {
            // 更新用户信息
            const userInfo = {
              userId: res.data.data.user_id,
              nickName: res.data.data.username,
              balance: res.data.data.balance
            }
            
            this.globalData.userInfo = userInfo
            
            // 更新本地存储
            wx.setStorageSync('userInfo', userInfo)
            
            resolve(userInfo)
          } else {
            reject(res.data.message || '获取用户信息失败')
          }
        },
        fail: err => {
          reject(err.errMsg || '网络错误')
        }
      })
    })
  },
  
  // 更新用户昵称
  updateUserName(userId, username) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://47.108.141.135:5001/api/user/update',
        method: 'POST',
        data: {
          user_id: userId,
          username: username
        },
        success: res => {
          if (res.data.code === 200) {
            // 更新本地用户信息
            const userInfo = this.globalData.userInfo
            userInfo.nickName = username
            
            this.globalData.userInfo = userInfo
            wx.setStorageSync('userInfo', userInfo)
            
            resolve(userInfo)
          } else {
            reject(res.data.message || '更新失败')
          }
        },
        fail: err => {
          reject(err.errMsg || '网络错误')
        }
      })
    })
  },
  
  // 用户退出登录
  doLogout() {
    // 清除全局状态
    this.globalData.userInfo = null;
    this.globalData.hasLogin = false;
    
    // 清除本地存储
    wx.removeStorageSync('userInfo');
  },
  
  // 添加到购物车
  addToCart(product, quantity = 1) {
    const cartItem = this.globalData.cartItems.find(item => item.id === product.id);
    
    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      this.globalData.cartItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        img: product.img,
        quantity: quantity,
        selected: true
      });
    }
    
    return this.globalData.cartItems;
  },
  
  // 创建订单API
  createOrder(userId, productId, quantity, vendingMachineId) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://47.108.141.135:5001/api/order/create',
        method: 'POST',
        data: {
          user_id: userId,
          product_id: productId,
          quantity: quantity,
          vending_machine_id: vendingMachineId
        },
        success: res => {
          if (res.data.code === 200) {
            resolve(res.data.data)
          } else {
            reject(res.data.message || '创建订单失败')
          }
        },
        fail: err => {
          reject(err.errMsg || '网络错误')
        }
      })
    })
  },
  
  // 获取订单列表API
  getOrders(userId) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://47.108.141.135:5001/api/orders',
        method: 'GET',
        data: {
          user_id: userId,
          _t: new Date().getTime() // 添加时间戳防止缓存
        },
        success: res => {
          if (res.data.code === 200) {
            resolve(res.data.data)
          } else {
            reject(res.data.message || '获取订单失败')
          }
        },
        fail: err => {
          reject(err.errMsg || '网络错误')
        }
      })
    })
  },
  
  // 处理支付API
  createPayment(userId, orderId, method, amount) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://47.108.141.135:5001/api/payment/create',
        method: 'POST',
        data: {
          user_id: userId,
          order_id: orderId,
          method: method,
          amount: amount
        },
        success: res => {
          if (res.data.code === 200) {
            resolve(res.data.data)
          } else {
            reject(res.data.message || '支付失败')
          }
        },
        fail: err => {
          reject(err.errMsg || '网络错误')
        }
      })
    })
  },
  
  globalData: {
    userInfo: null,
    hasLogin: false,
    products: [], // 商品数据
    cartItems: [] // 购物车数据
  }
})