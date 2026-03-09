import csv

# 参数配置区（按需修改）--------------------------------
csv_path = "data_processing/Summary table of raw data.csv"     # CSV文件路径
target_col = "商品详情"       # 目标列名（或列索引，见下方说明）
output_file = "data_processing/去重清单.txt"  # 输出文件路径
# ---------------------------------------------------

# 读取CSV并提取目标列
unique_items = set()
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    
    # 方式1：通过列名定位（推荐）
    header = next(reader)  # 读取标题行
    col_index = header.index(target_col)
    
    # 方式2：直接通过列索引定位（如果列名定位失败）
    # col_index = 12  # M列对应索引12（从0开始计数）
     
    # 提取数据
    for row in reader:
        if len(row) > col_index:  # 防止索引越界
            unique_items.add(row[col_index].strip())

# 写入TXT文件
with open(output_file, 'w', encoding='utf-8') as f:
    f.write("\n".join(sorted(unique_items, key=lambda x: x)))

print(f"去重完成！共找到 {len(unique_items)} 个唯一项，已保存至 {output_file}")