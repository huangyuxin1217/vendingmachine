import { Card, Row, Col, Statistic, Button, Table, message } from 'antd';
import { ShoppingCartOutlined, BarChartOutlined, AlertOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Line, Column } from '@ant-design/plots';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();

  // 定义状态
  const [dashboardData, setDashboardData] = useState({
    todayOrders: 0,
    todaySales: 0,
    faultyMachines: 0,
  });
  const [salesData, setSalesData] = useState([]);
  const [inventoryWarningData, setInventoryWarningData] = useState([]);

  // 获取仪表盘统计数据
  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('http://47.108.141.135:5010/api/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      message.error('获取仪表盘数据失败');
      console.error(error);
    }
  };

  // 获取销售趋势数据
  const fetchSalesData = async () => {
    try {
      const response = await axios.get('http://47.108.141.135:5010/api/sales');
      const formattedData = response.data.map((item) => ({
        ...item,
        date: dayjs(item.date).format('YYYY-MM-DD'),
        sales: Number(item.sales), // 确保 sales 是数字
      }));
      console.log('Sales Data:', formattedData); // 打印数据检查
      setSalesData(formattedData);
    } catch (error) {
      message.error('获取销售趋势数据失败');
      console.error(error);
    }
  };

  // 获取库存预警数据
  const fetchInventoryWarnings = async () => {
    try {
      const response = await axios.get('http://47.108.141.135:5010/api/inventory/warnings');
      setInventoryWarningData(response.data);
    } catch (error) {
      message.error('获取库存预警数据失败');
      console.error(error);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchDashboardData();
    fetchSalesData();
    fetchInventoryWarnings();
  }, []);

  // 销售趋势图配置
  const salesConfig = {
    data: salesData.sort((a, b) => new Date(a.date) - new Date(b.date)), // 确保横坐标时间递增
    xField: 'date', // 横坐标字段
    yField: 'sales', // 纵坐标字段
    color: '#1890ff', // 柱状图颜色
    label: {
      position: 'top', // 显示在柱子顶部
      style: {
        fill: '#000', // 黑色字体
        fontSize: 12, // 字体大小
        fontWeight: 'bold', // 加粗
      },
      formatter: (datum) => `¥${datum.sales.toFixed(2)}`, // 格式化为两位小数
    },
    tooltip: {
      showMarkers: true,
      formatter: (datum) => ({
        name: '销售额',
        value: `¥${datum.sales.toFixed(2)}`, // 格式化销售额为两位小数
      }),
    },
    xAxis: {
      label: {
        formatter: (text) => dayjs(text).format('M月D日'), // 格式化日期为中文
      },
    },
    yAxis: {
      min: Math.floor(Math.min(...salesData.map((item) => item.sales)) / 50) * 50, // 动态设置最小值
      max: Math.ceil(Math.max(...salesData.map((item) => item.sales)) / 50) * 50, // 动态设置最大值
      tickInterval: 50, // 固定刻度间隔为50
      label: {
        formatter: (value) => `${value}`, // 格式化为普通数值
      },
    },
  };

  // 库存预警表格列配置
  const columns = [
    { title: '商品ID', dataIndex: 'id', key: 'id' },
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    { title: '当前库存', dataIndex: 'stock', key: 'stock' },
    { title: '安全库存', dataIndex: 'minStock', key: 'minStock' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => <span style={{ color: '#cf1322' }}>{text}</span>,
    },
    {
      title: '操作',
      key: 'action',
      render: () => <Button type="link">补货</Button>,
    },
  ];

  return (
    <div className="dashboard">
      <h2>欢迎您，管理员</h2>

      {/* 数据统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="今日订单"
              value={dashboardData.todayOrders}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="今日销售额"
              value={dashboardData.todaySales}
              precision={2}
              prefix="¥"
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="故障机器"
              value={dashboardData.faultyMachines}
              valueStyle={{
                color: dashboardData.faultyMachines > 0 ? '#cf1322' : '#3f8600',
              }}
              prefix={<AlertOutlined />}
              suffix="台"
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷入口 */}
      <h3>快捷入口</h3>
      <Row gutter={16}>
        <Col span={6}>
          <Button
            type="primary"
            size="large"
            icon={<ShoppingCartOutlined />}
            onClick={() => navigate('/products')}
            block
          >
            商品管理
          </Button>
        </Col>
        <Col span={6}>
          <Button
            type="primary"
            size="large"
            icon={<ShoppingCartOutlined />}
            onClick={() => navigate('/orders')}
            block
          >
            订单管理
          </Button>
        </Col>
        <Col span={6}>
          <Button
            type="primary"
            size="large"
            icon={<AlertOutlined />}
            onClick={() => navigate('/inventory')}
            block
          >
            库存监控
          </Button>
        </Col>
        <Col span={6}>
          <Button
            type="primary"
            size="large"
            icon={<BarChartOutlined />}
            onClick={() => navigate('/statistics')}
            block
          >
            数据统计
          </Button>
        </Col>
      </Row>

      {/* 销售趋势图 */}
      <h3>销售趋势（近7天）</h3>
      <Card style={{ marginBottom: 24 }}>
        <Column {...salesConfig} />
      </Card>

      {/* 库存预警列表 */}
      <h3>库存预警</h3>
      <Card>
        <Table
          columns={columns}
          dataSource={inventoryWarningData}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default Dashboard;