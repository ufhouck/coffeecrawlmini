# Flaunch Game Mode Port Contract: Coffee Crawl

## Overview
- **Game Title**: Coffee Crawl: Bean Runner
- **Upstream**: https://github.com/ufhouck/coffeecrawlmini
- **Category**: 2.5D Endless 3-Lane Runner
- **Engine**: Phaser 3 + TypeScript + Vite

## Economy & Claims Contract
- **Point Ceiling**: Max 800 points per round.
- **Claim Rate Limit**: `minMsBetweenClaims = 800ms` (~1.2 events/sec).
- **Max Single Claim**: 50 points (Honey Bean).
- **Award Timing**: Immediate upon collectible pickup.

## Mandatory Framing & DOM Contract
- `data-gm-practice`: Practice mode overlay when `now < opensAt`.
- `data-gm-timer`: Round timer countdown until `closesAt`.
- `data-gm-leaderboard`: Live room player rankings.
- `data-gm-coin-panel`: Token ticker, market chart, allocation earned, and BUY button.
- `data-gm-buy`: Interactive BUY trigger for allocation.
- `data-gm-tutorial`: Initial 3-card tutorial scene.
- `data-gm-endscreen`: Round end summary with score, allocation, and standings.

## Asset & Bundle Rules
- Standalone self-contained build (`base: './'`).
- Bundle ZIP size under 20MB.
- Zero external network requests (no CDN, no external webfonts, no remote analytics).
