/**
 * game.js - 瞬时记忆游戏核心状态机与逻辑控制
 */

const GAME_STATES = {
  IDLE: 'IDLE',
  COUNTDOWN: 'COUNTDOWN',
  MEMORIZE: 'MEMORIZE',
  RECALL: 'RECALL',
  OVER: 'OVER'
};

const GAME_MODES = {
  CUSTOM: 'CUSTOM',
  ENDLESS: 'ENDLESS'
};

class ChimpGame {
  constructor(options = {}) {
    this.mode = GAME_MODES.CUSTOM;
    this.state = GAME_STATES.IDLE;

    // 自定义模式参数
    this.gridSize = 4; // 4x4
    this.numCount = 5;
    this.flashDuration = 3.0; // 秒
    this.countdownSeconds = 3;

    // 天梯挑战模式参数
    this.endlessLevel = 1;
    this.endlessLives = 3;
    this.endlessMaxNumbers = 3;

    // 运行时临时状态
    this.gridData = []; // 存所有格子的状态: { index, number, isActive, isFound }
    this.expectedNextNumber = 1;
    this.comboCount = 0;
    this.timerCountdown = null;
    this.timerFlash = null;

    // 毫秒级性能计时
    this.recallStartTime = 0;
    this.recallEndTime = 0;
    this.tapTimestamps = [];

    // 回调事件
    this.onStateChange = options.onStateChange || (() => {});
    this.onProgressUpdate = options.onProgressUpdate || (() => {});
    this.onGameFinish = options.onGameFinish || (() => {});
  }

  // 切换游戏模式
  setMode(mode) {
    if (this.state !== GAME_STATES.IDLE && this.state !== GAME_STATES.OVER) {
      this.resetToIdle();
    }
    this.mode = mode;
    if (mode === GAME_MODES.ENDLESS) {
      this.resetEndlessSession();
    }
    this.onStateChange(this.state, { mode: this.mode });
  }

  resetEndlessSession() {
    this.endlessLevel = 1;
    this.endlessLives = 3;
    this.endlessMaxNumbers = 3;
  }

  // 更新自定义难度配置
  updateCustomConfig({ gridSize, numCount, flashDuration, countdownSeconds }) {
    if (gridSize !== undefined) this.gridSize = parseInt(gridSize, 10);
    if (numCount !== undefined) this.numCount = parseInt(numCount, 10);
    if (flashDuration !== undefined) this.flashDuration = parseFloat(flashDuration);
    if (countdownSeconds !== undefined) this.countdownSeconds = parseInt(countdownSeconds, 10);

    // 安全边界校验：数字数量不得超过网格容量
    const maxCells = this.gridSize * this.gridSize;
    if (this.numCount > maxCells) {
      this.numCount = maxCells;
    }
  }

  // 获取当前局的数字量与记忆时长（适配天梯与自定义模式）
  getCurrentParams() {
    if (this.mode === GAME_MODES.CUSTOM) {
      return {
        gridSize: this.gridSize,
        count: this.numCount,
        flashTime: this.flashDuration
      };
    } else {
      // 天梯模式：根据当前关卡动态计算数字量与网格
      const count = 2 + this.endlessLevel; // Lv1=3, Lv2=4, Lv3=5...
      let size = 4;
      if (count <= 9) size = 4;
      else if (count <= 16) size = 5;
      else size = 6;

      // 随着关卡提高，曝光时间适当递减
      let flashTime = 3.0;
      if (count >= 10) flashTime = 2.0;
      else if (count >= 7) flashTime = 2.5;

      return {
        gridSize: size,
        count: count,
        flashTime: flashTime
      };
    }
  }

  // 开始新挑战
  startRound() {
    this.clearAllTimers();
    const params = this.getCurrentParams();
    this.setupGrid(params.gridSize, params.count);

    this.expectedNextNumber = 1;
    this.comboCount = 0;
    this.tapTimestamps = [];

    // 通知前端网格结构与参数就绪
    this.onProgressUpdate({
      type: 'ROUND_START',
      gridSize: params.gridSize,
      count: params.count
    });

    // 进入倒计时状态
    this.setState(GAME_STATES.COUNTDOWN);
    this.runCountdown(this.countdownSeconds);
  }

  // 生成网格与随机洗牌数字
  setupGrid(size, count) {
    const totalCells = size * size;
    this.gridData = [];

    for (let i = 0; i < totalCells; i++) {
      this.gridData.push({
        index: i,
        number: null,
        isActive: false,
        isFound: false
      });
    }

    // 随机抽取 count 个唯一索引
    const indices = Array.from({ length: totalCells }, (_, i) => i);
    // Fisher-Yates 洗牌
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const selectedIndices = indices.slice(0, count);
    selectedIndices.forEach((cellIdx, numIndex) => {
      this.gridData[cellIdx].isActive = true;
      this.gridData[cellIdx].number = numIndex + 1; // 从 1 开始排
    });
  }

  // 运行开始前倒计时 (3 -> 2 -> 1)
  runCountdown(secondsRemaining) {
    let current = secondsRemaining;
    
    const tick = () => {
      if (current > 0) {
        window.soundEngine.playCountdownTick();
        this.onProgressUpdate({
          type: 'COUNTDOWN_TICK',
          seconds: current
        });
        current--;
        this.timerCountdown = setTimeout(tick, 1000);
      } else {
        // 倒计时结束，立即曝光数字
        window.soundEngine.playCountdownStart();
        this.beginMemorizePhase();
      }
    };

    tick();
  }

  // 进入记忆阶段 (显示所有随机数字)
  beginMemorizePhase() {
    this.setState(GAME_STATES.MEMORIZE);
    const params = this.getCurrentParams();

    this.onProgressUpdate({
      type: 'MEMORIZE_START',
      duration: params.flashTime
    });

    this.timerFlash = setTimeout(() => {
      this.beginRecallPhase();
    }, params.flashTime * 1000);
  }

  // 进入回忆盲点阶段 (数字隐藏，玩家从小到大点击)
  beginRecallPhase() {
    this.setState(GAME_STATES.RECALL);
    this.recallStartTime = performance.now();
    this.tapTimestamps = [this.recallStartTime];

    this.onProgressUpdate({
      type: 'RECALL_START',
      totalNumbers: this.getCurrentParams().count
    });
  }

  // 玩家点击格子处理
  handleCellClick(cellIndex) {
    if (this.state !== GAME_STATES.RECALL) return;

    const cell = this.gridData[cellIndex];
    if (!cell) return;

    const params = this.getCurrentParams();
    const now = performance.now();
    this.tapTimestamps.push(now);

    // 1. 如果点击了非数字格子 (空白背景)
    if (!cell.isActive) {
      return; // 忽略或无效点击
    }

    // 2. 如果点击了已经正确消除过的格子
    if (cell.isFound) {
      return;
    }

    // 3. 点击的数字与当前期待的下一个数字匹配
    if (cell.number === this.expectedNextNumber) {
      cell.isFound = true;
      this.comboCount++;
      window.soundEngine.playTap(this.comboCount);
      window.soundEngine.vibrate(15);

      this.expectedNextNumber++;

      this.onProgressUpdate({
        type: 'CELL_CORRECT',
        cellIndex: cellIndex,
        number: cell.number,
        expectedNext: this.expectedNextNumber,
        totalNumbers: params.count
      });

      // 是否已成功全部连击完成
      if (this.expectedNextNumber > params.count) {
        this.finishRound(true);
      }
    } else {
      // 4. 点错了数字！
      window.soundEngine.playError();
      window.soundEngine.vibrate([40, 60, 40]);

      this.onProgressUpdate({
        type: 'CELL_WRONG',
        cellIndex: cellIndex,
        wrongNumber: cell.number,
        expectedNext: this.expectedNextNumber
      });

      this.finishRound(false, cellIndex);
    }
  }

  // 结算当前局
  finishRound(isSuccess, errorCellIndex = null) {
    this.recallEndTime = performance.now();
    this.setState(GAME_STATES.OVER);

    const params = this.getCurrentParams();
    const totalTimeMs = Math.max(0, this.recallEndTime - this.recallStartTime);
    const avgReactionMs = params.count > 0 ? Math.round(totalTimeMs / params.count) : 0;

    let endlessNewBest = false;
    let customNewBest = false;

    if (isSuccess) {
      window.soundEngine.playSuccess();
      if (this.mode === GAME_MODES.CUSTOM) {
        customNewBest = window.storageManager.saveCustomRecord(params.gridSize, params.count, totalTimeMs);
        window.storageManager.addHistoryItem({
          mode: '自由模式',
          grid: `${params.gridSize}×${params.gridSize}`,
          numbers: params.count,
          timeMs: totalTimeMs,
          success: true
        });
      } else {
        // 天梯升级
        this.endlessMaxNumbers = Math.max(this.endlessMaxNumbers, params.count);
        endlessNewBest = window.storageManager.saveEndlessRecord({
          level: this.endlessLevel,
          numbers: params.count,
          time: totalTimeMs,
          date: new Date().toISOString()
        });
        window.storageManager.addHistoryItem({
          mode: `天梯第 ${this.endlessLevel} 关`,
          grid: `${params.gridSize}×${params.gridSize}`,
          numbers: params.count,
          timeMs: totalTimeMs,
          success: true
        });
      }
    } else {
      // 失败记录
      if (this.mode === GAME_MODES.CUSTOM) {
        window.storageManager.addHistoryItem({
          mode: '自由模式',
          grid: `${params.gridSize}×${params.gridSize}`,
          numbers: params.count,
          timeMs: totalTimeMs,
          success: false
        });
      } else {
        this.endlessLives--;
        window.storageManager.addHistoryItem({
          mode: `天梯第 ${this.endlessLevel} 关`,
          grid: `${params.gridSize}×${params.gridSize}`,
          numbers: params.count,
          timeMs: totalTimeMs,
          success: false
        });
      }
    }

    const rankEval = window.storageManager.evaluateBrainRank(params.count, avgReactionMs);

    this.onGameFinish({
      success: isSuccess,
      mode: this.mode,
      gridSize: params.gridSize,
      totalNumbers: params.count,
      totalTimeMs: totalTimeMs,
      avgReactionMs: avgReactionMs,
      rank: rankEval,
      isNewRecord: endlessNewBest || customNewBest,
      errorCellIndex: errorCellIndex,
      endlessLevel: this.endlessLevel,
      endlessLives: this.endlessLives
    });
  }

  // 清除一切定时器
  clearAllTimers() {
    if (this.timerCountdown) {
      clearTimeout(this.timerCountdown);
      this.timerCountdown = null;
    }
    if (this.timerFlash) {
      clearTimeout(this.timerFlash);
      this.timerFlash = null;
    }
  }

  resetToIdle() {
    this.clearAllTimers();
    this.setState(GAME_STATES.IDLE);
  }

  setState(newState) {
    this.state = newState;
    this.onStateChange(this.state, { mode: this.mode });
  }
}

window.ChimpGame = ChimpGame;
window.GAME_STATES = GAME_STATES;
window.GAME_MODES = GAME_MODES;
