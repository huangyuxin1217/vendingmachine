import random
import time
import json
from datetime import datetime
from threading import Thread, Lock
from queue import Queue


class StockGenerator(Thread):
    def __init__(self, products, queue):
        super().__init__()
        self.products = products
        self.queue = queue
        self._running = True
        self.lock = Lock()

    def run(self):
        while self._running:
            stock_data = {
                "timestamp": datetime.now().isoformat(),
                "stock": {product: random.randint(5, 50) for product in self.products}
            }

            with self.lock:
                self.queue.put(stock_data)

            time.sleep(1)  # 每秒生成一次库存数据

    def stop(self):
        self._running = False


def main():
    # 固定产品列表
    products = [
        "农夫山泉", "可口可乐", "东鹏特饮", "乐事薯片青瓜味", "卫龙大面筋",
        "旺仔牛奶", "红牛罐装", "奥利奥巧克力夹心", "雀巢咖啡瓶装",
        "康师傅红烧牛肉面", "维他柠檬茶"
    ]

    # 创建共享队列
    stock_queue = Queue()

    # 创建多个 StockGenerator 实例
    num_threads = 4  # 设置线程数量
    stock_generators = [StockGenerator(products, stock_queue) for _ in range(num_threads)]

    # 启动所有线程
    for generator in stock_generators:
        generator.start()

    stock_data_list = []  # 用于存储生成的库存数据

    try:
        while True:
            stock_data = stock_queue.get()
            stock_data_list.append(stock_data)
            print(stock_data)  # 实时打印生成的库存数据
    except KeyboardInterrupt:
        print("\n捕获到退出信号，正在停止线程并保存数据...")
        for generator in stock_generators:
            generator.stop()
        for generator in stock_generators:
            generator.join()

        # 将数据写入 JSON 文件
        try:
            with open("generated_stock_data.json", "w", encoding="utf-8") as f:
                json.dump(stock_data_list, f, ensure_ascii=False, indent=4)
            print("库存数据已保存到 generated_stock_data.json 文件中")
        except Exception as e:
            print(f"保存库存数据时发生错误: {e}")


if __name__ == "__main__":
    main()