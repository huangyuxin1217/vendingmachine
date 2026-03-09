import pandas as pd

# 目标商品列表（需与实际数据中的名称完全匹配）
target_products = [
    "农夫山泉550X1", "可口可乐X1", "东鹏特饮X1", "乐事薯片青瓜味X1",
    "卫龙大面筋X1", "旺仔牛奶X1", "红牛罐装X1", "奥利奥巧克力夹心X1",
    "雀巢咖啡瓶装X1", "康师傅红烧牛肉面X1", "维他柠檬茶500X1"
]

# 读取原始数据
df = pd.read_csv("data_processing/database of raw data.csv")

# 筛选包含目标商品的行
filtered_df = df[df["商品详情"].isin(target_products)]

# 保存为新CSV
filtered_df.to_csv("filtered_products.csv", index=False)