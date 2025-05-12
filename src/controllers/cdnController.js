import { handleCache, fetchFromGitHub } from '../index.js';
import mime from 'mime-types';
import path from 'path';

const handleFileRequest = async (user, repo, branch, filePath, cacheKey, req, res) => {
  try {
    const rawCacheKey = `/gh/${user}/${repo}/${branch}/${filePath}`;
    const shouldRefresh = req.query.qure !== undefined;
    const contentType = mime.lookup(filePath);

    logger.debug(`开始处理文件请求：${rawCacheKey}`);

    if (shouldRefresh) {
      logger.debug(`强制刷新缓存：${rawCacheKey}`);
      await handleCache.refreshCache(rawCacheKey);
    }

    const cached = await handleCache.get(rawCacheKey);
    if (cached) {
      logger.info(`缓存命中：${rawCacheKey}`);
      return sendOptimizedResponse(res, cached, filePath, contentType);
    }

    logger.debug(`未缓存，从GitHub获取文件：${rawCacheKey}`);

    const { data, cacheDuration } = await fetchFromGitHub(user, repo, branch, filePath, rawCacheKey);
    await handleCache.set(rawCacheKey, cacheDuration, data);
    logger.debug(`文件获取成功，已缓存。缓存有效期：${cacheDuration}秒`);

    sendOptimizedResponse(res, data, filePath, contentType);

  } catch (err) {
    handleResponseError(err, res);
  }
};

/**
 * 优化响应发送（带内容类型日志）
 */
function sendOptimizedResponse(res, data, filePath, contentType) {
  res.setHeader('Content-Type', contentType);
  logger.debug(`发送数据，长度：${data.length}字符`);
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
    logger.error(`GitHub请求失败：${err.message}`);
    return res.status(503).send('GitHub服务不可用');
  }

  // 其他服务器错误
  logger.error(`服务器错误：${err.stack || err.message}`);
  res.status(500).send('服务器内部错误');
}

export { handleFileRequest };