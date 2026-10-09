/**
 * storage.js - 本地持久化存储与认知评估算法
 * 管理天梯最高分、各难度极速记录、历史成绩及阿优木认知评级。
 */

const STORAGE_KEYS = {
  ENDLESS_BEST: 'chimp_endless_best',
  CUSTOM_BESTS: 'chimp_custom_bests',
  HISTORY: 'chimp_game_history',
  SETTINGS: 'chimp_user_settings',
  THEME: 'chimp_theme'
};

class StorageManager {
  constructor() {
    this.endlessBest = this.loadEndlessBest();
    this.customBests = this.loadCustomBests();
    this.history = this.loadHistory();
  }

  // 读取天梯最佳成绩
  loadEndlessBest() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ENDLESS_BEST);
      return data ? JSON.parse(data) : { level: 1, numbers: 3, time: 0, date: null };
    } catch (e) {
      return { level: 1, numbers: 3, time: 0, date: null };
    }
  }

  // 保存天梯新成绩
  saveEndlessRecord(record) {
    if (!this.endlessBest.numbers || record.numbers > this.endlessBest.numbers || 
       (record.numbers === this.endlessBest.numbers && record.time < this.endlessBest.time)) {
      this.endlessBest = record;
      localStorage.setItem(STORAGE_KEYS.ENDLESS_BEST, JSON.stringify(record));
      return true; // 破纪录
    }
    return false;
  }

  // 读取自由模式各规格最佳成绩
  loadCustomBests() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_BESTS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  // 保存自由模式成绩
  saveCustomRecord(gridSize, numCount, timeMs) {
    const key = `${gridSize}x${gridSize}_${numCount}`;
    const prev = this.customBests[key];
    if (!prev || timeMs < prev.time) {
      this.customBests[key] = {
        gridSize,
        numCount,
        time: timeMs,
        date: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.CUSTOM_BESTS, JSON.stringify(this.customBests));
      return true; // 破纪录
    }
    return false;
  }

  getCustomBest(gridSize, numCount) {
    const key = `${gridSize}x${gridSize}_${numCount}`;
    return this.customBests[key] || null;
  }

  // 读取历史记录
  loadHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  // 新增单次历史记录
  addHistoryItem(entry) {
    this.history.unshift({
      id: Date.now(),
      ...entry,
      date: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    });
    // 仅保留最近 30 条
    if (this.history.length > 30) {
      this.history.pop();
    }
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
  }

  // 清空所有历史数据
  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.ENDLESS_BEST);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_BESTS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    this.endlessBest = { level: 1, numbers: 3, time: 0, date: null };
    this.customBests = {};
    this.history = [];
  }

  // 保存与读取用户个性化设置
  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  loadSettings(defaultSettings) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  }

  // 皮肤主题存储
  loadTheme() {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) || 'default';
    } catch (e) {
      return 'default';
    }
  }

  saveTheme(themeId) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, themeId);
    } catch (e) {}
  }

  // 计算大脑段位评级 (Ayumu Quotient)
  evaluateBrainRank(numberCount, avgReactionMs = 300) {
    if (numberCount <= 3) {
      return {
        title: '🌱 记忆萌芽 (Novice Brain)',
        desc: '刚刚启动大脑引擎，适合作为热身。',
        percentile: 'Top 90%'
      };
    } else if (numberCount <= 5) {
      return {
        title: '🐟 金鱼记忆过渡 (Developing Memory)',
        desc: '正在快速适应瞬间视觉记忆，请保持节奏！',
        percentile: 'Top 70%'
      };
    } else if (numberCount <= 7) {
      return {
        title: '🧠 标准成年人 (Standard Adult Human)',
        desc: '符合米勒法则(7±2)的标准人类瞬间工作记忆容量，表现稳健！',
        percentile: 'Top 45%'
      };
    } else if (numberCount <= 9) {
      return {
        title: '⚡ 高度专注者 (Sharp & Focused)',
        desc: '超越了大多数成年人！你的视觉暂留与空间坐标记忆十分出色。',
        percentile: 'Top 15%'
      };
    } else if (numberCount <= 11) {
      return {
        title: '🔥 最强大脑级 (Super Cognitive Genius)',
        desc: '已逼近人类肉眼瞬间记忆的生理上限，堪称空间记忆大师！',
        percentile: 'Top 3%'
      };
    } else {
      return {
        title: '🦍 超越黑猩猩阿优木 (Beyond Ayumu Legend)',
        desc: '不可思议！你打破了灵长类瞬间直觉记忆的认知天花板，神级反应！',
        percentile: 'Top 0.1%'
      };
    }
  }
}

window.storageManager = new StorageManager();
