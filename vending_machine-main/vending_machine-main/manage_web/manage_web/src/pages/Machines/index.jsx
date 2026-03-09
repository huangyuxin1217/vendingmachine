// src/pages/Machines/index.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Table, Card, Button, Space, Input, Tag, Badge, 
  Statistic, Row, Col, Progress, Descriptions, 
  Modal, Tabs, Empty, Alert, Timeline, Drawer,
  Select, message, Popconfirm, Typography, Tooltip
} from 'antd';
import { 
  ReloadOutlined, SearchOutlined, SyncOutlined, 
  EnvironmentOutlined, AlertOutlined, EyeOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ToolOutlined,
  WarningOutlined, ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons';
import './style.css';

const { Option } = Select;
const { Title, Text } = Typography;

// 售货机状态映射
const machineStatusMap = {
  '在线': { color: 'success', icon: <CheckCircleOutlined /> },
  '离线': { color: 'error', icon: <CloseCircleOutlined /> },
  '故障': { color: 'warning', icon: <AlertOutlined /> },
  '维护中': { color: 'processing', icon: <ToolOutlined /> }
};

const API_BASE_URL = 'http://47.108.141.135:5010/api';

const MachineStatus = () => {
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [machines, setMachines] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [searchText, setSearchText] = useState('');

  // 统计数据
  const [statistics, setStatistics] = useState({
    total: 0,
    online: 0,
    offline: 0,
    fault: 0,
    maintenance: 0,
    salesPerformance: 0,
    stockWarning: 0
  });

  // 加载售货机数据
  useEffect(() => {
    fetchMachines();
    fetchStatistics();
  }, []);

  // 筛选数据
  useEffect(() => {
    filterMachines();
  }, [machines, activeTab, searchText]);

  // 获取售货机统计数据
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/machines/statistics`);
      setStatistics(response.data);
    } catch (error) {
      console.error("获取统计数据失败", error);
      message.error("获取统计数据失败");
    }
  };

  // 获取售货机数据
  const fetchMachines = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/machines`);
      setMachines(response.data);
      // 如果后端没有提供统计数据，我们可以在前端计算
      updateStatistics(response.data);
    } catch (error) {
      console.error("获取售货机数据失败", error);
      message.error("获取售货机数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 更新统计数据（如果后端API未提供统计数据）
  const updateStatistics = (data) => {
    const stats = {
      total: data.length,
      online: data.filter(m => m.status === '在线').length,
      offline: data.filter(m => m.status === '离线').length,
      fault: data.filter(m => m.status === '故障').length,
      maintenance: data.filter(m => m.status === '维护中').length,
      salesPerformance: data.reduce((total, machine) => total + (machine.sales || 0), 0),
      stockWarning: data.filter(m => m.stockStatus === '预警').length
    };
    setStatistics(stats);
  };

  // 过滤售货机
  const filterMachines = () => {
    let filtered = [...machines];
    
    // 根据标签筛选
    if (activeTab !== 'all') {
      if (activeTab === 'warning') {
        filtered = filtered.filter(m => m.stockStatus === '预警' || m.status === '故障');
      } else {
        filtered = filtered.filter(m => m.status === activeTab);
      }
    }
    
    // 根据搜索文本筛选
    if (searchText) {
      filtered = filtered.filter(m => 
        String(m.id).toLowerCase().includes(searchText.toLowerCase()) ||
        (m.name && m.name.toLowerCase().includes(searchText.toLowerCase())) ||
        (m.location && m.location.toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    
    setFilteredMachines(filtered);
  };

  // 获取售货机详情
  const fetchMachineDetail = async (machineId) => {
    setDetailLoading(true);
    try {
      // 使用新的detail接口
      const response = await axios.get(`${API_BASE_URL}/machines/${machineId}/detail`);
      if (response.data) {
        // 确保数据字段存在
        const machineData = {
          ...response.data,
          slots: response.data.slots || [],
          logs: response.data.logs || [],
          salesTrend: 'up', // 默认值
        };
        setSelectedMachine(machineData);
      } else {
        message.error("获取售货机详情失败: 无数据返回");
      }
    } catch (error) {
      console.error("获取售货机详情失败", error);
      message.error("获取售货机详情失败: " + (error.response?.data?.message || error.message));
    } finally {
      setDetailLoading(false);
    }
  };

  // 显示详情抽屉
  const showDetail = (machine) => {
    setSelectedMachine(machine);
    setDetailVisible(true);
    fetchMachineDetail(machine.id);
  };

  // 发送维修请求
  const sendMaintenance = async (machineId) => {
    try {
      const userId = JSON.parse(localStorage.getItem('user'))?.id || 1;
      await axios.post(`${API_BASE_URL}/machines/${machineId}/maintenance`, {
        user_id: userId
      });
      
      message.success('已发送维护请求');
      fetchMachines();
      
      if (selectedMachine && selectedMachine.id === machineId) {
        fetchMachineDetail(machineId);
      }
    } catch (error) {
      console.error("发送维护请求失败", error);
      message.error("发送维护请求失败");
    }
  };

  // 远程重启
  const remoteRestart = async (machineId) => {
    message.loading('正在尝试重启售货机...', 2.5);
    try {
      const userId = JSON.parse(localStorage.getItem('user'))?.id || 1;
      // 修改调用的API路径
      await axios.put(`${API_BASE_URL}/machines/${machineId}/status`, {
        status: '在线',
        user_id: userId
      });
      
      message.success('远程重启成功');
      fetchMachines();
      
      if (selectedMachine && selectedMachine.id === machineId) {
        fetchMachineDetail(machineId);
      }
    } catch (error) {
      console.error("远程重启失败", error);
      message.error("远程重启失败: " + (error.response?.data?.message || error.message));
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '设备编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '所在位置',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (text) => (
        <span>
          <EnvironmentOutlined style={{ marginRight: 4, color: '#1890ff' }} />
          {text}
        </span>
      ),
    },
    {
      title: '网络状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={machineStatusMap[status]?.color} icon={machineStatusMap[status]?.icon}>
          {status}
        </Tag>
      ),
    },
    {
      title: '温度',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 100,
      render: (temp) => temp ? `${temp}°C` : '--',
    },
    {
      title: '商品槽状态',
      dataIndex: 'stockStatus',
      key: 'stockStatus',
      width: 150,
      render: (status, record) => (
        <Space>
          <Tag color={status === '预警' ? 'warning' : 'success'}>
            {status}
          </Tag>
          <Tooltip title={`空槽: ${record.emptySlots || 0}, 预警: ${record.warningSlots || 0}, 总槽: ${record.slots?.length || 0}`}>
            <Progress 
              percent={Math.round((record.fillLevel || 0) * 100)} 
              size="small" 
              status={status === '预警' ? 'exception' : 'normal'}
              style={{ width: 60 }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '近期销量',
      dataIndex: 'sales',
      key: 'sales',
      width: 120,
      render: (sales = 0, record) => (
        <span>
          {sales} 件
          {record.salesTrend === 'up' ? (
            <ArrowUpOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
          ) : (
            <ArrowDownOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />
          )}
        </span>
      ),
      sorter: (a, b) => (a.sales || 0) - (b.sales || 0),
    },
    {
      title: '最后在线',
      dataIndex: 'last_online',
      key: 'last_online',
      width: 150,
      render: (time, record) => record.status === '在线' ? '当前在线' : time,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          >
            详情
          </Button>
          
          {record.status === '故障' && (
            <Button 
              type="primary" 
              danger
              size="small" 
              icon={<ToolOutlined />}
              onClick={() => sendMaintenance(record.id)}
            >
              报修
            </Button>
          )}
          
          {(record.status === '在线' || record.status === '故障') && (
            <Popconfirm
              title="确定要远程重启该设备吗？"
              onConfirm={() => remoteRestart(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" icon={<SyncOutlined />}>
                重启
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="machines-page">
      <div className="machine-stats">
        <Row gutter={16}>
          <Col span={4}>
            <Card className="stat-card">
              <Statistic
                title="售货机总数"
                value={statistics.total}
                prefix={<span className="stat-icon">🏪</span>}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card className="stat-card">
              <Statistic
                title="在线设备"
                value={statistics.online}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
                suffix={`/ ${statistics.total}`}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card className="stat-card">
              <Statistic
                title="离线设备"
                value={statistics.offline}
                valueStyle={{ color: statistics.offline > 0 ? '#ff4d4f' : '#52c41a' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card className="stat-card">
              <Statistic
                title="故障设备"
                value={statistics.fault}
                valueStyle={{ color: statistics.fault > 0 ? '#faad14' : '#52c41a' }}
                prefix={<AlertOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card className="stat-card">
              <Statistic
                title="维护中"
                value={statistics.maintenance}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ToolOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card className="stat-card">
              <Statistic
                title="库存预警"
                value={statistics.stockWarning}
                valueStyle={{ color: statistics.stockWarning > 0 ? '#faad14' : '#52c41a' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Card
        title="售货机设备状态"
        className="machines-card"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchMachines}
            >
              刷新数据
            </Button>
          </Space>
        }
      >
        <div className="filter-container">
          <Input.Search
            placeholder="搜索设备ID/名称/位置"
            style={{ width: 250 }}
            allowClear
            onSearch={value => setSearchText(value)}
            onChange={e => {
              if (!e.target.value) {
                setSearchText('');
              }
            }}
          />
        </div>

        <div className="status-tabs">
          <Space size="middle">
            <Button
              type={activeTab === 'all' ? 'primary' : 'default'}
              onClick={() => setActiveTab('all')}
            >
              全部设备 ({statistics.total})
            </Button>
            <Button
              type={activeTab === '在线' ? 'primary' : 'default'}
              onClick={() => setActiveTab('在线')}
              icon={<CheckCircleOutlined />}
              style={{ color: activeTab === '在线' ? '#fff' : '#52c41a' }}
            >
              在线 ({statistics.online})
            </Button>
            <Button
              type={activeTab === '离线' ? 'primary' : 'default'}
              danger={activeTab === '离线'}
              onClick={() => setActiveTab('离线')}
              icon={<CloseCircleOutlined />}
            >
              离线 ({statistics.offline})
            </Button>
            <Button
              type={activeTab === '故障' ? 'primary' : 'default'}
              danger={activeTab === '故障'}
              onClick={() => setActiveTab('故障')}
              icon={<AlertOutlined />}
            >
              故障 ({statistics.fault})
            </Button>
            <Button
              type={activeTab === '维护中' ? 'primary' : 'default'}
              onClick={() => setActiveTab('维护中')}
              icon={<ToolOutlined />}
            >
              维护中 ({statistics.maintenance})
            </Button>
            <Button
              type={activeTab === 'warning' ? 'primary' : 'default'}
              danger={activeTab === 'warning'}
              onClick={() => setActiveTab('warning')}
              icon={<WarningOutlined />}
            >
              预警设备 ({statistics.stockWarning + statistics.fault})
            </Button>
          </Space>
        </div>

        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredMachines}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 台售货机`,
          }}
          rowClassName={(record) => {
            if (record.status === '故障') return 'machine-fault';
            if (record.status === '离线') return 'machine-offline';
            if (record.stockStatus === '预警') return 'machine-warning';
            return '';
          }}
        />
      </Card>

      {/* 售货机详情抽屉 */}
      <Drawer
        title={(
          <Space>
            <span>{selectedMachine?.name}</span>
            {selectedMachine && (
              <Tag color={machineStatusMap[selectedMachine.status]?.color} icon={machineStatusMap[selectedMachine.status]?.icon}>
                {selectedMachine.status}
              </Tag>
            )}
          </Space>
        )}
        width={700}
        placement="right"
        onClose={() => setDetailVisible(false)}
        open={detailVisible}
        extra={
          selectedMachine?.status === '在线' && (
            <Button 
              type="primary"
              onClick={() => message.success('远程监控已打开')}
            >
              进入远程监控
            </Button>
          )
        }
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Badge status="processing" />
            <span style={{ marginLeft: 8 }}>加载中...</span>
          </div>
        ) : selectedMachine && (
          <div className="machine-detail">
            <Row gutter={16} className="detail-section">
              <Col span={24}>
                <Alert
                  message={
                    selectedMachine.status === '在线' 
                      ? "设备运行正常" 
                      : selectedMachine.status === '故障'
                      ? "设备存在故障，请及时处理"
                      : selectedMachine.status === '离线'
                      ? "设备当前离线，请检查网络连接"
                      : "设备正在进行维护工作"
                  }
                  type={
                    selectedMachine.status === '在线' 
                      ? "success" 
                      : selectedMachine.status === '故障'
                      ? "error"
                      : selectedMachine.status === '离线'
                      ? "warning"
                      : "info"
                  }
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              </Col>
            </Row>

            <Tabs
              defaultActiveKey="info"
              items={[
                {
                  key: 'info',
                  label: '基本信息',
                  children: (
                    <Descriptions bordered column={2} className="detail-section">
                      <Descriptions.Item label="设备ID">{selectedMachine.id}</Descriptions.Item>
                      <Descriptions.Item label="设备名称">{selectedMachine.name}</Descriptions.Item>
                      <Descriptions.Item label="所在位置">{selectedMachine.location}</Descriptions.Item>
                      <Descriptions.Item label="最后在线">{selectedMachine.status === '在线' ? '当前在线' : selectedMachine.last_online}</Descriptions.Item>
                      <Descriptions.Item label="上架日期">{selectedMachine.setup_date}</Descriptions.Item>
                      <Descriptions.Item label="最近维护">{selectedMachine.last_maintenance || '暂无记录'}</Descriptions.Item>
                      {selectedMachine.temperature && (
                        <Descriptions.Item label="当前温度">{selectedMachine.temperature}°C</Descriptions.Item>
                      )}
                      {selectedMachine.humidity && (
                        <Descriptions.Item label="当前湿度">{selectedMachine.humidity}%</Descriptions.Item>
                      )}
                      <Descriptions.Item label="IP地址">{selectedMachine.ipAddress || '未知'}</Descriptions.Item>
                      <Descriptions.Item label="总销量">{selectedMachine.sales || 0}件</Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'slots',
                  label: '商品槽状态',
                  children: selectedMachine.slots && selectedMachine.slots.length > 0 ? (
                    <>
                      <div className="slot-container">
                        {selectedMachine.slots.map(slot => (
                          <div key={slot.id} className="slot-item">
                            <Title level={5}>{slot.name}</Title>
                            <Progress
                              type="dashboard"
                              percent={slot.percent}
                              status={slot.status === '预警' ? 'exception' : 'normal'}
                              width={80}
                              format={percent => (
                                <div className="slot-progress-text">
                                  <div>{slot.current}</div>
                                  <div className="slot-capacity">/{slot.capacity}</div>
                                </div>
                              )}
                            />
                            <div className="slot-stat">
                              <Tag color={slot.status === '预警' ? 'warning' : 'success'}>
                                {slot.status}
                              </Tag>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="slot-summary">
                        <Text>空槽位数: {selectedMachine.emptySlots || 0}</Text>
                        <Text>预警槽位数: {selectedMachine.warningSlots || 0}</Text>
                        <Text>填充率: {Math.round((selectedMachine.fillLevel || 0) * 100)}%</Text>
                      </div>
                    </>
                  ) : (
                    <Empty description="暂无商品槽数据" />
                  ),
                },
                {
                  key: 'logs',
                  label: '操作日志',
                  children: selectedMachine.logs && selectedMachine.logs.length > 0 ? (
                    <Timeline>
                      {selectedMachine.logs.map((log, index) => (
                        <Timeline.Item
                          key={index}
                          color={
                            log.type === '故障' ? 'red' : 
                            log.type === '维护' ? 'blue' :
                            log.type === '补货' ? 'green' : 'gray'
                          }
                        >
                          <p className="log-time">{log.time}</p>
                          <p className="log-content">
                            <Tag color={
                              log.type === '故障' ? 'error' : 
                              log.type === '维护' ? 'processing' :
                              log.type === '补货' ? 'success' : 'default'
                            }>
                              {log.type}
                            </Tag>
                            {log.content}
                          </p>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  ) : (
                    <Empty description="暂无操作日志" />
                  ),
                },
              ]}
            />

            <div className="machine-actions">
              {selectedMachine.status === '故障' && (
                <Button 
                  type="primary" 
                  danger
                  icon={<ToolOutlined />}
                  onClick={() => sendMaintenance(selectedMachine.id)}
                >
                  发送维护请求
                </Button>
              )}
              
              {(selectedMachine.status === '在线' || selectedMachine.status === '故障') && (
                <Popconfirm
                  title="确定要远程重启该设备吗？"
                  onConfirm={() => remoteRestart(selectedMachine.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button icon={<SyncOutlined />}>
                    远程重启
                  </Button>
                </Popconfirm>
              )}
              
              <Button 
                type="default"
                onClick={() => message.success('补货申请已创建')}
              >
                创建补货申请
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default MachineStatus;