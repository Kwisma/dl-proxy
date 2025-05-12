import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.resolve('./data');

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function getFilePath(cacheKey) {
  return path.join(CACHE_DIR, cacheKey);
}

const handleCache = {
  async get(cacheKey) {
    try {
      await ensureCacheDir();
      const filePath = getFilePath(cacheKey);
      const stat = await fs.stat(filePath);

      const metaPath = filePath + '.meta';
      const metaContent = await fs.readFile(metaPath, 'utf-8');
      const { expireAt } = JSON.parse(metaContent);

      if (Date.now() > expireAt) {
        await fs.unlink(filePath);
        await fs.unlink(metaPath);
        return null;
      }

      return await fs.readFile(filePath);
    } catch (err) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  },

  async set(cacheKey, cacheDuration, bufferData) {
    await ensureCacheDir();
    const filePath = getFilePath(cacheKey);
    await fs.writeFile(filePath, bufferData);
    await fs.writeFile(filePath + '.meta', JSON.stringify({
      expireAt: Date.now() + cacheDuration * 1000
    }));
    return true;
  },

  async del(cacheKey) {
    try {
      const filePath = getFilePath(cacheKey);
      await fs.unlink(filePath);
      await fs.unlink(filePath + '.meta');
      return 1;
    } catch (err) {
      if (err.code === 'ENOENT') return 0;
      throw err;
    }
  },

  async refreshCache(cacheKey) {
    try {
      const deleted = await this.del(cacheKey);
      console.info(deleted === 1
        ? `缓存刷新成功: ${cacheKey}`
        : `缓存不存在，无法刷新: ${cacheKey}`);
      return deleted;
    } catch (err) {
      console.error(`缓存刷新失败: ${err.message}`);
      throw err;
    }
  }
};

export default handleCache;
