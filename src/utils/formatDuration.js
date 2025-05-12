/**
 * 将秒数格式化为易读的多单位时间字符串
 * @param {number} seconds - 要格式化的秒数
 * @param {boolean} [showAllUnits=false] - 是否显示所有单位（false时只显示最大单位）
 * @returns {string} 格式化后的时间字符串
 * 
 * @example
 * formatDuration(3661); // 返回 "1小时1分钟1秒"
 * formatDuration(3661, false); // 返回 "1小时"
 */
function formatDuration(seconds, showAllUnits = true) {
  if (!Number.isInteger(seconds)) {
    throw new TypeError('秒数必须是整数');
  }
  
  if (seconds < 0) {
    throw new RangeError('秒数不能为负数');
  }

  if (seconds === 0) return '0秒';

  if (showAllUnits) {
    // 显示所有单位模式
    if (seconds >= 86400) {
      const days = Math.floor(seconds / 86400);
      const remaining = formatDuration(seconds % 86400, true);
      return remaining ? `${days}天${remaining}` : `${days}天`;
    }
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const remaining = formatDuration(seconds % 3600, true);
      return remaining ? `${hours}小时${remaining}` : `${hours}小时`;
    }
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remaining = formatDuration(seconds % 60, true);
      return remaining ? `${minutes}分钟${remaining}` : `${minutes}分钟`;
    }
    return `${seconds}秒`;
  } else {
    // 只显示最大单位模式
    if (seconds >= 86400) {
      const days = Math.round(seconds / 86400 * 10) / 10; // 保留1位小数
      return `${days}天`;
    }
    if (seconds >= 3600) {
      const hours = Math.round(seconds / 3600 * 10) / 10;
      return `${hours}小时`;
    }
    if (seconds >= 60) {
      const minutes = Math.round(seconds / 60 * 10) / 10;
      return `${minutes}分钟`;
    }
    return `${seconds}秒`;
  }
}

export { formatDuration };