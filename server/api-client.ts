/**
 * 留言板API客户端
 * 用于前端调用留言板相关的云函数
 */

// API基础URL，根据实际部署环境修改
const API_BASE_URL = 'https://your-laf-app.laf.run';

// 定义响应接口
interface ApiResponse<T = any> {
  ok?: boolean;
  error?: string;
  msg?: string;
  data?: T;
}

// 定义留言数据接口
interface FeedbackData {
  name: string;
  phone?: string;
  wechat?: string;
  message: string;
  messageType: 'question' | 'suggestion' | 'problem' | 'other';
  rating?: number;
}

// 定义留言列表参数接口
interface FeedbackListParams {
  page?: number;
  pageSize?: number;
  filter?: 'all' | 'replied' | 'unreplied';
}

// 定义登录凭据接口
interface LoginCredentials {
  username: string;
  password: string;
  code: string;
  uuid: string;
}

// 定义回复数据接口
interface ReplyData {
  id: string;
  reply: string;
}

/**
 * 提交留言
 * @param {FeedbackData} data 留言数据
 * @returns {Promise<ApiResponse>} 提交结果
 */
export async function submitFeedback(data: FeedbackData): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'submit',
        data
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('提交留言错误:', error);
    return { error: '网络错误，请稍后再试' };
  }
}

/**
 * 获取留言列表
 * @param {FeedbackListParams} params 分页和筛选参数
 * @returns {Promise<ApiResponse>} 留言列表数据
 */
export async function getFeedbackList(params: FeedbackListParams = {}): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'list',
        data: params
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('获取留言列表错误:', error);
    return { error: '网络错误，请稍后再试' };
  }
}

/**
 * 获取留言统计数据
 * @returns {Promise<ApiResponse>} 统计数据
 */
export async function getFeedbackStats(): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'stats'
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('获取留言统计错误:', error);
    return { error: '网络错误，请稍后再试' };
  }
}

/**
 * 管理员登录
 * @param {LoginCredentials} credentials 登录凭据
 * @returns {Promise<ApiResponse>} 登录结果
 */
export async function adminLogin(credentials: LoginCredentials): Promise<ApiResponse> {
  try {
    const { username, password, code, uuid } = credentials;
    
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, code, uuid })
    });
    
    return await response.json();
  } catch (error) {
    console.error('管理员登录错误:', error);
    return { error: '网络错误，请稍后再试' };
  }
}

/**
 * 管理员获取留言列表
 * @param {Object} params 查询参数
 * @param {string} token 管理员令牌
 * @returns {Promise<ApiResponse>} 留言列表数据
 */
export async function getAdminFeedbackList(params: any, token: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'list',
        data: params
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('管理员获取留言列表错误:', error);
    return { error: '网络错误，请稍后再试' };
  }
}

/**
 * 管理员回复留言
 * @param {ReplyData} data 回复数据
 * @param {string} token 管理员令牌
 * @returns {Promise<ApiResponse>} 回复结果
 */
export async function replyFeedback(data: ReplyData, token: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'reply',
        data
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('回复留言错误:', error);
    return { error: '网络错误，请稍后再试' };
  }
}

/**
 * 管理员删除留言
 * @param {string} id 留言ID
 * @param {string} token 管理员令牌
 * @returns {Promise<ApiResponse>} 删除结果
 */
export async function deleteFeedback(id: string, token: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'delete',
        data: { id }
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('删除留言错误:', error);
    return { error: '网络错误，请稍后再试' };
  }
}

/**
 * 发送验证码
 * @param {Object} data 发送验证码所需数据
 * @returns {Promise<ApiResponse>} 发送结果
 */
export async function sendCode(data: { type?: number; email?: string; phone?: string }): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return await response.json();
  } catch (error) {
    console.error('发送验证码错误:', error);
    return { error: '网络错误，请稍后再试' };
  }
}

/**
 * 注册账户
 * @param {Object} data 注册数据
 * @returns {Promise<ApiResponse>} 注册结果
 */
export async function register(data: {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  code: string;
  uuid: string;
}): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return await response.json();
  } catch (error) {
    console.error('注册错误:', error);
    return { error: '网络错误，请稍后再试' };
  }
} 