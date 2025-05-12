import axios from 'axios';
import { determineCacheDuration } from '../index.js';

// 构建 GitHub URL
const constructGitHubUrl = (user, repo, branch, filePath) => {
  const baseUrl = `https://raw.githubusercontent.com/${user}/${repo}`;
  if (branch.startsWith('refs/heads/')) {
    return `${baseUrl}/${branch}/${filePath}`;
  }
  return `${baseUrl}/${branch}/${filePath}`;
};

// 从 GitHub 获取文件
const fetchFromGitHub = async (user, repo, branch, filePath, rawCacheKey) => {
  const url = constructGitHubUrl(user, repo, branch, filePath);
  const response = await axios.get(url, { 
    headers: {
      'User-Agent': 'Mozilla/5.0'
    },
    responseType: 'arraybuffer'
  });
  logger.info(`写入缓存: ${rawCacheKey}`)
  return {
    data: Buffer.from(response.data),
    cacheDuration: determineCacheDuration(filePath)
  };
};

export default fetchFromGitHub;