Page({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    isLoading: false,
    passwordStrength: 0,
    passwordStrengthLevel: '',
    passwordStrengthText: '',
    hasLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
    canRegister: false,
    showPassword: false, // 添加控制密码显示的属性
    showConfirmPassword: false // 添加控制确认密码显示的属性
  },

  // 监听用户名输入
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    });
    this.checkCanRegister();
  },

  // 监听密码输入
  onPasswordInput(e) {
    const password = e.detail.value;
    
    // 检查密码强度
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // 计算强度分数
    const strengthPoints = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    
    // 确定强度等级
    let strengthLevel = '';
    let strengthText = '';
    
    if (password.length === 0) {
      strengthLevel = '';
      strengthText = '';
    } else if (strengthPoints <= 2) {
      strengthLevel = 'weak';
      strengthText = '弱';
    } else if (strengthPoints <= 4) {
      strengthLevel = 'medium';
      strengthText = '中';
    } else {
      strengthLevel = 'strong';
      strengthText = '强';
    }
    
    this.setData({
      password,
      passwordStrength: strengthPoints,
      passwordStrengthLevel: strengthLevel,
      passwordStrengthText: strengthText,
      hasLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial
    });
    
    this.checkCanRegister();
  },

  // 监听确认密码输入
  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    });
    this.checkCanRegister();
  },
  
  // 切换密码可见性
  togglePasswordVisibility() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },
  
  // 切换确认密码可见性
  toggleConfirmPasswordVisibility() {
    this.setData({
      showConfirmPassword: !this.data.showConfirmPassword
    });
  },
  
  // 检查是否可以注册
  checkCanRegister() {
    const { username, password, confirmPassword, passwordStrength } = this.data;
    const canRegister = 
      username.length > 0 && 
      password.length > 0 && 
      password === confirmPassword && 
      passwordStrength >= 3; // 至少中等强度才能注册
      
    this.setData({ canRegister });
  },

  // 处理注册请求
  handleRegister() {
    const { username, password, confirmPassword } = this.data;

    // 表单验证
    if (!username || !password || !confirmPassword) {
      wx.showToast({
        title: '所有字段都必须填写',
        icon: 'none'
      });
      return;
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次输入的密码不一致',
        icon: 'none'
      });
      return;
    }
    
    // 密码强度校验
    if (this.data.passwordStrength < 3) {
      wx.showToast({
        title: '请设置更安全的密码',
        icon: 'none'
      });
      return;
    }

    this.setData({ isLoading: true });

    // 调用注册API
    const app = getApp();
    app.doRegister(username, password)
      .then(userInfo => {
        this.setData({ isLoading: false });

        wx.showToast({
          title: '注册成功',
          icon: 'success'
        });

        // 注册成功后自动登录并跳转
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

  // 跳转到登录页面
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/index'
    });
  }
});