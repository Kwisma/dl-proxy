import axios from 'axios';
import fs from 'fs';
import { CACHE_CONFIG } from './cache.js';
export async function downloadToFile(url, filePath) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    logger.mark(`[Download] 开始下载: ${url}`);
    const response = await axios.get(url, {
        responseType: 'stream',
        maxContentLength: CACHE_CONFIG.maxSize * 2,
        validateStatus: (status) => status >= 200 && status < 400,
    });
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
        writer.on('finish', () => {
            logger.mark(`[Download] 下载完成，写入文件: ${filePath}`);
            resolve();
        });
        writer.on('error', (err) => {
            logger.error('[Download] 写入文件错误:', err);
            reject(err);
        });
    });
    return contentType;
}
