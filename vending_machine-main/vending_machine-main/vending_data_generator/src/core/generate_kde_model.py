# generate_kde_model.py
import pandas as pd
import numpy as np
from scipy.stats import gaussian_kde
import pickle

def generate_and_save_model(csv_path, save_path='time_kde_model.pkl'):
    # 读取数据
    df = pd.read_csv(csv_path, encoding='gbk')
    
    # 处理时间列
    df['下单时间'] = pd.to_datetime(df['下单时间'], format='%Y/%m/%d %H:%M')
    df['hour'] = df['下单时间'].dt.hour + df['下单时间'].dt.minute / 60.0
    
    # 镜像数据解决边界问题
    data = df['hour'].values
    data_mirrored = np.concatenate([data - 24, data, data + 24])
    
    # 训练KDE模型
    kde = gaussian_kde(data_mirrored)
    
    # 保存模型
    with open(save_path, 'wb') as f:
        pickle.dump(kde, f)
    print(f"模型已保存至: {save_path}")

if __name__ == "__main__":
    generate_and_save_model(
        csv_path=r'E:\vending_machine\vending_data_generator\src\core\sales.csv',
        save_path='time_kde_model.pkl'
    )