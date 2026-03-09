# main_frame.py
import wx
from threading import Thread
from queue import Queue
from core.generator import DataGenerator

class MainFrame(wx.Frame):
    def __init__(self):
        super().__init__(None, title="自动售货机数据生成器", size=(800, 600))
        
        # 控件初始化
        self.products = wx.ComboBox(self, choices=["可乐", "雪碧", "芬达","冰露","鲜果乐","零度可乐"], style=wx.CB_SORT)# 产品类型
        self.variance = wx.TextCtrl(self, style=wx.TE_PROCESS_ENTER)# 数据方差
        self.traffic = wx.SpinCtrl(self, min=1, max=9, initial=5) # 人流量挡位
        self.datarange_fro = wx.TextCtrl(self, style=wx.TE_PROCESS_ENTER)# 数据范围,起始
        self.datarange_to = wx.TextCtrl(self, style=wx.TE_PROCESS_ENTER)# 数据范围,终止
        self.time = wx.TextCtrl(self, style=wx.TE_PROCESS_ENTER)# 时间
        self.dist_type = wx.ComboBox(self, choices=["正态分布","泊松分布","随机分布"]) # 分布类型
        self.log_ctrl = wx.TextCtrl(self, style=wx.TE_MULTILINE|wx.TE_READONLY) # 日志输出
        

        # 线程管理
        self.data_queue = Queue()
        self.threads = []
        
        # 布局
        self._setup_ui()
        self._bind_events()
    
    def _setup_ui(self):
        param_sizer = wx.FlexGridSizer(cols=2, vgap=6, hgap=10)
        param_sizer.AddMany([
            (wx.StaticText(self, label="产品类型"), 0, wx.ALIGN_CENTER_VERTICAL),
            self.products,
            (wx.StaticText(self, label="人流量挡位"), 0, wx.ALIGN_CENTER_VERTICAL),
            self.traffic,
            (wx.StaticText(self, label="基于模型的随机分布类型"), 0, wx.ALIGN_CENTER_VERTICAL),
            self.dist_type,
            (wx.StaticText(self, label="数据起始"), 0, wx.ALIGN_CENTER_VERTICAL),
            self.datarange_fro,
            (wx.StaticText(self, label="数据终止"), 0, wx.ALIGN_CENTER_VERTICAL),
            self.datarange_to,
            (wx.StaticText(self, label="售货时间"), 0, wx.ALIGN_CENTER_VERTICAL),
            self.time,
            (wx.StaticText(self, label="数据方差"), 0, wx.ALIGN_CENTER_VERTICAL),
            self.variance,
        ])
        
        # 创建开始生成按钮，并添加到布局中
        self.start_btn = wx.Button(self, label="开始生成")

        main_sizer = wx.BoxSizer(wx.VERTICAL)
        main_sizer.Add(param_sizer, 0, wx.EXPAND|wx.ALL, 10) # 参数输入
        main_sizer.Add(self.start_btn, 0, wx.ALIGN_CENTER|wx.ALL, 10)  # 在这里添加按钮
        main_sizer.Add(self.log_ctrl, 1, wx.EXPAND|wx.ALL, 10) # 日志输出

        self.SetSizer(main_sizer)
    
    def _bind_events(self):
        self.Bind(wx.EVT_CLOSE, self.on_close)
        self.Bind(wx.EVT_BUTTON, lambda event: self.start_generation(), self.start_btn)

    def start_generation(self):
        for i in range(10):  # 10个设备线程
            thread = DataGenerator(
                device_id=i+1,
                products=self.products.GetValue(),
                traffic_level=self.traffic.GetValue(),
                dist_type=self.dist_type.GetValue(),
                variance_value=self.variance.GetValue(),
                datarange_fro=self.datarange_fro.GetValue(),
                datarange_to=self.datarange_to.GetValue(),
                time=self.time.GetValue(),
                queue=self.data_queue
            )
            thread.start()
            self.threads.append(thread)

        self.start_timer()
    
    def on_close(self, event):
        for t in self.threads:
            t.stop()
        event.Skip()

    def start_timer(self):
    # 每100毫秒检查一次队列是否有数据
        self.timer = wx.Timer(self)
        self.Bind(wx.EVT_TIMER, self.update_log, self.timer)
        self.timer.Start(100)

    def update_log(self, event):
    # 当队列中有数据时，将数据追加到日志控件
        while not self.data_queue.empty():
            data = self.data_queue.get()
            self.log_ctrl.AppendText(data.__str__() + "\n")
