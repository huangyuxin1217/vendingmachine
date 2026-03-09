# logger.py
import logging

def setup_logger():
    logger = logging.getLogger("VendingLogger")
    logger.setLevel(logging.INFO)
    
    # 文件处理器
    file_handler = logging.FileHandler('generator.log')
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    ))
    
    # 控制台处理器
    console_handler = logging.StreamHandler()
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    return logger