import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { config } from './index.js';

export const CACHE_CONFIG = {
  maxAge: config.cacheMaxAge * 60 * 1000,
  maxSize: config.maxSize * 1024 * 1024,
};

export const CACHE_DIR = path.resolve(process.cwd(), 'cache');

export async function ensureCacheDir() {
  try {
    await fsp.mkdir(CACHE_DIR, { recursive: true });
  } catch (e) {
    logger.error('[Cache] 创建缓存目录失败:', e);
  }
}

export function generateCacheKey(url: string): string {
  return createHash('md5').update(url).digest('hex');
}

export async function isCacheValid(filePath: string): Promise<boolean> {
  try {
    const stat = await fsp.stat(filePath);
    const valid = (Date.now() - stat.mtimeMs) <= CACHE_CONFIG.maxAge;
    logger.mark(`[Cache] 文件 ${filePath} 存在，${valid ? '未过期' : '已过期'}`);
    return valid;
  } catch {
    logger.mark(`[Cache] 文件 ${filePath} 不存在`);
    return false;
  }
}

export async function writeContentType(filePath: string, contentType: string) {
  try {
    await fsp.writeFile(filePath + '.meta', contentType, 'utf8');
  } catch (e) {
    logger.error('[Cache] 写入 Content-Type 失败:', e);
  }
}

export async function readContentType(filePath: string): Promise<string | null> {
  try {
    return await fsp.readFile(filePath + '.meta', 'utf8');
  } catch {
    return null;
  }
}
