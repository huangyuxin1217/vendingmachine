# API 文档

## 1. 用户相关 API

### 1.1 用户登录

**描述**: 用户登录，验证用户名和密码，返回用户信息。

- 请求方式: `POST`
- 请求路径: `/api/user/login`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|:---|:---|:---|:---|
| username | string | 是 | 用户名（支持纯数字，自动补齐前导零） |
| password | string | 是 | 密码 |

**成功响应**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user_id": 1,
    "username": "001",
    "balance": 100.0
  }
}
```

**失败响应**:

用户名或密码为空:
```json
{
  "code": 400,
  "message": "用户名和密码不能为空"
}
```

用户名或密码错误:
```json
{
  "code": 401,
  "message": "用户名或密码错误"
}
```

服务器错误:
```json
{
  "code": 500,
  "message": "服务器错误: <具体错误信息>"
}
```

### 1.2 获取用户信息

**描述**: 根据用户ID获取用户信息。

- 请求方式: `GET`
- 请求路径: `/api/user/info`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|:---|:---|:---|:---|
| user_id | int | 是 | 用户ID |

**成功响应**:
```json
{
  "code": 200,
  "data": {
    "user_id": 1,
    "username": "001",
    "balance": 100.0
  }
}
```

**失败响应**:

缺少用户ID:
```json
{
  "code": 400,
  "message": "缺少用户ID参数"
}
```

用户不存在:
```json
{
  "code": 404,
  "message": "用户不存在"
}
```

服务器错误:
```json
{
  "code": 500,
  "message": "服务器错误: <具体错误信息>"
}
```

### 1.3 更新用户信息

**描述**: 更新用户名。

- 请求方式: `POST`
- 请求路径: `/api/user/update`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|:---|:---|:---|:---|
| user_id | int | 是 | 用户ID |
| username | string | 是 | 新用户名 |

**成功响应**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "user_id": 1,
    "username": "new_username"
  }
}
```

**失败响应**:

缺少必要参数:
```json
{
  "code": 400,
  "message": "用户ID和用户名不能为空"
}
```

用户不存在:
```json
{
  "code": 404,
  "message": "用户不存在"
}
```

服务器错误:
```json
{
  "code": 500,
  "message": "服务器错误: <具体错误信息>"
}
```

## 2. 商品相关 API

### 2.1 获取商品列表

**描述**: 获取所有商品的详细信息。

- 请求方式: `GET`
- 请求路径: `/api/products/list`

**请求参数**: 无

**成功响应**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "商品A",
      "price": 10.0,
      "stock": 100,
      "location": "A1"
    },
    {
      "id": 2,
      "name": "商品B",
      "price": 20.0,
      "stock": 50,
      "location": "A2"
    }
  ]
}
```

**失败响应**:

服务器错误:
```json
{
  "code": 500,
  "message": "获取商品列表失败: <具体错误信息>"
}
```

## 3. 订单相关 API

### 3.1 创建订单

**描述**: 用户下单，检查库存并创建订单。

- 请求方式: `POST`
- 请求路径: `/api/order/create`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|:---|:---|:---|:---|
| user_id | int | 是 | 用户ID |
| product_id | int | 是 | 商品ID |
| quantity | int | 是 | 购买数量 |
| vending_machine_id | int | 是 | 自动售货机ID |

**成功响应**:
```json
{
  "code": 200,
  "message": "订单创建成功",
  "data": {
    "order_id": 1
  }
}
```

**失败响应**:

缺少必要参数:
```json
{
  "code": 400,
  "message": "缺少必要参数"
}
```

商品不存在:
```json
{
  "code": 404,
  "message": "商品不存在"
}
```

库存不足:
```json
{
  "code": 400,
  "message": "库存不足"
}
```

服务器错误:
```json
{
  "code": 500,
  "message": "订单创建失败: <具体错误信息>"
}
```

### 3.2 获取用户订单列表

**描述**: 根据用户ID获取该用户的所有订单。

- 请求方式: `GET`
- 请求路径: `/api/orders`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|:---|:---|:---|:---|
| user_id | int | 是 | 用户ID |

**成功响应**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "quantity": 2,
      "total_price": 20.0,
      "created_at": "2023-10-01T12:00:00",
      "product_name": "商品A"
    }
  ]
}
```

**失败响应**:

缺少用户ID:
```json
{
  "code": 400,
  "message": "缺少用户ID参数"
}
```

服务器错误:
```json
{
  "code": 500,
  "message": "获取订单列表失败: <具体错误信息>"
}
```

## 4. 支付相关 API

### 4.1 创建支付记录

**描述**: 用户完成支付，创建支付记录并更新用户余额。

- 请求方式: `POST`
- 请求路径: `/api/payment/create`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|:---|:---|:---|:---|
| user_id | int | 是 | 用户ID |
| order_id | int | 是 | 订单ID |
| method | string | 是 | 支付方式（如微信、支付宝） |
| amount | float | 是 | 支付金额 |

**成功响应**:
```json
{
  "code": 200,
  "message": "支付成功",
  "data": {
    "payment_id": 1
  }
}
```

**失败响应**:

缺少必要参数:
```json
{
  "code": 400,
  "message": "缺少必要参数"
}
```

服务器错误:
```json
{
  "code": 500,
  "message": "支付失败: <具体错误信息>"
}
```

## 5. 其他 API

### 5.1 获取商品库存

**描述**: 获取所有商品的库存信息。

- 请求方式: `GET`
- 请求路径: `/stock`

**请求参数**: 无

**成功响应**:
```json
{
  "stock": {
    "商品A": 100,
    "商品B": 50
  }
}
```

**失败响应**:

服务器错误:
```json
{
  "error": "Error getting stock data: <具体错误信息>"
}
```

### 5.2 获取订单详情

**描述**: 根据订单ID和用户ID获取订单详情。

- 请求方式: `GET`
- 请求路径: `/api/order/detail`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|:---|:---|:---|:---|
| order_id | int | 是 | 订单ID |
| user_id | int | 是 | 用户ID |

**成功响应**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "quantity": 2,
    "total_price": 20.0,
    "created_at": "2023-10-01T12:00:00",
    "product_name": "商品A",
    "payment_id": 1,
    "paid_at": "2023-10-01T12:05:00"
  }
}
```

**失败响应**:

缺少必要参数:
```json
{
  "code": 400,
  "message": "缺少必要参数"
}
```

订单不存在:
```json
{
  "code": 404,
  "message": "订单不存在"
}
```

服务器错误:
```json
{
  "code": 500,
  "message": "获取订单详情失败: <具体错误信息>"
}
```

## API 版本

当前 API 版本为 v1，后续更新可能会引入新功能或修改现有接口。

## 联系我们

如需帮助或反馈问题，请联系开发团队。