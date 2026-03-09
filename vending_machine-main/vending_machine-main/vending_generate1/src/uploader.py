import pandas as pd
import requests
import os

def excel_to_json(excel_path, json_path):
    # 处理Windows反斜杠路径（兼容Linux）
    excel_path = os.path.normpath(excel_path)
    json_path = os.path.normpath(json_path)
    
    # 读取Excel并转换为JSON
    df = pd.read_excel(excel_path, engine='openpyxl')  # 必须指定engine
    json_data = df.to_json(orient='records', indent=4, force_ascii=False)
    
    # 保存JSON文件（UTF-8编码避免中文乱码）
    with open(json_path, 'w', encoding='utf-8') as f:
        f.write(json_data)
    return json_path

def upload_json(json_path, server_url):
    with open(json_path, 'rb') as f:
        # 提取文件名（兼容Windows/Linux路径）
        filename = os.path.basename(json_path)
        files = {'file': (filename, f, 'application/json')}
        response = requests.post(server_url, files=files)
    print(f"状态码：{response.status_code}\n响应内容：{response.json()}")

if __name__ == '__main__':
    # 配置路径（无需手动修改斜杠）
    EXCEL_PATH = r'vending_generate1/out_put/inventory_data.xlsx'  # 原始Excel路径
    JSON_PATH = 'inventory_data.json'  # 生成的JSON文件名
    
    # 执行转换并上传
    json_file = excel_to_json(EXCEL_PATH, JSON_PATH)
    SERVER_URL = 'http://47.108.141.135:5001/upload'  # 替换为你的服务器地址
    upload_json(json_file, SERVER_URL)