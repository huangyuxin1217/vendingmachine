-- 创建数据库
CREATE DATABASE IF NOT EXISTS `vending_machine_manage` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `vending_machine_manage`;

-- 创建用户表
CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码',
  `balance` DECIMAL(10,2) DEFAULT 0.00 COMMENT '账户余额',
  `role` ENUM('user', 'admin') DEFAULT 'user' COMMENT '用户角色',
  `status` ENUM('active', 'inactive') DEFAULT 'active' COMMENT '用户状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `last_login` DATETIME COMMENT '最后登录时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 创建商品表
CREATE TABLE `products` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  `name` VARCHAR(100) NOT NULL COMMENT '商品名称',
  `price` DECIMAL(5,2) NOT NULL COMMENT '商品价格',
  `stock` INT(11) DEFAULT 0 COMMENT '库存数量',
  `safe_stock` INT(11) DEFAULT 10 COMMENT '安全库存',
  `category` VARCHAR(50) DEFAULT NULL COMMENT '商品分类',
  `description` TEXT COMMENT '商品描述',
  `image_url` VARCHAR(255) COMMENT '商品图片',
  `status` ENUM('上架', '下架') DEFAULT '上架' COMMENT '商品状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- 创建售货机表
CREATE TABLE `vending_machines` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '售货机ID',
  `name` VARCHAR(50) NOT NULL COMMENT '售货机名称',
  `location` VARCHAR(100) NOT NULL COMMENT '售货机位置',
  `status` ENUM('在线', '离线', '故障', '维护中') DEFAULT '离线' COMMENT '售货机状态',
  `temperature` DECIMAL(5,2) COMMENT '温度',
  `humidity` DECIMAL(5,2) COMMENT '湿度',
  `last_online` DATETIME COMMENT '最后在线时间',
  `last_maintenance` DATETIME COMMENT '最后维护时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售货机表';

-- 创建订单表
CREATE TABLE `orders` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_number` VARCHAR(50) NOT NULL UNIQUE COMMENT '订单编号',
  `user_id` INT(11) NOT NULL COMMENT '用户ID',
  `product_id` INT(11) NOT NULL COMMENT '商品ID',
  `vending_machine_id` INT(11) NOT NULL COMMENT '售货机ID',
  `quantity` INT(11) NOT NULL COMMENT '购买数量',
  `total_price` DECIMAL(10,2) NOT NULL COMMENT '订单总价',
  `status` ENUM('待支付', '已支付', '已完成', '已取消') DEFAULT '待支付' COMMENT '订单状态',
  `payment_method` VARCHAR(20) COMMENT '支付方式',
  `paid_at` DATETIME COMMENT '支付时间',
  `completed_at` DATETIME COMMENT '完成时间',
  `cancelled_at` DATETIME COMMENT '取消时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`vending_machine_id`) REFERENCES `vending_machines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 创建支付表
CREATE TABLE `payments` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '支付ID',
  `order_id` INT(11) NOT NULL COMMENT '订单ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '支付金额',
  `method` VARCHAR(50) NOT NULL COMMENT '支付方式',
  `paid_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '支付时间',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付表';

-- 创建库存日志表
CREATE TABLE `inventory_logs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `product_id` INT(11) NOT NULL COMMENT '商品ID',
  `vending_machine_id` INT(11) NOT NULL COMMENT '售货机ID',
  `action` ENUM('补货', '销售', '调整') NOT NULL COMMENT '操作类型',
  `quantity` INT(11) NOT NULL COMMENT '变动数量',
  `operator_id` INT(11) COMMENT '操作人ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`vending_machine_id`) REFERENCES `vending_machines` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存日志表';

-- 创建销售统计表
CREATE TABLE `sales_statistics` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '统计ID',
  `date` DATE NOT NULL COMMENT '统计日期',
  `vending_machine_id` INT(11) COMMENT '售货机ID',
  `product_id` INT(11) COMMENT '商品ID',
  `sales_quantity` INT(11) DEFAULT 0 COMMENT '销售数量',
  `sales_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '销售金额',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_date_machine_product` (`date`, `vending_machine_id`, `product_id`),
  FOREIGN KEY (`vending_machine_id`) REFERENCES `vending_machines` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售统计表';

-- 创建操作日志表
CREATE TABLE `operation_logs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `admin_id` INT(11) NOT NULL COMMENT '管理员ID',
  `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
  `target_type` VARCHAR(50) COMMENT '操作对象类型',
  `target_id` INT(11) COMMENT '操作对象ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 添加索引
CREATE INDEX `idx_orders_created_at` ON `orders` (`created_at`);
CREATE INDEX `idx_orders_status` ON `orders` (`status`);
CREATE INDEX `idx_products_category` ON `products` (`category`);
CREATE INDEX `idx_products_status` ON `products` (`status`);
CREATE INDEX `idx_vending_machines_status` ON `vending_machines` (`status`);