import cloud from "@lafjs/cloud";
import { v4 as uuidv4 } from 'uuid';

const db = cloud.database();

/**
 * 发送验证码云函数
 * 1. 生成随机验证码
 * 2. 存储验证码
 * 3. 返回给前端
 * 
 * 实际项目中可以对接短信/邮件服务进行发送
 */
export async function main(ctx) {
  const { type = 0, email, phone } = ctx.body;
  // type: 0-注册验证码，1-登录验证码，2-重置密码验证码
  
  // 生成6位数字验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 生成uuid作为验证码ID
  const uuid = uuidv4();
  
  try {
    // 保存验证码到数据库
    const codeData = {
      _id: uuid,
      code,
      type,
      email: email || '',
      phone: phone || '',
      createdAt: Date.now(),
      expireAt: Date.now() + 300000, // 5分钟有效期
      used: false
    };
    
    await db.collection('codes').add(codeData);
    
    // 在实际项目中，这里可以调用短信或邮件服务发送验证码
    // 以下是模拟发送验证码的响应
    console.log(`向 ${email || phone} 发送验证码: ${code}`);
    
    return {
      ok: true,
      msg: '验证码已发送',
      data: {
        uuid,
        // 注意：正式环境中不要返回验证码，这里为了测试方便
        code: process.env.NODE_ENV === 'production' ? undefined : code
      }
    };
  } catch (error) {
    console.error("发送验证码错误:", error);
    return { error: "验证码发送失败，请稍后再试" };
  }
} 