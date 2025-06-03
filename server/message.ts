import cloud from "@lafjs/cloud";
import { FunctionContext } from "@lafjs/cloud";
import { createHash } from "crypto";
import { v4 as uuidv4 } from 'uuid';

const db = cloud.database();
const _ = db.command;

// ======================= 类型定义 =======================

interface FeedbackData {
  name: string;
  phone: string;
  wechat: string;
  message: string;
  messageType: 'question' | 'suggestion' | 'problem' | 'other';
  rating: number;
  timestamp: number;
  replied: boolean;
  reply: string;
  replyTimestamp: number | null;
  ip: string;
  userAgent: string;
}

interface UserData {
  username: string;
  password: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  createTime: number;
  lastLoginTime: number | null;
  lastIp: string;
  lock: 0 | 1; // 0 未锁定，1 锁定
}

interface CodeData {
  _id: string;
  code: string;
  type: 0 | 1 | 2; // 0注册验证码，1登录验证码，2重置密码验证码
  email: string;
  phone: string;
  createdAt: number;
  expireAt: number;
  used: boolean;
}

interface ActionPayload {
  action: string;
  data: any;
}

interface AdminFeedbackListParams {
  page?: number;
  pageSize?: number;
  filter?: 'all' | 'replied' | 'unreplied';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
}

interface LoginRequest {
  username: string;
  password: string;
  code: string;
  uuid: string;
}

interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  code: string;
  uuid: string;
}

interface CodeRequest {
  type?: 0 | 1 | 2;
  email?: string;
  phone?: string;
}

interface QueryFeedbackParams {
  password: string;
  page?: number;
  pageSize?: number;
  filter?: 'all' | 'replied' | 'unreplied';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
  startDate?: number;
  endDate?: number;
}

// ======================= 入口函数 =======================

/**
 * 统一入口函数
 * 根据action参数路由到不同的功能处理
 */
export async function main(ctx: FunctionContext) {
  const { module, action, data } = ctx.body as { module: string; action: string; data: any };
  
  // 根据module和action参数执行不同操作
  switch (module) {
    case 'feedback': 
      return await handleFeedback(ctx, action);
    case 'admin':
      return await handleAdmin(ctx, action);
    case 'auth':
      return await handleAuth(ctx, action);
    default:
      return { error: "无效的模块类型" };
  }
}

// ======================= 留言板功能模块 =======================

/**
 * 处理留言板相关功能
 */
async function handleFeedback(ctx: FunctionContext, action: string) {
  switch (action) {
    case 'submit': 
      return await submitFeedback(ctx);
    case 'list':
      return await getFeedbackList(ctx);
    case 'reply':
      return await replyFeedback(ctx);
    case 'stats':
      return await getFeedbackStats(ctx);
    case 'query':
      return await queryFeedback(ctx);
    default:
      return { error: "无效的操作类型" };
  }
}

/**
 * 提交留言
 */
async function submitFeedback(ctx: FunctionContext) {
  try {
    const { name, phone, wechat, message, messageType, rating } = ctx.body.data;
    
    // 验证必填字段
    if (!name || !message || !messageType) {
      return { error: "姓名、留言内容和留言类型为必填项" };
    }
    
    // 创建留言记录
    const feedbackData: FeedbackData = {
      name,
      phone: phone || '',
      wechat: wechat || '',
      message,
      messageType,
      rating: parseInt(rating) || 5,
      timestamp: Date.now(),
      replied: false,
      reply: '',
      replyTimestamp: null,
      ip: ctx.headers['x-real-ip'] || '',
      userAgent: ctx.headers['user-agent'] || ''
    };
    
    // 写入数据库
    const result = await db.collection('feedback').add(feedbackData);
    
    if (result.id) {
      return {
        ok: true,
        msg: '留言提交成功',
        data: { id: result.id }
      };
    } else {
      return { error: "留言提交失败" };
    }
  } catch (error) {
    console.error("提交留言错误:", error);
    return { error: "服务器错误，请稍后再试" };
  }
}

/**
 * 获取留言列表
 * 支持分页和筛选已回复/未回复
 */
async function getFeedbackList(ctx: FunctionContext) {
  try {
    const { page = 1, pageSize = 10, filter = 'all' } = ctx.body.data;
    const skip = (page - 1) * pageSize;
    
    // 构建查询条件
    let query: Record<string, any> = {};
    if (filter === 'replied') {
      query.replied = true;
    } else if (filter === 'unreplied') {
      query.replied = false;
    }
    
    // 查询总数
    const countResult = await db.collection('feedback').where(query).count();
    
    // 查询留言列表，按时间倒序排列
    const { data } = await db.collection('feedback')
      .where(query)
      .orderBy('timestamp', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();
    
    return {
      ok: true,
      data: {
        list: data,
        total: countResult.total,
        page,
        pageSize,
        pages: Math.ceil(countResult.total / pageSize)
      }
    };
  } catch (error) {
    console.error("获取留言列表错误:", error);
    return { error: "服务器错误，请稍后再试" };
  }
}

/**
 * 获取留言统计数据
 */
async function getFeedbackStats(ctx: FunctionContext) {
  try {
    // 统计总留言数
    const totalCount = await db.collection('feedback').count();
    
    // 统计已回复数量
    const repliedCount = await db.collection('feedback').where({ replied: true }).count();
    
    // 获取所有评分，计算平均分
    const { data: ratings } = await db.collection('feedback')
      .field({ rating: 1 })
      .get();
    
    let ratingSum = 0;
    let ratingCount = 0;
    let ratingDistribution = [0, 0, 0, 0, 0]; // 1-5星的数量统计
    
    ratings.forEach((item: any) => {
      if (item.rating && item.rating >= 1 && item.rating <= 5) {
        ratingSum += item.rating;
        ratingCount++;
        ratingDistribution[item.rating - 1]++;
      }
    });
    
    const averageRating = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : "0";
    
    return {
      ok: true,
      data: {
        total: totalCount.total,
        replied: repliedCount.total,
        unreplied: totalCount.total - repliedCount.total,
        averageRating,
        ratingCount,
        ratingDistribution
      }
    };
  } catch (error) {
    console.error("获取留言统计错误:", error);
    return { error: "服务器错误，请稍后再试" };
  }
}

/**
 * 查询留言数据（需要密码验证）
 */
async function queryFeedback(ctx: FunctionContext) {
  try {
    const params = ctx.body.data as QueryFeedbackParams;
    
    // 验证密码
    const ADMIN_PASSWORD = "123456"; // 设置固定密码
    
    if (!params.password || params.password !== ADMIN_PASSWORD) {
      return { error: "密码错误，无权访问留言数据" };
    }
    
    // 参数处理
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const filter = params.filter || 'all';
    const sortBy = params.sortBy || 'timestamp';
    const sortOrder = params.sortOrder || 'desc';
    const keyword = params.keyword || '';
    const skip = (page - 1) * pageSize;
    
    // 构建查询条件
    let query: Record<string, any> = {};
    
    // 处理过滤条件
    if (filter === 'replied') {
      query.replied = true;
    } else if (filter === 'unreplied') {
      query.replied = false;
    }
    
    // 处理日期范围
    if (params.startDate && params.endDate) {
      query.timestamp = {
        $gte: params.startDate,
        $lte: params.endDate
      };
    } else if (params.startDate) {
      query.timestamp = { $gte: params.startDate };
    } else if (params.endDate) {
      query.timestamp = { $lte: params.endDate };
    }
    
    // 处理关键词搜索
    if (keyword) {
      query = {
        ...query,
        $or: [
          { name: new RegExp(keyword, 'i') },
          { message: new RegExp(keyword, 'i') },
          { wechat: new RegExp(keyword, 'i') },
          { phone: new RegExp(keyword, 'i') }
        ]
      };
    }
    
    // 查询总数
    const countResult = await db.collection('feedback').where(query).count();
    
    // 查询留言列表，按指定条件排序
    const { data } = await db.collection('feedback')
      .where(query)
      .orderBy(sortBy, sortOrder)
      .skip(skip)
      .limit(pageSize)
      .get();
    
    // 统计数据
    const repliedCount = await db.collection('feedback')
      .where({ ...query, replied: true })
      .count();
    
    return {
      ok: true,
      data: {
        list: data,
        total: countResult.total,
        replied: repliedCount.total,
        unreplied: countResult.total - repliedCount.total,
        page,
        pageSize,
        pages: Math.ceil(countResult.total / pageSize),
        filter,
        keyword
      }
    };
  } catch (error) {
    console.error("查询留言数据错误:", error);
    return { error: "服务器错误，请稍后再试" };
  }
}

// ======================= 管理员功能模块 =======================

/**
 * 处理管理员相关功能
 */
async function handleAdmin(ctx: FunctionContext, action: string) {
  // 验证管理员权限
  const isAdmin = await verifyAdmin(ctx);
  if (!isAdmin) {
    return { error: "无权限访问管理功能" };
  }
  
  switch (action) {
    case 'list': 
      return await getAdminFeedbackList(ctx);
    case 'reply':
      return await adminReplyFeedback(ctx);
    case 'delete':
      return await deleteFeedback(ctx);
    case 'batchDelete':
      return await batchDeleteFeedback(ctx);
    case 'stats':
      return await getAdminFeedbackStats(ctx);
    default:
      return { error: "无效的操作类型" };
  }
}

/**
 * 验证管理员权限
 * 从请求头中获取token并验证
 */
async function verifyAdmin(ctx: FunctionContext): Promise<boolean> {
  try {
    // 从请求头获取token
    const token = ctx.headers['authorization'];
    if (!token) {
      return false;
    }
    
    // 解析token (实际应用中应该使用JWT等更安全的方式)
    // 这里使用简化的方式，实际项目中根据您的登录系统进行调整
    const userId = token.replace('Bearer ', '');
    
    // 查询用户
    const { data: user } = await db.collection('users')
      .where({ _id: userId, role: 'admin' })
      .getOne();
    
    return !!user;
  } catch (error) {
    console.error("验证管理员权限错误:", error);
    return false;
  }
}

/**
 * 获取留言列表 (管理员版)
 * 支持更高级的筛选和排序
 */
async function getAdminFeedbackList(ctx: FunctionContext) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      filter = 'all', 
      sortBy = 'timestamp', 
      sortOrder = 'desc',
      keyword = '' 
    } = ctx.body.data as AdminFeedbackListParams;
    
    const skip = (page - 1) * pageSize;
    
    // 构建查询条件
    let query: Record<string, any> = {};
    if (filter === 'replied') {
      query.replied = true;
    } else if (filter === 'unreplied') {
      query.replied = false;
    }
    
    // 关键词搜索
    if (keyword) {
      query = {
        ...query,
        $or: [
          { name: new RegExp(keyword, 'i') },
          { message: new RegExp(keyword, 'i') },
          { wechat: new RegExp(keyword, 'i') },
          { phone: new RegExp(keyword, 'i') }
        ]
      };
    }
    
    // 查询总数
    const countResult = await db.collection('feedback').where(query).count();
    
    // 查询留言列表
    const { data } = await db.collection('feedback')
      .where(query)
      .orderBy(sortBy, sortOrder)
      .skip(skip)
      .limit(pageSize)
      .get();
    
    return {
      ok: true,
      data: {
        list: data,
        total: countResult.total,
        page,
        pageSize,
        pages: Math.ceil(countResult.total / pageSize)
      }
    };
  } catch (error) {
    console.error("获取管理员留言列表错误:", error);
    return { error: "服务器错误，请稍后再试" };
  }
}

/**
 * 管理员回复留言
 */
async function adminReplyFeedback(ctx: FunctionContext) {
  try {
    const { id, reply } = ctx.body.data;
    
    // 验证参数
    if (!id || !reply) {
      return { error: "留言ID和回复内容不能为空" };
    }
    
    // 更新留言
    const result = await db.collection('feedback').doc(id).update({
      reply,
      replied: true,
      replyTimestamp: Date.now()
    });
    
    if (result.updated) {
      return {
        ok: true,
        msg: '回复成功'
      };
    } else {
      return { error: "回复失败，可能留言不存在" };
    }
  } catch (error) {
    console.error("回复留言错误:", error);
    return { error: "服务器错误，请稍后再试" };
  }
}

/**
 * 删除单条留言
 */
async function deleteFeedback(ctx: FunctionContext) {
  try {
    const { id } = ctx.body.data;
    
    if (!id) {
      return { error: "留言ID不能为空" };
    }
    
    const result = await db.collection('feedback').doc(id).remove();
    
    if (result.deleted) {
      return {
        ok: true,
        msg: '删除成功'
      };
    } else {
      return { error: "删除失败，可能留言不存在" };
    }
  } catch (error) {
    console.error("删除留言错误:", error);
    return { error: "服务器错误，请稍后再试" };
  }
}

/**
 * 批量删除留言
 */
async function batchDeleteFeedback(ctx: FunctionContext) {
  try {
    const { ids } = ctx.body.data as { ids: string[] };
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return { error: "请选择要删除的留言" };
    }
    
    const result = await db.collection('feedback').where({
      _id: _.in(ids)
    }).remove();
    
    return {
      ok: true,
      msg: `成功删除${result.deleted}条留言`
    };
  } catch (error) {
    console.error("批量删除留言错误:", error);
    return { error: "服务器错误，请稍后再试" };
  }
}

/**
 * 获取留言统计数据 (管理员版)
 * 包含更详细的统计信息
 */
async function getAdminFeedbackStats(ctx: FunctionContext) {
  try {
    // 基础统计
    const totalCount = await db.collection('feedback').count();
    const repliedCount = await db.collection('feedback').where({ replied: true }).count();
    
    // 按留言类型统计
    const questionCount = await db.collection('feedback').where({ messageType: 'question' }).count();
    const suggestionCount = await db.collection('feedback').where({ messageType: 'suggestion' }).count();
    const problemCount = await db.collection('feedback').where({ messageType: 'problem' }).count();
    const otherCount = await db.collection('feedback').where({ messageType: 'other' }).count();
    
    // 评分统计
    const { data: ratings } = await db.collection('feedback')
      .field({ rating: 1 })
      .get();
    
    let ratingSum = 0;
    let ratingCount = 0;
    let ratingDistribution = [0, 0, 0, 0, 0]; // 1-5星的数量统计
    
    ratings.forEach((item: any) => {
      if (item.rating && item.rating >= 1 && item.rating <= 5) {
        ratingSum += item.rating;
        ratingCount++;
        ratingDistribution[item.rating - 1]++;
      }
    });
    
    const averageRating = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : "0";
    
    // 按月统计趋势数据
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    
    const { data: monthlyData } = await db.collection('feedback')
      .where({
        timestamp: _.gte(sixMonthsAgo.getTime())
      })
      .field({ timestamp: 1 })
      .get();
    
    // 按月分组
    const monthlyStats: Record<string, number> = {};
    const currentDate = new Date();
    for (let i = 0; i <= 5; i++) {
      const d = new Date();
      d.setMonth(currentDate.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyStats[monthKey] = 0;
    }
    
    monthlyData.forEach((item: any) => {
      const date = new Date(item.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyStats[monthKey] !== undefined) {
        monthlyStats[monthKey]++;
      }
    });
    
    return {
      ok: true,
      data: {
        total: totalCount.total,
        replied: repliedCount.total,
        unreplied: totalCount.total - repliedCount.total,
        types: {
          question: questionCount.total,
          suggestion: suggestionCount.total,
          problem: problemCount.total,
          other: otherCount.total
        },
        rating: {
          average: averageRating,
          count: ratingCount,
          distribution: ratingDistribution
        },
        monthly: monthlyStats
      }
    };
  } catch (error) {
    console.error("获取管理员留言统计错误:", error);
    return { error: "服务器错误，请稍后再试" };
  }
}

// ======================= 用户认证模块 =======================

/**
 * 处理用户认证相关功能
 */
async function handleAuth(ctx: FunctionContext, action: string) {
  switch (action) {
    case 'login': 
      return await login(ctx);
    case 'register':
      return await register(ctx);
    case 'sendCode':
      return await sendCode(ctx);
    default:
      return { error: "无效的操作类型" };
  }
}

/**
 * 用户/管理员登录
 */
async function login(ctx: FunctionContext) {
  const { username, password, code, uuid } = ctx.body.data as LoginRequest;
  
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

/**
 * 用户注册
 */
async function register(ctx: FunctionContext) {
  const { username, password, email, phone, code, uuid } = ctx.body.data as RegisterRequest;
  
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
  const userData: UserData = {
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
        role: 'user' as const
      }
    };
  } else {
    return { error: "注册失败，请稍后再试" };
  }
}

/**
 * 回复留言
 * 需要管理员权限
 */
async function replyFeedback(ctx: FunctionContext) {
  try {
    const { id, reply } = ctx.body.data;
    
    // 验证参数
    if (!id || !reply) {
      return { error: "留言ID和回复内容不能为空" };
    }
    
    // 验证用户权限
    // 这里应该添加对管理员权限的验证
    // 简单示例，实际应用中应该从ctx中获取用户信息并验证权限
    const user = ctx.user;
    if (!user || user.role !== 'admin') {
      return { error: "无权限执行此操作" };
    }
    
    // 更新留言
    const result = await db.collection('feedback').doc(id).update({
      reply,
      replied: true,
      replyTimestamp: Date.now()
    });
    
    if (result.updated) {
      return {
        ok: true,
        msg: '回复成功'
      };
    } else {
      return { error: "回复失败，可能留言不存在" };
    }
  } catch (error) {
    console.error("回复留言错误:", error);
    return { error: "服务器错误，请稍后再试" };
  }
}

/**
 * 发送验证码
 */
async function sendCode(ctx: FunctionContext) {
  const { type = 0, email, phone } = ctx.body.data as CodeRequest;
  
  // 生成6位数字验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 生成uuid作为验证码ID
  const uuid = uuidv4();
  
  try {
    // 保存验证码到数据库
    const codeData: CodeData = {
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