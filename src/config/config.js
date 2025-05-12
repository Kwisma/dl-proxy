import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import chokidar from 'chokidar';

class Config {
  constructor() {
    this.baseDir = process.cwd();
    this.defaultPath = path.join(this.baseDir, 'config/default/config.yaml');
    this.userPath = path.join(this.baseDir, 'config/config/config.yaml');
    this.configData = {};
  }

  static async init() {
    if (!Config.instance) {
      Config.instance = new Config();
      await Config.instance.initConfig();
    }
    return Config.instance;
  }

  mergeConfig() {
    const defaultConfig = yaml.load(fs.readFileSync(this.defaultPath, 'utf8'));
    let userConfig = {};
    if (fs.existsSync(this.userPath)) {
      userConfig = yaml.load(fs.readFileSync(this.userPath, 'utf8')) || {};
    }
    this.configData = { ...defaultConfig, ...userConfig };
  }

  async ensureUserConfig() {
    await fsp.mkdir(path.dirname(this.userPath), { recursive: true });
    if (!fs.existsSync(this.userPath)) {
      await fsp.copyFile(this.defaultPath, this.userPath);
    }
  }

  async initConfig() {
    await this.ensureUserConfig();
    this.mergeConfig();

    chokidar.watch(this.userPath).on('change', () => {
      try {
        this.mergeConfig();
        console.log('[Config] 配置热更新完成');
      } catch (err) {
        console.error('[Config] 配置热更新失败:', err.message);
      }
    });
  }

  static async getConfig() {
    const instance = await Config.init();
    return instance.configData;
  }
}

export default Config;
