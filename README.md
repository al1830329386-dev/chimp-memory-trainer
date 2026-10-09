# 瞬时脑力 · Chimp Memory Trainer 🧠

> 基于著名的京都大学灵长类研究所**“黑猩猩阿优木（Ayumu）瞬间工作记忆测试”**打造的 iOS 极简风脑力训练应用。

🔗 **在线游玩地址**：[https://al1830329386-dev.github.io/chimp-memory-trainer/](https://al1830329386-dev.github.io/chimp-memory-trainer/)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependency](https://img.shields.io/badge/Dependencies-0-success.svg)]()
[![PWA Ready](https://img.shields.io/badge/PWA-iOS%20Full%20Screen-orange.svg)]()
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20iOS%20%7C%20Android-lightgrey.svg)]()

---

## 🎮 游戏背景与玩法

2007 年，日本京都大学灵长类研究所的黑猩猩**阿优木（Ayumu）**在一项短期空间工作记忆实验中震惊了世界：
在屏幕上随机闪现 1~9 个数字仅仅 **210 毫秒（0.2秒）** 后隐去，阿优木能够凭借惊人的瞬间直觉记忆，几乎 100% 正确地按升序逐一盲点击中所有格子，远超人类成年人的平均水平。

本项目旨在通过**科学的瞬间视觉空间记忆训练**，激发与锻炼人类大脑的短时工作记忆广度与专注度。

### 规则：
1. **3 秒准备倒计时**：集中注意力进入备战状态。
2. **瞬间曝光**：随机格子里闪现乱序分布的数字序列（默认 3 秒，可在设置中调节至 0.5 秒极限闪记）。
3. **盲盒连击回忆**：数字隐去变为无字盲盒，凭借大脑中的瞬间残影，**从小到大依次点击无字格子（1 ➔ 2 ➔ 3...）**。
4. **正误反馈**：点中正确格子触发清脆音阶连击；点错则震动报警并揭示真实分布，便于复盘。

---

## ✨ 核心特性

- 🍏 **iOS 极简设计规范（Cupertino 质感）**
  - 纯净磨砂毛玻璃（`backdrop-filter: blur(25px)`）、Squircle 苹果连续曲率大圆角与微弥散柔光。
  - 物理弹簧微动效，适配桌面端鼠标与手机端多点触控。
- 🎵 **超爽打击音效系统（Web Audio API 纯算法合成）**
  - **音阶递增连击机制（Combo Scale）**：从数字 1 开始连续点中，打击音效将沿自然五度大调音阶自动攀升（Do-Re-Mi-Fa-Sol...），形成如敲击马林巴木琴般行云流水的旋律！
  - 零外部音频文件依赖，无延迟、不卡顿。
- ⚙️ **多维度自由难度调节**
  - 支持 $3\times3$（9格）、$4\times4$（16格）、$5\times5$（25格）、$6\times6$（36格）实时切换与重构。
  - 数字容量（$3 \sim 36$ 个）与曝光时长（$0.5s \sim 5.0s$）自由滑动定制。
- 🏆 **天梯挑战模式与脑力名人堂**
  - **天梯爬梯**：从 3 个数字起步，每关递增，高关卡曝光时间缩短，测量你的极限认知天花板。
  - **阿优木基准评级**：测算你的工作记忆处于标准人类（7±2）、最强大脑，还是超越黑猩猩阿优木。
  - **战绩海报生成**：类似 Apple 健身奖章风格的极简成绩微海报。
- 📱 **PWA 原生 App 体验**
  - 支持 iOS / Android 添加至主屏幕，沉浸式全屏无网址栏。

---

## 📱 手机端体验指南（推荐）

本项目针对 iPhone 与 Android 手机做了深度优化，可像真正的 App 一样在手机上玩：

### 在 iPhone 上以独立 App 模式游玩：
1. 用 **Safari 浏览器** 打开你的在线网址（如 GitHub Pages 链接）。
2. 点击浏览器底部的 **“分享”** 按钮（带有向上箭头的方框图标）。
3. 在弹出菜单中向下滑动，选择 **“添加到主屏幕”（Add to Home Screen）**。
4. 回到手机桌面，点击图标启动！**此时没有网址栏与底部工具栏，享受 100% 沉浸式原生 App 体验**。

### 在 Android 手机上：
1. 用 **Chrome 浏览器** 打开链接。
2. 点击右上角菜单（三个点），选择 **“安装应用”** 或 **“添加到主屏幕”** 即可。

---

## 🚀 如何发布到 GitHub 并开启免费在线游玩 (GitHub Pages)

将本项目免费部署为全世界任何人都能访问的网页只需 1 分钟：

### 第 1 步：创建 GitHub 仓库
1. 登录 [GitHub](https://github.com/)，点击右上角 **New repository**。
2. 仓库名填入任意名称，如：`chimp-memory-trainer`。
3. 选择 **Public（公开）**，点击 **Create repository**。

### 第 2 步：推送本地代码
在项目目录下打开终端（PowerShell 或 Git Bash），执行：
```bash
git remote add origin https://github.com/你的用户名/chimp-memory-trainer.git
git branch -M main
git push -u origin main
```

### 第 3 步：开启 GitHub Pages（一键免费上线）
1. 在 GitHub 仓库页面，点击上方的 **Settings**（设置）。
2. 在左侧菜单找到 **Pages**。
3. 在 **Build and deployment** 下方的 **Branch** 选择：`main` 分支，目录选择 `/ (root)`。
4. 点击 **Save**。
5. 等待 30 秒刷新页面，顶部就会显示你的专属永久免费链接：
   `https://<你的用户名>.github.io/chimp-memory-trainer/`

---

## 📂 项目文件架构

```text
├── index.html        # 主入口（iOS 视口规范、PWA 元标签、游戏舞台与组件）
├── styles.css        # 完整 iOS 设计系统（毛玻璃、弹簧动效、自适应网格、响应式排版）
├── manifest.json     # PWA 配置文件（支持桌面图标与独立窗口启动）
├── icons/
│   └── icon.svg      # 高清 iOS Squircle 风格应用桌面图标
├── js/
│   ├── audio.js      # Web Audio API 动态音阶合成器（马林巴音色、音阶升调、音效控制）
│   ├── storage.js    # 本地数据持久化、历史榜单存储与阿优木认知评级算法
│   ├── game.js       # 核心游戏状态机（Fisher-Yates 随机打乱、毫秒精准计时、天梯晋级）
│   └── app.js        # DOM 控制胶水层（设置即时生效、键盘快捷键、抽屉交互）
├── LICENSE           # MIT 开源协议
└── README.md         # 项目文档与使用说明
```

---

## ⌨️ 桌面端快捷键速查

| 按键 | 说明 |
| :--- | :--- |
| <kbd>空格键</kbd> | 快速开始 / 结算后快速开启下一关 |
| <kbd>Esc</kbd> | 快速关闭当前打开的设置或排行榜抽屉 |
| 鼠标点击 / 触屏轻触 | 记忆盲点击碎格子 |

---

## 📄 开源许可证

本项目采用 [MIT 许可证](LICENSE) 开源。欢迎 Star、Fork 与改进！
