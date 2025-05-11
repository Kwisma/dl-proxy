// 处理缓存逻辑
const handleCache = {
  async get(cacheKey) {
    return await client.get(cacheKey);
  },

  async set(cacheKey, data, cacheDuration) {
    await client.setEx(cacheKey, cacheDuration, data);
  },

  async del(cacheKey) {
    return await client.del(cacheKey);
  },

  async refreshCache(cacheKey) {
    try {
      const deleted = await this.del(cacheKey);
      logger.info(deleted === 1
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