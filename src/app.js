import express from 'express';
import cors from 'cors';
import cdnRoutes from './core/routes/cdnRoutes.js';
import './core/logger/logger.js';
//import './core/services/redisService.js';

const app = express();

// 中间件
app.use(cors());
app.use(express.raw());

// 路由
app.use('/', cdnRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`服务器本地地址: http://localhost:${port}`);
});
