import random
import time
import json
from datetime import datetime
from threading import Thread, Lock
from queue import Queue

# 参数传入
class InputParam:
    def __init__(self, device_id, products, datarange_fro, datarange_to):
        self.device_id = device_id
        self.products = products
        self.datarange_fro = datarange_fro
        self.datarange_to = datarange_to

class DataGenerator(Thread):
    def __init__(self, input_param: InputParam, queue):  # 接受参数
        super().__init__()
        self.device_id = input_param.device_id
        self.products = input_param.products
        self.datarange_fro = input_param.datarange_fro
        self.datarange_to = input_param.datarange_to
        self.queue = queue
        self._running = True
        self.lock = Lock()

    def run(self):  # 生成数据
        while self._running:
            data = {
                "timestamp": datetime.now().isoformat(),
                "device_id": self.device_id,
                "product": random.choice(self.products),
                "sales": random.randint(int(self.datarange_fro), int(self.datarange_to)),
                "time": self._generate_random_time()
            }

            with self.lock:
                self.queue.put(data)

            time.sleep(0.01)  # 快速生成数据

    def _generate_random_time(self):
        hour = random.randint(0, 23)
        minute = random.randint(0, 59)
        return f"{hour:02}:{minute:02}"

    def stop(self):
        self._running = False


def main():
    # 固定产品列表
    products = [
        "农夫山泉", "可口可乐", "东鹏特饮", "乐事薯片青瓜味", "卫龙大面筋",
        "旺仔牛奶", "红牛罐装", "奥利奥巧克力夹心", "雀巢咖啡瓶装",
        "康师傅红烧牛肉面", "维他柠檬茶"
    ]

    # 创建 InputParam 实例
    input_param = InputParam(
        device_id="D001",
        products=products,
        datarange_fro="10",
        datarange_to="50"
    )

    # 创建共享队列
    q = Queue()

    # 创建多个 DataGenerator 实例
    num_threads = 16  # 设置线程数量
    generators = [DataGenerator(input_param=input_param, queue=q) for _ in range(num_threads)]

    # 启动所有线程
    for generator in generators:
        generator.start()

    data_list = []  # 用于存储生成的数据

    try:
        while True:
            device_data = q.get()
            data_list.append(device_data)
            print(device_data)  # 实时打印生成的数据
    except KeyboardInterrupt:
        print("\n捕获到退出信号，正在停止线程并保存数据...")
        for generator in generators:
            generator.stop()
        for generator in generators:
            generator.join()

        # 将数据写入 JSON 文件
        try:
            with open("generated_data.json", "w", encoding="utf-8") as f:
                json.dump(data_list, f, ensure_ascii=False, indent=4)
            print("数据已保存到 generated_data.json 文件中")
        except Exception as e:
            print(f"保存数据时发生错误: {e}")


if __name__ == "__main__":
    main()