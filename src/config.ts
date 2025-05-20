import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

type Config = { [key: string]: any };

const defaultConfigPath = path.resolve(process.cwd(), 'config/default/config.yaml');
const userConfigPath = path.resolve(process.cwd(), 'config/config/config.yaml');

// 单例配置对象（导出时引用）
export const config: Config = {};

// 读取 YAML 文件
function readYamlConfig(filePath: string): Config {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return yaml.parse(content);
  } catch (e) {
    console.warn(`无法读取配置文件 ${filePath}, 使用空配置`, e);
    return {};
  }
}

// 自动生成用户配置文件
function ensureUserConfigExists() {
  if (!fs.existsSync(userConfigPath)) {
    const userConfigDir = path.dirname(userConfigPath);
    if (!fs.existsSync(userConfigDir)) {
      fs.mkdirSync(userConfigDir, { recursive: true });
    }
    fs.copyFileSync(defaultConfigPath, userConfigPath);
  }
}

// 加载并更新 config 对象属性
function loadConfig() {
  const defaultConfig = readYamlConfig(defaultConfigPath);
  const userConfig = fs.existsSync(userConfigPath) ? readYamlConfig(userConfigPath) : {};
  // 清空旧配置
  for (const key of Object.keys(config)) {
    delete config[key];
  }
  // 合并新配置赋值给 config 对象
  Object.assign(config, { ...defaultConfig, ...userConfig });
}

// 初始化
ensureUserConfigExists();
loadConfig();

// 监听用户配置变化，自动热加载更新 config 对象
fs.watch(userConfigPath, (eventType) => {
  if (eventType === 'change') {
    logger.info('用户配置文件变更，重新加载配置');
    loadConfig();
  }
});
