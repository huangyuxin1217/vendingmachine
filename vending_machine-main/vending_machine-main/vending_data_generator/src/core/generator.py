# generator.py
import random
import time
from threading import Lock
from datetime import datetime
from threading import Thread
import numpy as np
from core.use_distribution import load_time_distribution

class DataGenerator(Thread):
    def __init__(self, device_id, products, traffic_level, dist_type, variance_value, datarange_fro, datarange_to, time, queue):#接受参数
        super().__init__()
        self.device_id = device_id
        self.products = products.split(',')
        self.traffic = traffic_level
        self.dist_type = dist_type
        self.variance_value = variance_value
        self.datarange_fro = datarange_fro
        self.datarange_to = datarange_to
        self.time = time
        self.queue = queue
        self.avera = (int(datarange_fro) + int(datarange_to)) / 2
        self._running = True
        self.lock = Lock()

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

    # def _use_time_kde_model(self):
    #     KDE_MODEL_PATH = 'time_kde_model.pkl'
    #     # 加载分布函数（传入正确的模型路径）
    #     get_density = load_time_distribution(KDE_MODEL_PATH)
    #     # 获取时间
    #     hour = self.time
    #     # 计算该时间的概率密度，并结合流量系数生成销量
    #     density = get_density(hour)
    #     return int(density * self.traffic * 100)

    def _use_time_kde_model(self):
        KDE_MODEL_PATH = 'time_kde_model.pkl'
        get_density = load_time_distribution(KDE_MODEL_PATH)
        hour = self.time
        density = get_density(hour)
        base = density * self.traffic * 100

        # 根据乘数分布生成系数
        if self.multiplier_dist_type == "正态分布":
            # 使用正态分布参数生成系数，确保非负
            coefficient = max(0, random.gauss(self.multiplier_mu, self.multiplier_sigma))
        elif self.multiplier_dist_type == "泊松分布":
            # 使用泊松分布参数生成系数
            coefficient = np.random.poisson(self.multiplier_lambda)
        elif self.multiplier_dist_type == "随机分布":
            # 使用均匀分布生成系数
            coefficient = random.uniform(self.multiplier_min, self.multiplier_max)
        else:
            # 默认无乘数效应
            coefficient = 1

        return int(base * coefficient)

    def _generate_sales(self): # 生成销售数据

        if self.dist_type == "正态分布":
            return max(0, int(random.gauss(self.avera, int(self.variance_value))))
        elif self.dist_type == "泊松分布":
            return np.random.poisson(30)
        elif self.dist_type == "随机分布":
            return random.randint(int(self.datarange_fro), int(self.datarange_to))
       
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