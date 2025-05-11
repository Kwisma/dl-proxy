import axios from 'axios';
import { determineCacheDuration } from '../../utils/helpers.js';

// 构建 GitHub URL
const constructGitHubUrl = (user, repo, branch, filePath) => {
  const baseUrl = `https://raw.githubusercontent.com/${user}/${repo}`;
  logger.info(`写入缓存: ${baseUrl}/${branch}/${filePath}`)
  if (branch.startsWith('refs/heads/')) {
    return `${baseUrl}/${branch}/${filePath}`;
  }
  return `${baseUrl}/${branch}/${filePath}`;
};

// 从 GitHub 获取文件
const fetchFromGitHub = async (user, repo, branch, filePath) => {
  const url = constructGitHubUrl(user, repo, branch, filePath);
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return {
    data: response.data,
    cacheDuration: determineCacheDuration(filePath)
  };
};

export default fetchFromGitHub;