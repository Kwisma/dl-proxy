import express from 'express';
import { handleFileRequest } from '../controllers/cdnController.js';

const router = express.Router();

// 主页路由
router.get('/', (req, res) => {
  res.sendFile('index.html', { root: './public' });
});

// CDN 路由
router.get('/gh/*', async (req, res) => {
  const fullPath = req.params[0];

  // 处理 /gh/user/repo/refs/heads/branch/路径 格式
  const refMatch = fullPath.match(/^([^/]+)\/([^/]+)\/(refs\/heads\/[^/]+)\/(.*)$/);

  if (refMatch) {
    const [user, repo, ref, filePath] = refMatch.slice(1);
    const branch = ref.replace(/^refs\/heads\//, '');
    const cacheKey = `${user}/${repo}@${branch}/${filePath}`;
    return handleFileRequest(user, repo, branch, filePath, cacheKey, req, res);
  }

  // 处理 /gh/user/repo@branch/路径 格式
  const repoMatch = fullPath.match(/^([^/]+)\/([^@]+)@([^/]+)\/(.*)$/);

  if (repoMatch) {
    const [user, repo, branch, filePath] = repoMatch.slice(1);
    const cacheKey = `${user}/${repo}@${branch}/${filePath}`;
    return handleFileRequest(user, repo, branch, filePath, cacheKey, req, res);
  }

  // 格式无效
  return res.status(400).send('格式无效。请使用 /gh/user/repo@branch/filepath 或 /gh/user/repo/refs/heads/branch/filepath');
});

export default router;