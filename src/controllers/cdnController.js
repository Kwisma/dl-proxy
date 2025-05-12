import { handleCache, fetchFromGitHub, Config, formatDuration, formatBytes } from '../index.js';
import mime from 'mime-types';
import path from 'path';
import { createHash } from 'crypto';

const handleFileRequest = async (user, repo, branch, filePath, cacheKey, request, ctx) => {
  try {
    const rawCacheKey = `/gh/${user}/${repo}/${branch}/${filePath}`;
    const shouldRefresh = ctx.query.qure !== undefined;
    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    const cfg = await Config.getConfig();

    // 强制刷新缓存逻辑
    if (shouldRefresh) {
      logger.debug(`强制刷新缓存：${rawCacheKey}`);
      await handleCache.refreshCache(rawCacheKey);
    }

    // 尝试从缓存获取
    const cached = await handleCache.get(rawCacheKey);
    if (cached) {
      logger.debug(`缓存命中：${rawCacheKey}`);
      return sendOptimizedResponse(ctx, cached, filePath, contentType);
    }

    logger.debug(`未缓存，从GitHub获取文件：${rawCacheKey}`);

    // 从GitHub获取并缓存
    const { data, cacheDuration } = await fetchFromGitHub(
      user, 
      repo, 
      branch, 
      filePath, 
      rawCacheKey, 
      cfg.github
    );
    
    await handleCache.set(rawCacheKey, cacheDuration, data);
    logger.debug(`文件获取成功，已缓存。缓存有效期：${formatDuration(cacheDuration)}`);

    return sendOptimizedResponse(ctx, data, filePath, contentType);

  } catch (err) {
    return handleResponseError(err, ctx);
  }
};

/**
 * 优化响应发送
 */
function sendOptimizedResponse(ctx, data, filePath, contentType) {
  // 设置响应头
  ctx.set('Content-Type', contentType);
  
  // 添加缓存控制头
  ctx.set('Cache-Control', 'public, max-age=3600');
  
  // 对于可缓存资源添加ETag
  if (data.length > 1024) { // 只对大文件添加ETag
    const etag = createHash('md5').update(data).digest('hex');
    ctx.set('ETag', etag);
    
    // 处理If-None-Match请求头
    if (ctx.get('If-None-Match') === etag) {
      ctx.status = 304;
      return;
    }
  }

  // 设置内容处置头（特别是对于下载文件）
  if (contentType === 'application/octet-stream') {
    const filename = path.basename(filePath);
    ctx.set('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
  }

  logger.debug(`发送数据，类型：${contentType}，大小：${formatBytes(data.length)}`);
  
  // 根据数据类型决定发送方式
  if (Buffer.isBuffer(data)) {
    ctx.body = data;
  } else if (typeof data === 'object') {
    ctx.body = JSON.stringify(data);
  } else {
    ctx.body = data;
  }
}

/**
 * 增强的错误处理
 */
function handleResponseError(err, ctx) {
  // GitHub API 错误
  if (err.response) {
    const status = err.response.status;
    let message = `GitHub API错误：${status}`;
    
    // 更友好的错误消息
    switch (status) {
      case 404:
        message = '请求的资源不存在';
        break;
      case 403:
        message = '访问被拒绝，可能达到API速率限制';
        break;
      default:
        message += ` ${err.response.statusText}`;
    }
    
    logger.error(`${message}，请求路径：${err.config?.url || '未知'}`);
    
    // 对于速率限制，添加Retry-After头
    if (status === 403 && err.response.headers['x-ratelimit-remaining'] === '0') {
      const resetTime = new Date(err.response.headers['x-ratelimit-reset'] * 1000);
      ctx.set('Retry-After', resetTime.toUTCString());
    }
    
    ctx.status = status;
    ctx.body = { error: message };
    return;
  }

  // 网络错误
  if (err.request) {
    logger.error(`GitHub请求失败：${err.message}`);
    ctx.status = 503;
    ctx.body = { error: 'GitHub服务不可用' };
    return;
  }

  // 其他服务器错误
  logger.error(`服务器错误：${err.stack || err.message}`);
  ctx.status = 500;
  ctx.body = { error: '服务器内部错误' };
}

export { handleFileRequest };