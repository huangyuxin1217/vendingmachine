// src/pages/Inventory/index.jsx
import { useState, useEffect } from 'react';
import { 
  Table, Card, Button, Space, Input, 
  Tag, Modal, Form, InputNumber, message, 
  Popconfirm, Select, Badge
} from 'antd';
import { 
  ReloadOutlined, SearchOutlined, 
  WarningOutlined, EditOutlined
} from '@ant-design/icons';
import axios from 'axios';
import './style.css';

const { Option } = Select;

const Inventory = () => {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [refillingRecord, setRefillingRecord] = useState(null);
  const [form] = Form.useForm();
  const [showWarningOnly, setShowWarningOnly] = useState(false);

  // 获取库存数据
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://47.108.141.135:5010/api/products');
      const data = response.data.map((item) => ({
        ...item,
        status: item.stock < item.safe_stock ? '预警' : '正常',
      }));
      setInventory(data);
    } catch (error) {
      message.error('获取库存数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 显示补货或调整库存模态框
  const showModal = (record, isRefill = true) => {
    setRefillingRecord({ ...record, isRefill });
    form.setFieldsValue({
      addStock: isRefill ? 10 : 0, // 默认补货数量
      newSafeStock: record.safe_stock // 当前安全库存
    });
    setModalVisible(true);
  };

  // 处理补货或调整安全库存
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const { addStock, newSafeStock } = values;

      if (refillingRecord.isRefill) {
        // 补货操作
        await axios.put('http://47.108.141.135:5010/api/inventory', {
          product_id: refillingRecord.id,
          stock_change: addStock,
        });
        message.success(`已为 ${refillingRecord.name} 补货 ${addStock} 件`);
      } else {
        // 调整安全库存操作
        await axios.put('http://47.108.141.135:5010/api/products', {
          product_id: refillingRecord.id,
          safe_stock: newSafeStock,
        });
        message.success(`${refillingRecord.name} 的安全库存已调整为 ${newSafeStock}`);
      }

      setModalVisible(false);
      form.resetFields();
      fetchInventory();
    } catch (error) {
      message.error('操作失败，请重试');
      console.error(error);
    }
  };

  // 批量调整库存
  const handleBatchAdjust = async () => {
    try {
      const warnings = inventory.filter((item) => item.status === '预警');
      for (const item of warnings) {
        await axios.put('http://47.108.141.135:5010/api/inventory', {
          product_id: item.id,
          stock_change: item.safe_stock - item.stock,
        });
      }
      message.success('已为所有预警商品补充库存');
      fetchInventory();
    } catch (error) {
      message.error('批量调整库存失败');
      console.error(error);
    }
  };

  // 页面加载时获取库存数据
  useEffect(() => {
    fetchInventory();
  }, []);

  // 表格列定义
  const columns = [
    { title: '商品ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: '商品名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 120 },
    { 
      title: '单价', 
      dataIndex: 'price', 
      key: 'price',
      width: 100,
      render: (price) => {
        const validPrice = typeof price === 'number' ? price : 0; // 确保 price 为数字
        return `¥${validPrice.toFixed(2)}`;
      },
    },
    { 
      title: '当前库存', 
      dataIndex: 'stock', 
      key: 'stock', 
      width: 100,
      render: (stock, record) => (
        <span style={{ color: stock < record.safe_stock ? '#cf1322' : 'inherit' }}>
          {stock}
        </span>
      ),
    },
    { title: '安全库存', dataIndex: 'safe_stock', key: 'safe_stock', width: 100 },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === '预警' ? 'error' : 'success'}>
          {status}
        </Tag>
      ),
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
            onClick={() => showModal(record, true)}
          >
            补货
          </Button>
          <Button 
            type="default" 
            size="small"
            onClick={() => showModal(record, false)}
          >
            调整安全库存
          </Button>
        </Space>
      ),
    },
  ];

  // 筛选数据
  const getFilteredData = () => {
    if (showWarningOnly) {
      return inventory.filter((item) => item.status === '预警');
    }
    return inventory;
  };

  return (
    <div className="inventory-page">
      <Card
        title="库存管理"
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={fetchInventory}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<WarningOutlined />}
              onClick={handleBatchAdjust}
            >
              批量调整库存
            </Button>
            <Button 
              type={showWarningOnly ? "primary" : "default"}
              icon={<WarningOutlined />}
              onClick={() => setShowWarningOnly(!showWarningOnly)}
              danger={showWarningOnly}
            >
              {showWarningOnly ? "查看全部" : "查看预警列表"}
            </Button>
          </Space>
        }
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={getFilteredData()}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 补货或调整安全库存模态框 */}
      <Modal
        title={refillingRecord?.isRefill ? '商品补货' : '调整安全库存'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        width={400}
      >
        {refillingRecord && (
          <Form
            form={form}
            layout="vertical"
            name="inventoryForm"
          >
            {refillingRecord.isRefill ? (
              <Form.Item
                name="addStock"
                label="补货数量"
                rules={[{ required: true, message: '请输入补货数量' }]}
              >
                <InputNumber
                  placeholder="请输入补货数量"
                  min={1}
                  style={{ width: '100%' }}
                  addonAfter="件"
                />
              </Form.Item>
            ) : (
              <Form.Item
                name="newSafeStock"
                label="新的安全库存"
                rules={[{ required: true, message: '请输入安全库存' }]}
              >
                <InputNumber
                  placeholder="请输入安全库存值"
                  min={0}
                  style={{ width: '100%' }}
                  addonAfter="件"
                />
              </Form.Item>
            )}
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Inventory;