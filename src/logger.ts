import log4js from 'log4js';
import { config } from './index.js';
// 定义 logger 方法参数类型，这里用any[]，也可以细化为具体类型
type LogMethod = (...args: any[]) => void;
const logLevel = 'info'
interface Logger {
  trace: LogMethod;
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  fatal: LogMethod;
  mark: LogMethod;
}

async function createLogger() {
  // 设置进程时区为中国标准时间
  process.env.TZ = 'Asia/Shanghai';

  log4js.configure({
    appenders: {
      console: {
        type: 'console',
        layout: {
          type: 'pattern',
          pattern: '%[[dl-proxy][%d{hh:mm:ss.SSS}][%4.4p]%] %m'
        }
      },
      fileAppender: {
        type: 'file',
        filename: 'logs/console.log',
        pattern: 'yyyy-MM-dd.log',
        numBackups: 15,
        alwaysIncludePattern: true,
        layout: {
          type: 'pattern',
          pattern: '[dl-proxy][%d{yyyy-MM-dd hh:mm:ss}][%4.4p] %m'
        }
      },
      command: {
        type: 'dateFile',
        filename: 'logs/command',
        pattern: 'yyyy-MM-dd.log',
        numBackups: 15,
        alwaysIncludePattern: true,
        layout: {
          type: 'pattern',
          pattern: '[%d{hh:mm:ss.SSS}][%4.4p] %m'
        }
      },
      error: {
        type: 'file',
        filename: 'logs/error.log',
        alwaysIncludePattern: true,
        layout: {
          type: 'pattern',
          pattern: '[%d{hh:mm:ss.SSS}][%4.4p] %m'
        }
      }
    },
    categories: {
      default: { appenders: ['console', 'fileAppender'], level: config.logLevel || 'info' },
      command: { appenders: ['console', 'command'], level: 'warn' },
      error: { appenders: ['console', 'command', 'error'], level: 'error' }
    }
  });

  const defaultLogger = log4js.getLogger('message');
  const commandLogger = log4js.getLogger('command');
  const errorLogger = log4js.getLogger('error');

  const logger: Logger = {
    trace: (...args: Parameters<typeof defaultLogger.trace>) => defaultLogger.trace(...args),
    debug: (...args: Parameters<typeof defaultLogger.trace>) => defaultLogger.debug(...args),
    info: (...args: Parameters<typeof defaultLogger.trace>) => defaultLogger.info(...args),
    warn: (...args: Parameters<typeof defaultLogger.trace>) => commandLogger.warn(...args),
    error: (...args: Parameters<typeof defaultLogger.trace>) => errorLogger.error(...args),
    fatal: (...args: Parameters<typeof defaultLogger.trace>) => errorLogger.fatal(...args),
    mark: (...args: Parameters<typeof defaultLogger.trace>) => errorLogger.mark(...args),
  };

  return logger;
}

const logger = await createLogger();

declare global {
  var logger: Logger;
}

global.logger = logger;

export default logger;
