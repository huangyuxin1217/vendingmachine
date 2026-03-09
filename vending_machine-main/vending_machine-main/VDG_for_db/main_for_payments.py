import random
import time
from datetime import datetime, timedelta
from threading import Thread, Lock
from queue import Queue
import json

class OrderIDGenerator:
    """线程安全的订单号生成器（兼容INT类型）"""
    def __init__(self):
        self.epoch = datetime(2024, 1, 1)  # 自定义纪元时间
        self.counter = 0
        self.lock = Lock()
        self.current_day = (datetime.now() - self.epoch).days

    def generate(self):
        """生成唯一订单号（最大支持到2147483647）"""
        now = datetime.now()
        with self.lock:
            # 每天重置计数器
            if (now - self.epoch).days != self.current_day:
                self.current_day = (now - self.epoch).days
                self.counter = 0

            # ID结构：[3位天数][5位序列号]
            days_since_epoch = (now - self.epoch).days
            if days_since_epoch > 999:
                raise ValueError("超出天数范围，请调整纪元时间")

            if self.counter >= 99999:
                raise ValueError("当日订单量超过限额")

            self.counter += 1
            return days_since_epoch * 100000 + self.counter

class DataGenerator(Thread):
    def __init__(self, config, queue, id_generator):
        super().__init__()
        self.user_range = config['user_range']
        self.product_count = config['product_count']
        self.queue = queue
        self.id_generator = id_generator
        self._running = True

    def run(self):
        while self._running:
            try:
                data = {
                    "id": random.randint(1, self.product_count),
                    "users_id": random.randint(*self.user_range),
                    "order_id": self.id_generator.generate(),
                    "method": random.choice(["cash", "credit_card", "alipay", "wechat"]),
                    "amount": round(random.uniform(10, 50), 2),
                    "paid_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }

                self.queue.put(data)
                time.sleep(0.01)
            except ValueError as e:
                print(f"生成错误: {str(e)}")
                self.stop()

    def stop(self):
        self._running = False

def main():
    # 初始化共享组件
    id_generator = OrderIDGenerator()
    config = {
        "user_range": (1000, 9999),
        "product_count": 11  # 对应商品数量
    }

    q = Queue()
    generators = [DataGenerator(config, q, id_generator) for _ in range(4)]

    # 启动生成线程
    for gen in generators:
        gen.start()

    dataset = []
    try:
        while True:
            item = q.get()
            dataset.append(item)
            print(f"生成记录：{item}")
    except KeyboardInterrupt:
        print("\n停止生成...")
        for gen in generators:
            gen.stop()
        for gen in generators:
            gen.join()

        # 保存数据前验证INT范围
        valid_data = []
        for item in dataset:
            if item["order_id"] > 2147483647:
                print(f"超出INT范围：{item['order_id']}")
                continue
            valid_data.append(item)

        with open("payment_int.json", "w") as f:
            json.dump(valid_data, f, indent=2)
        print(f"有效数据已保存（{len(valid_data)}条）")

if __name__ == "__main__":
    main()