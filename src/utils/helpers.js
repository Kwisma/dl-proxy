// 动态设置缓存时长
const determineCacheDuration = (filePath, cfg) => {
  // 如果是特定类型的文件（如图片、CSS、JS），可以考虑延长缓存时长
  if (filePath.endsWith('.css') || filePath.endsWith('.js') || filePath.endsWith('.jpg') || filePath.endsWith('.png')) {
    return cfg.cacheDuration;
  }
  return cfg.defaultTTL;
};

export { determineCacheDuration };