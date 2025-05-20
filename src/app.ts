import Koa, { Context } from 'koa';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import {
  CACHE_DIR,
  ensureCacheDir,
  generateCacheKey,
  isCacheValid,
  writeContentType,
  readContentType,
  downloadToFile,
  isAllowedUrl
} from './index.js';

const app = new Koa();

app.use(async (ctx: Context) => {
  if (ctx.path === '/favicon.ico') {
    ctx.status = 204; // 无内容
    return;
  }
  const requestedPath = ctx.path.slice(1);
  if (!requestedPath || requestedPath === '/') {
    ctx.status = 400;
    ctx.body = { error: 'URL is required in path' };
    logger.mark('[Request] URL 为空，返回400');
    return;
  }

  try {
    const url = decodeURIComponent(requestedPath);

    logger.mark(`[Request] 收到请求 URL: ${url}`);

    if (!isAllowedUrl(url)) {
      ctx.status = 403;
      ctx.body = { error: 'Access to this URL is forbidden by whitelist/blacklist rules.' };
      logger.warn(`[Security] 拒绝访问 URL: ${url}`);
      return;
    }

    const key = generateCacheKey(url);
    await ensureCacheDir();
    const filePath = path.join(CACHE_DIR, key);

    let useCache = false;
    if (await isCacheValid(filePath)) {
      useCache = true;
      logger.mark('[Cache] 使用本地缓存');
    } else {
      logger.mark('[Cache] 缓存无效，重新下载');
      try {
        const contentType = await downloadToFile(url, filePath);
        await writeContentType(filePath, contentType);
      } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw err;
      }
    }

    let contentType = await readContentType(filePath);
    if (!contentType) {
      const fallback = mime.lookup(filePath) || 'application/octet-stream';
      contentType = fallback;
      logger.warn(`[Cache] Content-Type 读取失败，使用 fallback 类型: ${contentType}`);
    }

    ctx.type = contentType;
    ctx.set('X-Cache', useCache ? 'HIT' : 'MISS (stored)');
    ctx.body = fs.createReadStream(filePath);
  } catch (err: any) {
    logger.error('[Error]', err);
    ctx.status = 500;
    ctx.type = 'application/json';
    ctx.body = { error: err.message };
  }
});

export default app;
