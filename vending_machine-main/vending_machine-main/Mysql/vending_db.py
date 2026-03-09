# vending_db.py
import pymysql
from dotenv import load_dotenv
import os
import logging
from datetime import datetime
import json  # 新增导入模块

class VendingDB:
    def __init__(self):
        load_dotenv()
        self.conn = None
        self._connect()
        
    def _connect(self):
        """使用 TCP/IP 连接以支持 Windows 系统"""
        try:
            self.conn = pymysql.connect(
                host=os.getenv('DB_HOST', '127.0.0.1'),  # 默认使用本地地址
                port=int(os.getenv('DB_PORT', 3306)),    # 默认 MySQL 端口
                user=os.getenv('DB_USER'),
                password=os.getenv('DB_PASSWORD'),
                db='vending_db',
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor
            )
            logging.info("成功通过 TCP/IP 连接数据库")
        except pymysql.MySQLError as e:
            logging.error(f"连接失败: {e}")
            raise

    def insert_sales(self, data):
        """批量插入优化"""
        sql = """INSERT INTO vending_sales 
                (device_id, product, sales_quantity, transaction_time)
                VALUES (%s, %s, %s, %s)"""
        try:
            with self.conn.cursor() as cursor:
                cursor.executemany(sql, data)
                self.conn.commit()
                return cursor.rowcount
        except pymysql.Error as e:
            self.conn.rollback()
            logging.error(f"插入失败: {e}")
            return 0

    def get_daily_report(self, date):
        """每日销售报告"""
        sql = """SELECT 
                device_id,
                product,
                SUM(sales_quantity) AS total_sales,
                COUNT(*) AS transactions
            FROM vending_sales
            WHERE DATE(transaction_time) = %s
            GROUP BY device_id, product
            WITH ROLLUP"""
        
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(sql, (date,))
                return cursor.fetchall()
        except pymysql.Error as e:
            logging.error(f"查询失败: {e}")
            return []

    def close(self):
        if self.conn:
            self.conn.close()
            logging.info("数据库连接已关闭")

# 使用示例
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # 初始化数据库对象
    db = VendingDB()
    
    # 从 JSON 文件读取数据
    json_file_path = "Mysql/generated_data.json"  # 替换为你的 JSON 文件路径
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
            logging.debug(f"读取的原始数据: {raw_data}")
            
            # 处理 JSON 数据，适配数据库字段
            test_data = []
            for item in raw_data:
                try:
                    # 将 timestamp 和 time 组合成 transaction_time
                    transaction_time = f"{item['timestamp'][:10]} {item['time']}:00"
                    test_data.append((
                        item["device_id"],
                        item["product"],
                        item["sales"],
                        transaction_time
                    ))
                except KeyError as e:
                    logging.warning(f"记录缺少字段 {e}，跳过: {item}")
        
        # 批量插入
        inserted = db.insert_sales(test_data)
        logging.info(f"成功插入 {inserted} 条记录")
        
        # 生成日报表
        report = db.get_daily_report('2025-04-14')
        for row in report:
            print(f"{row['device_id']} - {row['product']}: {row['total_sales']}件")
    except FileNotFoundError:
        logging.error(f"未找到文件: {json_file_path}")
    except json.JSONDecodeError as e:
        logging.error(f"JSON 文件解析失败: {e}")
    finally:
        db.close()