// src/pages/Orders/index.jsx
import { useState, useEffect, useRef } from 'react';
import { 
  Table, Card, Button, Space, Input, 
  Tag, Modal, Form, Select, DatePicker,
  Badge, Descriptions, Tabs, Drawer,
  Timeline, Statistic, Row, Col, message, Popconfirm
} from 'antd';
import { 
  SearchOutlined, SyncOutlined, 
  FileExcelOutlined, PrinterOutlined,
  EyeOutlined, CloseCircleOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, DownloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import './style.css';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

// API 基础地址
const API_BASE_URL = 'http://47.108.141.135:5010/api';

// 订单状态颜色映射
const statusColors = {
  '待支付': 'warning',
  '已支付': 'processing',
  '已完成': 'success',
  '已取消': 'default',
  '已退款': 'error'
};

const Orders = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    totalAmount: 0,
    pending: 0,
    paid: 0,
    completed: 0,
    cancelled: 0,
    todayOrders: 0,
    todayAmount: 0
  });
  
  const searchInputRef = useRef(null);
  
  // 获取订单数据
  useEffect(() => {
    fetchOrders();
    fetchStatistics();
  }, []);
  
  // 监听筛选条件变化，更新过滤后的订单
  useEffect(() => {
    filterOrders();
  }, [orders, activeTab, searchText, dateRange]);
  
  // 获取订单数据
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      let params = {};
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      if (searchText) {
        params.search = searchText;
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }
      
      // 调用后端API获取订单数据
      const response = await axios.get(`${API_BASE_URL}/orders`, { params });
      
      // 转换数据格式以适配现有组件
      const formattedOrders = response.data.map(order => ({
        id: order.order_number,
        customerId: `CUS${order.user_id}`,
        status: order.status,
        createdAt: order.created_at,
        paymentMethod: order.payment_method || '-',
        machine: order.machine_name,
        machineLocation: order.machine_location,
        items: [{
          id: `ITEM-${order.id}`,
          name: order.product_name,
          price: parseFloat(order.product_price),
          quantity: order.quantity,
          amount: parseFloat(order.total_price)
        }],
        totalAmount: parseFloat(order.total_price),
        payTime: order.paid_at,
        completedTime: order.completed_at,
        cancelledTime: order.cancelled_at
      }));
      
      setOrders(formattedOrders);
      setFilteredOrders(formattedOrders); // 初始显示全部
      
    } catch (error) {
      console.error("获取订单数据失败", error);
      message.error("获取订单数据失败: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // 获取订单统计数据
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/statistics`);
      setStatistics({
        total: response.data.total,
        totalAmount: response.data.totalAmount,
        pending: response.data.pending,
        paid: response.data.paid,
        completed: response.data.completed,
        cancelled: response.data.cancelled,
        todayOrders: response.data.todayOrders,
        todayAmount: response.data.todayAmount
      });
    } catch (error) {
      console.error("获取统计数据失败", error);
      message.error("获取统计数据失败");
    }
  };
  
  // 过滤订单
  const filterOrders = () => {
    let filtered = [...orders];
    
    // 根据标签筛选
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.status === activeTab);
    }
    
    // 根据搜索文本筛选
    if (searchText) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchText.toLowerCase()) ||
        order.customerId.toLowerCase().includes(searchText.toLowerCase()) ||
        order.machine.toLowerCase().includes(searchText.toLowerCase()) ||
        (order.items.some(item => item.name.toLowerCase().includes(searchText.toLowerCase())))
      );
    }
    
    // 根据日期范围筛选
    if (dateRange && dateRange[0] && dateRange[1]) {
      const [start, end] = dateRange;
      filtered = filtered.filter(order => {
        const orderDate = dayjs(order.createdAt);
        return orderDate.isAfter(start) && orderDate.isBefore(end.add(1, 'day'));
      });
    }
    
    setFilteredOrders(filtered);
  };
  
  // 查看订单详情
  const viewOrderDetail = async (order) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/${order.id}`);
      setViewingOrder(response.data);
      setDrawerVisible(true);
    } catch (error) {
      console.error("获取订单详情失败", error);
      message.error("获取订单详情失败: " + (error.response?.data?.message || error.message));
    }
  };
  
  // 取消订单
  const handleCancelOrder = async (orderId) => {
    try {
      const userId = JSON.parse(localStorage.getItem('user'))?.id || 1;
      const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: '已取消',
        user_id: userId
      });
      
      message.success(response.data.message || '订单已取消');
      
      // 刷新数据
      fetchOrders();
      fetchStatistics();
      
      if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder({
          ...viewingOrder,
          status: '已取消',
          cancelledTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
        });
      }
    } catch (error) {
      console.error("取消订单失败", error);
      message.error("取消订单失败: " + (error.response?.data?.message || error.message));
    }
  };
  
  // 完成订单
  const handleCompleteOrder = async (orderId) => {
    try {
      const userId = JSON.parse(localStorage.getItem('user'))?.id || 1;
      const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: '已完成',
        user_id: userId
      });
      
      message.success(response.data.message || '订单已标记为完成');
      
      // 刷新数据
      fetchOrders();
      fetchStatistics();
      
      if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder({
          ...viewingOrder,
          status: '已完成',
          completedTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
        });
      }
    } catch (error) {
      console.error("完成订单失败", error);
      message.error("完成订单失败: " + (error.response?.data?.message || error.message));
    }
  };
  
  // 导出订单
  const exportOrders = () => {
    message.success('订单数据导出成功');
  };
  
  // 重置筛选条件
  const resetFilters = () => {
    setActiveTab('all');
    setSearchText('');
    setDateRange(null);
    if (searchInputRef.current) {
      searchInputRef.current.input.value = '';
    }
  };
  
  // 表格列定义
  const columns = [
    {
      title: '订单编号',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      fixed: 'left',
    },
    {
      title: '下单时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (amount) => `¥${amount.toFixed(2)}`,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 120,
      render: (method) => method ? <Tag>{method}</Tag> : '-',
    },
    {
      title: '售货机',
      dataIndex: 'machine',
      key: 'machine',
      width: 150,
    },
    {
      title: '商品数量',
      key: 'itemCount',
      width: 100,
      render: (_, record) => record.items.reduce((total, item) => total + item.quantity, 0),
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusColors[status]}>
          {status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => viewOrderDetail(record)}
          >
            详情
          </Button>
          
          {record.status === '待支付' && (
            <Popconfirm
              title="确定要取消该订单吗？"
              description="取消后，此订单将不可恢复"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
              onConfirm={() => handleCancelOrder(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" danger icon={<CloseCircleOutlined />}>
                取消
              </Button>
            </Popconfirm>
          )}
          
          {record.status === '已支付' && (
            <Popconfirm
              title="确定要标记订单为已完成吗？"
              onConfirm={() => handleCompleteOrder(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>
                完成
              </Button>
            </Popconfirm>
          )}
          
          {(record.status === '已支付' || record.status === '已完成') && (
            <Popconfirm
              title="确定要取消该订单吗？"
              description="取消后将退回商品库存，此操作不可撤销"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />
              }
              onConfirm={() => handleCancelOrder(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" danger icon={<CloseCircleOutlined />}>
                退款/取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];
  
  return (
    <div className="orders-page">
      <Card title="订单统计" className="stat-card">
        <Row gutter={16}>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic 
                title="总订单数" 
                value={statistics.total} 
                prefix={<span className="statistic-icon">📊</span>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic 
                title="总销售额" 
                value={statistics.totalAmount} 
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic 
                title="今日订单" 
                value={statistics.todayOrders}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic 
                title="今日销售额" 
                value={statistics.todayAmount} 
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic 
                title="待支付" 
                value={statistics.pending}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic 
                title="已支付" 
                value={statistics.paid}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic 
                title="已完成" 
                value={statistics.completed}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic 
                title="已取消" 
                value={statistics.cancelled}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>
      
      <Card
        title="订单管理"
        className="order-list-card"
        extra={
          <Space>
            <Button 
              icon={<FileExcelOutlined />}
              onClick={exportOrders}
            >
              导出订单
            </Button>
            <Button 
              icon={<SyncOutlined />}
              onClick={fetchOrders}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <div className="order-filter-container">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            className="order-tabs"
          >
            <TabPane tab="全部订单" key="all" />
            <TabPane tab="待支付" key="待支付" />
            <TabPane tab="已支付" key="已支付" />
            <TabPane tab="已完成" key="已完成" />
            <TabPane tab="已取消" key="已取消" />
          </Tabs>
          
          <Space className="order-filters">
            <Input.Search
              ref={searchInputRef}
              placeholder="搜索订单号/商品/售货机"
              onSearch={value => setSearchText(value)}
              style={{ width: 240 }}
            />
            <RangePicker 
              onChange={setDateRange} 
              value={dateRange}
              placeholder={['开始日期', '结束日期']}
            />
            <Button onClick={resetFilters}>重置</Button>
          </Space>
        </div>
        
        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ 
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条订单`
          }}
        />
      </Card>
      
      {viewingOrder && (
        <Drawer
          title={`订单详情 - ${viewingOrder.id}`}
          width={600}
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          extra={
            <Space>
              <Button icon={<PrinterOutlined />}>打印</Button>
              <Button icon={<DownloadOutlined />}>下载</Button>
            </Space>
          }
        >
          <Descriptions bordered column={1}>
            <Descriptions.Item label="订单状态">
              <Tag color={statusColors[viewingOrder.status]}>{viewingOrder.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="客户ID">{viewingOrder.customerId}</Descriptions.Item>
            <Descriptions.Item label="客户名">{viewingOrder.customerName || '未登录用户'}</Descriptions.Item>
            <Descriptions.Item label="下单时间">{viewingOrder.createdAt}</Descriptions.Item>
            <Descriptions.Item label="支付方式">{viewingOrder.paymentMethod || '-'}</Descriptions.Item>
            <Descriptions.Item label="售货机">{viewingOrder.machine}</Descriptions.Item>
            <Descriptions.Item label="位置">{viewingOrder.machineLocation}</Descriptions.Item>
          </Descriptions>
          
          <div className="order-items">
            <h3>订单商品</h3>
            <Table
              dataSource={viewingOrder.items}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '商品名称', dataIndex: 'name', key: 'name' },
                { title: '单价', dataIndex: 'price', key: 'price', render: price => `¥${price.toFixed(2)}` },
                { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                { title: '小计', dataIndex: 'amount', key: 'amount', render: amount => `¥${amount.toFixed(2)}` }
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}><strong>总计金额</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={1}><strong>¥{viewingOrder.totalAmount.toFixed(2)}</strong></Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
          
          <div className="order-timeline">
            <h3>订单进度</h3>
            <Timeline>
              <Timeline.Item color="blue">
                创建订单: {viewingOrder.createdAt}
              </Timeline.Item>
              
              {viewingOrder.payTime && (
                <Timeline.Item color="green">
                  完成支付: {viewingOrder.payTime}
                </Timeline.Item>
              )}
              
              {viewingOrder.completedTime && (
                <Timeline.Item color="green">
                  订单完成: {viewingOrder.completedTime}
                </Timeline.Item>
              )}
              
              {viewingOrder.cancelledTime && (
                <Timeline.Item color="red">
                  订单取消/退款: {viewingOrder.cancelledTime}
                </Timeline.Item>
              )}
            </Timeline>
          </div>
          
          <div className="order-actions">
            <Space>
              {viewingOrder.status === '待支付' && (
                <Popconfirm
                  title="确定要取消该订单吗？"
                  onConfirm={() => handleCancelOrder(viewingOrder.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button danger icon={<CloseCircleOutlined />}>取消订单</Button>
                </Popconfirm>
              )}
              
              {viewingOrder.status === '已支付' && (
                <Popconfirm
                  title="确定要标记订单为已完成吗？"
                  onConfirm={() => handleCompleteOrder(viewingOrder.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="primary" icon={<CheckCircleOutlined />}>完成订单</Button>
                </Popconfirm>
              )}
              
              {(viewingOrder.status === '已支付' || viewingOrder.status === '已完成') && (
                <Popconfirm
                  title="确定要取消该订单并退款吗？"
                  onConfirm={() => handleCancelOrder(viewingOrder.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button danger icon={<CloseCircleOutlined />}>退款/取消</Button>
                </Popconfirm>
              )}
            </Space>
          </div>
        </Drawer>
      )}
    </div>
  );
};

export default Orders;