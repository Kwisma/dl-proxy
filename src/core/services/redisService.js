import { exec } from 'child_process';
import redis from 'redis';

// 检查 Redis 是否已经启动
function checkRedisStatus() {
  return new Promise((resolve, reject) => {
    exec('pgrep redis-server', (err, stdout, stderr) => {
      if (err || stderr) {
        reject('Redis 服务未启动');
      } else {
        resolve('Redis 服务已运行');
      }
    });
  });
}

// 启动 Redis 服务
function startRedisServer() {
  return new Promise((resolve, reject) => {
    exec('redis-server --daemonize yes', (err, stdout, stderr) => {
      if (err || stderr) {
        reject('启动 Redis 服务失败');
      } else {
        resolve('Redis 服务启动成功');
      }
    });
  });
}

// 创建 Redis 客户端
async function createRedisClient() {
  try {
    // 首先检查 Redis 是否已启动
    const status = await checkRedisStatus();
    logger.info(status);
  } catch (error) {
    // 如果 Redis 没有启动，则尝试启动它
    logger.info('Redis 服务没有启动，正在启动 Redis...');
    try {
      const server = await startRedisServer();
      logger.info(server);
    } catch (startError) {
      logger.error(startError);
      throw new Error('无法启动 Redis 服务');
    }
  }

  // 创建 Redis 客户端并连接
  const client = redis.createClient({ url: 'redis://localhost:6379' });
  
  try {
    await client.connect();
    logger.info('Redis 客户端连接成功');
    return client;
  } catch (err) {
    logger.error('Redis 客户端连接失败:', err);
    throw err;
  }
}
global.client = await createRedisClient()
export default client;