import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, message } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  DatabaseOutlined,  
  ShoppingCartOutlined,  
  AppstoreOutlined, // 添加售货机状态图标
} from '@ant-design/icons';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import './style.css';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // 从本地存储获取用户信息
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // 导航菜单项
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '首页',
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: '商品管理',
    },
    {
      key: '/inventory',
      icon: <DatabaseOutlined />,  
      label: '库存管理',
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,  
      label: '订单管理',
    },
    {
      key: '/machines',
      icon: <AppstoreOutlined />, // 修改为App图标
      label: '售货机状态',
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '数据统计',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '管理员设置',
    },
  ];
  
  // 处理退出登录
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    navigate('/login');
  };
  
  // 用户下拉菜单
  const userMenu = {
    items: [
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '个人设置',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
      },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') {
        handleLogout();
      } else if (key === 'settings') {
        navigate('/settings');
      }
    },
  };

  return (
    <Layout className="main-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div className="logo">
          {!collapsed ? '售货机管理系统' : '售'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="site-header">
          <div className="header-left">
            {collapsed ? (
              <MenuUnfoldOutlined className="trigger" onClick={() => setCollapsed(false)} />
            ) : (
              <MenuFoldOutlined className="trigger" onClick={() => setCollapsed(true)} />
            )}
          </div>
          <div className="header-right">
            <div className="user-info">
              <Dropdown menu={userMenu} placement="bottomRight">
                <span className="user-dropdown">
                  <Avatar src={user.avatar} icon={!user.avatar && <UserOutlined />} />
                  <span className="username">{user.name || '管理员'}</span>
                </span>
              </Dropdown>
            </div>
          </div>
        </Header>
        <Content className="site-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;