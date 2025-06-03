import cloud from "@lafjs/cloud";
import { FunctionContext } from "@lafjs/cloud";
import { createHash } from "crypto";

const db = cloud.database();
const _ = db.command;

// 定义登录请求的接口
interface LoginRequest {
  username: string;
  password: string;
  code: string;
  uuid: string;
}

export async function main(ctx: FunctionContext) {
  const { username, password, code, uuid } = ctx.body as LoginRequest;
  
  // 查询验证码，有则删除
  const { deleted } = await db.collection('codes').where({
    type: 1,  // 登录验证码类型为1
    _id: uuid,
    code,
  }).remove();
  
  if (deleted !== 1) {
    return { error: '验证码不正确！' };
  }

  // 校验用户名和密码是否为空
  if (!username || !password) {
    return { error: "用户名或密码不能为空" };
  }

  // 查询数据库，查找符合 username 的记录
  const { data: user } = await db.collection("users").where({
    username,
    password: createHash("sha256").update(password).digest("hex"),
  }).getOne();
  
  // 检查用户是否存在和是否锁定
  if (!user) {
    return { error: "用户名或密码错误" };
  }
  
  if (user.lock === 1) {
    return { error: '用户已被锁定，请联系管理员！' };
  }

  // 更新最后登录IP
  await db.collection('users').where({ _id: user._id }).update({
    lastIp: ctx.headers['x-real-ip'] || '',
    lastLoginTime: Date.now()
  });

  // 返回登录成功信息
  return {
    ok: true,
    msg: '登录成功！',
    data: user
  };
} 