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
        # 产品到ID和单价的映射
        self.product_price_map = {
            1: 2,
            2: 3,
            3: 5,
            4: 7,
            5: 4,
            6: 3,
            7: 5,
            8: 12,
            9: 8,
            10: 5,
            11: 5
        }
        self.product_id_map = {
            "农夫山泉": 1,
            "可口可乐": 2,
            "东鹏特饮": 3,
            "乐事薯片青瓜味": 4,
            "卫龙大面筋": 5,
            "旺仔牛奶": 6,
            "红牛罐装": 7,
            "奥利奥巧克力夹心": 8,
            "雀巢咖啡瓶装": 9,
            "康师傅红烧牛肉面": 10,
            "维他柠檬茶": 11
        }

    def run(self):  # 生成数据
        while self._running:
            product_name = random.choice(self.products)
            product_id = self.product_id_map[product_name]
            quantity = random.randint(int(self.datarange_fro), int(self.datarange_to))
            total_price = self.product_price_map[product_id] * quantity  # 计算总价

            data = {
                "user_id": f"{random.randint(1, 999):03}",  # 生成001-999的user_id
                "product_id": product_id,
                "quantity": quantity,
                "total_price": total_price,  # 计算结果
                "created_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "vending_machine_id": f"{random.randint(1, 999):03}"  # 生成001-999的vending_machine_id
            }

            with self.lock:
                self.queue.put(data)

            time.sleep(0.01)  # 快速生成数据

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

            # 每生成1000条数据就保存一次到 JSON 文件
            if len(data_list) >= 1000:
                with open("generated_data.json", "w", encoding="utf-8") as f:
                    json.dump(data_list, f, ensure_ascii=False, indent=4)
                print("数据已保存到 generated_data.json 文件中")
                data_list = []  # 清空列表
    except KeyboardInterrupt:
        print("\n捕获到退出信号，正在停止线程并保存数据...")
        for generator in generators:
            generator.stop()
        for generator in generators:
            generator.join()

        # 保存剩余的数据到 JSON 文件
        if data_list:
            with open("generated_data_new.json", "w", encoding="utf-8") as f:
                json.dump(data_list, f, ensure_ascii=False, indent=4)
            print("剩余数据已保存到 generated_data.json 文件中")


if __name__ == "__main__":
    main()