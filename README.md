# WikimoeGuild

基于 **Vue3 + Express5 + MongoDB** 的全栈 Monorepo 项目框架，使用 pnpm workspace 管理，全局统一 ESM 规范。

---

## 目录结构

```
wikimoeGuild/
├── package.json              # 根配置，定义 monorepo 全局脚本
├── pnpm-workspace.yaml       # pnpm 工作区定义
├── scripts/
│   └── generate.js           # CRUD 代码生成器
├── .gitignore
│
├── shared/                   # ⭐ 前后端共享层
│   ├── index.js              # 统一出口
│   ├── utils/                # 通用工具函数（formatDate、numberFormat）
│   ├── constants/            # 枚举常量（ROLES、HTTP_CODE、BIZ_CODE）
│   ├── validators/           # Joi 校验规则（前后端复用）
│   └── helpers/              # 纯函数业务逻辑（getNestedValue、arrayToMap）
│
├── server/                   # 后端 Express 5
│   ├── app.js                # 应用入口
│   ├── .env                  # 环境变量（不提交 Git）
│   ├── .env.example          # 环境变量示例
│   ├── config/               # 配置（数据库连接、JWT、日志）
│   ├── models/               # Mongoose Schema
│   ├── routes/               # 路由定义
│   │   └── admin/            # 管理后台路由（含 GENERATOR 标记）
│   ├── controllers/          # 请求处理（薄层）
│   ├── services/             # 业务逻辑（核心层）
│   ├── middlewares/          # 中间件（鉴权、校验、错误处理）
│   ├── scripts/              # 脚本（seedAdmin）
│   └── utils/                # 后端专属工具（logger）
│
└── client/                   # 前端 Vue3 + Vite
    ├── index.html            # Vite 入口
    ├── vite.config.js        # Vite 配置
    └── src/
        ├── main.js           # 应用入口
        ├── App.vue           # 根组件
        ├── router/           # vue-router 路由
        ├── views/            # 页面级组件
        │   └── admin/        # 管理后台页面（kebab-case 目录）
        ├── stores/           # Pinia 状态管理
        ├── api/              # Axios 封装
        │   └── admin/        # 管理后台 API
        ├── composables/      # 组合式函数（useIsMobile、useTheme）
        ├── layouts/          # 布局组件（AdminLayout）
        ├── components/       # 通用组件（ResponsiveTable 等，自动注册）
        ├── config/           # 前端配置（adminMenu）
        └── assets/           # 静态资源
```

---

## 环境要求

| 工具    | 版本要求                   |
| ------- | -------------------------- |
| Node.js | ≥ 18                       |
| pnpm    | ≥ 9                        |
| MongoDB | 本地实例 或 Atlas 云数据库 |

### 安装 pnpm（若未安装）

```bash
npm install -g pnpm
```

---

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp server/.env.example server/.env
```

编辑 `server/.env`：

```dotenv
PORT=3000
MONGODB_URI=mongodb://localhost:27017/wikimoe-guild
LOG_LEVEL=debug
```

### 3. 初始化管理员账号

```bash
pnpm run seed:admin
```

默认管理员：`admin` / `admin123`（密码以 bcrypt 加密存储）。

### 4. 启动开发服务器

```bash
# 同时启动前后端
pnpm dev

# 或分别启动
pnpm dev:server   # 后端（端口 3000，热重载）
pnpm dev:client   # 前端（端口 5173，Vite HMR）
```

- 前端访问：http://localhost:5173
- 管理后台：http://localhost:5173/admin/login
- 后端 API：http://localhost:3000
- 健康检查：http://localhost:3000/health

> 前端已配置 Vite proxy，`/api` 请求自动转发到后端，无需处理跨域。

---

## 技术栈

| 分层         | 技术                    | 版本   |
| ------------ | ----------------------- | ------ |
| 前端框架     | Vue.js                  | 3.5.28 |
| 构建工具     | Vite                    | 7.3.1  |
| UI 组件库    | Element Plus            | 2.13.2 |
| CSS 框架     | Tailwind CSS            | 4.2.0  |
| 自动导入     | unplugin-auto-import    | 21.0.0 |
| 自动组件注册 | unplugin-vue-components | 31.0.0 |
| 状态管理     | Pinia                   | 3.0.4  |
| 请求库       | Axios                   | 1.13.5 |
| 后端框架     | Express                 | 5.2.1  |
| 数据库 ODM   | Mongoose                | 9.2.1  |
| 参数校验     | Joi                     | 18.0.2 |
| 日志系统     | Winston                 | 3.19.0 |
| 鉴权         | jsonwebtoken            | 9.0.3  |
| 密码加密     | bcryptjs                | 3.0.2  |

---

## 管理后台

### 功能特性

- **响应式布局**：桌面端侧边栏、移动端抽屉式菜单，全面适配手机平板
- **暗模式**：支持一键切换暗/亮模式，跟随系统偏好，持久化到 localStorage
- **登录鉴权**：独立管理员 JWT (admin.key)，前端路由守卫 + Axios 拦截器自动处理 401
- **错误提示**：登录页内嵌表单校验 + el-alert 错误展示，CRUD 页统一 ElMessage 反馈
- **ResponsiveTable**：自定义响应式表格组件，桌面端渲染标准 el-table，移动端自动切换卡片布局

### 页面结构

| 页面     | 路由               | 说明                        |
| -------- | ------------------ | --------------------------- |
| 登录     | `/admin/login`     | 管理员登录                  |
| 仪表盘   | `/admin/dashboard` | 欢迎卡片、系统状态          |

---

## CRUD 代码生成器

一键生成完整的前后端 CRUD 模块：

```bash
pnpm run gen <中文名> <驼峰英文名>
```

### 示例

```bash
pnpm run gen 示例 example
```

### 命名转换规则

| 输入          | PascalCase    | kebab-case     |
| ------------- | ------------- | -------------- |
| `exampleName` | `ExampleName` | `example-name` |
| `user`        | `User`        | `user`         |

### 生成内容

每次执行生成 **7 个文件** + 自动更新 **5 个索引文件**：

| 生成文件                                            | 用途             |
| --------------------------------------------------- | ---------------- |
| `server/models/{PascalCase}.js`                     | Mongoose Schema  |
| `shared/validators/{camelCase}Validator.js`         | Joi 校验规则     |
| `server/services/admin/{camelCase}Service.js`       | 业务逻辑（CRUD） |
| `server/controllers/admin/{camelCase}Controller.js` | 请求处理         |
| `server/routes/admin/{camelCase}Routes.js`          | Express 路由     |
| `client/src/api/admin/{camelCase}.js`               | 前端 API 封装    |
| `client/src/views/admin/{kebab-case}/index.vue`     | CRUD 管理页面    |

自动更新的索引文件：

- `shared/validators/index.js` — 导出校验 Schema
- `server/routes/admin/index.js` — 注册路由（import + use）
- `client/src/router/index.js` — 注册前端路由
- `client/src/config/adminMenu.js` — 注册侧栏菜单

### 生成后步骤

1. 编辑 `server/models/{PascalCase}.js` 添加业务字段
2. 同步更新 `shared/validators/{camelCase}Validator.js` 校验规则
3. 同步更新 `client/src/views/admin/{kebab-case}/index.vue` 表格列和表单字段
4. 重启后端：`pnpm dev:server`

### 幂等性

生成器支持幂等执行——重复运行同一模块不会重复创建文件或注册，已存在的文件和注册项会自动跳过。

---

## 响应式表格组件

项目内置 `ResponsiveTable` 和 `ResponsiveTableColumn` 组件，替代原生 `el-table` / `el-table-column`：

- **桌面端**：渲染标准 Element Plus 表格
- **移动端**（< 768px）：自动切换为卡片列表布局
- **API 兼容**：props 与 `el-table` / `el-table-column` 完全一致，零成本替换

```vue
<ResponsiveTable :data="tableData" stripe>
  <ResponsiveTableColumn prop="title" label="标题" />
  <ResponsiveTableColumn label="操作" fixed="right" card-action>
    <template #default="{ row }">
      <el-button link @click="handleEdit(row)">编辑</el-button>
    </template>
  </ResponsiveTableColumn>
</ResponsiveTable>
```

额外 props：

| 组件                    | Prop               | 说明                           |
| ----------------------- | ------------------ | ------------------------------ |
| `ResponsiveTable`       | `mobileBreakpoint` | 移动端断点（默认 768）         |
| `ResponsiveTableColumn` | `cardHidden`       | 移动端卡片模式下隐藏该列       |
| `ResponsiveTableColumn` | `cardAction`       | 移动端卡片模式下作为操作区显示 |

---

## 暗模式

管理后台顶栏右侧提供暗/亮模式切换按钮：

- 首次访问跟随系统偏好
- 切换后持久化到 `localStorage`（key: `admin-theme`）
- 同时生效于 Element Plus 组件（dark CSS 变量）和 Tailwind CSS（`dark:` 变体）

技术实现：通过 `useTheme` composable 控制 `<html class="dark">`，配合 `element-plus/theme-chalk/dark/css-vars.css` 和 Tailwind CSS 4 的 `@custom-variant dark`。

---

## 开发指南

### 在 shared 中添加公共代码

```js
// server 中
import { registerSchema, ROLES, HTTP_CODE } from 'shared'

// client 中（通过 vite alias）
import { formatDate } from '@shared'
```

### 使用自动导入

`vite.config.js` 已配置 `unplugin-auto-import`，以下内容无需手动 import：

- Vue 所有 API：`ref`、`computed`、`watch`、`onMounted` 等
- vue-router：`useRouter`、`useRoute`
- pinia：`defineStore`

组件自动注册（`unplugin-vue-components`）：

- `src/components/` 下的组件自动全局可用（如 `ResponsiveTable`、`ResponsiveTableColumn`）
- Element Plus 组件按需自动导入

### JWT 密钥管理

JWT 密钥以文件形式存储在 `server/keys/` 目录中，启动时自动生成：

| 文件                    | 用途                    |
| ----------------------- | ----------------------- |
| `server/keys/user.key`  | 用户界面 token 签发验证 |
| `server/keys/admin.key` | 管理后台 token 签发验证 |

- 首次启动自动生成 64 字节强随机密钥（权限 `0o600`）
- `server/keys/` 已加入 `.gitignore`，绝不提交
- 多实例部署需手动同步 `keys/` 目录

修改 token 过期时间：编辑 `server/config/jwt.js`

```js
export const JWT_CONFIG = {
  user: { expiresIn: '7d' }, // 用户界面
  admin: { expiresIn: '2h' } // 管理后台
}
```

### JWT 鉴权

```js
import { authUser, authAdmin } from '../middlewares/auth.js'

router.get('/profile', authUser, controller.getProfile) // 用户
router.get('/admin/data', authAdmin, controller.getData) // 管理员
```

---

## 构建部署

### 构建前端

```bash
pnpm build:client
```

产物输出到 `client/dist/`。

### 启动生产后端

```bash
cd server && node app.js
```

---

## API 接口

### 公开接口

| 方法 | 路径                  | 描述         |
| ---- | --------------------- | ------------ |
| POST | `/api/users/register` | 用户注册     |
| POST | `/api/users/login`    | 用户登录     |
| GET  | `/api/users/profile`  | 当前用户信息 |
| GET  | `/health`             | 健康检查     |

### 管理后台接口

| 方法   | 路径                      | 描述         |
| ------ | ------------------------- | ------------ |
| POST   | `/api/admin/auth/login`   | 管理员登录   |
| GET    | `/api/admin/auth/profile` | 管理员信息   |
| GET    | `/api/admin/{module}`     | 列表（分页） |
| GET    | `/api/admin/{module}/:id` | 详情         |
| POST   | `/api/admin/{module}`     | 创建         |
| PUT    | `/api/admin/{module}/:id` | 更新         |
| DELETE | `/api/admin/{module}/:id` | 删除         |

> `{module}` 为生成器创建的模块路径（kebab-case）。

---

## 注意事项

- 所有子包均为 **ESM**（`"type": "module"`），使用 `import/export`
- 密码使用 `bcrypt.genSaltSync(10)` + `bcrypt.hashSync()` 加密存储
- `server/.env` 和 `server/keys/` 已加入 `.gitignore`，不提交版本库
- 生成器使用 `// ===GENERATOR_XXX===` 标记注释作为插入点，请勿删除
- `client/src/auto-imports.d.ts` 和 `client/src/components.d.ts` 为插件自动生成
