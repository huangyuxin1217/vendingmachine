from flask import Flask, request, jsonify
import hashlib
import time
import random
import string
import secrets
from datetime import datetime
from werkzeug.exceptions import BadRequest
from threading import Lock
from flask_cors import CORS
import json
import pymysql
from pymysql.cursors import DictCursor

app = Flask(__name__)
CORS(app)

# ================== 全局变量 ==================
tickets = {}
tokens = {}
device_lock = Lock()
processed_requests = {}
request_lock = Lock()

DEVICES = {
    "CQUCHX0503001": {
        "secret": "lAJIOxHiUyp2GuoN",
        "status": "正常运行",
        "products": [
            {"name": "可口可乐", "price": 3.5, "stock": 15, "slot": "A01", "category": "饮料"},
            {"name": "乐事薯片", "price": 5.0, "stock": 8, "slot": "B01", "category": "零食"}
        ]
    },
    "CQUCHX0503002": {
        "secret": "oIzUqhuNgFJMOkCL",
        "status": "正常运行",
        "products": [
            {"name": "可口可乐", "price": 3.5, "stock": 15, "slot": "A01", "category": "饮料"},
            {"name": "乐事薯片", "price": 5.0, "stock": 8, "slot": "B01", "category": "零食"}
        ]
    },
    "CQUCHX0503003": {
        "secret": "0piWBoxFYNyOKECX",
        "status": "正常运行",
        "products": [
            {"name": "可口可乐", "price": 3.5, "stock": 15, "slot": "A01", "category": "饮料"},
            {"name": "乐事薯片", "price": 5.0, "stock": 8, "slot": "B01", "category": "零食"}
        ]
    },
    "CQUCHX0503004": {
        "secret": "tlqbV10QkEOo5yAc",
        "status": "正常运行",
        "products": [
            {"name": "可口可乐", "price": 3.5, "stock": 15, "slot": "A01", "category": "饮料"},
            {"name": "乐事薯片", "price": 5.0, "stock": 8, "slot": "B01", "category": "零食"}
        ]
    },
    "CQUCHX0503005": {
        "secret": "xJZ4oclUgQWHs0FB",
        "status": "正常运行",
        "products": [
            {"name": "可口可乐", "price": 3.5, "stock": 15, "slot": "A01", "category": "饮料"},
            {"name": "乐事薯片", "price": 5.0, "stock": 8, "slot": "B01", "category": "零食"}
        ]
    },
    "CQUCHX0503006": {
        "secret": "smEtIJoej1NFbCwU",
        "status": "正常运行",
        "products": [
            {"name": "可口可乐", "price": 3.5, "stock": 15, "slot": "A01", "category": "饮料"},
            {"name": "乐事薯片", "price": 5.0, "stock": 8, "slot": "B01", "category": "零食"}
        ]
    },
    "CQUCHX0503007": {
        "secret": "FaSP6l8OKMysXuTe",
        "status": "正常运行",
        "products": [
            {"name": "可口可乐", "price": 3.5, "stock": 15, "slot": "A01", "category": "饮料"},
            {"name": "乐事薯片", "price": 5.0, "stock": 8, "slot": "B01", "category": "零食"}
        ]
    },
    "CQUCHX0503008": {
        "secret": "ZbOfMLvqjxA4GsBH",
        "status": "正常运行",
        "products": [
            {"name": "可口可乐", "price": 3.5, "stock": 15, "slot": "A01", "category": "饮料"},
            {"name": "乐事薯片", "price": 5.0, "stock": 8, "slot": "B01", "category": "零食"}
        ]
    },
    "CQUCHX0503009": {
        "secret": "DY1loibvZjwW4xyq",
        "status": "正常运行",
        "products": [
            {"name": "可口可乐", "price": 3.5, "stock": 15, "slot": "A01", "category": "饮料"},
            {"name": "乐事薯片", "price": 5.0, "stock": 8, "slot": "B01", "category": "零食"}
        ]
    },
    "CQUCHX0503010": {
        "secret": "caMrEAgOV3XL2z7I",
        "status": "正常运行",
        "products": [
            {"name": "可口可乐", "price": 3.5, "stock": 15, "slot": "A01", "category": "饮料"},
            {"name": "乐事薯片", "price": 5.0, "stock": 8, "slot": "B01", "category": "零食"}
        ]
    }
}

# ================== 工具函数 ==================
def generate_random_string(length=16):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def calculate_signature(data):
    return hashlib.md5(data.encode()).hexdigest()

# ================== 接口路由 ==================
@app.route('/get_ticket', methods=['POST'])
def get_ticket():
    device_id = request.json.get('deviceId')
    device_info = DEVICES.get(device_id)
    
    # 检查设备是否存在
    if not device_info:
        return jsonify({"error": "Invalid deviceId"}), 400
    
    # 检查设备状态
    if device_info["status"] != "正常运行":
        return jsonify({"error": "Device is not operational"}), 403
    
    secret = device_info["secret"]
    ticket = generate_random_string()
    signature = calculate_signature(ticket + device_id + secret)
    
    # 存储 Ticket 信息
    tickets[ticket] = {
        "device_id": device_id,
        "signature": signature,
        "expires_at": time.time() + 120
    }
    
    return jsonify({"ticket": ticket, "signature": signature})

@app.route('/get_token', methods=['POST'])
def get_token():
    data = request.json
    device_id = data.get('deviceId')
    client_timestamp = data.get('timestamp')
    signature = data.get('Signature')
    ticket = data.get('Ticket')

    # 1. 检查设备是否存在
    device_info = DEVICES.get(device_id)
    if not device_info:
        return jsonify({"error": "Invalid deviceId"}), 400
    
    # 2. 检查设备状态
    if device_info["status"] != "正常运行":
        return jsonify({"error": "Device is not operational"}), 403
    
    secret = device_info["secret"]

    # 3. 验证时间戳
    server_time = time.time()
    if abs(server_time - client_timestamp) > 300:
        return jsonify({"error": "Invalid timestamp"}), 400

    # 4. 检查 Ticket 是否存在
    if ticket not in tickets:
        return jsonify({"error": "Invalid Ticket"}), 400

    # 5. 检查 Ticket 是否过期
    if time.time() > tickets[ticket]["expires_at"]:
        return jsonify({"error": "Ticket expired"}), 400

    # 6. 验证签名
    expected_data = f"{ticket}{device_id}{secret}{client_timestamp}"
    expected_signature = calculate_signature(expected_data)
    if signature != expected_signature:
        return jsonify({"error": "Invalid Signature"}), 400

    # 7. 生成 Token
    token = generate_random_string()
    tokens[token] = {
        "device_id": device_id,
        "expires_at": time.time() + 7200
    }

    return jsonify({
        "token": token,
        "expires_in": 7200,
        "device_id": device_id
    })

@app.route('/upload_data', methods=['POST'])
def upload_data():
    data = request.json
    device_id = data.get('deviceId')
    token = data.get('token')
    business_data = data.get('business_data')
    request_id = data.get('request_id')
    if not request_id:
        return jsonify({"error": "Missing request_id"}), 400
    with request_lock:
        if request_id in processed_requests:
            return jsonify(processed_requests[request_id])

    # 1. 检查 Token 是否存在
    token_info = tokens.get(token)
    if not token_info:
        return jsonify({"error": "Invalid Token"}), 400

    # 2. 检查设备ID是否匹配
    if token_info["device_id"] != device_id:
        return jsonify({"error": "Device ID mismatch"}), 400

    # 3. 检查 Token 是否过期
    if time.time() > token_info["expires_at"]:
        return jsonify({"error": "Token expired"}), 400

    # 4. 处理业务数据
    try:
        # 模拟处理耗时
        time.sleep(0.5)
        
        # 存储处理结果（新增）
        response = {
            "status": "success",
            "request_id": request_id,
            "data_received": business_data
        }
        
        with request_lock:
            processed_requests[request_id] = response
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "request_id": request_id,
            "message": str(e)
        }), 500

@app.route('/refresh_token', methods=['POST'])
def refresh_token():
    data = request.json
    device_id = data.get('deviceId')
    signature = data.get('Signature')
    token = data.get('token')

    # 1. 参数校验
    required_fields = ['deviceId', 'Signature', 'token']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required field(s)"}), 400

    # 2. 检查 Token 是否存在
    if token not in tokens:
        return jsonify({"error": "Invalid Token"}), 400

    # 3. 获取设备信息
    device_info = DEVICES.get(device_id)
    if not device_info:
        return jsonify({"error": "Device not found"}), 404

    # 4. 检查设备状态
    if device_info["status"] != "正常运行":
        return jsonify({"error": "Device is not operational"}), 403

    # 5. 验证签名
    secret = device_info["secret"]
    expected_signature = calculate_signature(f"{token}{device_id}{secret}")
    if signature != expected_signature:
        return jsonify({"error": "Invalid Signature"}), 400

    # 6. 线程安全操作
    with device_lock:
        # 生成新 Token
        new_token = generate_random_string()
        tokens[new_token] = {
            "device_id": device_id,
            "expires_at": time.time() + 7200
        }

        # 删除旧 Token
        del tokens[token]

    return jsonify({
        "token": new_token,
        "expires_in": 7200,
        "device_id": device_id
    })

@app.route('/register_device', methods=['POST'])
def register_device():
    data = request.json
    device_id = data.get('device_id')
    admin_token = data.get('admin_token', "")

    # 1. 校验必填字段
    if not device_id:
        return jsonify({"error": "Missing device_id"}), 400

    # 2. 权限验证
    if admin_token != "SUPER_SECRET_ADMIN_KEY":
        return jsonify({"error": "Unauthorized"}), 401

    # 3. 线程安全操作
    with device_lock:
        if device_id in DEVICES:
            return jsonify({"error": "Device ID already exists"}), 409

        # 生成密钥
        secret = secrets.token_urlsafe(16)
        DEVICES[device_id] = {
            "secret": secret,
            "status": "正常运行"
        }

    return jsonify({
        "device_id": device_id,
        "secret": secret,
        "status": "正常运行",
        "message": "Device registered successfully"
    }), 201

@app.route('/delete_device', methods=['DELETE'])
def delete_device():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON body required"}), 400

        device_id = data.get('device_id')
        admin_token = data.get('admin_token', "")

        # 1. 校验必填字段
        if not device_id:
            return jsonify({"error": "Missing device_id"}), 400

        # 2. 权限验证
        if admin_token != "SUPER_SECRET_ADMIN_KEY":
            return jsonify({"error": "Unauthorized"}), 401

        # 3. 线程安全操作
        with device_lock:
            if device_id not in DEVICES:
                return jsonify({"error": "Device not found"}), 404

            # 删除设备
            del DEVICES[device_id]

            # 清理关联 Token
            global tokens
            tokens = {
                t: info for t, info in tokens.items() 
                if info["device_id"] != device_id
            }

        return jsonify({
            "message": "Device deleted successfully",
            "device_id": device_id
        }), 200

    except BadRequest:
        return jsonify({"error": "Invalid JSON"}), 400
        
@app.route('/devices/<device_id>/products', methods=['GET'])
def get_device_products(device_id):
    """获取设备商品列表"""
    device_info = DEVICES.get(device_id)
    if not device_info:
        return jsonify({"code": 404, "message": "设备不存在"}), 404
    
    return jsonify({
        "code": 200,
        "data": {
            "device_id": device_id,
            "products": device_info["products"]
        }
    })

@app.route('/devices/<device_id>/stock', methods=['POST'])
def update_product_stock(device_id):
    """更新商品库存"""
    data = request.json
    # 权限验证
    if data.get('admin_token') != "SUPER_SECRET_ADMIN_KEY":
        return jsonify({"code": 403, "message": "权限不足"}), 403
    
    required_fields = ['slot', 'operation', 'quantity']
    if not all(field in data for field in required_fields):
        return jsonify({"code": 400, "message": "缺少必要参数"}), 400

    with device_lock:
        device_info = DEVICES.get(device_id)
        if not device_info:
            return jsonify({"code": 404, "message": "设备不存在"}), 404
        
        # 查找对应货道
        target_product = next(
            (p for p in device_info["products"] if p["slot"] == data['slot']), 
            None
        )
        
        if not target_product:
            return jsonify({"code": 404, "message": "货道不存在"}), 404
        
        # 执行库存操作
        if data['operation'] == 'restock':
            target_product["stock"] += data['quantity']
        elif data['operation'] == 'sale':
            target_product["stock"] = max(0, target_product["stock"] - data['quantity'])
        else:
            return jsonify({"code": 400, "message": "无效操作类型"}), 400

    return jsonify({
        "code": 200,
        "data": {
            "device_id": device_id,
            "slot": data['slot'],
            "new_stock": target_product["stock"]
        }
    })

@app.route('/devices/<device_id>/slots', methods=['GET'])
def get_slot_status(device_id):
    """货道状态监控"""
    device_info = DEVICES.get(device_id)
    if not device_info:
        return jsonify({"code": 404, "message": "设备不存在"}), 404
    
    slots = [{
        "slot": p["slot"],
        "status": "正常" if p["stock"] > 0 else "缺货",
        "last_restock": datetime.now().isoformat()  # 可扩展补货时间记录
    } for p in device_info["products"]]
    
    return jsonify({
        "code": 200,
        "data": {
            "device_id": device_id,
            "slots": slots
        }
    })


@app.route('/update_status', methods=['POST'])
def update_device_status():
    data = request.json
    device_id = data.get('device_id')
    new_status = data.get('status')
    admin_token = data.get('admin_token', "")

    # 1. 权限验证
    if admin_token != "SUPER_SECRET_ADMIN_KEY":
        return jsonify({"error": "Unauthorized"}), 401

    # 2. 检查设备是否存在
    device_info = DEVICES.get(device_id)
    if not device_info:
        return jsonify({"error": "Device not found"}), 404

    # 3. 验证状态合法性
    allowed_statuses = ["正常运行", "需补货", "故障"]
    if new_status not in allowed_statuses:
        return jsonify({"error": "Invalid status"}), 400

    # 4. 线程安全更新
    with device_lock:
        device_info["status"] = new_status
    
    return jsonify({
        "message": "Status updated",
        "device_id": device_id,
        "new_status": new_status
    })
    
@app.route('/device_status/<device_id>', methods=['GET'])
def get_device_status(device_id):
    """获取单个设备状态"""
    # 1. 权限验证
    admin_token = request.args.get('admin_token')
    if not admin_token:
        return jsonify({"code": 4001, "message": "缺少管理令牌"}), 400
    if admin_token != "SUPER_SECRET_ADMIN_KEY":
        return jsonify({"code": 4003, "message": "无效的管理令牌"}), 401

    # 2. 设备校验
    device_info = DEVICES.get(device_id)
    if not device_info:
        return jsonify({"code": 4004, "message": "设备不存在"}), 404

    # 3. 返回数据
    return jsonify({
        "code": 200,
        "data": {
            "device_id": device_id,
            "status": device_info["status"],
            "last_updated": datetime.now().isoformat()
        }
    })

@app.route('/devices/status', methods=['POST'])
def batch_get_device_status():
    """批量查询设备状态"""
    # 1. 参数解析
    data = request.get_json()
    if not data:
        return jsonify({"code": 4000, "message": "无效的请求体"}), 400
    
    # 2. 权限校验
    admin_token = data.get('admin_token')
    if admin_token != "SUPER_SECRET_ADMIN_KEY":
        return jsonify({"code": 4003, "message": "无效的管理令牌"}), 401

    # 3. 数据校验
    device_ids = data.get('device_ids', [])
    if not isinstance(device_ids, list) or len(device_ids) > 1000:
        return jsonify({"code": 4002, "message": "设备ID列表不合法"}), 400

    # 4. 数据处理
    status_filter = data.get('status')
    matched = [
        {
            "device_id": did,
            "status": DEVICES[did]["status"]
        } 
        for did in set(device_ids) 
        if did in DEVICES and (not status_filter or DEVICES[did]["status"] == status_filter)
    ]

    return jsonify({
        "code": 200,
        "data": {
            "total": len(matched),
            "devices": matched
        }
    })
    
    
    
# weichat-littleprogramme
# 小程序部分API

# 获取generated_data.json文件内容
@app.route('/data', methods=['GET'])
def get_data():
    try:
        with open('/www/wwwroot/file-upload-server/generated_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": f"Error reading file: {str(e)}"}), 500

# 测试Flask服务器是否正常运行
@app.route('/')
def index():
    return 'Flask server is running! Use /data to get JSON.'

# @app.route('/stock', methods=['GET'])
# def get_stock():
#     try:
#         with open('/www/wwwroot/file-upload-server/generated_stock_data.json', 'r', encoding='utf-8') as f:
#             data = json.load(f)
#         return jsonify(data)
#     except Exception as e:
#         return jsonify({"error": f"Error reading stock file: {str(e)}"}), 500

#########################################################################################################
#########################################################################################################

# 数据库连接配置
def get_db_connection():
    return pymysql.connect(
        host='localhost',
        user='root',  # 请替换为您的MySQL用户名
        password='vending',  # 请替换为您的MySQL密码
        db='vending_mysql',
        charset='utf8mb4',
        cursorclass=DictCursor
    )

# 用户相关API
# 修改登录接口，添加更详细的错误信息
@app.route('/api/user/login', methods=['POST'])
def user_login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"code": 400, "message": "用户名和密码不能为空"}), 400
        
        print(f"尝试登录: 用户名={username}, 密码长度={len(password)}")
        
        # 连接数据库并验证用户
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 检查用户名格式问题 - 可能需要补齐前导零
        if username.isdigit():
            # 如果用户输入的是纯数字，尝试补齐三位数格式
            formatted_username = username.zfill(3)
            print(f"格式化用户名: {username} -> {formatted_username}")
            
            cursor.execute("SELECT id, username, balance FROM users WHERE username IN (%s, %s) AND password = %s",
                         (username, formatted_username, password))
        else:
            cursor.execute("SELECT id, username, balance FROM users WHERE username = %s AND password = %s",
                         (username, password))
            
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if user:
            print(f"登录成功: user_id={user['id']}, username={user['username']}")
            return jsonify({
                "code": 200, 
                "message": "登录成功", 
                "data": {
                    "user_id": user['id'],
                    "username": user['username'],
                    "balance": float(user['balance'])
                }
            })
        else:
            print(f"登录失败: 用户名或密码不匹配")
            return jsonify({"code": 401, "message": "用户名或密码错误"}), 401
            
    except Exception as e:
        print(f"登录异常: {str(e)}")
        return jsonify({"code": 500, "message": f"服务器错误: {str(e)}"}), 500
        
@app.route('/api/user/info', methods=['GET'])
def get_user_info():
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({"code": 400, "message": "缺少用户ID参数"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, username, balance FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if user:
            return jsonify({
                "code": 200, 
                "data": {
                    "user_id": user['id'],
                    "username": user['username'],
                    "balance": float(user['balance'])
                }
            })
        else:
            return jsonify({"code": 404, "message": "用户不存在"}), 404
            
    except Exception as e:
        return jsonify({"code": 500, "message": f"服务器错误: {str(e)}"}), 500

@app.route('/api/user/update', methods=['POST'])
def update_user():
    try:
        data = request.json
        user_id = data.get('user_id')
        username = data.get('username')
        
        if not user_id or not username:
            return jsonify({"code": 400, "message": "用户ID和用户名不能为空"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 检查用户是否存在
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            conn.close()
            return jsonify({"code": 404, "message": "用户不存在"}), 404
        
        # 更新用户名
        cursor.execute("UPDATE users SET username = %s WHERE id = %s", (username, user_id))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "code": 200, 
            "message": "更新成功", 
            "data": {
                "user_id": int(user_id),
                "username": username
            }
        })
            
    except Exception as e:
        return jsonify({"code": 500, "message": f"服务器错误: {str(e)}"}), 500

# 商品相关API
# flask接口检查修复 - 添加更多错误处理和日志记录
@app.route('/api/products/list', methods=['GET'])
def get_products():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name, price, stock, location FROM products")
        products = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # 确保数据格式转换正确
        for product in products:
            product['price'] = float(product['price'])
            product['stock'] = int(product['stock'])
        
        print(f"API返回商品数据: {len(products)}条记录")
        return jsonify({
            "code": 200, 
            "data": products
        })
            
    except Exception as e:
        print(f"获取商品列表错误: {str(e)}")
        return jsonify({"code": 500, "message": f"获取商品列表失败: {str(e)}"}), 500

# 订单相关API
@app.route('/api/order/create', methods=['POST'])
def create_order():
    try:
        data = request.json
        user_id = data.get('user_id')
        product_id = data.get('product_id')
        quantity = data.get('quantity')
        vending_machine_id = data.get('vending_machine_id')
        
        if not user_id or not product_id or not quantity or not vending_machine_id:
            return jsonify({"code": 400, "message": "缺少必要参数"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 获取商品价格
        cursor.execute("SELECT price, stock FROM products WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        
        if not product:
            cursor.close()
            conn.close()
            return jsonify({"code": 404, "message": "商品不存在"}), 404
        
        # 检查库存
        if product['stock'] < quantity:
            cursor.close()
            conn.close()
            return jsonify({"code": 400, "message": "库存不足"}), 400
        
        # 计算总价
        total_price = float(product['price']) * quantity
        
        # 创建订单
        cursor.execute(
            "INSERT INTO orders (user_id, product_id, quantity, total_price, created_at, vending_machine_id) VALUES (%s, %s, %s, %s, %s, %s)",
            (user_id, product_id, quantity, total_price, datetime.now(), vending_machine_id)
        )
        order_id = cursor.lastrowid
        
        # 更新库存
        cursor.execute("UPDATE products SET stock = stock - %s WHERE id = %s", (quantity, product_id))
        
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "code": 200, 
            "message": "订单创建成功", 
            "data": {"order_id": order_id}
        })
            
    except Exception as e:
        return jsonify({"code": 500, "message": f"订单创建失败: {str(e)}"}), 500

@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({"code": 400, "message": "缺少用户ID参数"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 添加LEFT JOIN关联payments表
        cursor.execute("""
            SELECT o.id, o.quantity, o.total_price, o.created_at, p.name as product_name, 
                   pay.id as payment_id, pay.paid_at
            FROM orders o 
            JOIN products p ON o.product_id = p.id 
            LEFT JOIN payments pay ON o.id = pay.order_id
            WHERE o.user_id = %s
            ORDER BY o.created_at DESC
        """, (user_id,))
        
        orders = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # 转换价格为浮点数
        for order in orders:
            order['total_price'] = float(order['total_price'])
        
        return jsonify({
            "code": 200, 
            "data": orders
        })
            
    except Exception as e:
        # ...保持原有的异常处理代码...
        return jsonify({"code": 500, "message": f"获取订单列表失败: {str(e)}"}), 500

# 支付相关API
@app.route('/api/payment/create', methods=['POST'])
def create_payment():
    try:
        data = request.json
        user_id = data.get('user_id')
        order_id = data.get('order_id')
        method = data.get('method')
        amount = data.get('amount')
        
        if not user_id or not order_id or not method or not amount:
            return jsonify({"code": 400, "message": "缺少必要参数"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 插入支付记录
        cursor.execute(
            "INSERT INTO payments (users_id, order_id, method, amount, paid_at) VALUES (%s, %s, %s, %s, %s)",
            (user_id, order_id, method, amount, datetime.now())
        )
        payment_id = cursor.lastrowid
        
        # 更新用户余额
        cursor.execute("UPDATE users SET balance = balance - %s WHERE id = %s", (amount, user_id))
        
        conn.commit()
        
        cursor.close()
        conn.close()
        
        # 返回完整的支付信息，包含payment_id
        return jsonify({
            "code": 200, 
            "message": "支付成功", 
            "data": {
                "payment_id": payment_id, 
                "order_id": order_id,
                "amount": amount,
                "method": method
            }
        })
            
    except Exception as e:
        return jsonify({"code": 500, "message": f"支付失败: {str(e)}"}), 500

# 原有的weichat-littleprogramme接口需要修改为从数据库获取数据

@app.route('/stock', methods=['GET'])
def get_stock():
    try:
        # 修改为从数据库获取库存数据
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT name, stock FROM products")
        products = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # 构建合适的数据结构
        stock_data = {"stock": {}}
        for product in products:
            stock_data["stock"][product['name']] = product['stock']
            
        return jsonify(stock_data)
    except Exception as e:
        return jsonify({"error": f"Error getting stock data: {str(e)}"}), 500
        
@app.route('/api/order/detail', methods=['GET'])
def get_order_detail():
    try:
        order_id = request.args.get('order_id')
        user_id = request.args.get('user_id')
        
        if not order_id or not user_id:
            return jsonify({"code": 400, "message": "缺少必要参数"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 查询订单详情，包含商品信息
        cursor.execute("""
            SELECT o.*, p.name as product_name, pay.id as payment_id, pay.paid_at 
            FROM orders o 
            JOIN products p ON o.product_id = p.id 
            LEFT JOIN payments pay ON o.id = pay.order_id
            WHERE o.id = %s AND o.user_id = %s
        """, (order_id, user_id))
        
        order = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not order:
            return jsonify({"code": 404, "message": "订单不存在"}), 404
            
        # 转换价格为浮点数
        order['total_price'] = float(order['total_price'])
        
        # 处理日期格式
        if isinstance(order['created_at'], datetime):
            order['created_at'] = order['created_at'].isoformat()
        if order.get('paid_at') and isinstance(order['paid_at'], datetime):
            order['paid_at'] = order['paid_at'].isoformat()
            
        return jsonify({
            "code": 200,
            "data": order
        })
        
    except Exception as e:
        print(f"获取订单详情错误: {str(e)}")
        return jsonify({"code": 500, "message": f"获取订单详情失败: {str(e)}"}), 500
        
@app.route('/api/order/status', methods=['GET'])
def get_order_status():
    try:
        order_id = request.args.get('order_id')
        user_id = request.args.get('user_id')
        
        if not order_id or not user_id:
            return jsonify({"code": 400, "message": "缺少必要参数"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 直接联表查询订单和支付信息
        cursor.execute("""
            SELECT o.*, p.id as payment_id, p.paid_at 
            FROM orders o 
            LEFT JOIN payments p ON o.id = p.order_id 
            WHERE o.id = %s AND o.user_id = %s
        """, (order_id, user_id))
        
        order = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not order:
            return jsonify({"code": 404, "message": "订单不存在"}), 404
        
        # 检查是否已支付
        is_paid = order.get('payment_id') is not None
        
        return jsonify({
            "code": 200,
            "data": {
                "order_id": order['id'],
                "status": "completed" if is_paid else "pending",
                "payment_id": order.get('payment_id'),
                "paid_at": order.get('paid_at')
            }
        })
        
    except Exception as e:
        return jsonify({"code": 500, "message": f"查询订单状态失败: {str(e)}"}), 500
    
@app.route('/api/user/register', methods=['POST'])
def user_register():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"code": 400, "message": "用户名和密码不能为空"}), 400
        
        # 连接数据库
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 检查用户名是否已存在
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            conn.close()
            return jsonify({"code": 400, "message": "用户名已存在"}), 400
        
        # 创建新用户，默认余额1000
        cursor.execute(
            "INSERT INTO users (username, password, balance) VALUES (%s, %s, %s)",
            (username, password, 1000.00)
        )
        
        user_id = cursor.lastrowid
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "code": 200, 
            "message": "注册成功", 
            "data": {
                "user_id": user_id,
                "username": username
            }
        })
            
    except Exception as e:
        return jsonify({"code": 500, "message": f"服务器错误: {str(e)}"}), 500
#########################################################################################################
#########################################################################################################

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)