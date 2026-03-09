// src/pages/Settings/index.jsx
import { useState, useEffect } from 'react';
import { 
  Card, Tabs, Form, Input, Button, 
  Avatar, Upload, message, Switch, 
  Divider, Row, Col, Descriptions, 
  List, Modal, Popconfirm, Badge,
  Timeline, Select, Space, Tag
} from 'antd';
import { 
  UserOutlined, LockOutlined, MailOutlined, 
  PhoneOutlined, UploadOutlined, KeyOutlined,
  BellOutlined, SafetyOutlined, LogoutOutlined,
  SettingOutlined, PlusOutlined, DeleteOutlined,
  CheckCircleOutlined, SyncOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './style.css';

const { TabPane } = Tabs;
const { Option } = Select;

// API 基础地址
const API_BASE_URL = 'http://47.108.141.135:5010/api';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [passwordForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState('/avatar.png');
  const [securityLogs, setSecurityLogs] = useState([]);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [addAdminVisible, setAddAdminVisible] = useState(false);
  const [addAdminForm] = Form.useForm();
  const [currentUser, setCurrentUser] = useState(null);
  
  // 加载用户信息
  useEffect(() => {
    // 从本地存储获取用户信息
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      message.error('未登录或登录已过期');
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userJson);
    setCurrentUser(user);
    
    // 设置默认头像
    if (user.avatar) {
      setAvatarUrl(user.avatar);
    }
    
    // 加载用户资料
    fetchUserProfile(user.id);
    
    // 加载安全日志
    loadSecurityLogs(user.id);
    
    // 如果是管理员，加载管理员账号列表
    if (user.role === 'admin') {
      loadAdminAccounts();
    }
    
    // 加载通知设置
    notificationForm.setFieldsValue({
      emailNotification: true,
      smsNotification: false,
      lowStockAlert: true,
      orderNotification: true,
      machineErrorAlert: true,
    });
  }, []);
  
  // 获取用户资料
  const fetchUserProfile = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
      const userData = response.data;
      
      profileForm.setFieldsValue({
        username: userData.username || '',
        role: userData.role || 'user'
      });
      
    } catch (error) {
      console.error("获取用户资料失败", error);
      message.error("获取用户资料失败: " + (error.response?.data?.message || error.message));
    }
  };
  
  // 加载安全日志
  const loadSecurityLogs = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/security/logs?user_id=${userId}`);
      const logsData = response.data;
      
      // 转换为前端所需格式
      const formattedLogs = logsData.map(log => ({
        time: log.created_at,
        action: log.action,
        ip: '192.168.1.100',  // 目前后端未记录IP，使用默认值
        device: 'Web Browser'  // 目前后端未记录设备，使用默认值
      }));
      
      setSecurityLogs(formattedLogs);
    } catch (error) {
      console.error("获取安全日志失败", error);
      message.error("获取安全日志失败: " + (error.response?.data?.message || error.message));
    }
  };
  
  // 加载管理员账号列表
  const loadAdminAccounts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users`);
      const usersData = response.data;
      
      // 转换为前端所需格式
      const formattedUsers = usersData.map(user => ({
        id: user.id.toString(),
        username: user.username,
        name: user.username,  // 后端未存储真实姓名，使用用户名代替
        email: `${user.username}@example.com`,  // 后端未存储邮箱，使用默认格式
        role: user.role,
        lastLogin: user.last_login || '--',
        status: user.status
      }));
      
      setAdminAccounts(formattedUsers);
    } catch (error) {
      console.error("获取管理员账号列表失败", error);
      message.error("获取管理员账号列表失败: " + (error.response?.data?.message || error.message));
    }
  };
  
  // 处理修改密码
  const handleChangePassword = async (values) => {
    try {
      setLoading(true);
      
      if (!currentUser) {
        message.error('未登录或登录已过期');
        navigate('/login');
        return;
      }
      
      await axios.put(`${API_BASE_URL}/users/${currentUser.id}/password`, {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      
      message.success('密码修改成功');
      passwordForm.resetFields();
      
    } catch (error) {
      console.error("修改密码失败", error);
      
      if (error.response?.status === 400) {
        // 原密码错误
        passwordForm.setFields([{
          name: 'oldPassword',
          errors: [error.response.data.message || '原密码不正确']
        }]);
      } else {
        message.error("修改密码失败: " + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 处理更新个人资料
  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      
      if (!currentUser) {
        message.error('未登录或登录已过期');
        navigate('/login');
        return;
      }
      
      await axios.put(`${API_BASE_URL}/users/${currentUser.id}`, {
        ...values,
        current_user_id: currentUser.id
      });
      
      // 更新本地存储的用户信息
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.username = values.username;
      localStorage.setItem('user', JSON.stringify(user));
      
      message.success('个人资料更新成功');
      
      // 重新加载用户资料
      fetchUserProfile(currentUser.id);
      
    } catch (error) {
      console.error("更新个人资料失败", error);
      message.error("更新个人资料失败: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // 处理通知设置更新
  const handleUpdateNotifications = (values) => {
    setLoading(true);
    
    // 目前后端未实现通知设置，只做前端展示
    setTimeout(() => {
      message.success('通知设置更新成功');
      setLoading(false);
    }, 500);
  };
  
  // 头像上传前校验
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('请上传图片文件!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过2MB!');
    }
    return isImage && isLt2M;
  };
  
  // 自定义上传处理
  const customUpload = ({ file }) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // 更新本地URL和localStorage
      setAvatarUrl(reader.result);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.avatar = reader.result;
      localStorage.setItem('user', JSON.stringify(user));
      message.success('头像上传成功');
    };
  };
  
  // 处理新增管理员
  const handleAddAdmin = async () => {
    try {
      const values = await addAdminForm.validateFields();
      
      if (!currentUser) {
        message.error('未登录或登录已过期');
        navigate('/login');
        return;
      }
      
      const response = await axios.post(`${API_BASE_URL}/admin/users`, {
        ...values,
        admin_id: currentUser.id
      });
      
      message.success('管理员账号创建成功');
      setAddAdminVisible(false);
      addAdminForm.resetFields();
      
      // 重新加载管理员列表
      loadAdminAccounts();
      
    } catch (error) {
      console.error("添加管理员失败", error);
      
      if (error.response?.status === 400) {
        // 输入错误
        message.error(error.response.data.message || '添加管理员失败');
      } else {
        message.error("添加管理员失败: " + (error.response?.data?.message || error.message));
      }
    }
  };
  
  // 删除管理员
  const handleDeleteAdmin = async (id) => {
    try {
      if (!currentUser) {
        message.error('未登录或登录已过期');
        navigate('/login');
        return;
      }
      
      await axios.delete(`${API_BASE_URL}/admin/users/${id}?admin_id=${currentUser.id}`);
      
      message.success('管理员账号已删除');
      
      // 重新加载管理员列表
      loadAdminAccounts();
      
    } catch (error) {
      console.error("删除管理员失败", error);
      message.error("删除管理员失败: " + (error.response?.data?.message || error.message));
    }
  };
  
  // 切换管理员状态
  const toggleAdminStatus = async (id, currentStatus) => {
    try {
      if (!currentUser) {
        message.error('未登录或登录已过期');
        navigate('/login');
        return;
      }
      
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      await axios.put(`${API_BASE_URL}/admin/users/${id}/status`, {
        status: newStatus,
        admin_id: currentUser.id
      });
      
      message.success('管理员状态已更新');
      
      // 重新加载管理员列表
      loadAdminAccounts();
      
    } catch (error) {
      console.error("更新管理员状态失败", error);
      message.error("更新管理员状态失败: " + (error.response?.data?.message || error.message));
    }
  };
  
  // 处理退出登录
  const handleLogout = () => {
    // 清除token和用户信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    navigate('/login');
  };
  
  // 渲染个人资料设置
  const renderProfileSettings = () => (
    <div className="settings-section">
      <div className="avatar-section">
        <Avatar 
          size={100} 
          icon={<UserOutlined />} 
          src={avatarUrl}
        />
        <Upload
          name="avatar"
          listType="text"
          showUploadList={false}
          beforeUpload={beforeUpload}
          customRequest={customUpload}
        >
          <Button icon={<UploadOutlined />} className="upload-button">
            更换头像
          </Button>
        </Upload>
      </div>
      
      <Form
        form={profileForm}
        layout="vertical"
        onFinish={handleUpdateProfile}
        className="profile-form"
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="用户名" />
        </Form.Item>
        
        <Form.Item
          name="role"
          label="角色"
        >
          <Input disabled />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存修改
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
  
  // 渲染密码设置
  const renderPasswordSettings = () => (
    <div className="settings-section">
      <Form
        form={passwordForm}
        layout="vertical"
        onFinish={handleChangePassword}
      >
        <Form.Item
          name="oldPassword"
          label="当前密码"
          rules={[{ required: true, message: '请输入当前密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="当前密码" />
        </Form.Item>
        
        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度不能少于6个字符' }
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
        </Form.Item>
        
        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            修改密码
          </Button>
        </Form.Item>
      </Form>
      
      <Divider />
      
      <div className="security-tips">
        <h3>安全提示</h3>
        <ul>
          <li>密码至少包含6个字符</li>
          <li>建议使用字母、数字和符号的组合</li>
          <li>不要使用与其他网站相同的密码</li>
          <li>定期更换密码可以提高账号安全性</li>
        </ul>
      </div>
    </div>
  );
  
  // 渲染通知设置
  const renderNotificationSettings = () => (
    <div className="settings-section">
      <Form
        form={notificationForm}
        layout="vertical"
        onFinish={handleUpdateNotifications}
      >
        <h3>通知方式</h3>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="emailNotification"
              valuePropName="checked"
              label="邮件通知"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="smsNotification"
              valuePropName="checked"
              label="短信通知"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        
        <h3>通知事件</h3>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="lowStockAlert"
              valuePropName="checked"
              label="库存预警"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="orderNotification"
              valuePropName="checked"
              label="订单提醒"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="machineErrorAlert"
              valuePropName="checked"
              label="设备故障提醒"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
  
  // 渲染安全日志
  const renderSecurityLogs = () => (
    <div className="settings-section">
      <div className="security-header">
        <h3>安全日志</h3>
        <Button 
          type="default" 
          icon={<SyncOutlined />}
          onClick={() => currentUser && loadSecurityLogs(currentUser.id)}
        >
          刷新
        </Button>
      </div>
      
      <Timeline>
        {securityLogs.map((log, index) => (
          <Timeline.Item 
            key={index}
            color={log.action.includes('失败') ? 'red' : 'green'}
          >
            <div className="log-entry">
              <div className="log-time">{log.time}</div>
              <div className="log-action">{log.action}</div>
              <div className="log-detail">
                <span>IP: {log.ip}</span>
                <span>设备: {log.device}</span>
              </div>
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  );
  
  // 渲染账号管理
  const renderAccountManagement = () => (
    <div className="settings-section">
      <div className="account-header">
        <h3>管理员账号</h3>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setAddAdminVisible(true)}
        >
          新增管理员
        </Button>
      </div>
      
      <List
        itemLayout="horizontal"
        dataSource={adminAccounts}
        renderItem={item => (
          <List.Item
            actions={[
              <Button
                type="text"
                onClick={() => toggleAdminStatus(item.id, item.status)}
              >
                {item.status === 'active' ? '禁用' : '启用'}
              </Button>,
              item.username !== 'admin' && item.id !== '1' && (
                <Popconfirm
                  title="确定要删除此管理员吗？"
                  onConfirm={() => handleDeleteAdmin(item.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="text" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              ),
            ]}
          >
            <List.Item.Meta
              avatar={
                <Badge 
                  status={item.status === 'active' ? 'success' : 'default'} 
                  offset={[0, 0]}
                >
                  <Avatar icon={<UserOutlined />} />
                </Badge>
              }
              title={
                <Space>
                  <span>{item.name}</span>
                  {item.role === 'admin' && item.id === '1' && (
                    <Tag color="red">超级管理员</Tag>
                  )}
                  {item.role === 'admin' && item.id !== '1' && (
                    <Tag color="blue">管理员</Tag>
                  )}
                  {item.role === 'user' && (
                    <Tag color="green">普通用户</Tag>
                  )}
                </Space>
              }
              description={
                <div className="admin-info">
                  <div>用户名: {item.username}</div>
                  <div>邮箱: {item.email}</div>
                  <div>最后登录: {item.lastLogin}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
      
      <Modal
        title="新增管理员"
        open={addAdminVisible}
        onOk={handleAddAdmin}
        onCancel={() => setAddAdminVisible(false)}
        width={500}
      >
        <Form
          form={addAdminForm}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="初始密码"
            rules={[
              { required: true, message: '请输入初始密码' },
              { min: 6, message: '密码长度不能少于6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入初始密码" />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
            initialValue="user"
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="user">普通用户</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
  
  // 渲染个人中心首页
  const renderAccountOverview = () => (
    <div className="settings-section">
      <Row gutter={24}>
        <Col span={8}>
          <div className="account-overview-avatar">
            <Avatar 
              size={120} 
              icon={<UserOutlined />} 
              src={avatarUrl}
            />
            <h2>{currentUser?.username || '管理员'}</h2>
            <Tag color="blue">
              {currentUser?.role === 'admin' ? '超级管理员' : '普通用户'}
            </Tag>
          </div>
        </Col>
        <Col span={16}>
          <Descriptions title="账号信息" bordered column={1}>
            <Descriptions.Item label="用户名">{currentUser?.username || 'admin'}</Descriptions.Item>
            <Descriptions.Item label="角色">{currentUser?.role === 'admin' ? '超级管理员' : '普通用户'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge status="success" text="活跃" />
            </Descriptions.Item>
            <Descriptions.Item label="最后登录">
              {securityLogs[0]?.time || '未记录'}
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
      
      <Divider />
      
      <Row gutter={16}>
        <Col span={8}>
          <Card 
            title="账号安全" 
            extra={<a href="#security">查看</a>}
            className="overview-card"
          >
            <div className="card-content">
              <p><KeyOutlined /> 密码强度: <Tag color="green">强</Tag></p>
              <p><SafetyOutlined /> 两步验证: <Tag color="orange">未开启</Tag></p>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            title="通知设置" 
            extra={<a href="#notification">设置</a>}
            className="overview-card"
          >
            <div className="card-content">
              <p><BellOutlined /> 通知方式: 邮件</p>
              <p><CheckCircleOutlined /> 已开启: 库存预警, 设备故障</p>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            title="账号管理" 
            extra={<a href="#accounts">管理</a>}
            className="overview-card"
          >
            <div className="card-content">
              <p><UserOutlined /> 管理员账号: {adminAccounts.length}个</p>
              <p><CheckCircleOutlined /> 活跃账号: {adminAccounts.filter(a => a.status === 'active').length}个</p>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Divider />
      
      <div className="logout-section">
        <Popconfirm
          title="确定要退出登录吗？"
          onConfirm={handleLogout}
          okText="确定"
          cancelText="取消"
        >
          <Button type="primary" danger icon={<LogoutOutlined />}>
            退出登录
          </Button>
        </Popconfirm>
      </div>
    </div>
  );

  return (
    <div className="settings-page">
      <Card title="管理员设置">
        <Tabs defaultActiveKey="overview">
          <TabPane 
            tab={<span><UserOutlined /> 账号首页</span>} 
            key="overview"
          >
            {renderAccountOverview()}
          </TabPane>
          <TabPane 
            tab={<span><UserOutlined /> 个人资料</span>} 
            key="profile"
          >
            {renderProfileSettings()}
          </TabPane>
          <TabPane 
            tab={<span><KeyOutlined /> 密码设置</span>} 
            key="security"
          >
            {renderPasswordSettings()}
          </TabPane>
          <TabPane 
            tab={<span><BellOutlined /> 通知设置</span>} 
            key="notification"
          >
            {renderNotificationSettings()}
          </TabPane>
          <TabPane 
            tab={<span><SafetyOutlined /> 安全日志</span>} 
            key="logs"
          >
            {renderSecurityLogs()}
          </TabPane>
          {currentUser?.role === 'admin' && (
            <TabPane 
              tab={<span><SettingOutlined /> 账号管理</span>} 
              key="accounts"
            >
              {renderAccountManagement()}
            </TabPane>
          )}
        </Tabs>
      </Card>
    </div>
  );
};

export default Settings;