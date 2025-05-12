import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import serve from 'koa-static';
import send from 'koa-send';
import Config from './config/config.js';
import logger from './config/logger.js';
import { handleFileRequest } from './controllers/cdnController.js';
import handleCache from './services/cacheService.js';
import fetchFromGitHub from './services/githubService.js';
import { determineCacheDuration } from './utils/helpers.js';
import { formatDuration } from './utils/formatDuration.js';
import { formatBytes } from './utils/formatBytes.js';

// 初始化应用
const app = new Koa();
const router = new Router();
const cfg = await Config.getConfig();

// 中间件配置
const configureMiddleware = () => {
  app.use(cors({
    allowMethods: ['GET', 'HEAD', 'OPTIONS'] // 允许的HTTP方法
  }));
  
  app.use(serve('./public', {
    maxage: cfg.staticCache // 静态文件缓存
  }));
};

// 通用路由处理器
const createRouteHandler = (method = 'GET') => async (ctx, next) => {
  try {
    const fullPath = ctx.params[0];
    
    // 统一日志记录
    logger.info(`[${method}] ${ctx.url}`, {
      ip: ctx.ip,
      ua: ctx.get('User-Agent')
    });

    // 路径匹配逻辑
    const matchPattern = (pattern) => {
      const match = fullPath.match(pattern);
      if (!match) return null;
      
      return {
        user: match[1],
        repo: match[2],
        branch: match[3].replace(/^refs\/heads\//, ''),
        filePath: match[4]
      };
    };

    // 尝试两种匹配模式
    const params = matchPattern(/^([^/]+)\/([^/]+)\/(refs\/heads\/[^/]+)\/(.*)$/) || 
                  matchPattern(/^([^/]+)\/([^@]+)@([^/]+)\/(.*)$/);

    if (!params) {
      ctx.status = 400;
      ctx.body = { error: 'Invalid format' };
      return;
    }

    // 构造缓存键
    const cacheKey = `${params.user}/${params.repo}@${params.branch}/${params.filePath}`;
    
    // 处理方法逻辑
    switch (method) {
      case 'GET':
        return handleFileRequest(
          params.user,
          params.repo,
          params.branch,
          params.filePath,
          cacheKey,
          ctx.request,
          ctx
        );
      
      case 'HEAD':
        // HEAD请求处理逻辑
        ctx.status = 200;
        ctx.set('Content-Length', '0');
        break;
        
      default:
        ctx.status = 405;
        ctx.set('Allow', 'GET, HEAD');
        ctx.body = { error: 'Method not allowed' };
    }
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
    logger.error(`[${method}] Error: ${err.message}`);
  }
};

// 路由配置
const configureRoutes = () => {
  // 主页路由
  router.get('/', async ctx => {
    await send(ctx, 'index.html', { root: './public' });
  });

  // 支持多种方法的CDN路由
  router.get('/gh/(.*)', createRouteHandler('GET'));
  router.head('/gh/(.*)', createRouteHandler('HEAD'));
  
  // 其他路由可在此扩展
  router.all('/gh/(.*)', ctx => {
    ctx.set('Allow', 'GET, HEAD');
    ctx.status = 405;
  });
};

// 初始化应用
const initializeApp = () => {
  configureMiddleware();
  configureRoutes();
  
  app.use(router.routes());
  app.use(router.allowedMethods({
    throw: true, // 抛出405错误
    notImplemented: ctx => { ctx.status = 501 }, // 处理未实现方法
    methodNotAllowed: ctx => { ctx.status = 405 } // 自定义405处理
  }));

  // 错误处理
  app.on('error', (err, ctx) => {
    logger.error('Server Error', {
      url: ctx.url,
      error: err.stack,
      state: ctx.state
    });
  });

  // 启动服务器
  const port = process.env.PORT || cfg.port;
  app.listen(port, () => {
    logger.info(`Server started on http://localhost:${port}`);
  });
};

initializeApp();
export {
  Config,
  logger,
  handleFileRequest,
  handleCache,
  fetchFromGitHub,
  determineCacheDuration,
  formatDuration,
  formatBytes
};
