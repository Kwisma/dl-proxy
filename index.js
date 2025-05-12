import express from 'express';
import cors from 'cors';
import { Config, router} from './src/index.js';

const app = express();
const cfg = await Config.getConfig()

// 中间件
app.use(cors());
app.use(express.raw());

// 路由
app.use('/', router);

const port = process.env.PORT || cfg.port;
app.listen(port, () => {
  logger.info(`服务器本地地址: http://localhost:${port}`);
});
