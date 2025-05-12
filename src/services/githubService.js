import axios from 'axios';
import { determineCacheDuration } from '../index.js';

// 构建 GitHub URL
const constructGitHubUrl = (user, repo, branch, filePath, cfg) => {
  let baseUrl;  // 声明 baseUrl 变量
  // 判断是否使用代理
  if (cfg.githubproxy) {
    baseUrl = `${cfg.githubproxy}/https://raw.githubusercontent.com/${user}/${repo}`;
  } else {
    baseUrl = `https://raw.githubusercontent.com/${user}/${repo}`;
  }

  // 处理分支
  if (branch.startsWith('refs/heads/')) {
    return `${baseUrl}/${branch.replace('refs/heads/', '')}/${filePath}`;
  }

  return `${baseUrl}/${branch}/${filePath}`;
};


// 从 GitHub 获取文件
const fetchFromGitHub = async (user, repo, branch, filePath, rawCacheKey, cfg) => {
  const url = constructGitHubUrl(user, repo, branch, filePath, cfg);
  const response = await axios.get(url, { 
    headers: {
      'User-Agent': 'Mozilla/5.0'
    },
    responseType: 'arraybuffer'
  });
  logger.debug(`访问地址: ${url}`)
  logger.info(`写入缓存: ${rawCacheKey}`)
  return {
    data: Buffer.from(response.data),
    cacheDuration: determineCacheDuration(filePath, cfg)
  };
};

export default fetchFromGitHub;