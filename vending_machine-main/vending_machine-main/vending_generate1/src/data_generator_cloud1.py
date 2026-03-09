import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import traceback
import os

class InventoryManager:
    """库存管理系统类"""
    def __init__(self):
        self.machines = {f"VM{m:04d}": {"可乐":20, "橙汁":20, "咖啡":20, "矿泉水":20} 
                        for m in range(1, 1001)}
        self.operation_log = []
        self.error_log = []

    def process_transaction(self, machine_id, product, quantity):
        """处理交易并返回结果"""
        try:
            current_stock = self.machines[machine_id][product]
            
            if current_stock < quantity:
                adjusted_quantity = current_stock
                self.machines[machine_id][product] = 0
                status = "部分成交"
            else:
                adjusted_quantity = quantity
                remaining = current_stock - quantity
                self.machines[machine_id][product] = remaining
                status = "成交成功"
            
            self.operation_log.append({
                "machine_id": machine_id,
                "product": product,
                "quantity": quantity,
                "adjusted_quantity": adjusted_quantity,
                "status": status,
                "timestamp": datetime.now().isoformat()
            })
            
            return adjusted_quantity, remaining, status
        except KeyError as e:
            error_msg = f"[{datetime.now()}] 机器{machine_id}商品{product}不存在: {str(e)}"
            self.error_log.append(error_msg)
            return None
        except Exception as e:
            error_msg = f"[{datetime.now()}] 处理交易时发生错误: {str(e)}"
            self.error_log.append(error_msg)
            return None

def generate_sales_data(num_records=1000):
    """生成销售数据"""
    beverages = ["可乐", "橙汁", "咖啡", "矿泉水"]
    price_map = {"可乐":5.0, "橙汁":6.0, "咖啡":6.5, "矿泉水":2.5}
    payment_methods = ["现金", "信用卡", "移动支付", "储值卡"]
    membership_tiers = ["普通", "白银", "黄金", "钻石"]
    
    inventory = InventoryManager()
    user_pool = [f"UID{u:07d}" for u in np.random.randint(0, 9999999, num_records)]
    
    sales_data = []
    for _ in range(num_records):
        machine_id = f"VM{np.random.randint(1,1001):04d}"
        beverage = np.random.choice(beverages)
        quantity = np.random.randint(1, 5)
        
        result = inventory.process_transaction(machine_id, beverage, quantity)
        if result is None:
            continue
        
        actual_qty, remaining, status = result
        
        days_offset = np.random.randint(0, 365)
        sale_time = (datetime.now() - timedelta(days=days_offset)).strftime("%Y-%m-%d %H:%M")
        
        user_id = np.random.choice(user_pool)
        membership = np.random.choice(membership_tiers, p=[0.6,0.3,0.08,0.02])
        
        sales_record = {
            "流水号": len(sales_data) + 1,
            "售货机编号": machine_id,
            "销售时间": sale_time,
            "用户ID": user_id,
            "饮料种类": beverage,
            "请求数量": quantity,
            "实际销量": actual_qty,
            "剩余库存": remaining,
            "交易状态": status,
            "单价": price_map[beverage],
            "实收金额": round(price_map[beverage] * actual_qty, 2),
            "支付方式": np.random.choice(payment_methods),
            "会员等级": membership
        }
        sales_data.append(sales_record)
    
    inventory_df = pd.DataFrame.from_dict(inventory.machines, orient='index')
    inventory_df.index.name = '售货机编号'
    inventory_df = inventory_df.reset_index()
    inventory_df['总库存'] = inventory_df[["可乐", "橙汁", "咖啡", "矿泉水"]].sum(axis=1)
    
    return pd.DataFrame(sales_data), inventory_df, inventory

if __name__ == "__main__":
    try:
        # 定义输出目录（相对路径）
        output_dir = os.path.join("vending_generate1", "out_put")
        os.makedirs(output_dir, exist_ok=True)
        
        # 生成数据
        sales_df, inventory_df, inventory = generate_sales_data(1000)
        
        # 保存销售数据到Excel
        sales_path = os.path.join(output_dir, "sales_data.xlsx")
        sales_df.to_excel(sales_path, 
                         sheet_name='销售记录',
                         index=False,
                         engine='openpyxl')
        
        # 保存库存数据到Excel
        inventory_path = os.path.join(output_dir, "inventory_data.xlsx")
        inventory_df.to_excel(inventory_path, 
                             sheet_name='库存状态',
                             index=False,
                             engine='openpyxl')
        
        # 保存错误日志
        if inventory.error_log:
            error_log_path = os.path.join(output_dir, "error_log.txt")
            with open(error_log_path, "w") as f:
                f.write("\n".join(inventory.error_log))
        
        # 控制台输出验证信息
        print("\n=== 数据生成结果 ===")
        print(f"输出目录：{os.path.abspath(output_dir)}")
        print(f"生成文件列表：{os.listdir(output_dir)}")
        print(f"销售记录数：{len(sales_df)} 条（已保存至 sales_data.xlsx）")
        print(f"库存记录数：{len(inventory_df)} 条（已保存至 inventory_data.xlsx）")
        print(f"错误日志数：{len(inventory.error_log)} 条")
        
    except Exception as e:
        print(f"\n!! 发生严重错误: {str(e)}")
        traceback.print_exc()
        if 'inventory' in locals():
            error_log_path = os.path.join(output_dir, "error_log.txt")
            with open(error_log_path, "a") as f:
                f.write(f"\n\n[致命错误] {datetime.now()}\n")
                f.write(f"{str(e)}\n")
                f.write(traceback.format_exc())
                #test3
                