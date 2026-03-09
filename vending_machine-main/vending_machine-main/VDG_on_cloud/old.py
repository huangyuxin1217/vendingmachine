# generator.py
import random
import time
import numpy as np
import pickle
# import pandas as pd
from threading import Lock
from datetime import datetime
from threading import Thread
from queue import Queue
# from core.use_distribution import load_time_distributon

# 加载分布函数
def load_time_distribution(model_path = r'E:\vending_machine\VDG_on_cloud\time_kde_model.pkl'):
    with open(model_path, 'rb') as f:
        kde = pickle.load(f)
    
    def time_distribution(hour):
        # 转换输入为小时数值
        if isinstance(hour, str):
            h, m = map(float, hour.split(':'))
            hour = h + m/60
        elif hasattr(hour, 'hour'):  # 处理datetime对象
            hour = hour.hour + hour.minute/60
        
        # 处理24小时周期性问题（确保在0-24范围内）
        hour = np.clip(hour % 24, 0, 24)
        
        # 计算密度并转换为 float
        kde_result = kde.evaluate([hour])  # 可能返回 NumPy 数组
        density_value = float(kde_result[0]) * 3  # 提取单个 float 值
        return density_value
    
    return time_distribution

# 参数传入
class InputParam:
    def __init__(self, device_id, products, traffic_level, dist_type, variance_value, datarange_fro, datarange_to, time):
        self.device_id = device_id
        self.products = products
        self.traffic_level = traffic_level
        self.dist_type = dist_type
        self.variance_value = variance_value
        self.datarange_fro = datarange_fro
        self.datarange_to = datarange_to
        self.time = time

class DataGenerator(Thread):
    def __init__(self, input_param: InputParam, queue):#接受参数
        super().__init__()
        self.device_id = input_param.device_id
        self.products = input_param.products.split(',')  # 转成列表
        self.traffic = int(input_param.traffic_level)
        self.dist_type = input_param.dist_type
        self.variance_value = float(input_param.variance_value)
        self.datarange_fro = input_param.datarange_fro
        self.datarange_to = input_param.datarange_to
        self.time = input_param.time
        self.queue = queue
        self.avera = (int(input_param.datarange_fro) + int(input_param.datarange_to)) / 2
        self._running = True
        self.lock = Lock()
        self.multiplier_mu = 1  # 设定默认均值
        self.multiplier_sigma = 0.2  # 设定默认标准差

    def run(self): # 生成数据
        while self._running:
            data = {
                "timestamp": datetime.now().isoformat(),
                "device_id": self.device_id,
                "product": random.choice(self.products),
                "sales": self._generate_sales(),
                "traffic": self.traffic,
                "time": self.time
            }
            
            with self.lock:
                self.queue.put(data)
            
            time.sleep(random.randint(5, 15))  # 随机间隔

    def _use_time_kde_model(self):
        KDE_MODEL_PATH = 'time_kde_model.pkl'
        get_density = load_time_distribution(KDE_MODEL_PATH)
        hour = self.time
        density = get_density(hour)  # 确保 density 是 float
        base = density * self.traffic * 100
        # 生成系数
        coefficient = max(0, random.gauss(self.multiplier_mu, self.multiplier_sigma))
        
        return int(base * coefficient)

    def _generate_sales(self): # 生成销售数据

        # if self.dist_type == "正态分布":
        #     return max(0, int(random.gauss(self.avera, int(self.variance_value))))
        # elif self.dist_type == "泊松分布":
        #     return np.random.poisson(30)
        # elif self.dist_type == "随机分布":
        #     return random.randint(int(self.datarange_fro), int(self.datarange_to))
        
        return self._use_time_kde_model()
        # else:
        #     #return random.randint(int(self.datarange_fro), int(self.datarange_to))
        #     return -1
        # get_density = load_time_distribution()
        # time_random = random.randint(0, 23)
        # return load_time_distribution(time_random*self.traffic)

        # KDE_MODEL_PATH = 'time_kde_model.pkl'
        # # 加载分布函数（传入正确的模型路径）
        # get_density = load_time_distribution(KDE_MODEL_PATH)
    
        # # 生成时间随机数（示例逻辑，根据实际需求调整）
        # hour = np.random.uniform(0, 24)
    
        # # 计算该时间的概率密度，并结合流量系数生成销量
        # density = get_density(hour)
        # return int(density * self.traffic * 100)
        

    def stop(self):
        self._running = False


def main():
    # 创建 InputParam 实例
    input_param = InputParam(
        device_id="D001",
        products="Coke,Pepsi,Water",
        traffic_level="5",
        dist_type="normal",
        variance_value="5",
        datarange_fro="10",
        datarange_to="20",
        time="2:57"
    )

    # 创建 DataGenerator 实例
    q = Queue()
    generator = DataGenerator(input_param=input_param, queue=q)
    generator.start()

    try:
        while True:
            device_data = q.get()
            print(device_data)
    except KeyboardInterrupt:
        generator._running = False
        generator.join()


if __name__ == "__main__":
    main()