# 留言板云函数

这个目录包含了工具箱网站留言板功能的云函数代码，基于 Laf 云开发平台。支持 TypeScript。

## 目录结构

- `feedback.ts` - 留言板主要功能云函数，包括提交留言、获取留言列表等
- `feedback-admin.ts` - 留言板管理功能云函数，包括管理员查看、回复、删除留言等
- `login.ts` - 管理员登录云函数
- `register.ts` - 用户注册云函数
- `send-code.ts` - 发送验证码云函数
- `api-client.ts` - 前端API调用客户端
- `tsconfig.json` - TypeScript 配置文件
- `package.json` - 项目依赖配置

## 安装和构建

```bash
# 安装依赖
npm install

# 构建 TypeScript 文件
npm run build
```

构建后的 JavaScript 文件会生成在 `dist` 目录中，可以直接部署到 Laf 云开发平台。

## 数据库结构

需要在 Laf 云开发平台创建以下集合：

### feedback 集合

存储用户留言数据

```typescript
interface FeedbackData {
  _id: string; // 自动生成的ID
  name: string; // 用户姓名
  phone: string; // 联系电话
  wechat: string; // 微信号
  message: string; // 留言内容
  messageType: 'question' | 'suggestion' | 'problem' | 'other'; // 留言类型
  rating: number; // 评分1-5
  timestamp: number; // 留言时间戳
  replied: boolean; // 是否已回复
  reply: string; // 回复内容
  replyTimestamp: number | null; // 回复时间戳
  ip: string; // 用户IP地址
  userAgent: string; // 用户浏览器信息
}
```

### users 集合

存储管理员账户

```typescript
interface UserData {
  _id: string; // 自动生成的ID
  username: string; // 用户名
  password: string; // 密码哈希值
  email: string; // 邮箱
  phone: string; // 手机号
  role: 'user' | 'admin'; // 角色
  createTime: number; // 创建时间戳
  lastLoginTime: number | null; // 最后登录时间戳
  lastIp: string; // 最后登录IP
  lock: 0 | 1; // 0未锁定，1锁定
}
```

### codes 集合

存储验证码

```typescript
interface CodeData {
  _id: string; // UUID
  code: string; // 验证码
  type: 0 | 1 | 2; // 0注册验证码，1登录验证码，2重置密码验证码
  email: string; // 邮箱
  phone: string; // 手机号
  createdAt: number; // 创建时间戳
  expireAt: number; // 过期时间戳
  used: boolean; // 是否已使用
}
```

## 部署步骤

1. 在 Laf 云开发平台创建一个新应用
2. 创建上述三个数据库集合
3. 构建 TypeScript 文件
4. 创建以下云函数，并上传对应的 JavaScript 文件：
   - `feedback` - 使用 dist/feedback.js 的内容
   - `feedback-admin` - 使用 dist/feedback-admin.js 的内容
   - `login` - 使用 dist/login.js 的内容
   - `register` - 使用 dist/register.js 的内容
   - `send-code` - 使用 dist/send-code.js 的内容
5. 发布这些云函数
6. 修改 api-client.ts 中的 API_BASE_URL 为您的实际 Laf 应用地址
7. 将 api-client.ts 整合到前端项目中，或者也可以构建后使用 dist/api-client.js

## 接口调用示例

### 提交留言

```typescript
import { submitFeedback } from './api-client';

const feedback = {
  name: '张三',
  phone: '13800138000',
  wechat: 'zhangsan123',
  message: '网站很好用，希望增加更多功能',
  messageType: 'suggestion' as const,
  rating: 5
};

submitFeedback(feedback).then(result => {
  if (result.ok) {
    console.log('留言提交成功');
  } else {
    console.error('留言提交失败:', result.error);
  }
});
```

### 管理员登录

```typescript
import { adminLogin } from './api-client';

// 先获取验证码
// ...

const credentials = {
  username: 'admin',
  password: 'password123',
  code: '123456',
  uuid: 'uuid-from-send-code'
};

adminLogin(credentials).then(result => {
  if (result.ok) {
    // 保存用户信息和token
    localStorage.setItem('adminToken', result.data._id);
    console.log('登录成功');
  } else {
    console.error('登录失败:', result.error);
  }
});
```

### 管理员回复留言

```typescript
import { replyFeedback } from './api-client';

const token = localStorage.getItem('adminToken');
const replyData = {
  id: 'feedback-id',
  reply: '谢谢您的建议，我们会考虑添加更多功能'
};

replyFeedback(replyData, token).then(result => {
  if (result.ok) {
    console.log('回复成功');
  } else {
    console.error('回复失败:', result.error);
  }
});
```

## 安全建议

1. 在生产环境中，确保 `send-code.ts` 不会直接返回验证码，而是通过短信或邮件发送
2. 考虑使用 JWT 进行更安全的身份验证
3. 为 admin 相关接口添加速率限制，防止暴力攻击
4. 定期清理过期的验证码数据
5. 考虑在 feedback 集合上添加索引以提高查询性能 