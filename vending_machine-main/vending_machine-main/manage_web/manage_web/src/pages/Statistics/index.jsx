// src/pages/Statistics/index.jsx
import { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Space, DatePicker, 
  Select, Button, Table, Statistic, 
  Spin, Empty, Typography, Radio,
  message, Tabs, Divider
} from 'antd';
import { 
  ArrowUpOutlined, ArrowDownOutlined, 
  FileExcelOutlined, ReloadOutlined, 
  DollarOutlined, ShoppingOutlined, 
  LineChartOutlined, BarChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';  // 使用 ECharts 替代 antv/plots

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title } = Typography;
const { TabPane } = Tabs;

// API 基础地址
const API_BASE_URL = 'http://47.108.141.135:5010/api';

const Statistics = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [selectedMachine, setSelectedMachine] = useState('all');
  const [timeUnit, setTimeUnit] = useState('day');
  const [activeTab, setActiveTab] = useState('sales');
  const [machineList, setMachineList] = useState([]);
  
  // 统计数据
  const [summaryData, setSummaryData] = useState({
    total_sales: 0,
    total_orders: 0,
    average_order_value: 0,
    sales_growth: 0
  });
  
  // 热门商品数据
  const [topProducts, setTopProducts] = useState([]);
  
  // 销售趋势数据
  const [salesTrend, setSalesTrend] = useState([]);
  
  // 售货机销售对比
  const [machineComparison, setMachineComparison] = useState([]);
  
  // 分类销售占比
  const [categorySales, setCategorySales] = useState([]);
  
  // 加载售货机列表
  useEffect(() => {
    fetchMachineList();
  }, []);
  
  // 监听筛选条件变化，加载对应数据
  useEffect(() => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      fetchStatisticsData();
    }
  }, [dateRange, selectedMachine, timeUnit, activeTab]);
  
  // 获取售货机列表
  const fetchMachineList = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics/machines`);
      setMachineList(response.data || []);
    } catch (error) {
      console.error("获取售货机列表失败", error);
      message.error("获取售货机列表失败");
      // 使用默认数据作为回退
      setMachineList([
        { id: 1, name: 'A001', location: '一号楼大厅' },
        { id: 2, name: 'B002', location: '二号楼入口' },
        { id: 3, name: 'C003', location: '三号楼走廊' }
      ]);
    }
  };
  
  // 获取统计数据
  const fetchStatisticsData = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning('请选择日期范围');
      return;
    }
    
    setLoading(true);
    
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      // 根据当前活动标签，加载不同数据
      await Promise.all([
        fetchSalesSummary(startDate, endDate),
        fetchTopProducts(startDate, endDate)
      ]);
      
      if (activeTab === 'sales') {
        await fetchSalesTrend(startDate, endDate);
      } else if (activeTab === 'products') {
        await fetchCategorySales(startDate, endDate);
      } else if (activeTab === 'machines') {
        await fetchMachineComparison(startDate, endDate);
      }
      
    } catch (error) {
      console.error("获取统计数据失败", error);
      message.error("获取统计数据失败，使用模拟数据");
      // 如果 API 调用失败，使用模拟数据
      useMockData();
    } finally {
      setLoading(false);
    }
  };
  
  // 使用模拟数据(作为失败的回退)
  const useMockData = () => {
    // 模拟销售概览数据
    setSummaryData({
      total_sales: 9875.50,
      total_orders: 328,
      average_order_value: 30.11,
      sales_growth: 15.6
    });
    
    // 模拟热门商品数据
    setTopProducts([
      { id: 1, name: '可口可乐', sales: 156, amount: 546.00, growth: 12.5, category: '饮料' },
      { id: 2, name: '百事可乐', sales: 123, amount: 430.50, growth: 8.2, category: '饮料' },
      { id: 3, name: '薯片', sales: 98, amount: 490.00, growth: -5.3, category: '零食' },
      { id: 4, name: '矿泉水', sales: 87, amount: 174.00, growth: 18.6, category: '饮料' },
      { id: 5, name: '巧克力', sales: 76, amount: 456.00, growth: 22.1, category: '零食' }
    ]);
    
    // 模拟销售趋势数据
    const trendData = [];
    const now = dayjs();
    for (let i = 30; i >= 0; i--) {
      const date = now.subtract(i, 'day');
      trendData.push({
        time_period: date.format('YYYY-MM-DD'),
        orders: Math.floor(Math.random() * 20) + 5,
        sales: parseFloat((Math.random() * 500 + 200).toFixed(2))
      });
    }
    setSalesTrend(trendData);
    
    // 模拟分类销售占比
    setCategorySales([
      { category: '饮料', orders: 186, sales: 2790.00, quantity: 558, percentage: 48.5 },
      { category: '零食', orders: 132, sales: 1980.00, quantity: 264, percentage: 34.4 },
      { category: '食品', orders: 67, sales: 938.00, quantity: 94, percentage: 16.3 },
      { category: '其他', orders: 8, sales: 48.00, quantity: 12, percentage: 0.8 }
    ]);
    
    // 模拟售货机销售对比
    setMachineComparison([
      { id: 1, name: 'A001', location: '一号楼大厅', orders: 142, sales: 2130.00 },
      { id: 2, name: 'B002', location: '二号楼入口', orders: 106, sales: 1590.00 },
      { id: 3, name: 'C003', location: '三号楼走廊', orders: 80, sales: 1200.00 }
    ]);
  };
  
  // 获取销售汇总数据
  const fetchSalesSummary = async (startDate, endDate) => {
    try {
      const params = {
        start_date: startDate,
        end_date: endDate,
        machine_id: selectedMachine,
        time_unit: timeUnit
      };
      
      const response = await axios.get(`${API_BASE_URL}/statistics/overview`, { params });
      setSummaryData(response.data || {
        total_sales: 0,
        total_orders: 0,
        average_order_value: 0,
        sales_growth: 0
      });
    } catch (error) {
      console.error("获取销售汇总数据失败", error);
      throw error;
    }
  };
  
  // 获取热门商品
  const fetchTopProducts = async (startDate, endDate) => {
    try {
      const params = {
        start_date: startDate,
        end_date: endDate,
        machine_id: selectedMachine,
        limit: 10
      };
      
      const response = await axios.get(`${API_BASE_URL}/statistics/top-products`, { params });
      setTopProducts(response.data || []);
    } catch (error) {
      console.error("获取热门商品数据失败", error);
      throw error;
    }
  };
  
  // 获取销售趋势
  const fetchSalesTrend = async (startDate, endDate) => {
    try {
      const params = {
        start_date: startDate,
        end_date: endDate,
        machine_id: selectedMachine,
        time_unit: timeUnit
      };
      
      const response = await axios.get(`${API_BASE_URL}/statistics/sales-trend`, { params });
      setSalesTrend(response.data || []);
    } catch (error) {
      console.error("获取销售趋势数据失败", error);
      throw error;
    }
  };
  
  // 获取商品分类销售占比
  const fetchCategorySales = async (startDate, endDate) => {
    try {
      const params = {
        start_date: startDate,
        end_date: endDate,
        machine_id: selectedMachine
      };
      
      const response = await axios.get(`${API_BASE_URL}/statistics/category-sales`, { params });
      setCategorySales(response.data || []);
    } catch (error) {
      console.error("获取分类销售数据失败", error);
      throw error;
    }
  };
  
  // 获取售货机销售对比
  const fetchMachineComparison = async (startDate, endDate) => {
    try {
      const params = {
        start_date: startDate,
        end_date: endDate
      };
      
      const response = await axios.get(`${API_BASE_URL}/statistics/machine-comparison`, { params });
      setMachineComparison(response.data || []);
    } catch (error) {
      console.error("获取售货机销售对比数据失败", error);
      throw error;
    }
  };
  
  // 导出数据
  const exportData = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      const params = {
        start_date: startDate,
        end_date: endDate,
        machine_id: selectedMachine,
        time_unit: timeUnit
      };
      
      // 如果后端支持导出，可以直接调用API
      message.success('导出成功，正在生成下载链接...');
      
      // 模拟下载行为
      setTimeout(() => {
        const element = document.createElement('a');
        const file = new Blob(
          [JSON.stringify({
            summary: summaryData,
            topProducts: topProducts,
            salesTrend: salesTrend,
            categorySales: categorySales,
            machineComparison: machineComparison
          }, null, 2)], 
          { type: 'application/json' }
        );
        element.href = URL.createObjectURL(file);
        element.download = `sales_data_${startDate}_to_${endDate}.json`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }, 1500);
      
    } catch (error) {
      console.error("导出数据失败", error);
      message.error("导出数据失败: " + (error.response?.data?.message || error.message));
    }
  };
  
  // 构建销售趋势图的配置
  const getSalesTrendOption = () => {
    if (!salesTrend || salesTrend.length === 0) {
      return {
        title: {
          text: '暂无销售趋势数据'
        }
      };
    }
    
    // 准备数据
    const xAxisData = salesTrend.map(item => item.time_period);
    const salesData = salesTrend.map(item => parseFloat(item.sales || 0).toFixed(2));
    const ordersData = salesTrend.map(item => item.orders);
    
    return {
      title: {
        text: '销售趋势'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['销售额', '订单数']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          rotate: xAxisData.length > 10 ? 45 : 0
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '销售额',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        {
          type: 'value',
          name: '订单数',
          position: 'right'
        }
      ],
      series: [
        {
          name: '销售额',
          type: 'bar',
          data: salesData,
          itemStyle: {
            color: '#3498db'
          }
        },
        {
          name: '订单数',
          type: 'line',
          yAxisIndex: 1,
          data: ordersData,
          itemStyle: {
            color: '#e74c3c'
          },
          lineStyle: {
            width: 2
          },
          symbol: 'circle',
          symbolSize: 8
        }
      ]
    };
  };
  
  // 构建分类销售占比图表配置
  const getCategorySalesOption = () => {
    if (!categorySales || categorySales.length === 0) {
      return {
        title: {
          text: '暂无分类销售数据'
        }
      };
    }
    
    return {
      title: {
        text: '分类销售占比',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        data: categorySales.map(item => item.category)
      },
      series: [
        {
          name: '销售额',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            formatter: '{b}: {c} ({d}%)'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '16',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: true
          },
          data: categorySales.map(item => ({
            name: item.category,
            value: parseFloat(item.sales || 0).toFixed(2)
          }))
        }
      ]
    };
  };
  
  // 构建售货机销售对比图表配置
  const getMachineComparisonOption = () => {
    if (!machineComparison || machineComparison.length === 0) {
      return {
        title: {
          text: '暂无售货机销售对比数据'
        }
      };
    }
    
    const machineNames = machineComparison.map(item => item.name);
    const salesData = machineComparison.map(item => parseFloat(item.sales || 0).toFixed(2));
    const ordersData = machineComparison.map(item => item.orders);
    
    return {
      title: {
        text: '售货机销售对比'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['销售额', '订单数']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: machineNames,
        axisLabel: {
          interval: 0,
          rotate: machineNames.length > 6 ? 30 : 0
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '销售额',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        {
          type: 'value',
          name: '订单数',
          position: 'right'
        }
      ],
      series: [
        {
          name: '销售额',
          type: 'bar',
          data: salesData,
          itemStyle: {
            color: '#2ecc71'
          }
        },
        {
          name: '订单数',
          type: 'bar',
          yAxisIndex: 1,
          data: ordersData,
          itemStyle: {
            color: '#f39c12'
          }
        }
      ]
    };
  };
  
  // 顶部过滤器
  const renderFilters = () => (
    <div className="statistics-filters">
      <Space wrap size={12}>
        <RangePicker
          value={dateRange}
          onChange={setDateRange}
          allowClear={false}
          placeholder={['开始日期', '结束日期']}
        />
        <Select
          value={selectedMachine}
          onChange={setSelectedMachine}
          style={{ width: 180 }}
          placeholder="选择售货机"
        >
          <Option value="all">所有售货机</Option>
          {machineList.map(machine => (
            <Option key={machine.id} value={machine.id}>
              {machine.name} ({machine.location})
            </Option>
          ))}
        </Select>
        <Radio.Group value={timeUnit} onChange={e => setTimeUnit(e.target.value)}>
          <Radio.Button value="day">按日</Radio.Button>
          <Radio.Button value="week">按周</Radio.Button>
          <Radio.Button value="month">按月</Radio.Button>
        </Radio.Group>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
          onClick={fetchStatisticsData}
        >
          刷新数据
        </Button>
        <Button 
          icon={<FileExcelOutlined />}
          onClick={exportData}
        >
          导出数据
        </Button>
      </Space>
    </div>
  );
  
  // 销售概览卡片
  const renderSalesSummary = () => (
    <Row gutter={16} className="statistics-summary">
      <Col xs={24} sm={12} md={6}>
        <Card className="summary-card">
          <Statistic
            title="总销售额"
            value={summaryData.total_sales || 0}
            precision={2}
            valueStyle={{ color: '#e74c3c' }}
            prefix="¥"
            suffix={
              summaryData.sales_growth > 0 ? (
                <ArrowUpOutlined style={{ color: '#2ecc71' }} />
              ) : (
                <ArrowDownOutlined style={{ color: '#e74c3c' }} />
              )
            }
          />
          <div className="summary-icon">
            <DollarOutlined />
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card className="summary-card">
          <Statistic
            title="总订单数"
            value={summaryData.total_orders || 0}
            valueStyle={{ color: '#3498db' }}
            suffix="单"
          />
          <div className="summary-icon">
            <ShoppingOutlined />
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card className="summary-card">
          <Statistic
            title="客单价"
            value={summaryData.average_order_value || 0}
            precision={2}
            valueStyle={{ color: '#f39c12' }}
            prefix="¥"
          />
          <div className="summary-icon">
            <BarChartOutlined />
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card className="summary-card">
          <Statistic
            title="同比增长"
            value={Math.abs(summaryData.sales_growth || 0).toFixed(2)}
            precision={2}
            valueStyle={{ 
              color: (summaryData.sales_growth || 0) >= 0 ? '#2ecc71' : '#e74c3c' 
            }}
            prefix={(summaryData.sales_growth || 0) >= 0 ? "+" : "-"}
            suffix="%"
          />
          <div className="summary-icon">
            <LineChartOutlined />
          </div>
        </Card>
      </Col>
    </Row>
  );
  
  // 热门商品排行
  const renderTopProducts = () => (
    <Card title="热门商品排行" className="table-card">
      <Table
        dataSource={topProducts}
        rowKey="id"
        pagination={false}
        size="middle"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column 
          title="商品名称" 
          dataIndex="name" 
          key="name" 
          fixed="left"
        />
        <Table.Column 
          title="销量" 
          dataIndex="sales" 
          key="sales"
          sorter={(a, b) => a.sales - b.sales}
          defaultSortOrder="descend"
        />
        <Table.Column 
          title="销售额" 
          dataIndex="amount" 
          key="amount"
          render={(amount) => `¥${parseFloat(amount || 0).toFixed(2)}`}
          sorter={(a, b) => a.amount - b.amount}
        />
        <Table.Column 
          title="环比增长" 
          dataIndex="growth" 
          key="growth"
          render={(growth) => (
            <span style={{ 
              color: (growth || 0) >= 0 ? '#2ecc71' : '#e74c3c',
              fontWeight: 'bold' 
            }}>
              {(growth || 0) >= 0 ? "+" : ""}
              {parseFloat(growth || 0).toFixed(2)}%
            </span>
          )}
          sorter={(a, b) => a.growth - b.growth}
        />
        <Table.Column title="分类" dataIndex="category" key="category" />
      </Table>
    </Card>
  );
  
  // 销售趋势图表
  const renderSalesTrendChart = () => (
    <Card title="销售趋势">
      {salesTrend && salesTrend.length > 0 ? (
        <div className="chart-container">
          <ReactECharts 
            option={getSalesTrendOption()} 
            style={{ height: '400px' }} 
            notMerge={true}
          />
        </div>
      ) : (
        <Empty description="暂无销售趋势数据" />
      )}
    </Card>
  );
  
  // 商品分类占比图表
  const renderCategorySalesChart = () => (
    <Card title="分类销售占比">
      {categorySales && categorySales.length > 0 ? (
        <div className="chart-container">
          <ReactECharts 
            option={getCategorySalesOption()} 
            style={{ height: '400px' }} 
            notMerge={true}
          />
        </div>
      ) : (
        <Empty description="暂无分类销售数据" />
      )}
    </Card>
  );
  
  // 售货机销售对比图表
  const renderMachineComparisonChart = () => (
    <Card title="售货机销售对比">
      {machineComparison && machineComparison.length > 0 ? (
        <div className="chart-container">
          <ReactECharts 
            option={getMachineComparisonOption()} 
            style={{ height: '400px' }} 
            notMerge={true}
          />
        </div>
      ) : (
        <Empty description="暂无售货机销售对比数据" />
      )}
    </Card>
  );
  
  // 销售分析页面
  const renderSalesAnalysis = () => (
    <>
      <Title level={4}>销售数据分析</Title>
      {renderSalesSummary()}
      <Row gutter={16}>
        <Col span={24}>
          {renderTopProducts()}
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: '16px' }}>
        <Col span={24}>
          {renderSalesTrendChart()}
        </Col>
      </Row>
    </>
  );
  
  // 商品分析页面
  const renderProductAnalysis = () => (
    <>
      <Title level={4}>商品销售分析</Title>
      <Row gutter={16}>
        <Col span={24}>
          {renderTopProducts()}
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: '16px' }}>
        <Col span={24}>
          {renderCategorySalesChart()}
        </Col>
      </Row>
    </>
  );
  
  // 售货机分析页面
  const renderMachineAnalysis = () => (
    <>
      <Title level={4}>售货机数据分析</Title>
      <Row gutter={16}>
        <Col span={24}>
          {renderMachineComparisonChart()}
        </Col>
      </Row>
    </>
  );
  
  // 更新 TabPane 到 items 的渲染方法
  const renderTabItems = () => {
    return [
      {
        key: 'sales',
        label: (
          <span>
            <LineChartOutlined /> 销售概览
          </span>
        ),
        children: renderSalesAnalysis()
      },
      {
        key: 'products',
        label: (
          <span>
            <BarChartOutlined /> 商品分析
          </span>
        ),
        children: renderProductAnalysis()
      },
      {
        key: 'machines',
        label: (
          <span>
            <PieChartOutlined /> 售货机分析
          </span>
        ),
        children: renderMachineAnalysis()
      }
    ];
  };
  
  return (
    <div className="statistics-page">
      <Card title="数据统计与分析" className="filter-card">
        {renderFilters()}
      </Card>
      
      <Spin spinning={loading}>
        <div className="tab-content">
          <Tabs 
            activeKey={activeTab}
            onChange={setActiveTab}
            items={renderTabItems()}
            className="statistics-tabs"
          />
        </div>
      </Spin>
    </div>
  );
};

// 添加样式表
const styles = `
.statistics-page {
  padding-bottom: 20px;
}

.statistics-filters {
  margin-bottom: 16px;
}

.statistics-summary {
  margin-bottom: 24px;
}

.summary-card {
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}

.summary-card .ant-statistic-title {
  font-size: 16px;
  font-weight: 500;
}

.summary-card .ant-statistic-content {
  font-size: 24px;
  font-weight: bold;
}

.summary-icon {
  position: absolute;
  right: 16px;
  top: 16px;
  font-size: 24px;
  opacity: 0.2;
}

.statistics-tabs {
  margin-bottom: 24px;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 6px;
}

.table-card {
  margin-bottom: 20px;
  border-radius: 6px;
}

.tab-content {
  padding-top: 8px;
}

.chart-container {
  height: 400px;
  position: relative;
  margin: 12px 0;
}

@media (max-width: 768px) {
  .statistics-filters .ant-space {
    flex-wrap: wrap;
  }
  
  .chart-container {
    height: 300px;
  }
  
  .summary-card .ant-statistic-content {
    font-size: 20px;
  }
}
`;

// 创建样式标签
const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);

export default Statistics;