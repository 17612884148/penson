import cloud from "@lafjs/cloud";
import { FunctionContext } from "@lafjs/cloud";

const db = cloud.database();
const _ = db.command;

// 定义接口
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

interface ActionPayload {
  action: string;
  data: any;
}

/**
 * 留言板云函数
 * 功能：提交留言、获取留言列表、回复留言
 */
export async function main(ctx: FunctionContext) {
  const { action, data } = ctx.body as ActionPayload;
  
  // 根据action参数执行不同操作
  switch (action) {
    case 'submit': 
      return await submitFeedback(ctx);
    case 'list':
      return await getFeedbackList(ctx);
    case 'reply':
      return await replyFeedback(ctx);
    case 'stats':
      return await getFeedbackStats(ctx);
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
    
    ratings.forEach(item => {
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