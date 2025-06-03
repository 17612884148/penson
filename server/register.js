import cloud from "@lafjs/cloud";
import { createHash } from "crypto";

const db = cloud.database();
const _ = db.command;

/**
 * 用户注册云函数
 */
export async function main(ctx) {
  const { username, password, email, phone, code, uuid } = ctx.body;
  
  // 查询验证码，有则删除
  const { deleted } = await db.collection('codes').where({ 
    type: 0, // 注册验证码类型为0
    _id: uuid, 
    code 
  }).remove();
  
  if (deleted !== 1) {
    return { error: '验证码不正确！' };
  }
  
  // 校验用户名和密码是否为空
  if (!username || !password) {
    return { error: "用户名或密码不能为空" };
  }
  
  // 查询是否已存在相同用户名
  const { total } = await db.collection("users").where({ username }).count();
  
  if (total > 0) {
    return { error: "用户名已存在" };
  }
  
  // 查询是否已存在相同邮箱
  if (email) {
    const { total: emailTotal } = await db.collection("users").where({ email }).count();
    if (emailTotal > 0) {
      return { error: "邮箱已被使用" };
    }
  }
  
  // 查询是否已存在相同手机号
  if (phone) {
    const { total: phoneTotal } = await db.collection("users").where({ phone }).count();
    if (phoneTotal > 0) {
      return { error: "手机号已被使用" };
    }
  }
  
  // 创建用户
  const userData = {
    username,
    password: createHash("sha256").update(password).digest("hex"),
    email: email || '',
    phone: phone || '',
    role: 'user', // 默认为普通用户
    createTime: Date.now(),
    lastLoginTime: null,
    lastIp: ctx.headers['x-real-ip'] || '',
    lock: 0 // 0 未锁定，1 锁定
  };
  
  // 写入数据库
  const result = await db.collection('users').add(userData);
  
  if (result.id) {
    return {
      ok: true,
      msg: '注册成功！',
      data: {
        id: result.id,
        username,
        email,
        phone,
        role: 'user'
      }
    };
  } else {
    return { error: "注册失败，请稍后再试" };
  }
} 