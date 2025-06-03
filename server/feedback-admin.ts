import cloud from "@lafjs/cloud";
import { FunctionContext } from "@lafjs/cloud";
import { createHash } from "crypto";

const db = cloud.database();
const _ = db.command;

// 定义接口
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

/**
 * 留言板管理后台云函数
 * 功能：管理员查看、回复、删除留言等
 */
export async function main(ctx: FunctionContext) {
  const { action, data } = ctx.body as ActionPayload;
  
  // 验证管理员权限
  const isAdmin = await verifyAdmin(ctx);
  if (!isAdmin) {
    return { error: "无权限访问管理功能" };
  }
  
  // 根据action参数执行不同操作
  switch (action) {
    case 'list': 
      return await getAdminFeedbackList(ctx);
    case 'reply':
      return await replyFeedback(ctx);
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
async function replyFeedback(ctx: FunctionContext) {
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
    
    ratings.forEach(item => {
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
    
    monthlyData.forEach(item => {
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