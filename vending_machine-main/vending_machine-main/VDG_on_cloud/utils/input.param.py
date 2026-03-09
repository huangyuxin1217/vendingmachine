from threading import Thread, Lock

class InputParam:
    def __init__(self, device_id, products, traffic_level, dist_type, variance_value, datarange_fro, datarange_to, time):
        self.device_id = device_id
        self.products = products
        self.traffic_level = traffic_level
        self.dist_type = dist_type
        self.variance_value = variance_value
        self.datarange_fro = datarange_fro
        self.datarange_to = datarange_to
        self.time = time  # 别忘了存 `time`，原代码中少了

class DataGenerator(Thread):
    def __init__(self, input_param: InputParam, queue):  # 只接收一个 InputParam 对象
        super().__init__()
        self.device_id = input_param.device_id
        self.products = input_param.products.split(',')  # 转成列表
        self.traffic = input_param.traffic_level
        self.dist_type = input_param.dist_type
        self.variance_value = input_param.variance_value
        self.datarange_fro = input_param.datarange_fro
        self.datarange_to = input_param.datarange_to
        self.time = input_param.time  # 需要保存时间参数
        self.queue = queue
        self.avera = (int(input_param.datarange_fro) + int(input_param.datarange_to)) / 2
        self._running = True
        self.lock = Lock()

# 示例：创建参数对象
params = InputParam(device_id="A123", products="可乐,雪碧,红牛", traffic_level=2,
                    dist_type="normal", variance_value=1.5, datarange_fro=5, datarange_to=20, time=10)

# 创建 DataGenerator 实例
queue = []  # 假设一个队列
data_generator = DataGenerator(params, queue)

# 打印检查
print(data_generator.device_id)  # A123
print(data_generator.products)  # ['可乐', '雪碧', '红牛']