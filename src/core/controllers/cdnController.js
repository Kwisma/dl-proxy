import handleCache from '../services/cacheService.js';
import fetchFromGitHub from '../services/githubService.js';
import mime from 'mime-types';

/**
 * 增强版文件请求处理器（支持中文日志和自动 Content-Type 检测）
 */
const handleFileRequest = async (user, repo, branch, filePath, cacheKey, req, res) => {
  try {
    const fullCacheKey = `/gh/${user}/${repo}/${branch}/${filePath}`;
    const shouldRefresh = req.query.qure !== undefined;

    logger.info(`开始处理文件请求：${fullCacheKey}`);

    // 1. 缓存刷新逻辑
    if (shouldRefresh) {
      logger.info(`强制刷新缓存：${fullCacheKey}`);
      await handleCache.refreshCache(fullCacheKey);
    }

    // 2. 尝试从缓存读取
    const cached = await handleCache.get(fullCacheKey);
    if (cached) {
      logger.info(`缓存命中 [${fullCacheKey}]，数据类型：${Buffer.isBuffer(cached) ? '二进制' : '文本'}`);
      return sendOptimizedResponse(res, cached, filePath);
    }

    logger.info(`缓存未命中，从GitHub获取文件：${filePath}`);

    // 3. 从 GitHub 获取数据
    const { data, cacheDuration } = await fetchFromGitHub(user, repo, branch, filePath);
    await handleCache.set(fullCacheKey, data, cacheDuration);
    
    logger.info(`文件获取成功，已缓存。缓存有效期：${cacheDuration}秒`);
    
    // 4. 发送响应
    sendOptimizedResponse(res, data, filePath);

  } catch (err) {
    handleResponseError(err, res);
  }
};

/**
 * 优化响应发送（带内容类型日志）
 */
function sendOptimizedResponse(res, data, filePath) {
  const contentType = mime.lookup(filePath) || 'text/plain';
  res.setHeader('Content-Type', contentType);

  logger.info(`响应 Content-Type 设置为：${contentType}`);

  if (Buffer.isBuffer(data)) {
    logger.info(`发送二进制数据，长度：${data.length}字节`);
    return res.end(data);
  }
  
  logger.info(`发送文本数据，长度：${data.length}字符`);
  res.send(data);
}

/**
 * 统一错误处理（中文日志）
 */
function handleResponseError(err, res) {
  // GitHub API 错误
  if (err.response) {
    const status = err.response.status;
    const message = `GitHub API错误：${status} ${err.response.statusText}`;
    logger.error(`${message}，请求路径：${err.config?.url || '未知'}`);
    return res.status(status).send(message);
  }

  // 网络错误
  if (err.request) {
    logger.error(`GitHub请求失败：${err.message}，请求超时：${err.config?.timeout || '未设置'}ms`);
    return res.status(503).send('GitHub服务不可用');
  }

  // 其他服务器错误
  logger.error(`服务器错误：${err.stack || err.message}`);
  res.status(500).send('服务器内部错误');
}

export { handleFileRequest };