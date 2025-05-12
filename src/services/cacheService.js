import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.resolve('./data');

/**
 * 生成缓存文件路径
 */
function getFilePath(cacheKey) {
  const cleanKey = cacheKey.startsWith('/') ? cacheKey.slice(1) : cacheKey;
  return path.join(CACHE_DIR, cleanKey);
}

/**
 * 确保父级目录存在
 */
async function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

const handleCache = {
  /**
   * 读取缓存，如果已过期则自动删除
   */
  async get(cacheKey) {
    try {
      const filePath = getFilePath(cacheKey);
      const metaPath = filePath + '.meta';

      const metaContent = await fs.readFile(metaPath, 'utf-8');
      const { expireAt } = JSON.parse(metaContent);

      if (Date.now() > expireAt) {
        logger.debug(`缓存已过期，删除：${cacheKey}`);
        await fs.unlink(filePath).catch(() => {});
        await fs.unlink(metaPath).catch(() => {});
        return null;
      }

      logger.debug(`读取缓存成功：${cacheKey}`);
      return await fs.readFile(filePath);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  },

  /**
   * 写入缓存及 meta 信息
   */
  async set(cacheKey, cacheDuration, bufferData) {
    const filePath = getFilePath(cacheKey);
    const metaPath = filePath + '.meta';

    await ensureDirExists(filePath);

    await fs.writeFile(filePath, bufferData);
    await fs.writeFile(metaPath, JSON.stringify({
      expireAt: Date.now() + cacheDuration * 1000
    }, null, 2));

    logger.debug(`写入缓存成功：${cacheKey}`);
    return true;
  },

  /**
   * 删除缓存及 meta
   */
  async del(cacheKey) {
    const filePath = getFilePath(cacheKey);
    const metaPath = filePath + '.meta';
    try {
      await fs.unlink(filePath);
      await fs.unlink(metaPath);
      logger.debug(`缓存删除成功：${cacheKey}`);
      return 1;
    } catch (err) {
      if (err.code === 'ENOENT') {
        logger.warn(`缓存删除失败（不存在）：${cacheKey}`);
        return 0;
      }
      throw err;
    }
  },

  /**
   * 刷新缓存（删除）
   */
  async refreshCache(cacheKey) {
    try {
      const deleted = await this.del(cacheKey);
      logger.debug(deleted === 1
        ? `缓存刷新成功: ${cacheKey}`
        : `缓存不存在，无法刷新: ${cacheKey}`);
      return deleted;
    } catch (err) {
      logger.error(`缓存刷新失败: ${err.message}`);
      throw err;
    }
  }
};

export default handleCache;
