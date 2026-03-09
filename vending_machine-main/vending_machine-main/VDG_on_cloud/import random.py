import random
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
        stock_data = {
            "timestamp": datetime.now().isoformat(),
            "stock": {product: random.randint(5, 50) for product in self.products}
        }

        with self.lock:
            self.queue.put(stock_data)

        self._running = False  # 生成一次数据后停止运行


def main():
    # 固定产品列表
    products = [
        "农夫山泉", "可口可乐", "东鹏特饮", "乐事薯片青瓜味", "卫龙大面筋",
        "旺仔牛奶", "红牛罐装", "奥利奥巧克力夹心", "雀巢咖啡瓶装",
        "康师傅红烧牛肉面", "维他柠檬茶"
    ]

    # 创建共享队列
    stock_queue = Queue()

    # 创建一个 StockGenerator 实例
    stock_generator = StockGenerator(products, stock_queue)

    # 启动线程
    stock_generator.start()

    # 等待线程完成
    stock_generator.join()

    # 获取生成的数据
    stock_data = stock_queue.get()

    # 将数据写入 JSON 文件
    try:
        with open("generated_stock_data.json", "w", encoding="utf-8") as f:
            json.dump(stock_data, f, ensure_ascii=False, indent=4)
        print("库存数据已保存到 generated_stock_data.json 文件中")
    except Exception as e:
        print(f"保存库存数据时发生错误: {e}")


if __name__ == "__main__":
    main()