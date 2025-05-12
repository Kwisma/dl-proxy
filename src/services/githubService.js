import axios from 'axios';
import { determineCacheDuration } from '../index.js';

// 构建 GitHub URL
const constructGitHubUrl = (user, repo, branch, filePath, cfg) => {
  const baseUrl = cfg.githubproxy 
    ? `${cfg.githubproxy}/https://raw.githubusercontent.com/${user}/${repo}`
    : `https://raw.githubusercontent.com/${user}/${repo}`;

  // 规范化分支名称（处理 refs/heads/ 前缀）
  const normalizedBranch = branch.startsWith('refs/heads/') 
    ? branch.replace('refs/heads/', '')
    : branch;

  return `${baseUrl}/${normalizedBranch}/${filePath}`;
};

/**
 * 从 GitHub 获取文件
 * @param {string} user - GitHub 用户名
 * @param {string} repo - 仓库名
 * @param {string} branch - 分支名
 * @param {string} filePath - 文件路径
 * @param {string} rawCacheKey - 原始缓存键
 * @param {object} cfg - 配置对象
 * @param {number} [retryCount=0] - 当前重试次数（内部使用）
 * @returns {Promise<{data: Buffer, cacheDuration: number}>}
 */
const fetchFromGitHub = async (user, repo, branch, filePath, rawCacheKey, cfg, retryCount = 0) => {
  const maxRetries = cfg.maxRetries;
  const retryDelay = cfg.retryDelay;
  
  try {
    const url = constructGitHubUrl(user, repo, branch, filePath, cfg);
    logger.debug(`尝试从GitHub获取文件: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': cfg.userAgent,
        'Accept': 'application/vnd.github.v3.raw'
      },
      responseType: 'arraybuffer',
      timeout: cfg.timeout
    });

    logger.info(`成功获取文件并写入缓存: ${rawCacheKey}`, {
      url,
      status: response.status,
      size: response.data.length
    });

    return {
      data: Buffer.from(response.data),
      cacheDuration: determineCacheDuration(filePath, cfg.cache)
    };

  } catch (error) {
    if (retryCount < maxRetries) {
      const nextRetry = retryCount + 1;
      logger.warn(`请求失败，准备重试 (${nextRetry}/${maxRetries}): ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay * (nextRetry * 0.5 + 1)));
      return fetchFromGitHub(user, repo, branch, filePath, rawCacheKey, cfg, nextRetry);
    }

    logger.error(`从GitHub获取文件失败: ${error.message}`, {
      user,
      repo,
      branch,
      filePath,
      attempts: retryCount + 1
    });

    throw enhanceGitHubError(error);
  }
};

/**
 * 增强GitHub错误信息
 */
function enhanceGitHubError(error) {
  if (error.response) {
    // GitHub API 返回的错误
    const { status, statusText, data } = error.response;
    const message = `GitHub API错误: ${status} ${statusText}`;
    
    // 尝试解析错误详情
    let details;
    try {
      const jsonData = JSON.parse(data.toString());
      details = jsonData.message || '无额外错误信息';
    } catch {
      details = data.toString().substring(0, 100);
    }

    error.message = `${message} - ${details}`;
    error.statusCode = status;
  } else if (error.request) {
    // 请求已发出但没有收到响应
    error.message = `无法连接到GitHub: ${error.message}`;
  }

  return error;
}

export default fetchFromGitHub;