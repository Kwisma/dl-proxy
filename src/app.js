import express from 'express';
import cors from 'cors';
import cdnRoutes from './routes/cdnRoutes.js';
import './config/logger.js';
import './services/redisService.js';

const app = express();

// 中间件
app.use(cors());

// 路由
app.use('/', cdnRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`服务器本地地址: http://localhost:${port}`);
});
