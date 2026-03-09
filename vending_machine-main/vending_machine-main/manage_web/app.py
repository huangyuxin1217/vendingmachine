from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import hashlib
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

# 数据库连接配置
db_config = {
    'host': '47.108.141.135',
    'user': 'vending_machine_manage',
    'password': 'XwX2eLWh8TL72Ndf',
    'database': 'vending_machine_manage'
}

# 创建数据库连接
def get_db_connection():
    return mysql.connector.connect(**db_config)

# 测试 API
@app.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({'message': 'Pong!'})
    
#用户注册和登录
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': '用户名和密码不能为空'}), 400

    # 加密密码（假设数据库中存储的是加密后的密码）
    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, username, role FROM users WHERE username = %s AND password = %s", (username, hashed_password))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user:
        # 模拟生成 token（实际项目中应使用 JWT 或其他安全方式）
        token = f"token-{user['id']}"
        return jsonify({
            'message': '登录成功',
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'role': user['role']
            }
        })
    else:
        return jsonify({'message': '用户名或密码错误'}), 401

# 获取售货机列表
@app.route('/api/machines', methods=['GET'])
def get_machines():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM vending_machines")
    machines = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(machines)

# 获取售货机详情
@app.route('/api/machines/<int:id>', methods=['GET'])
def get_machine_detail(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM vending_machines WHERE id = %s", (id,))
    machine = cursor.fetchone()
    cursor.close()
    conn.close()
    if machine:
        return jsonify(machine)
    else:
        return jsonify({'message': '售货机不存在'}), 404

# 更新售货机状态
@app.route('/api/machines/<int:id>', methods=['PUT'])
def update_machine_status(id):
    data = request.json
    status = data.get('status')
    if not status:
        return jsonify({'message': '状态不能为空'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE vending_machines SET status = %s WHERE id = %s", (status, id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': '售货机状态更新成功'})

@app.route('/api/machines/<int:machine_id>/status', methods=['PUT'])
def update_machine_status_with_log(machine_id):
    try:
        data = request.json
        new_status = data.get('status')
        user_id = data.get('user_id', 1)  # 默认管理员ID为1
        
        if not new_status:
            return jsonify({'message': '状态不能为空'}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 更新售货机状态
        cursor.execute("""
            UPDATE vending_machines 
            SET status = %s, 
                last_online = CASE WHEN %s = '在线' THEN NOW() ELSE last_online END
            WHERE id = %s
        """, (new_status, new_status, machine_id))
        
        # 记录操作日志
        cursor.execute("""
            INSERT INTO operation_logs (admin_id, action, target_type, target_id, created_at)
            VALUES (%s, %s, 'vending_machine', %s, NOW())
        """, (user_id, f"状态更新为{new_status}", machine_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': '售货机状态更新成功'})
        
    except Exception as e:
        return jsonify({'message': f'更新售货机状态失败: {str(e)}'}), 500



# 获取所有订单（带过滤和分页）
@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        # 获取查询参数
        status = request.args.get('status')
        search_text = request.args.get('search')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 构建SQL查询
        query = """
            SELECT o.id, o.order_number, o.user_id, o.product_id, o.vending_machine_id, 
                   o.quantity, o.total_price, o.status, o.payment_method, 
                   o.paid_at, o.completed_at, o.cancelled_at, o.created_at,
                   p.name as product_name, p.price as product_price,
                   v.name as machine_name, v.location as machine_location
            FROM orders o
            JOIN products p ON o.product_id = p.id
            JOIN vending_machines v ON o.vending_machine_id = v.id
            WHERE 1=1
        """
        params = []
        
        # 添加过滤条件
        if status and status != 'all':
            query += " AND o.status = %s"
            params.append(status)
        
        if search_text:
            query += " AND (o.order_number LIKE %s OR v.name LIKE %s OR p.name LIKE %s)"
            search_pattern = f"%{search_text}%"
            params.extend([search_pattern, search_pattern, search_pattern])
        
        if start_date and end_date:
            query += " AND o.created_at BETWEEN %s AND %s"
            params.extend([start_date, end_date + " 23:59:59"])
        
        query += " ORDER BY o.created_at DESC"
        
        cursor.execute(query, params)
        orders = cursor.fetchall()
        
        # 格式化日期时间
        for order in orders:
            for date_field in ['paid_at', 'completed_at', 'cancelled_at', 'created_at']:
                if order[date_field]:
                    order[date_field] = order[date_field].strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.close()
        conn.close()
        return jsonify(orders)
        
    except Exception as e:
        return jsonify({'message': f'获取订单失败: {str(e)}'}), 500

# 获取订单统计信息
@app.route('/api/orders/statistics', methods=['GET'])
def get_order_statistics():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 获取订单总数
        cursor.execute("SELECT COUNT(*) AS total FROM orders")
        total = cursor.fetchone()['total']
        
        # 获取订单总金额 (不包括已取消的订单)
        cursor.execute("SELECT SUM(total_price) AS totalAmount FROM orders WHERE status != '已取消'")
        result = cursor.fetchone()
        totalAmount = result['totalAmount'] if result['totalAmount'] else 0
        
        # 获取各状态订单数量
        cursor.execute("""
            SELECT status, COUNT(*) AS count
            FROM orders
            GROUP BY status
        """)
        status_counts = {row['status']: row['count'] for row in cursor.fetchall()}
        
        # 获取今日订单数和销售额
        cursor.execute("SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = CURDATE()")
        today_orders = cursor.fetchone()['count']
        
        cursor.execute("SELECT SUM(total_price) AS amount FROM orders WHERE DATE(created_at) = CURDATE() AND status != '已取消'")
        result = cursor.fetchone()
        today_amount = float(result['amount']) if result['amount'] else 0
        
        statistics = {
            'total': total,
            'totalAmount': float(totalAmount),
            'pending': status_counts.get('待支付', 0),
            'paid': status_counts.get('已支付', 0),
            'completed': status_counts.get('已完成', 0),
            'cancelled': status_counts.get('已取消', 0),
            'todayOrders': today_orders,
            'todayAmount': today_amount
        }
        
        cursor.close()
        conn.close()
        return jsonify(statistics)
        
    except Exception as e:
        return jsonify({'message': f'获取订单统计失败: {str(e)}'}), 50

# 更新订单状态
@app.route('/api/orders/<string:order_number>/status', methods=['PUT'])
def update_order_status(order_number):
    try:
        data = request.json
        new_status = data.get('status')
        user_id = data.get('user_id', 1)
        
        if not new_status:
            return jsonify({'message': '状态不能为空'}), 400
            
        # 防止SQL注入
        if not is_valid_status(new_status):
            return jsonify({'message': '无效的订单状态'}), 400
        
        # 优先检查订单是否存在
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT status FROM orders WHERE order_number = %s", (order_number,))
        order = cursor.fetchone()
        
        if not order:
            cursor.close()
            conn.close()
            return jsonify({'message': f'订单 {order_number} 不存在'}), 404
        
        current_status = order[0]
        
        # 安全处理状态转换
        valid_transitions = {
            '待支付': ['已支付', '已取消'],
            '已支付': ['已完成', '已取消'],
            '已完成': ['已取消'],  # 允许取消已完成订单作为"退款"
            '已取消': []  # 已取消状态不允许再变更
        }
        
        if new_status not in valid_transitions.get(current_status, []):
            cursor.close()
            conn.close()
            return jsonify({
                'message': f'不允许从 {current_status} 状态变更为 {new_status}',
                'current_status': current_status
            }), 400
        
        try:
            # 尝试更新订单状态
            update_fields = ""
            if new_status == '已支付':
                update_fields = ", paid_at = NOW(), payment_method = '后台支付'"
            elif new_status == '已完成':
                update_fields = ", completed_at = NOW()"
            elif new_status == '已取消':
                update_fields = ", cancelled_at = NOW()"
            
            cursor.execute(f"""
                UPDATE orders 
                SET status = %s{update_fields}
                WHERE order_number = %s
            """, (new_status, order_number))
            
            # 如果是取消订单，尝试恢复库存
            if new_status == '已取消' and current_status != '已取消':
                try:
                    # 查询订单中的商品和数量
                    cursor.execute("""
                        SELECT product_id, quantity FROM orders WHERE order_number = %s
                    """, (order_number,))
                    order_info = cursor.fetchone()
                    
                    if order_info and order_info[0] and order_info[1]:
                        product_id, quantity = order_info
                        # 恢复库存
                        cursor.execute("""
                            UPDATE products SET stock = stock + %s WHERE id = %s
                        """, (quantity, product_id))
                except Exception as stock_error:
                    print(f"恢复库存失败: {str(stock_error)}")
                    # 继续执行，不因为库存恢复失败而回滚整个事务
            
            # 记录操作日志
            try:
                cursor.execute("""
                    INSERT INTO operation_logs (admin_id, action, target_type, target_id, created_at)
                    VALUES (%s, %s, 'order', %s, NOW())
                """, (user_id, f"订单状态更新为{new_status}", order_number))
            except Exception as log_error:
                print(f"记录操作日志失败: {str(log_error)}")
                # 继续执行，不因为日志记录失败而回滚整个事务
            
            conn.commit()
            
        except Exception as update_error:
            conn.rollback()
            raise update_error
        finally:
            cursor.close()
            conn.close()
        
        return jsonify({
            'message': f'订单状态已更新为{new_status}',
            'status': new_status
        })
        
    except Exception as e:
        print(f"更新订单状态失败: {str(e)}")
        return jsonify({'message': f'更新订单状态失败: {str(e)}'}), 500

# 辅助函数：验证状态值的有效性
def is_valid_status(status):
    return status in ['待支付', '已支付', '已完成', '已取消']
# 获取订单详情
@app.route('/api/orders/<string:order_number>', methods=['GET'])
def get_order_detail(order_number):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 获取订单基本信息
        cursor.execute("""
            SELECT o.id, o.order_number, o.user_id, o.product_id, o.vending_machine_id, 
                   o.quantity, o.total_price, o.status, o.payment_method, 
                   o.paid_at, o.completed_at, o.cancelled_at, o.created_at,
                   p.name as product_name, p.price as product_price,
                   v.name as machine_name, v.location as machine_location,
                   u.username as customer_name
            FROM orders o
            JOIN products p ON o.product_id = p.id
            JOIN vending_machines v ON o.vending_machine_id = v.id
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.order_number = %s
        """, (order_number,))
        
        order = cursor.fetchone()
        if not order:
            return jsonify({'message': '订单不存在'}), 404
            
        # 格式化日期时间
        for date_field in ['paid_at', 'completed_at', 'cancelled_at', 'created_at']:
            if order[date_field]:
                order[date_field] = order[date_field].strftime('%Y-%m-%d %H:%M:%S')
        
        # 构建订单项信息
        order_items = [{
            'id': f"ITEM-{order['id']}",
            'name': order['product_name'],
            'price': float(order['product_price']),
            'quantity': order['quantity'],
            'amount': float(order['total_price'])
        }]
        
        # 构建完整订单对象
        order_detail = {
            'id': order['order_number'],
            'customerId': f"CUS{order['user_id']}",
            'customerName': order['customer_name'],
            'status': order['status'],
            'createdAt': order['created_at'],
            'paymentMethod': order['payment_method'],
            'machine': order['machine_name'],
            'machineLocation': order['machine_location'],
            'items': order_items,
            'totalAmount': float(order['total_price']),
            'payTime': order['paid_at'],
            'completedTime': order['completed_at'],
            'cancelledTime': order['cancelled_at']
        }
        
        cursor.close()
        conn.close()
        return jsonify(order_detail)
        
    except Exception as e:
        return jsonify({'message': f'获取订单详情失败: {str(e)}'}), 500

# 更新库存
@app.route('/api/inventory', methods=['PUT'])
def update_inventory():
    data = request.json
    product_id = data.get('product_id')
    stock_change = data.get('stock_change')

    conn = get_db_connection()
    cursor = conn.cursor()
    query = "UPDATE products SET stock = stock + %s WHERE id = %s"
    cursor.execute(query, (stock_change, product_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': '库存更新成功'})


    
    
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # 今日订单数
    cursor.execute("SELECT COUNT(*) AS todayOrders FROM orders WHERE DATE(created_at) = CURDATE()")
    today_orders = cursor.fetchone()['todayOrders']

    # 今日销售额
    cursor.execute("SELECT SUM(total_price) AS todaySales FROM orders WHERE DATE(created_at) = CURDATE() AND status = '已支付'")
    today_sales = cursor.fetchone()['todaySales'] or 0

    # 故障机器数
    cursor.execute("SELECT COUNT(*) AS faultyMachines FROM vending_machines WHERE status = '故障'")
    faulty_machines = cursor.fetchone()['faultyMachines']

    cursor.close()
    conn.close()

    return jsonify({
        'todayOrders': today_orders,
        'todaySales': today_sales,
        'faultyMachines': faulty_machines
    })
    

@app.route('/api/sales', methods=['GET'])
def get_sales_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # 获取最近7天的销售数据
    cursor.execute("""
        SELECT DATE(created_at) AS date, SUM(total_price) AS sales
        FROM orders
        WHERE status = '已支付'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC
        LIMIT 7
    """)
    sales_data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(sales_data)
    
@app.route('/api/inventory/warnings', methods=['GET'])
def get_inventory_warnings():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # 获取库存低于安全库存的商品
    cursor.execute("""
        SELECT id, name, stock, safe_stock AS minStock, '预警' AS status
        FROM products
        WHERE stock < safe_stock
    """)
    warnings = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(warnings)

@app.route('/api/machines/<int:machine_id>/detail', methods=['GET'])
def get_machine_detail_info(machine_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 获取售货机信息
        cursor.execute("""
            SELECT * FROM vending_machines WHERE id = %s
        """, (machine_id,))
        machine = cursor.fetchone()
        
        if not machine:
            return jsonify({'message': '售货机不存在'}), 404
        
        # 格式化日期字段
        for field in ['last_online', 'last_maintenance', 'created_at']:
            if machine.get(field) and isinstance(machine[field], datetime):
                machine[field] = machine[field].strftime("%Y-%m-%d %H:%M:%S")
        
        # 获取商品槽位信息 
        cursor.execute("""
            SELECT id, name, stock as current, safe_stock as capacity
            FROM products
            WHERE id IN (SELECT product_id FROM inventory_logs WHERE vending_machine_id = %s)
        """, (machine_id,))
        products = cursor.fetchall()
        
        # 计算商品槽位状态
        slots = []
        for product in products:
            capacity = product['capacity'] or 10  # 默认容量为10
            current = product['current'] or 0
            percent = (current / capacity * 100) if capacity > 0 else 0
            status = '预警' if current < capacity * 0.2 else '正常'
            
            slots.append({
                'id': f"SLOT-{machine_id}-{product['id']}",
                'name': product['name'],
                'capacity': capacity,
                'current': current,
                'percent': percent,
                'status': status
            })
        
        machine['slots'] = slots
        machine['emptySlots'] = len([s for s in slots if s['current'] == 0])
        machine['warningSlots'] = len([s for s in slots if s['status'] == '预警'])
        machine['fillLevel'] = sum([s['current'] for s in slots]) / sum([s['capacity'] for s in slots]) if slots else 0
        
        # 获取操作日志
        cursor.execute("""
            SELECT ol.action, ol.created_at, u.username
            FROM operation_logs ol
            LEFT JOIN users u ON ol.admin_id = u.id
            WHERE ol.target_type = 'vending_machine' AND ol.target_id = %s
            ORDER BY ol.created_at DESC LIMIT 10
        """, (machine_id,))
        logs_data = cursor.fetchall()
        
        logs = []
        for log in logs_data:
            if log['created_at'] and isinstance(log['created_at'], datetime):
                time_str = log['created_at'].strftime("%Y-%m-%d %H:%M:%S")
            else:
                time_str = str(log['created_at'])
                
            logs.append({
                'time': time_str,
                'type': '系统',
                'content': f"{log['action']}操作 - {log['username'] or '系统'}"
            })
        
        machine['logs'] = logs
        
        cursor.close()
        conn.close()
        return jsonify(machine)
        
    except Exception as e:
        return jsonify({'message': f'获取售货机详情失败: {str(e)}'}), 500


# 获取所有商品（带搜索功能）
@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        # 获取查询参数
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 构建基本查询
        query = "SELECT * FROM products WHERE 1=1"
        params = []
        
        # 添加过滤条件
        if search:
            query += " AND (name LIKE %s OR id LIKE %s)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param])
            
        if category and category != 'all':
            query += " AND category = %s"
            params.append(category)
            
        # 执行查询
        cursor.execute(query, params)
        products = cursor.fetchall()
        
        # 处理Decimal类型为float，使其可JSON序列化
        for product in products:
            if 'price' in product:
                product['price'] = float(product['price'])
                
        cursor.close()
        conn.close()
        return jsonify(products)
        
    except Exception as e:
        return jsonify({'message': f'获取商品列表失败: {str(e)}'}), 500

# 添加商品
@app.route('/api/products', methods=['POST'])
def add_product():
    try:
        data = request.json
        name = data.get('name')
        price = data.get('price')
        stock = data.get('stock', 0)
        safe_stock = data.get('safe_stock', 10)
        category = data.get('category')
        description = data.get('description', '')
        status = data.get('status', '上架')
        
        # 验证必要字段
        if not name or price is None:
            return jsonify({'message': '商品名称和价格不能为空'}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 插入商品记录
        cursor.execute("""
            INSERT INTO products 
            (name, price, stock, safe_stock, category, description, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (name, price, stock, safe_stock, category, description, status))
        
        conn.commit()
        product_id = cursor.lastrowid
        
        # 记录操作日志
        user_id = data.get('user_id', 1)  # 默认管理员ID
        cursor.execute("""
            INSERT INTO operation_logs 
            (admin_id, action, target_type, target_id, created_at)
            VALUES (%s, %s, 'product', %s, NOW())
        """, (user_id, '添加商品', product_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': '商品添加成功', 
            'product_id': product_id
        }), 201
        
    except Exception as e:
        return jsonify({'message': f'添加商品失败: {str(e)}'}), 500

# 更新商品
@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.json
        
        # 构建更新字段和参数
        update_fields = []
        params = []
        
        # 动态构建更新语句
        for field in ['name', 'price', 'stock', 'safe_stock', 'category', 'description', 'status']:
            if field in data:
                update_fields.append(f"{field} = %s")
                params.append(data[field])
                
        if not update_fields:
            return jsonify({'message': '没有提供更新字段'}), 400
            
        # 添加产品ID到参数列表
        params.append(product_id)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 执行更新
        query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(query, params)
        
        # 检查是否找到并更新了商品
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'message': '商品不存在'}), 404
        
        # 记录操作日志
        user_id = data.get('user_id', 1)  # 默认管理员ID
        cursor.execute("""
            INSERT INTO operation_logs 
            (admin_id, action, target_type, target_id, created_at)
            VALUES (%s, %s, 'product', %s, NOW())
        """, (user_id, '更新商品', product_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': '商品更新成功'})
        
    except Exception as e:
        return jsonify({'message': f'更新商品失败: {str(e)}'}), 500

# 删除商品
@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 检查商品是否存在
        cursor.execute("SELECT id FROM products WHERE id = %s", (product_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': '商品不存在'}), 404
            
        # 删除商品
        cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
        
        # 记录操作日志
        user_id = request.args.get('user_id', 1)  # 从URL参数中获取用户ID
        cursor.execute("""
            INSERT INTO operation_logs 
            (admin_id, action, target_type, target_id, created_at)
            VALUES (%s, %s, 'product', %s, NOW())
        """, (user_id, '删除商品', product_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': '商品删除成功'})
        
    except Exception as e:
        return jsonify({'message': f'删除商品失败: {str(e)}'}), 500

# 获取商品分类列表
@app.route('/api/products/categories', methods=['GET'])
def get_product_categories():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT DISTINCT category FROM products WHERE category IS NOT NULL")
        categories = [row['category'] for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        return jsonify(categories)
        
    except Exception as e:
        return jsonify({'message': f'获取商品分类失败: {str(e)}'}), 500



# 获取用户资料
@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, username, role, status, created_at, last_login
            FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        if not user:
            return jsonify({'message': '用户不存在'}), 404
        
        # 格式化日期时间
        for field in ['created_at', 'last_login']:
            if user.get(field) and isinstance(user[field], datetime):
                user[field] = user[field].strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.close()
        conn.close()
        return jsonify(user)
    except Exception as e:
        return jsonify({'message': f'获取用户资料失败: {str(e)}'}), 500

# 更新用户资料
@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user_profile(user_id):
    try:
        data = request.json
        
        # 验证权限
        current_user_id = data.get('current_user_id')
        if current_user_id != user_id:
            # 检查是否为管理员
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            cursor.close()
            
            if not user_role or user_role['role'] != 'admin':
                return jsonify({'message': '没有权限修改其他用户的资料'}), 403
        
        # 构建更新字段
        update_fields = []
        params = []
        
        # 允许更新的字段
        allowed_fields = ['username', 'status']
        for field in allowed_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                params.append(data[field])
        
        if not update_fields:
            return jsonify({'message': '没有提供要更新的字段'}), 400
        
        # 添加用户ID到参数列表
        params.append(user_id)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 执行更新
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(query, params)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': '用户资料更新成功'})
    except Exception as e:
        return jsonify({'message': f'更新用户资料失败: {str(e)}'}), 500

# 修改密码
@app.route('/api/users/<int:user_id>/password', methods=['PUT'])
def change_password(user_id):
    try:
        data = request.json
        old_password = data.get('oldPassword')
        new_password = data.get('newPassword')
        
        if not old_password or not new_password:
            return jsonify({'message': '原密码和新密码不能为空'}), 400
        
        # 加密密码
        hashed_old_password = hashlib.sha256(old_password.encode()).hexdigest()
        hashed_new_password = hashlib.sha256(new_password.encode()).hexdigest()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 验证旧密码
        cursor.execute("SELECT id FROM users WHERE id = %s AND password = %s", (user_id, hashed_old_password))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': '原密码不正确'}), 400
        
        # 更新密码
        cursor.execute("UPDATE users SET password = %s WHERE id = %s", (hashed_new_password, user_id))
        
        # 记录操作日志
        cursor.execute("""
            INSERT INTO operation_logs (admin_id, action, target_type, target_id, created_at)
            VALUES (%s, %s, 'user', %s, NOW())
        """, (user_id, '修改密码', user_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': '密码修改成功'})
    except Exception as e:
        return jsonify({'message': f'密码修改失败: {str(e)}'}), 500

# 获取管理员列表
@app.route('/api/admin/users', methods=['GET'])
def get_admin_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, username, role, status, created_at, last_login
            FROM users WHERE role = 'admin' OR role = 'user'
            ORDER BY id
        """)
        
        users = cursor.fetchall()
        
        # 格式化日期时间
        for user in users:
            for field in ['created_at', 'last_login']:
                if user.get(field) and isinstance(user[field], datetime):
                    user[field] = user[field].strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.close()
        conn.close()
        return jsonify(users)
    except Exception as e:
        return jsonify({'message': f'获取管理员列表失败: {str(e)}'}), 500

# 添加管理员
@app.route('/api/admin/users', methods=['POST'])
def add_admin_user():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'user')
        
        if not username or not password:
            return jsonify({'message': '用户名和密码不能为空'}), 400
        
        # 加密密码
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 检查用户名是否已存在
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': '用户名已存在'}), 400
        
        # 添加用户
        cursor.execute("""
            INSERT INTO users (username, password, role, status, created_at)
            VALUES (%s, %s, %s, 'active', NOW())
        """, (username, hashed_password, role))
        
        user_id = cursor.lastrowid
        
        # 记录操作日志
        admin_id = data.get('admin_id', 1)  # 执行操作的管理员ID
        cursor.execute("""
            INSERT INTO operation_logs (admin_id, action, target_type, target_id, created_at)
            VALUES (%s, %s, 'user', %s, NOW())
        """, (admin_id, '添加用户', user_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': '用户添加成功', 'user_id': user_id})
    except Exception as e:
        return jsonify({'message': f'添加用户失败: {str(e)}'}), 500

# 删除用户
@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        admin_id = request.args.get('admin_id', 1)  # 执行操作的管理员ID
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 检查是否为超级管理员
        cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            conn.close()
            return jsonify({'message': '用户不存在'}), 404
        
        # 防止删除超级管理员
        if user['role'] == 'admin' and user_id == 1:
            cursor.close()
            conn.close()
            return jsonify({'message': '不允许删除超级管理员账号'}), 403
        
        # 删除用户
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        
        # 记录操作日志
        cursor.execute("""
            INSERT INTO operation_logs (admin_id, action, target_type, target_id, created_at)
            VALUES (%s, %s, 'user', %s, NOW())
        """, (admin_id, '删除用户', user_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': '用户删除成功'})
    except Exception as e:
        return jsonify({'message': f'删除用户失败: {str(e)}'}), 500

# 更新用户状态
@app.route('/api/admin/users/<int:user_id>/status', methods=['PUT'])
def update_user_status(user_id):
    try:
        data = request.json
        new_status = data.get('status')
        admin_id = data.get('admin_id', 1)  # 执行操作的管理员ID
        
        if not new_status or new_status not in ['active', 'inactive']:
            return jsonify({'message': '无效的状态值'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 检查是否为超级管理员
        cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            conn.close()
            return jsonify({'message': '用户不存在'}), 404
        
        # 防止禁用超级管理员
        if user['role'] == 'admin' and user_id == 1 and new_status == 'inactive':
            cursor.close()
            conn.close()
            return jsonify({'message': '不允许禁用超级管理员账号'}), 403
        
        # 更新状态
        cursor.execute("UPDATE users SET status = %s WHERE id = %s", (new_status, user_id))
        
        # 记录操作日志
        action = f"用户状态更新为{new_status}"
        cursor.execute("""
            INSERT INTO operation_logs (admin_id, action, target_type, target_id, created_at)
            VALUES (%s, %s, 'user', %s, NOW())
        """, (admin_id, action, user_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': '用户状态更新成功'})
    except Exception as e:
        return jsonify({'message': f'更新用户状态失败: {str(e)}'}), 500

# 获取安全日志
@app.route('/api/security/logs', methods=['GET'])
def get_security_logs():
    try:
        user_id = request.args.get('user_id')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT ol.id, ol.action, ol.target_type, ol.target_id, ol.created_at,
                   u.username as admin_name
            FROM operation_logs ol
            LEFT JOIN users u ON ol.admin_id = u.id
            WHERE 1=1
        """
        params = []
        
        if user_id:
            query += " AND ol.admin_id = %s"
            params.append(user_id)
        
        query += " ORDER BY ol.created_at DESC LIMIT 100"
        
        cursor.execute(query, params)
        logs = cursor.fetchall()
        
        # 格式化日期时间
        for log in logs:
            if log.get('created_at') and isinstance(log['created_at'], datetime):
                log['created_at'] = log['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.close()
        conn.close()
        return jsonify(logs)
    except Exception as e:
        return jsonify({'message': f'获取安全日志失败: {str(e)}'}), 500

# 获取销售统计概览
@app.route('/api/statistics/overview', methods=['GET'])
def get_statistics_overview():
    try:
        # 获取查询参数
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        machine_id = request.args.get('machine_id', 'all')
        time_unit = request.args.get('time_unit', 'day')
        
        if not start_date or not end_date:
            return jsonify({'message': '开始日期和结束日期不能为空'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 构建查询条件
        where_clauses = ["status IN ('已支付', '已完成')"]
        params = []
        
        where_clauses.append("created_at BETWEEN %s AND %s")
        params.extend([start_date, end_date + " 23:59:59"])
        
        if machine_id != 'all':
            where_clauses.append("vending_machine_id = %s")
            params.append(machine_id)
            
        where_clause = " AND ".join(where_clauses)
        
        # 查询当前时间段的销售数据
        cursor.execute(f"""
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_price) as total_sales
            FROM orders
            WHERE {where_clause}
        """, params)
        
        current_data = cursor.fetchone()
        total_orders = current_data['total_orders'] or 0
        total_sales = float(current_data['total_sales'] or 0)
        
        # 计算平均订单金额
        avg_order_value = total_sales / total_orders if total_orders > 0 else 0
        
        # 计算同比增长
        # 获取上一个相同时间段的数据
        time_diff = None
        if time_unit == 'day':
            time_diff = "INTERVAL 1 DAY"
        elif time_unit == 'week':
            time_diff = "INTERVAL 7 DAY"
        elif time_unit == 'month':
            time_diff = "INTERVAL 30 DAY"
        
        prev_start_date = f"DATE_SUB('{start_date}', {time_diff})"
        prev_end_date = f"DATE_SUB('{end_date}', {time_diff})"
        
        cursor.execute(f"""
            SELECT 
                SUM(total_price) as prev_total_sales
            FROM orders
            WHERE status IN ('已支付', '已完成') 
            AND created_at BETWEEN {prev_start_date} AND {prev_end_date} + INTERVAL 1 DAY - INTERVAL 1 SECOND
            {f"AND vending_machine_id = {machine_id}" if machine_id != 'all' else ""}
        """)
        
        prev_data = cursor.fetchone()
        prev_total_sales = float(prev_data['prev_total_sales'] or 0)
        
        # 计算增长率
        sales_growth = 0
        if prev_total_sales > 0:
            sales_growth = ((total_sales - prev_total_sales) / prev_total_sales) * 100
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'total_sales': total_sales,
            'total_orders': total_orders,
            'average_order_value': avg_order_value,
            'sales_growth': sales_growth
        })
        
    except Exception as e:
        return jsonify({'message': f'获取销售统计概览失败: {str(e)}'}), 500

# 获取热门商品排行
@app.route('/api/statistics/top-products', methods=['GET'])
def get_top_products():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        machine_id = request.args.get('machine_id', 'all')
        limit = int(request.args.get('limit', 10))
        
        if not start_date or not end_date:
            return jsonify({'message': '开始日期和结束日期不能为空'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 构建查询条件
        where_clauses = ["o.status IN ('已支付', '已完成')"]
        params = []
        
        where_clauses.append("o.created_at BETWEEN %s AND %s")
        params.extend([start_date, end_date + " 23:59:59"])
        
        if machine_id != 'all':
            where_clauses.append("o.vending_machine_id = %s")
            params.append(machine_id)
            
        where_clause = " AND ".join(where_clauses)
        
        # 查询当前时间段的热门商品
        cursor.execute(f"""
            SELECT 
                p.id,
                p.name,
                SUM(o.quantity) as sales,
                SUM(o.total_price) as amount,
                p.category
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE {where_clause}
            GROUP BY p.id, p.name, p.category
            ORDER BY sales DESC
            LIMIT %s
        """, params + [limit])
        
        products = cursor.fetchall()
        
        # 计算同比增长
        for product in products:
            # 获取上一个相同时间段的数据
            prev_start = f"DATE_SUB('{start_date}', INTERVAL 30 DAY)"
            prev_end = f"DATE_SUB('{end_date}', INTERVAL 30 DAY)"
            
            cursor.execute(f"""
                SELECT 
                    SUM(o.total_price) as prev_amount
                FROM orders o
                WHERE o.product_id = %s
                AND o.status IN ('已支付', '已完成')
                AND o.created_at BETWEEN {prev_start} AND {prev_end} + INTERVAL 1 DAY - INTERVAL 1 SECOND
                {f"AND o.vending_machine_id = {machine_id}" if machine_id != 'all' else ""}
            """, [product['id']])
            
            prev_data = cursor.fetchone()
            prev_amount = float(prev_data['prev_amount'] or 0)
            
            # 计算增长率
            growth = 0
            current_amount = float(product['amount'] or 0)
            if prev_amount > 0:
                growth = ((current_amount - prev_amount) / prev_amount) * 100
                
            product['growth'] = growth
            product['amount'] = float(product['amount'] or 0)
        
        cursor.close()
        conn.close()
        
        return jsonify(products)
        
    except Exception as e:
        return jsonify({'message': f'获取热门商品排行失败: {str(e)}'}), 500

# 获取销售趋势数据
@app.route('/api/statistics/sales-trend', methods=['GET'])
def get_sales_trend():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        machine_id = request.args.get('machine_id', 'all')
        time_unit = request.args.get('time_unit', 'day')
        
        if not start_date or not end_date:
            return jsonify({'message': '开始日期和结束日期不能为空'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 根据时间单位选择不同的分组方式
        group_format = ""
        if time_unit == 'day':
            group_format = "%Y-%m-%d"
        elif time_unit == 'week':
            group_format = "%x-W%v"  # ISO year and week
        elif time_unit == 'month':
            group_format = "%Y-%m"
            
        # 构建查询条件
        where_clauses = ["status IN ('已支付', '已完成')"]
        params = []
        
        where_clauses.append("created_at BETWEEN %s AND %s")
        params.extend([start_date, end_date + " 23:59:59"])
        
        if machine_id != 'all':
            where_clauses.append("vending_machine_id = %s")
            params.append(machine_id)
            
        where_clause = " AND ".join(where_clauses)
        
        # 查询销售趋势数据
        cursor.execute(f"""
            SELECT 
                DATE_FORMAT(created_at, '{group_format}') as time_period,
                COUNT(*) as orders,
                SUM(total_price) as sales
            FROM orders
            WHERE {where_clause}
            GROUP BY time_period
            ORDER BY MIN(created_at)
        """, params)
        
        trend_data = cursor.fetchall()
        
        # 处理数据格式
        for item in trend_data:
            item['sales'] = float(item['sales'] or 0)
        
        cursor.close()
        conn.close()
        
        return jsonify(trend_data)
        
    except Exception as e:
        return jsonify({'message': f'获取销售趋势数据失败: {str(e)}'}), 500

# 获取售货机销售对比数据
@app.route('/api/statistics/machine-comparison', methods=['GET'])
def get_machine_comparison():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            return jsonify({'message': '开始日期和结束日期不能为空'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 获取售货机销售数据
        cursor.execute("""
            SELECT 
                v.id,
                v.name,
                v.location,
                COUNT(o.id) as orders,
                SUM(o.total_price) as sales
            FROM vending_machines v
            LEFT JOIN orders o ON v.id = o.vending_machine_id 
                AND o.status IN ('已支付', '已完成')
                AND o.created_at BETWEEN %s AND %s
            GROUP BY v.id, v.name, v.location
            ORDER BY sales DESC
        """, [start_date, end_date + " 23:59:59"])
        
        machine_data = cursor.fetchall()
        
        # 处理数据格式
        for item in machine_data:
            item['sales'] = float(item['sales'] or 0)
        
        cursor.close()
        conn.close()
        
        return jsonify(machine_data)
        
    except Exception as e:
        return jsonify({'message': f'获取售货机销售对比数据失败: {str(e)}'}), 500

# 获取商品分类销售占比
@app.route('/api/statistics/category-sales', methods=['GET'])
def get_category_sales():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        machine_id = request.args.get('machine_id', 'all')
        
        if not start_date or not end_date:
            return jsonify({'message': '开始日期和结束日期不能为空'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 构建查询条件
        where_clauses = ["o.status IN ('已支付', '已完成')"]
        params = []
        
        where_clauses.append("o.created_at BETWEEN %s AND %s")
        params.extend([start_date, end_date + " 23:59:59"])
        
        if machine_id != 'all':
            where_clauses.append("o.vending_machine_id = %s")
            params.append(machine_id)
            
        where_clause = " AND ".join(where_clauses)
        
        # 获取分类销售数据
        cursor.execute(f"""
            SELECT 
                IFNULL(p.category, '其他') as category,
                COUNT(o.id) as orders,
                SUM(o.total_price) as sales,
                SUM(o.quantity) as quantity
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE {where_clause}
            GROUP BY p.category
            ORDER BY sales DESC
        """, params)
        
        category_data = cursor.fetchall()
        
        # 计算总销售额
        total_sales = sum(float(item['sales'] or 0) for item in category_data)
        
        # 添加占比字段
        for item in category_data:
            item['sales'] = float(item['sales'] or 0)
            item['percentage'] = (item['sales'] / total_sales * 100) if total_sales > 0 else 0
        
        cursor.close()
        conn.close()
        
        return jsonify(category_data)
        
    except Exception as e:
        return jsonify({'message': f'获取商品分类销售占比失败: {str(e)}'}), 500

# 获取售货机列表（用于下拉选择）
@app.route('/api/statistics/machines', methods=['GET'])
def get_statistics_machines():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id, name, location FROM vending_machines ORDER BY name")
        machines = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(machines)
        
    except Exception as e:
        return jsonify({'message': f'获取售货机列表失败: {str(e)}'}), 500

# 导出销售数据
@app.route('/api/statistics/export', methods=['GET'])
def export_statistics():
    try:
        # 此处简单返回成功消息
        # 实际项目中，可以生成CSV/Excel文件并提供下载链接
        return jsonify({'message': '导出成功', 'download_url': '/downloads/sales_data.csv'})
        
    except Exception as e:
        return jsonify({'message': f'导出数据失败: {str(e)}'}), 500



# 启动 Flask 应用
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5010, debug=True)