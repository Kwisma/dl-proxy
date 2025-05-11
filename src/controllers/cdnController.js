import handleCache from '../services/cacheService.js';
import fetchFromGitHub from '../services/githubService.js';

// 处理文件请求
const handleFileRequest = async (user, repo, branch, filePath, cacheKey, req, res) => {
  try {
    const fullCacheKey = `/gh/${user}/${repo}/${branch}/${filePath}`;
    const shouldRefresh = req.query.qure !== undefined;
    res.setHeader('Content-Type', 'text/plain');

    if (shouldRefresh) {
      await handleCache.refreshCache(fullCacheKey);
    }

    const cached = await handleCache.get(fullCacheKey);
    if (cached) {
      logger.info(`命中缓存: ${fullCacheKey}`);
      return res.send(cached);
    }

    const { data, cacheDuration } = await fetchFromGitHub(user, repo, branch, filePath);
    await handleCache.set(fullCacheKey, data, cacheDuration);
    res.send(data);
  } catch (err) {
    logger.error(err.message);
    if (err.response) {
      return res.status(err.response.status).send(`GitHub 错误: ${err.response.statusText}`);
    }
    res.status(500).send('内部服务器错误');
  }
};

export { handleFileRequest };