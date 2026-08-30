# ☕ Coffee Crawl Mini — Flaunch Game Mode

Official Web / Flaunch Game Mode port of **Coffee Crawl: Bean Runner**.

Built with **Phaser 3**, **TypeScript**, **Vite**, and **Web Audio API** procedural audio synthesis.

---

## 🎮 Game Overview
- **Runner Mechanics:** 3-lane dodge & collect endless runner with progressive lane speeds, smooth physics, and dynamic obstacles.
- **Collectibles:**
  - Standard Coffee Beans (+1 pt)
  - Honey Beans (+50 pts & Disco Mode Trigger)
  - Golden Beans (+100 pts)
  - Croissants (+200 pts)
  - Logo Cups (+1 Life / Max 3 HP)
  - Slow Clocks (0.6x Slow Motion for 8s)
  - Fast Clocks (1.5x Fast Rush for 10s)
- **Obstacles:** Hot Coffee Spills and Broken Cups with danger tints.
- **Dynamic Procedural Audio Engine:** 100% Web Audio API procedural synthesis with zero audio asset weight (0 KB) — featuring real-time drums, Moog resonant bass, stereo echo delay leads, 4 unique randomized themes, and a dedicated 138 BPM Disco Overdrive mode.
- **Flaunch Game Mode Integration:** Fully compliant with Flaunch DOM Data Contracts (`data-gm-*`), practice modes, claim rate-limiting, and live room leaderboards.

---

## 🚀 Development & Build

### Install dependencies
```bash
npm install
```

### Start local dev server
```bash
npm run dev
```

### Run Flaunch QA Validation Suite
```bash
node tools/qa-gamemode.mjs
```

### Build for production
```bash
npm run build
```

The production output will be generated in `./dist` as a self-contained bundle under 6 MB.

---

## 📄 Provenance & Contracts
- **Upstream Repository:** [https://github.com/ufhouck/coffeecrawl](https://github.com/ufhouck/coffeecrawl)
- **Flaunch Contract:** [`port.json`](./port.json)
- **Flaunch Agent Guidelines:** [`AGENTS.md`](./AGENTS.md)
