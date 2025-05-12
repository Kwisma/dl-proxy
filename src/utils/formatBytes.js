/**
 * 将字节大小格式化为易读的带单位字符串
 * @param {number} bytes - 要格式化的字节数
 * @param {number} [decimals=2] - 保留的小数位数
 * @returns {string} 格式化后的字符串
 * 
 * @example
 * formatBytes(1024); // 返回 "1 KB"
 * formatBytes(1048576); // 返回 "1 MB"
 * formatBytes(1234, 0); // 返回 "1 KB"
 */
function formatBytes(bytes, decimals = 2) {
  if (!Number.isFinite(bytes)) {
    throw new TypeError('字节数必须是有效数字');
  }
  
  if (bytes < 0) {
    throw new RangeError('字节数不能为负数');
  }

  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // 处理过大的单位索引
  const unitIndex = Math.min(i, sizes.length - 1);
  const unit = sizes[unitIndex];
  
  // 特殊处理0位小数的情况
  if (dm === 0) {
    return `${Math.round(bytes / Math.pow(k, unitIndex))} ${unit}`;
  }
  
  return `${parseFloat((bytes / Math.pow(k, unitIndex)).toFixed(dm))} ${unit}`;
}

export { formatBytes };