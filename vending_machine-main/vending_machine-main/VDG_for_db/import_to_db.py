import json
import pymysql
from datetime import datetime

# 数据库配置
DB_CONFIG = {
    "host": "localhost",  # 数据库地址
    "port": 3306,         # 数据库端口
    "user": "root",       # 数据库用户名
    "password": "vending",  # 数据库密码
    "database": "vending_mysql",  # 数据库名称
    "charset": "utf8mb4"
}

# 读取 JSON 文件并上传到数据库
def upload_json_to_db(json_file_path, table_name):
    # 连接到数据库
    try:
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        print("成功连接到数据库")
    except pymysql.MySQLError as e:
        print(f"数据库连接失败: {e}")
        return

    # 读取 JSON 文件
    try:
        with open(json_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not data:
                print(f"JSON 文件为空: {json_file_path}")
                return
            print(f"成功读取 JSON 文件: {json_file_path}, 包含 {len(data)} 条记录")
    except FileNotFoundError:
        print(f"未找到 JSON 文件: {json_file_path}")
        return
    except json.JSONDecodeError as e:
        print(f"JSON 文件解析失败: {e}")
        return

    # 插入数据到数据库
    insert_query = f"""
        INSERT INTO {table_name} 
        (id, user_id, product_id, quantity, total_price, created_at, vending_machine_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    try:
        for idx, item in enumerate(data, start=1):
            # 准备数据
            record = (
                idx,  # 自动生成的 ID
                int(item["user_id"]),
                int(item["product_id"]),
                int(item["quantity"]),
                float(item["total_price"]),
                datetime.strptime(item["created_at"], "%Y-%m-%d %H:%M:%S"),
                int(item["vending_machine_id"])
            )
            cursor.execute(insert_query, record)
            print(f"成功插入记录: {record}")

        # 提交事务
        connection.commit()
        print(f"成功插入 {len(data)} 条记录到表 {table_name}")
    except pymysql.MySQLError as e:
        connection.rollback()
        print(f"插入数据失败: {e}")
    finally:
        # 关闭数据库连接
        cursor.close()
        connection.close()
        print("数据库连接已关闭")

if __name__ == "__main__":
    # JSON 文件路径
    json_file_path = "generated_data_new.json"  # 替换为你的 JSON 文件路径

    # 数据库表名
    table_name = "orders"

    # 上传数据
    upload_json_to_db(json_file_path, table_name)