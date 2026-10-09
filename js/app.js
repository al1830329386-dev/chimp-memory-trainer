/**
 * app.js - 主控制器与 iOS UI 交互胶水层
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化核心状态与引擎
  const soundEngine = window.soundEngine;
  const storageManager = window.storageManager;

  // DOM 元素引用
  const elGameGrid = document.getElementById('game-grid');
  const elModeTitle = document.getElementById('mode-title');
  const elTabCustom = document.getElementById('tab-custom');
  const elTabEndless = document.getElementById('tab-endless');

  // 顶部看板
  const elStatTarget = document.getElementById('stat-target-number');
  const elStatProgress = document.getElementById('stat-progress');
  const elStatRecord = document.getElementById('stat-record');
  const elMiddleLabel = document.getElementById('label-middle-stat');

  // 横幅与遮罩
  const elStatusBanner = document.getElementById('game-status-banner');
  const elBannerText = document.getElementById('banner-text');
  const elBannerSubtext = document.getElementById('banner-subtext');
  const elStartOverlay = document.getElementById('start-overlay');
  const elStartTitle = document.getElementById('start-title');
  const elStartDesc = document.getElementById('start-desc');
  const elBtnStart = document.getElementById('btn-start-game');

  // 结果遮罩
  const elResultOverlay = document.getElementById('result-overlay');
  const elResultBadge = document.getElementById('result-badge-icon');
  const elResultTitle = document.getElementById('result-title');
  const elResultDesc = document.getElementById('result-desc');
  const elMetricNumbers = document.getElementById('metric-numbers');
  const elMetricTime = document.getElementById('metric-time');
  const elMetricAvgSpeed = document.getElementById('metric-avg-speed');
  const elRankName = document.getElementById('rank-name');
  const elRankTip = document.getElementById('rank-tip');
  const elBtnPlayAgain = document.getElementById('btn-play-again');
  const elBtnShareResult = document.getElementById('btn-share-result');

  // 底部控制
  const elLiveHint = document.getElementById('game-live-hint');
  const elBtnSoundToggle = document.getElementById('btn-sound-toggle');
  const elIconSoundOn = document.getElementById('icon-sound-on');
  const elIconSoundOff = document.getElementById('icon-sound-off');

  // 设置模态框
  const elBtnSettings = document.getElementById('btn-settings');
  const elModalSettings = document.getElementById('modal-settings');
  const elBtnCloseSettings = document.getElementById('btn-close-settings');
  const elGridSizeButtons = document.querySelectorAll('.grid-size-options .pill-btn');
  const elSliderNumCount = document.getElementById('slider-num-count');
  const elValNumCount = document.getElementById('val-num-count');
  const elSliderFlashTime = document.getElementById('slider-flash-time');
  const elValFlashTime = document.getElementById('val-flash-time');
  const elSliderCountdown = document.getElementById('slider-countdown-time');
  const elValCountdown = document.getElementById('val-countdown-time');
  const elSliderMaxLbl = document.getElementById('slider-max-lbl');
  const elToggleVibrate = document.getElementById('toggle-vibrate');
  const elToggleScalePitch = document.getElementById('toggle-scale-pitch');

  // 排行榜模态框
  const elBtnLeaderboard = document.getElementById('btn-leaderboard');
  const elModalLeaderboard = document.getElementById('modal-leaderboard');
  const elBtnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
  const elTabLbEndless = document.getElementById('tab-lb-endless');
  const elTabLbCustom = document.getElementById('tab-lb-custom');
  const elLbEndlessView = document.getElementById('lb-endless-content');
  const elLbCustomView = document.getElementById('lb-custom-content');
  const elEndlessHistoryList = document.getElementById('endless-history-list');
  const elCustomHistoryList = document.getElementById('custom-history-list');
  const elBtnClearHistory = document.getElementById('btn-clear-history');

  // 战绩卡片模态框
  const elModalShareCard = document.getElementById('modal-sharecard');
  const elBtnCloseShare = document.getElementById('btn-close-share');
  const elPosterDate = document.getElementById('poster-date');
  const elPosterScore = document.getElementById('poster-score-num');
  const elPosterRank = document.getElementById('poster-rank-text');
  const elPosterTime = document.getElementById('poster-time-val');
  const elPosterSpeed = document.getElementById('poster-speed-val');
  const elPosterAccuracy = document.getElementById('poster-accuracy-val');

  // 读取已保存的用户设置
  const defaultSettings = {
    gridSize: 4,
    numCount: 5,
    flashDuration: 3.0,
    countdownSeconds: 3,
    soundEnabled: true,
    scalePitch: true,
    vibrate: true
  };
  const userSettings = storageManager.loadSettings(defaultSettings);

  // 2. 实例化游戏核心
  const game = new window.ChimpGame({
    onStateChange: handleStateChange,
    onProgressUpdate: handleProgressUpdate,
    onGameFinish: handleGameFinish
  });

  // 应用用户设置到游戏引擎
  game.updateCustomConfig(userSettings);
  soundEngine.enabled = userSettings.soundEnabled;
  soundEngine.scalePitchEnabled = userSettings.scalePitch;

  // 3. UI 渲染与网格初始化
  function renderGridShell(size) {
    elGameGrid.className = `game-grid grid-${size}x${size}`;
    elGameGrid.innerHTML = '';
    const total = size * size;

    for (let i = 0; i < total; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell empty';
      cell.dataset.index = i;
      cell.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        soundEngine.initAudioContext();
        game.handleCellClick(i);
      });
      elGameGrid.appendChild(cell);
    }
  }

  function updateDashboard() {
    const params = game.getCurrentParams();

    if (game.mode === window.GAME_MODES.CUSTOM) {
      elModeTitle.textContent = '自由训练模式';
      elMiddleLabel.textContent = '已找到';
      elStatProgress.textContent = `0 / ${params.count}`;
      const best = storageManager.getCustomBest(params.gridSize, params.count);
      elStatRecord.textContent = best ? `${(best.time / 1000).toFixed(2)}s` : '--';
      elStatTarget.textContent = '1';
    } else {
      elModeTitle.textContent = `天梯挑战 · 第 ${game.endlessLevel} 关`;
      elMiddleLabel.textContent = '生命值';
      elStatProgress.textContent = '❤️'.repeat(game.endlessLives);
      elStatRecord.textContent = `${storageManager.endlessBest.numbers || 3} 个`;
      elStatTarget.textContent = '1';
    }
  }

  // 4. 游戏状态事件监听与 DOM 驱动
  function handleStateChange(state, meta) {
    if (state === window.GAME_STATES.IDLE) {
      elStatusBanner.classList.add('hidden');
      elStatusBanner.classList.remove('counting');
      elStartOverlay.classList.remove('hidden');
      elResultOverlay.classList.add('hidden');
      renderGridShell(game.getCurrentParams().gridSize);
      updateDashboard();
      elLiveHint.textContent = '点击“开始挑战”激活瞬间记忆';
    } else if (state === window.GAME_STATES.COUNTDOWN) {
      elStartOverlay.classList.add('hidden');
      elResultOverlay.classList.add('hidden');
      elStatusBanner.classList.remove('hidden');
      elStatusBanner.classList.add('counting');
      renderGridShell(game.getCurrentParams().gridSize);
      updateDashboard();
      elLiveHint.textContent = '保持专注，数字即将闪现...';
    } else if (state === window.GAME_STATES.MEMORIZE) {
      elStatusBanner.classList.remove('counting');
      elBannerText.textContent = '记住全部数字位置';
      elBannerSubtext.textContent = `${game.getCurrentParams().flashTime} 秒后数字将隐藏`;
      elLiveHint.textContent = '快速扫描并锁定所有数字方位';
      
      // 显示所有格子中的数字
      const cells = elGameGrid.querySelectorAll('.grid-cell');
      cells.forEach((cellEl, i) => {
        const item = game.gridData[i];
        if (item && item.isActive) {
          cellEl.className = 'grid-cell active revealed';
          cellEl.textContent = item.number;
        } else {
          cellEl.className = 'grid-cell empty';
          cellEl.textContent = '';
        }
      });
    } else if (state === window.GAME_STATES.RECALL) {
      elStatusBanner.classList.add('hidden');
      elLiveHint.textContent = '凭记忆，从小到大依次点击空白格子！';
      
      // 将所有数字格子变为可点击的无字盲盒
      const cells = elGameGrid.querySelectorAll('.grid-cell');
      cells.forEach((cellEl, i) => {
        const item = game.gridData[i];
        if (item && item.isActive) {
          cellEl.className = 'grid-cell active masked';
          cellEl.textContent = '';
        }
      });
    }
  }

  function handleProgressUpdate(event) {
    if (event.type === 'ROUND_START') {
      renderGridShell(event.gridSize);
      updateDashboard();
    } else if (event.type === 'COUNTDOWN_TICK') {
      elBannerText.textContent = event.seconds;
      elBannerSubtext.textContent = '准备记忆数字位置';
    } else if (event.type === 'CELL_CORRECT') {
      const cellEl = elGameGrid.querySelector(`[data-index="${event.cellIndex}"]`);
      if (cellEl) {
        cellEl.classList.remove('masked');
        cellEl.classList.add('correct');
        cellEl.textContent = event.number;
      }

      const foundCount = event.number;
      elStatProgress.textContent = `${foundCount} / ${event.totalNumbers}`;
      elStatTarget.textContent = event.expectedNext <= event.totalNumbers ? event.expectedNext : '✓';
      elLiveHint.textContent = `连击 +${foundCount}！下一个找数字 [${event.expectedNext}]`;
    } else if (event.type === 'CELL_WRONG') {
      const cellEl = elGameGrid.querySelector(`[data-index="${event.cellIndex}"]`);
      if (cellEl) {
        cellEl.classList.add('wrong');
        cellEl.textContent = event.wrongNumber;
      }
      elLiveHint.textContent = `点错了！应按顺序点击 [${event.expectedNext}]`;

      // 揭开其余所有格子的真实数字，让玩家看清错误
      elGameGrid.querySelectorAll('.grid-cell.active').forEach((el) => {
        const idx = parseInt(el.dataset.index, 10);
        const data = game.gridData[idx];
        if (data && data.isActive) {
          el.classList.remove('masked');
          el.textContent = data.number;
        }
      });
    }
  }

  function handleGameFinish(summary) {
    setTimeout(() => {
      elResultOverlay.classList.remove('hidden');

      if (summary.success) {
        elResultBadge.className = 'result-icon-circle success';
        elResultBadge.textContent = '✓';
        elResultTitle.textContent = summary.isNewRecord ? '🎉 创造新纪录！' : '挑战大成功！';
        elResultDesc.textContent = `完美记忆 ${summary.totalNumbers} 个数字的位置并按序命中`;
        elBtnPlayAgain.textContent = summary.mode === window.GAME_MODES.ENDLESS ? '进入下一关 ➔' : '再来一局';
        
        // 若为天梯模式，关卡自动 +1
        if (summary.mode === window.GAME_MODES.ENDLESS) {
          game.endlessLevel++;
        }
      } else {
        elResultBadge.className = 'result-icon-circle fail';
        elResultBadge.textContent = '✕';
        elResultTitle.textContent = '挑战失误';
        elResultDesc.textContent = `未能完全按顺序回忆出所有卡片`;
        if (summary.mode === window.GAME_MODES.ENDLESS) {
          if (summary.endlessLives <= 0) {
            elResultDesc.textContent = `3 次机会已用尽，本轮天梯结束（攻克 ${summary.totalNumbers - 1} 个数字）`;
            elBtnPlayAgain.textContent = '重新挑战天梯';
            game.resetEndlessSession();
          } else {
            elBtnPlayAgain.textContent = `继续挑战（剩余 ${summary.endlessLives} 命）`;
          }
        } else {
          elBtnPlayAgain.textContent = '重试当前难度';
        }
      }

      // 指标填充
      elMetricNumbers.textContent = summary.totalNumbers;
      elMetricTime.textContent = `${(summary.totalTimeMs / 1000).toFixed(2)}s`;
      elMetricAvgSpeed.textContent = `${summary.avgReactionMs}ms`;

      // 认知段位
      elRankName.textContent = summary.rank.title;
      elRankTip.textContent = summary.rank.desc;

      // 战绩卡片数据就绪
      lastFinishedSummary = summary;
    }, 450);
  }

  let lastFinishedSummary = null;

  // 5. 交互事件绑定

  // 开始按钮
  elBtnStart.addEventListener('click', () => {
    soundEngine.initAudioContext();
    game.startRound();
  });

  // 再玩一次
  elBtnPlayAgain.addEventListener('click', () => {
    soundEngine.initAudioContext();
    elResultOverlay.classList.add('hidden');
    game.startRound();
  });

  // 模式切换
  elTabCustom.addEventListener('click', () => {
    elTabCustom.classList.add('active');
    elTabEndless.classList.remove('active');
    game.setMode(window.GAME_MODES.CUSTOM);
    elStartTitle.textContent = '自由训练模式';
    elStartDesc.textContent = '随意调配网格数量、数字容量与展现时间，适合针对性专项锻炼。';
    renderGridShell(game.getCurrentParams().gridSize);
    updateDashboard();
  });

  elTabEndless.addEventListener('click', () => {
    elTabEndless.classList.add('active');
    elTabCustom.classList.remove('active');
    game.setMode(window.GAME_MODES.ENDLESS);
    elStartTitle.textContent = '天梯挑战模式';
    elStartDesc.textContent = '从 3 个数字起步，每关递增，时间递减，测量你的真正工作记忆极限！';
    renderGridShell(game.getCurrentParams().gridSize);
    updateDashboard();
  });

  // 音效开关
  function updateSoundUI() {
    if (soundEngine.enabled) {
      elIconSoundOn.classList.remove('hidden');
      elIconSoundOff.classList.add('hidden');
    } else {
      elIconSoundOn.classList.add('hidden');
      elIconSoundOff.classList.remove('hidden');
    }
  }

  elBtnSoundToggle.addEventListener('click', () => {
    soundEngine.enabled = !soundEngine.enabled;
    userSettings.soundEnabled = soundEngine.enabled;
    storageManager.saveSettings(userSettings);
    updateSoundUI();
  });

  // 设置面板开启与关闭函数
  function closeSettingsSheet() {
    elModalSettings.classList.add('hidden');
    storageManager.saveSettings(userSettings);
    game.updateCustomConfig(userSettings);
    if (game.mode === window.GAME_MODES.CUSTOM) {
      if (game.state === window.GAME_STATES.IDLE || game.state === window.GAME_STATES.OVER) {
        game.resetToIdle();
        renderGridShell(userSettings.gridSize);
        updateDashboard();
      }
    }
  }

  elBtnSettings.addEventListener('click', () => {
    syncSettingsModal();
    elModalSettings.classList.remove('hidden');
  });

  elBtnCloseSettings.addEventListener('click', closeSettingsSheet);

  // 点击遮罩外部半透明区域自动关闭并保存设置
  elModalSettings.addEventListener('click', (e) => {
    if (e.target === elModalSettings) {
      closeSettingsSheet();
    }
  });

  // 设置面板内控件交互：即时反应
  elGridSizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elGridSizeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const size = parseInt(btn.dataset.size, 10);
      userSettings.gridSize = size;
      const maxCells = size * size;
      elSliderNumCount.max = maxCells;
      elSliderMaxLbl.textContent = `${maxCells} (极限)`;
      if (userSettings.numCount > maxCells) {
        userSettings.numCount = maxCells;
        elSliderNumCount.value = maxCells;
        elValNumCount.textContent = `${maxCells} 个`;
      }

      // 关键：立即更新配置并持久化，实时重绘网格！
      game.updateCustomConfig(userSettings);
      storageManager.saveSettings(userSettings);
      if (game.mode === window.GAME_MODES.CUSTOM) {
        if (game.state === window.GAME_STATES.IDLE || game.state === window.GAME_STATES.OVER) {
          game.resetToIdle();
          renderGridShell(size);
          updateDashboard();
        }
      }
    });
  });

  elSliderNumCount.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    userSettings.numCount = val;
    elValNumCount.textContent = `${val} 个`;
    game.updateCustomConfig(userSettings);
    storageManager.saveSettings(userSettings);
    if (game.mode === window.GAME_MODES.CUSTOM) {
      updateDashboard();
    }
  });

  elSliderFlashTime.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    userSettings.flashDuration = val;
    elValFlashTime.textContent = `${val.toFixed(1)} 秒`;
    game.updateCustomConfig(userSettings);
    storageManager.saveSettings(userSettings);
  });

  elSliderCountdown.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    userSettings.countdownSeconds = val;
    elValCountdown.textContent = `${val} 秒`;
    game.updateCustomConfig(userSettings);
    storageManager.saveSettings(userSettings);
  });

  elToggleVibrate.addEventListener('change', (e) => {
    userSettings.vibrate = e.target.checked;
    storageManager.saveSettings(userSettings);
  });

  elToggleScalePitch.addEventListener('change', (e) => {
    soundEngine.scalePitchEnabled = e.target.checked;
    userSettings.scalePitch = e.target.checked;
    storageManager.saveSettings(userSettings);
  });

  // 同步设置面板初始值
  function syncSettingsModal() {
    elGridSizeButtons.forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.size, 10) === userSettings.gridSize);
    });
    const maxCells = userSettings.gridSize * userSettings.gridSize;
    elSliderNumCount.max = maxCells;
    elSliderNumCount.value = userSettings.numCount;
    elValNumCount.textContent = `${userSettings.numCount} 个`;
    elSliderMaxLbl.textContent = `${maxCells} (极限)`;

    elSliderFlashTime.value = userSettings.flashDuration;
    elValFlashTime.textContent = `${userSettings.flashDuration.toFixed(1)} 秒`;

    elSliderCountdown.value = userSettings.countdownSeconds;
    elValCountdown.textContent = `${userSettings.countdownSeconds} 秒`;

    elToggleVibrate.checked = userSettings.vibrate;
    elToggleScalePitch.checked = userSettings.scalePitch;
    updateSoundUI();
  }

  // 排行榜弹窗与数据渲染
  elBtnLeaderboard.addEventListener('click', () => {
    renderLeaderboard();
    elModalLeaderboard.classList.remove('hidden');
  });

  elBtnCloseLeaderboard.addEventListener('click', () => {
    elModalLeaderboard.classList.add('hidden');
  });

  elTabLbEndless.addEventListener('click', () => {
    elTabLbEndless.classList.add('active');
    elTabLbCustom.classList.remove('active');
    elLbEndlessView.classList.remove('hidden');
    elLbCustomView.classList.add('hidden');
  });

  elTabLbCustom.addEventListener('click', () => {
    elTabLbCustom.classList.add('active');
    elTabLbEndless.classList.remove('active');
    elLbCustomView.classList.remove('hidden');
    elLbEndlessView.classList.add('hidden');
  });

  function renderLeaderboard() {
    // 渲染天梯历史
    const history = storageManager.loadHistory();
    const endlessItems = history.filter(h => h.mode.includes('天梯'));
    
    if (endlessItems.length === 0) {
      elEndlessHistoryList.innerHTML = '<div class="empty-state">暂无天梯挑战记录，快去试一局吧！</div>';
    } else {
      elEndlessHistoryList.innerHTML = endlessItems.map((item, idx) => `
        <div class="history-item">
          <span class="h-rank ${idx === 0 ? 'top1' : idx === 1 ? 'top2' : idx === 2 ? 'top3' : ''}">${idx + 1}</span>
          <div class="h-detail">
            <span class="h-title">${item.mode} · ${item.numbers} 个数字</span>
            <span class="h-sub">${item.date} · ${item.grid} · ${item.success ? '全对' : '失误'}</span>
          </div>
          <div class="h-score">
            <div class="h-main-score">${(item.timeMs / 1000).toFixed(2)}s</div>
          </div>
        </div>
      `).join('');
    }

    // 渲染自由极速记录
    const customBests = storageManager.loadCustomBests();
    const keys = Object.keys(customBests);
    if (keys.length === 0) {
      elCustomHistoryList.innerHTML = '<div class="empty-state">暂无自由模式极速记录</div>';
    } else {
      elCustomHistoryList.innerHTML = keys.map((k, idx) => {
        const item = customBests[k];
        return `
          <div class="history-item">
            <span class="h-rank ${idx === 0 ? 'top1' : idx === 1 ? 'top2' : idx === 2 ? 'top3' : ''}">${idx + 1}</span>
            <div class="h-detail">
              <span class="h-title">${item.gridSize}×${item.gridSize} 网格 · ${item.numCount} 个数字</span>
              <span class="h-sub">极速通关纪录</span>
            </div>
            <div class="h-score">
              <div class="h-main-score">${(item.time / 1000).toFixed(2)}s</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  elBtnClearHistory.addEventListener('click', () => {
    if (confirm('确定要清空全部本地战绩和排行榜数据吗？')) {
      storageManager.clearAll();
      renderLeaderboard();
      updateDashboard();
    }
  });

  // 战绩海报卡片
  elBtnShareResult.addEventListener('click', () => {
    if (!lastFinishedSummary) return;

    elPosterDate.textContent = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    elPosterScore.textContent = lastFinishedSummary.totalNumbers;
    elPosterRank.textContent = lastFinishedSummary.rank.title;
    elPosterTime.textContent = `${(lastFinishedSummary.totalTimeMs / 1000).toFixed(2)}s`;
    elPosterSpeed.textContent = `${lastFinishedSummary.avgReactionMs}ms`;
    elPosterAccuracy.textContent = lastFinishedSummary.success ? '100%' : '未通关';

    elModalShareCard.classList.remove('hidden');
  });

  elBtnCloseShare.addEventListener('click', () => {
    elModalShareCard.classList.add('hidden');
  });

  // 模态框背景点击自动关闭
  elModalLeaderboard.addEventListener('click', (e) => {
    if (e.target === elModalLeaderboard) {
      elModalLeaderboard.classList.add('hidden');
    }
  });

  elModalShareCard.addEventListener('click', (e) => {
    if (e.target === elModalShareCard) {
      elModalShareCard.classList.add('hidden');
    }
  });

  // 键盘全局快捷键 (空格开始 / ESC 关闭弹窗)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      if (!elModalSettings.classList.contains('hidden') || !elModalLeaderboard.classList.contains('hidden')) return;
      e.preventDefault();
      soundEngine.initAudioContext();
      if (!elResultOverlay.classList.contains('hidden')) {
        elResultOverlay.classList.add('hidden');
        game.startRound();
      } else if (!elStartOverlay.classList.contains('hidden')) {
        game.startRound();
      }
    } else if (e.code === 'Escape') {
      if (!elModalSettings.classList.contains('hidden')) {
        closeSettingsSheet();
      }
      elModalLeaderboard.classList.add('hidden');
      elModalShareCard.classList.add('hidden');
    }
  });

  // 首次运行启动
  syncSettingsModal();
  renderGridShell(userSettings.gridSize);
  updateDashboard();
});
