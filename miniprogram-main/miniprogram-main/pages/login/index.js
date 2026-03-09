Page({
  data: {
    username: '',
    password: '',
    isLoading: false,
    showPassword: false // 添加控制密码显示的属性
  },
  
  // 监听用户名输入
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    })
  },
  
  // 监听密码输入
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },
  
  // 切换密码可见性
  togglePasswordVisibility() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },
  
  // 处理登录请求
  handleLogin() {
    // 原有登录逻辑保持不变
    const { username, password } = this.data;
    
    if (!username || !password) {
      wx.showToast({
        title: '用户名和密码不能为空',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isLoading: true });
    
    const app = getApp();
    app.doLogin(username, password)
      .then(userInfo => {
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
        
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/profile/index'
          });
        }, 1500);
      })
      .catch(err => {
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: err,
          icon: 'none'
        });
      });
  },

  // 跳转到注册页面
  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/index'
    });
  }
});