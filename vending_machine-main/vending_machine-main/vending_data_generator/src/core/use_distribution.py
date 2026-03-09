# use_distribution.py
import numpy as np
import pickle
import pandas as pd

def load_time_distribution(model_path='time_kde_model.pkl'):
    """加载KDE模型并返回一个可直接调用的分布函数"""
    with open(model_path, 'rb') as f:
        kde = pickle.load(f)
    
    def time_distribution(hour):
        """
        计算时间点的概率密度，支持多种输入格式：
        - 数值（如 23.5 表示23:30）
        - 字符串（如 "14:30"）
        - datetime对象（如 datetime.datetime.now()）
        """
        # 转换输入为小时数值
        if isinstance(hour, str):
            h, m = map(float, hour.split(':'))
            hour = h + m/60
        elif hasattr(hour, 'hour'):  # 处理datetime对象
            hour = hour.hour + hour.minute/60
        
        # 处理24小时周期性问题（确保在0-24范围内）
        hour = np.clip(hour % 24, 0, 24)
        
        # 计算密度（考虑镜像扩展的归一化因子3）
        return kde.evaluate(hour)[0] * 3
    
    return time_distribution

# # 示例用法
# if __name__ == "__main__":
#     # 加载分布函数
#     get_density = load_time_distribution()
    
#     # 计算不同格式的时间密度
#     print("上午10点密度:", get_density(10))          # 数值
#     print("下午3:30密度:", get_density("15:30"))     # 字符串
#     print("当前时间密度:", get_density(pd.Timestamp.now()))  # datetime对象