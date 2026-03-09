import csv
import json
import argparse

def csv_to_json(csv_file_path, json_file_path, delimiter=',', encoding='utf-8', convert_numeric=True):
    """
    将CSV文件转换为JSON格式
    
    参数:
        csv_file_path (str): CSV文件路径
        json_file_path (str): 输出JSON文件路径
        delimiter (str): CSV字段分隔符，默认逗号
        encoding (str): 文件编码，默认utf-8
        convert_numeric (bool): 是否自动转换数值类型，默认开启
    """
    # 用于存储转换后的数据
    data = []
    
    with open(csv_file_path, 'r', encoding=encoding) as csv_file:
        # 使用DictReader自动处理表头
        csv_reader = csv.DictReader(csv_file, delimiter=delimiter)
        
        for row in csv_reader:
            processed_row = {}
            for key, value in row.items():
                # 自动转换数值类型（如果启用）
                if convert_numeric:
                    try:
                        # 尝试转换为整数
                        processed_row[key] = int(value)
                    except ValueError:
                        try:
                            # 尝试转换为浮点数
                            processed_row[key] = float(value)
                        except ValueError:
                            # 保持字符串格式
                            processed_row[key] = value.strip()
                else:
                    processed_row[key] = value.strip()
            data.append(processed_row)
    
    # 写入JSON文件
    with open(json_file_path, 'w', encoding=encoding) as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)

if __name__ == '__main__':
    # 设置命令行参数
    parser = argparse.ArgumentParser(description='CSV转JSON工具')
    parser.add_argument('input', help='输入CSV文件路径')
    parser.add_argument('output', help='输出JSON文件路径')
    parser.add_argument('--delimiter', default=',', help='CSV分隔符（默认：逗号）')
    parser.add_argument('--encoding', default='utf-8', help='文件编码（默认：utf-8）')
    parser.add_argument('--no-convert', action='store_false', dest='convert', 
                        help='禁用自动数值类型转换')
    
    args = parser.parse_args()
    
    # 执行转换
    csv_to_json(
        csv_file_path=args.input,
        json_file_path=args.output,
        delimiter=args.delimiter,
        encoding=args.encoding,
        convert_numeric=args.convert
    )
    
    print(f'转换完成！已保存至 {args.output}')