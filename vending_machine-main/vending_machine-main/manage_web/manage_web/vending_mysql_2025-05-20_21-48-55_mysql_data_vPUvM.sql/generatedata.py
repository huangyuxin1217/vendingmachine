import mysql.connector
from datetime import datetime, timedelta
import random

# 数据库连接配置
db_config = {
    'host': '47.108.141.135',
    'user': 'vending_machine_manage',
    'password': 'XwX2eLWh8TL72Ndf',
    'database': 'vending_machine_manage'
}

# 商品种类（固定为图中列出的商品）
product_types = [
    {"name": "农夫山泉", "price": 2.50, "category": "饮料"},
    {"name": "可口可乐", "price": 3.00, "category": "饮料"},
    {"name": "东鹏特饮", "price": 5.00, "category": "饮料"},
    {"name": "乐事薯片青瓜味", "price": 6.50, "category": "零食"},
    {"name": "卫龙大面筋", "price": 4.00, "category": "零食"},
    {"name": "旺仔牛奶", "price": 5.50, "category": "饮料"},
    {"name": "红牛罐装", "price": 7.00, "category": "饮料"},
    {"name": "奥利奥巧克力夹心", "price": 8.00, "category": "零食"},
    {"name": "雀巢咖啡瓶装", "price": 6.00, "category": "饮料"},
    {"name": "康师傅红烧牛肉面", "price": 4.50, "category": "方便食品"},
    {"name": "维他柠檬茶", "price": 3.50, "category": "饮料"}
]

# 连接到数据库
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

# 清空数据库表的函数
def clear_data():
    tables = ['payments', 'orders', 'inventory_logs', 'sales_statistics', 'operation_logs', 
              'vending_machines', 'products', 'users']
    for table in tables:
        cursor.execute(f"DELETE FROM {table}")
        cursor.execute(f"ALTER TABLE {table} AUTO_INCREMENT = 1")
    conn.commit()
    print("所有表数据已清空！")

# 随机生成数据的函数
def generate_random_data():
    # 用户数据
    users = []
    operation_logs = []
    for i in range(1, 1001):  # 生成 1000 个用户
        username = f'user_{i}'
        password = f'password_{i}'
        balance = round(random.uniform(100, 1000), 2)
        role = 'user'
        status = 'active'
        created_at = datetime.now() - timedelta(days=random.randint(0, 365))
        users.append((username, password, balance, role, status, created_at))

        # 记录操作日志
        operation_logs.append((
            1,  # 假设管理员ID为1
            '新增用户',
            '用户',
            i,  # 用户ID
            created_at
        ))

    # 商品数据
    products = []
    inventory_logs = []
    for i, product in enumerate(product_types, start=1):
        stock = random.randint(50, 500)
        safe_stock = random.randint(10, 50)
        created_at = datetime.now() - timedelta(days=random.randint(0, 30))
        products.append((
            product['name'], product['price'], stock, safe_stock, product['category'],
            f"{product['name']}的描述", f"https://example.com/product_{i}.jpg", '上架', created_at
        ))

        # 记录补货日志
        inventory_logs.append((
            i,  # 商品ID
            random.randint(1, 100),  # 随机售货机ID
            '补货',
            stock,
            1,  # 假设操作人ID为1
            created_at
        ))

    # 售货机数据
    vending_machines = [
        (f'售货机_{i}', f'位置_{i}', random.choice(['在线', '离线', '故障', '维护中']),
         round(random.uniform(15, 30), 2), round(random.uniform(40, 70), 2),
         datetime.now() - timedelta(days=random.randint(0, 30)),
         datetime.now() - timedelta(days=random.randint(0, 30)))
        for i in range(1, 101)  # 生成 100 台售货机
    ]

    # 订单数据
    orders = []
    payments = []
    for i in range(1, 5001):  # 生成 5000 个订单
        user_id = random.randint(1, 1000)
        product_id = random.randint(1, len(product_types))
        vending_machine_id = random.randint(1, 100)
        quantity = random.randint(1, 3)
        product_price = product_types[product_id - 1]['price']
        total_price = round(quantity * product_price, 2)

        # 确保 80% 的订单金额不超过 10 元
        if random.random() < 0.8 and total_price > 10:
            quantity = max(1, int(10 // product_price))
            total_price = round(quantity * product_price, 2)

        status = random.choice(['待支付', '已支付', '已完成', '已取消'])
        created_at = datetime.now() - timedelta(days=random.randint(0, 30))
        orders.append((
            f'ORD_{i:05d}', user_id, product_id, vending_machine_id, quantity, total_price,
            status, random.choice(['微信', '支付宝', None]),
            created_at if status in ['已支付', '已完成'] else None,
            created_at if status == '已完成' else None,
            created_at if status == '已取消' else None,
            created_at
        ))

        # 如果订单已支付，生成支付记录
        if status in ['已支付', '已完成']:
            payments.append((
                i, total_price, random.choice(['微信', '支付宝']), created_at
            ))

    # 销售统计数据
    sales_statistics = []
    for i in range(1, 101):  # 假设有 100 台售货机
        for product_id in range(1, len(product_types) + 1):  # 遍历所有商品
            for day_offset in range(30):  # 生成最近 30 天的销售数据
                date = datetime.now() - timedelta(days=day_offset)
                sales_quantity = random.randint(0, 50)
                sales_amount = sales_quantity * product_types[product_id - 1]['price']
                sales_statistics.append((
                    date.date(), i, product_id, sales_quantity, round(sales_amount, 2)
                ))

    return users, products, vending_machines, orders, payments, sales_statistics, operation_logs, inventory_logs

# 批量插入数据的函数
def insert_data():
    users, products, vending_machines, orders, payments, sales_statistics, operation_logs, inventory_logs = generate_random_data()

    # 插入用户数据
    cursor.executemany("""
        INSERT INTO users (username, password, balance, role, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, users)

    # 插入商品数据
    cursor.executemany("""
        INSERT INTO products (name, price, stock, safe_stock, category, description, image_url, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, products)

    # 插入售货机数据
    cursor.executemany("""
        INSERT INTO vending_machines (name, location, status, temperature, humidity, last_online, last_maintenance)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, vending_machines)

    # 插入订单数据
    cursor.executemany("""
        INSERT INTO orders (order_number, user_id, product_id, vending_machine_id, quantity, total_price, status, payment_method, paid_at, completed_at, cancelled_at, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, orders)

    # 插入支付数据
    cursor.executemany("""
        INSERT INTO payments (order_id, amount, method, paid_at)
        VALUES (%s, %s, %s, %s)
    """, payments)

    # 插入销售统计数据
    cursor.executemany("""
        INSERT INTO sales_statistics (date, vending_machine_id, product_id, sales_quantity, sales_amount)
        VALUES (%s, %s, %s, %s, %s)
    """, sales_statistics)

    # 插入操作日志数据
    cursor.executemany("""
        INSERT INTO operation_logs (admin_id, action, target_type, target_id, created_at)
        VALUES (%s, %s, %s, %s, %s)
    """, operation_logs)

    # 插入库存日志数据
    cursor.executemany("""
        INSERT INTO inventory_logs (product_id, vending_machine_id, action, quantity, operator_id, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, inventory_logs)

    # 提交事务
    conn.commit()
    print("批量数据插入成功！")

# 主程序
try:
    clear_data()  # 清空原有数据
    insert_data()  # 插入新数据
except mysql.connector.Error as err:
    print(f"数据插入失败: {err}")
finally:
    cursor.close()
    conn.close()