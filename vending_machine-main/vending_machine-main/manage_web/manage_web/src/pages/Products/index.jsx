import { useState, useEffect, useRef } from 'react';
import { 
  Table, Card, Button, Space, Input, Select, 
  Popconfirm, Tag, Modal, Form, InputNumber, message 
} from 'antd';
import { 
  PlusOutlined, ImportOutlined, ExportOutlined, 
  SearchOutlined, EditOutlined, DeleteOutlined, SyncOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

// API 基础地址
const API_BASE_URL = 'http://47.108.141.135:5010/api';

const Products = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const searchInputRef = useRef(null);
  
  // 获取商品数据
  const fetchProducts = async (search = '', category = 'all') => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = {};
      if (search) {
        params.search = search;
      }
      if (category && category !== 'all') {
        params.category = category;
      }

      const response = await axios.get(`${API_BASE_URL}/products`, { params });
      setProducts(response.data);
    } catch (error) {
      console.error("获取商品数据失败", error);
      message.error("获取商品数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 获取商品分类
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("获取商品分类失败", error);
    }
  };
  
  // 初始化数据
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);
  
  // 处理搜索
  const handleSearch = () => {
    fetchProducts(searchText, selectedCategory);
  };
  
  // 显示编辑/新增模态框
  const showModal = (product = null) => {
    setEditingProduct(product);
    if (product) {
      form.setFieldsValue(product);
    } else {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        status: '上架',
        stock: 0,
        safe_stock: 10
      });
    }
    setModalVisible(true);
  };
  
  // 处理表单提交
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 获取当前用户ID (如果有登录系统的话)
      const userId = JSON.parse(localStorage.getItem('user'))?.id || 1;
      
      if (editingProduct) {
        // 更新商品
        await axios.put(`${API_BASE_URL}/products/${editingProduct.id}`, {
          ...values,
          user_id: userId
        });
        message.success('商品更新成功');
      } else {
        // 添加新商品
        await axios.post(`${API_BASE_URL}/products`, {
          ...values,
          user_id: userId
        });
        message.success('商品添加成功');
      }
      
      setModalVisible(false);
      fetchProducts(searchText, selectedCategory); // 重新加载数据
      
    } catch (error) {
      console.error("保存商品失败", error);
      message.error("保存商品失败: " + (error.response?.data?.message || error.message));
    }
  };
  
  // 删除商品
  const handleDelete = async (id) => {
    try {
      const userId = JSON.parse(localStorage.getItem('user'))?.id || 1;
      await axios.delete(`${API_BASE_URL}/products/${id}?user_id=${userId}`);
      message.success('商品已删除');
      fetchProducts(searchText, selectedCategory); // 重新加载数据
    } catch (error) {
      console.error("删除商品失败", error);
      message.error("删除商品失败: " + (error.response?.data?.message || error.message));
    }
  };
  
  // 表格列定义
  const columns = [
    { title: '商品ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 120 },
    { 
      title: '单价', 
      dataIndex: 'price', 
      key: 'price',
      width: 100,
      render: (price) => `¥${parseFloat(price).toFixed(2)}`
    },
    { 
      title: '库存/安全库存', 
      key: 'stock',
      width: 140,
      render: (_, record) => (
        <span>
          {record.stock} / {record.safe_stock || 10}
          {record.stock < (record.safe_stock || 10) && (
            <Tag color="warning" style={{ marginLeft: 8 }}>预警</Tag>
          )}
        </span>
      )
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === '上架' ? 'green' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个商品吗？"
            description="删除后将无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="products-page">
      <Card
        title="商品管理"
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              新增商品
            </Button>
            <Button icon={<SyncOutlined />} onClick={() => fetchProducts()}>
              刷新
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Input.Group compact style={{ display: 'flex', maxWidth: 600 }}>
            <Input 
              style={{ flex: 1 }} 
              placeholder="搜索商品名称/ID" 
              prefix={<SearchOutlined />} 
              ref={searchInputRef}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Select 
              value={selectedCategory} 
              onChange={setSelectedCategory}
              style={{ width: 120 }}
            >
              <Option value="all">全部分类</Option>
              {categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
            <Button type="primary" onClick={handleSearch}>搜索</Button>
          </Input.Group>
        </div>
        
        <Table
          loading={loading}
          columns={columns}
          dataSource={products}
          rowKey="id"
          pagination={{ 
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条商品`
          }}
        />
      </Card>
      
      <Modal
        title={editingProduct ? '编辑商品' : '添加商品'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          name="productForm"
        >
          <Form.Item
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="商品分类"
            rules={[{ required: true, message: '请选择商品分类' }]}
          >
            <Select placeholder="请选择商品分类">
              {categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
              <Option value="饮料">饮料</Option>
              <Option value="零食">零食</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="price"
            label="商品单价"
            rules={[{ required: true, message: '请输入商品单价' }]}
          >
            <InputNumber
              placeholder="请输入商品单价"
              min={0}
              step={0.1}
              precision={2}
              prefix="¥"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="stock"
            label="库存数量"
            rules={[{ required: true, message: '请输入库存数量' }]}
          >
            <InputNumber
              placeholder="请输入库存数量"
              min={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="safe_stock"
            label="安全库存"
            rules={[{ required: true, message: '请输入安全库存' }]}
          >
            <InputNumber
              placeholder="请输入安全库存"
              min={0}
              style={{ width: '100%' }}
              defaultValue={10}
            />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="商品描述"
          >
            <Input.TextArea 
              placeholder="请输入商品描述" 
              rows={3}
            />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="商品状态"
            rules={[{ required: true, message: '请选择商品状态' }]}
          >
            <Select placeholder="请选择商品状态">
              <Option value="上架">上架</Option>
              <Option value="下架">下架</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;