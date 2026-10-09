/**
 * audio.js - Web Audio API 高保真音效合成引擎
 * 采用纯算法声波合成，零外部资源依赖，无延迟、音质清亮悦耳。
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.scalePitchEnabled = true;

    // 清脆空灵的五度大调音阶频率列表 (从 C5 到 C7)
    this.scaleNotes = [
      523.25, // C5 (Do)
      587.33, // D5 (Re)
      659.25, // E5 (Mi)
      783.99, // G5 (Sol)
      880.00, // A5 (La)
      1046.50, // C6 (Do)
      1174.66, // D6 (Re)
      1318.51, // E6 (Mi)
      1567.98, // G6 (Sol)
      1760.00, // A6 (La)
      2093.00, // C7 (Do)
      2349.32, // D7 (Re)
      2637.02, // E7 (Mi)
      3135.96  // G7 (Sol)
    ];
  }

  // 初始化或激活 AudioContext（应对浏览器自动播放策略）
  initAudioContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 播放单次清脆马林巴/玻璃铃铛音效（支持连击音阶升调）
  playTap(comboIndex = 0) {
    if (!this.enabled) return;
    this.initAudioContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // 计算音高
    let freq = 659.25; // 默认 E5
    if (this.scalePitchEnabled) {
      const noteIdx = Math.min(comboIndex, this.scaleNotes.length - 1);
      freq = this.scaleNotes[noteIdx];
    }

    // 主音量增益
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.35, now + 0.003); // 极快起音 (Attack)
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22); // 柔和衰减 (Decay)
    masterGain.connect(this.ctx.destination);

    // 基频振荡器 (Sine: 饱满、纯净)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // 泛音振荡器 (Triangle: 增加木质/水晶质感的高次谐波)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.76, now); // 仿马林巴非整数泛音
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.08, now);
    osc2Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc2.connect(osc2Gain);
    osc2Gain.connect(masterGain);

    osc1.connect(masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.24);
    osc2.stop(now + 0.24);
  }

  // 准备倒计时轻叩音 (Woodblock Tick)
  playCountdownTick() {
    if (!this.enabled) return;
    this.initAudioContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // 倒计时结束 / 开始瞬间提示音
  playCountdownStart() {
    if (!this.enabled) return;
    this.initAudioContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 783.99, 1046.5]; // C5, G5, C6 闪烁三和弦
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = idx * 0.035;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.2, now + delay + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.3);
    });
  }

  // 通关胜利琶音 (Victory Fanfare)
  playSuccess() {
    if (!this.enabled) return;
    this.initAudioContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C - E - G - C - E
    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + (i * 0.065);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.25, noteTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.48);
    });
  }

  // 失败柔和微闷音 (Fail Damp Thud)
  playError() {
    if (!this.enabled) return;
    this.initAudioContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // 触感震动反馈（支持震动的移动设备）
  vibrate(pattern = 15) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // 部分环境禁止或未授权震动
      }
    }
  }
}

// 导出单例
window.soundEngine = new SoundEngine();
