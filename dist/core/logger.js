import log4js from 'log4js';
const logLevel = 'info';
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
            default: { appenders: ['console', 'fileAppender'], level: logLevel },
            command: { appenders: ['console', 'command'], level: 'warn' },
            error: { appenders: ['console', 'command', 'error'], level: 'error' }
        }
    });
    const defaultLogger = log4js.getLogger('message');
    const commandLogger = log4js.getLogger('command');
    const errorLogger = log4js.getLogger('error');
    const logger = {
        trace: (...args) => defaultLogger.trace(...args),
        debug: (...args) => defaultLogger.debug(...args),
        info: (...args) => defaultLogger.info(...args),
        warn: (...args) => commandLogger.warn(...args),
        error: (...args) => errorLogger.error(...args),
        fatal: (...args) => errorLogger.fatal(...args),
        mark: (...args) => errorLogger.mark(...args),
    };
    return logger;
}
const logger = await createLogger();
global.logger = logger;
export default logger;
