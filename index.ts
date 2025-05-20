import { app } from './src/index.js';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`服务器已启动，正在监听: http://localhost:${PORT}`);
});
