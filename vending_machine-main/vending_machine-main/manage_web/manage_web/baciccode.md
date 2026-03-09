# 安装 Node.js (建议 v18+)
# 然后安装 Vite
npm install -g create-vite

npm create vite@latest my-app --template react
cd my-app
npm install

npm run dev

项目结构说明
src/
├── App.jsx        # 主组件
├── main.jsx       # 应用入口
├── assets/        # 静态资源
├── components/    # 推荐存放组件
├── pages/         # 页面组件
└── styles/        # 样式文件

常用开发任务
1. 创建新组件
// src/components/Button.jsx
export default function Button({ children }) {
  return <button className="btn">{children}</button>;
}
2. 添加路由 (需安装 react-router-dom)
npm install react-router-dom
// main.jsx
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
3. 使用 CSS 模块
/* src/styles/button.module.css */
.btn {
  padding: 8px 16px;
  background: #646cff;
}
import styles from './styles/button.module.css';

function Button() {
  return <button className={styles.btn}>Click</button>;
}
4. 环境变量配置
创建 .env 文件：

VITE_API_URL=https://api.example.com
使用：

const apiUrl = import.meta.env.VITE_API_URL;