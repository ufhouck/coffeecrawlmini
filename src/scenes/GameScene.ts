import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.ts';
import { Player } from '../objects/Player.ts';
import { Collectible } from '../objects/Collectible.ts';
import { Obstacle } from '../objects/Obstacle.ts';
import { SpawnManager } from '../systems/SpawnManager.ts';
import { ScoreManager } from '../systems/ScoreManager.ts';
import { InputManager } from '../systems/InputManager.ts';
import { audioManager } from '../systems/AudioManager.ts';
import { HUD } from '../ui/HUD.ts';
import { CoinPanelUI } from '../ui/CoinPanel.ts';
import { RoundTimerUI, PracticeOverlayUI, AllocationBeatUI } from '../ui/RoundTimer.ts';
import { GameOverModalUI, EndScreenModalUI } from '../ui/Modals.ts';
import { roomInstance } from '../room.ts';
import type { CollectibleType, ObstacleType } from '../game/types.ts';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private spawnManager!: SpawnManager;
  private scoreManager!: ScoreManager;
  private inputManager!: InputManager;

  private bgDisco!: Phaser.GameObjects.Image;
  private discoOverlay!: Phaser.GameObjects.Rectangle;
  private discoColorTimer?: Phaser.Time.TimerEvent;
  private hud!: HUD;
  private coinPanelUI!: CoinPanelUI;
  private timerUI!: RoundTimerUI;
  private practiceUI!: PracticeOverlayUI;
  private beatUI!: AllocationBeatUI;
  private gameOverModalUI!: GameOverModalUI;
  private endScreenModalUI!: EndScreenModalUI;

  private collectibles: Collectible[] = [];
  private obstacles: Obstacle[] = [];
  private isPlaying = false;
  private isGameOver = false;
  private lastBannerLevel = 1;

  constructor() {
    super({ key: 'GameScene' });
  }

  public create() {
    const W = GAME_CONFIG.width;
    const H = GAME_CONFIG.height;
    this.isPlaying = true;
    this.isGameOver = false;
    this.lastBannerLevel = 1;

    // Reset room singleton for new round
    roomInstance.reset();

    // 1. Backgrounds
    const bgNormal = this.add.image(W / 2, H / 2, 'bg_cafe');
    bgNormal.setDisplaySize(W, H);
    bgNormal.setDepth(0);

    this.bgDisco = this.add.image(W / 2, H / 2, 'bg_disco');
    this.bgDisco.setDisplaySize(W, H);
    this.bgDisco.setAlpha(0);
    this.bgDisco.setDepth(1);
    this.bgDisco.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // Color-cycling overlay for disco multiply effect
    this.discoOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0xff00ff, 0);
    this.discoOverlay.setDepth(2);
    this.discoOverlay.setBlendMode(Phaser.BlendModes.ADD);

    // 2. Systems Setup
    this.spawnManager = new SpawnManager();
    this.scoreManager = new ScoreManager();

    // 3. UI Setup (Native Retina DOM)
    this.hud = new HUD();
    this.hud.setVisible(true);

    // Show timer elements
    const timerEl = document.getElementById('round-timer');
    if (timerEl) timerEl.style.display = 'block';
    const timerBarEl = document.getElementById('timer-bar');
    if (timerBarEl) timerBarEl.style.display = 'block';

    this.coinPanelUI = new CoinPanelUI();
    this.coinPanelUI.show();
    this.timerUI = new RoundTimerUI();
    this.practiceUI = new PracticeOverlayUI();
    this.beatUI = new AllocationBeatUI();
    this.gameOverModalUI = new GameOverModalUI();
    this.endScreenModalUI = new EndScreenModalUI();

    // 4. Player Setup
    this.player = new Player(this, 1);
    this.player.setDepth(20);

    // 5. Input Setup
    this.inputManager = new InputManager(
      this,
      () => this.handleMoveLeft(),
      () => this.handleMoveRight()
    );

    // 6. Hook ScoreManager callbacks
    this.scoreManager.setCallbacks({
      onScoreUpdate: (score, alloc, mult) => {
        this.hud.updateScore(score, alloc, mult);
        this.coinPanelUI.updateAllocation(alloc);
      },
      onLivesUpdate: (lives) => {
        this.hud.updateLives(lives);
      },
      onLevelUpdate: (level, prog, target) => {
        this.hud.updateLevel(level, prog, target);
        audioManager.playLevelUp();
        audioManager.updatePacing(level, this.scoreManager.isFastMode);
        // Level Up banner animation — only on actual level change
        if (level > 1 && level !== this.lastBannerLevel) {
          this.lastBannerLevel = level;
          this.showLevelUpBanner(level);
        }
      },
      onDiscoModeChange: (active, remaining) => {
        this.hud.setDiscoMode(active, remaining);
        if (active) {
          audioManager.startDiscoMusic();
          this.startDiscoEffect();
        } else {
          audioManager.stopDiscoMusic();
          this.stopDiscoEffect();
        }
      },
      onSlowModeChange: (active) => {
        this.hud.setSlowMode(active);
      },
      onFastModeChange: (active, remaining) => {
        this.hud.setFastMode(active, remaining);
        audioManager.updatePacing(this.scoreManager.currentLevel, active);
      },
      onGameOver: () => {
        audioManager.stopMusic();
        this.handleGameOver();
      }
    });

    // Start dynamic adaptive runner music
    audioManager.startMusic(1);
    const soundBtn = document.getElementById('sound-toggle-btn');
    const soundImg = document.getElementById('sound-icon-img') as HTMLImageElement | null;
    if (soundBtn) {
      soundBtn.style.display = 'flex';
      if (soundImg) {
        soundImg.src = audioManager.isMuted ? './assets/images/sound-off.svg' : './assets/images/sound-on.svg';
      }
      soundBtn.onclick = () => {
        const isMuted = audioManager.toggleMute();
        if (soundImg) {
          soundImg.src = isMuted ? './assets/images/sound-off.svg' : './assets/images/sound-on.svg';
        }
      };
    }

    // 7. Hook Room Listeners
    roomInstance.setListener({
      onTimerTick: (remaining, _total, isPractice, opensIn) => {
        this.timerUI.update(remaining);
        this.practiceUI.setPractice(isPractice, opensIn);
      },
      onRoundEnd: (finalState) => {
        this.isPlaying = false;
        this.hud.setVisible(false);
        this.endScreenModalUI.show(
          finalState,
          () => {
            this.cleanAndRestart();
          },
          () => {
            this.goToLobby();
          }
        );
      }
    });

    this.scoreManager.reset();
    this.spawnManager.reset();

    // Initial HUD state
    this.hud.updateLives(GAME_CONFIG.maxLives);
    this.hud.updateLevel(1, 0, GAME_CONFIG.targetPickups(1));
    this.hud.updateScore(0, 0, 1);
  }

  private handleMoveLeft() {
    if (!this.isPlaying || this.isGameOver) return;
    if (this.player.currentLane > 0) {
      this.player.switchLane(this.player.currentLane - 1);
    }
  }

  private handleMoveRight() {
    if (!this.isPlaying || this.isGameOver) return;
    if (this.player.currentLane < 2) {
      this.player.switchLane(this.player.currentLane + 1);
    }
  }

  public update(_time: number, delta: number) {
    if (!this.isPlaying || this.isGameOver) return;
    const deltaSec = delta / 1000;

    // 1. Update managers
    this.scoreManager.update(deltaSec);
    const currentSpeed = this.scoreManager.getCurrentSpeed();

    // 2. Update spawns
    this.spawnManager.update(
      deltaSec,
      currentSpeed,
      this.scoreManager.currentLevel,
      (lane, isObs, cType, oType) => this.spawnItem(lane, isObs, cType, oType)
    );

    // 3. Move and update Collectibles
    const moveDist = currentSpeed * deltaSec;
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      if (item.isCollected) continue;

      const newY = item.y + moveDist;
      item.updatePerspective(newY);

      // Check Collision with Player
      if (
        Math.abs(item.y - GAME_CONFIG.playerY) < GAME_CONFIG.collectHitRadius &&
        item.laneIndex === this.player.currentLane &&
        this.player.playerState !== 'spilled'
      ) {
        this.handleCollectiblePickup(item);
        this.collectibles.splice(i, 1);
        continue;
      }

      // Exit off-screen
      if (newY >= GAME_CONFIG.exitY) {
        item.destroy();
        this.collectibles.splice(i, 1);
      }
    }

    // 4. Move and update Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const newY = obs.y + moveDist;
      obs.updatePerspective(newY);

      // Check Collision with Player
      if (
        !obs.hasHit &&
        Math.abs(obs.y - GAME_CONFIG.playerY) < GAME_CONFIG.obstacleHitRadius &&
        obs.laneIndex === this.player.currentLane &&
        this.player.playerState !== 'spilled'
      ) {
        this.handleObstacleHit(obs);
        this.obstacles.splice(i, 1);
        continue;
      }

      // Exit off-screen
      if (newY >= GAME_CONFIG.exitY) {
        obs.destroy();
        this.obstacles.splice(i, 1);
      }
    }
  }

  private spawnItem(lane: number, isObstacle: boolean, cType?: CollectibleType, oType?: ObstacleType) {
    if (isObstacle && oType) {
      const obs = new Obstacle(this, lane, oType, GAME_CONFIG.spawnY);
      obs.setDepth(10);
      this.obstacles.push(obs);
    } else if (!isObstacle && cType) {
      const col = new Collectible(this, lane, cType, GAME_CONFIG.spawnY);
      col.setDepth(11);
      this.collectibles.push(col);
    }
  }

  private handleCollectiblePickup(item: Collectible) {
    const isGold = item.collectibleType === 'goldBean' || item.collectibleType === 'honeyBean';
    if (item.collectibleType === 'honeyBean') {
      audioManager.playHoney();
      this.scoreManager.triggerDiscoMode();
      this.cameras.main.shake(300, 0.015);
    } else {
      audioManager.playCollect(isGold);
    }

    // Special items
    if (item.collectibleType === 'heartCup') {
      const lifeAdded = this.scoreManager.addLife();
      if (lifeAdded) {
        audioManager.playLevelUp();
        this.showFloatText('+1 LIFE', item.x, item.y - 20, '#2ecc71');
      } else {
        audioManager.playCollect(true);
        this.showFloatText('FULL HP', item.x, item.y - 20, '#f5c542');
      }
    } else if (item.collectibleType === 'slowTimer') {
      this.scoreManager.triggerSlowMode();
      this.showFloatText('SLOW', item.x, item.y - 20, '#74b9ff');
    } else if (item.collectibleType === 'fastTimer') {
      this.scoreManager.triggerFastMode();
      audioManager.playLevelUp();
      this.showFloatText('FAST 1.5X', item.x, item.y - 20, '#e67e22');
    } else {
      const baseVal = item.getScoreValue();
      const claimRes = this.scoreManager.addCollectiblePoints(baseVal);
      if (claimRes.success && claimRes.awardedPoints > 0) {
        const bonusStr = this.scoreManager.isDiscoMode ? ' (2X)' : '';
        const allocAdd = (claimRes.awardedPoints * 0.0025).toFixed(2);
        this.showFloatText(`+${claimRes.awardedPoints}${bonusStr}`, item.x, item.y - 20, '#2ecc71');
        this.beatUI.triggerBeat(Number(allocAdd));
      }
    }

    item.collect();
  }

  private handleObstacleHit(obs: Obstacle) {
    obs.onHit();
    audioManager.playHit();

    // 1. Player wobble + red tint
    this.player.hit();

    // 2. Camera shake (stronger) + red flash
    this.cameras.main.shake(320, 0.035);
    this.cameras.main.flash(200, 231, 76, 60, true);

    // 3. DOM hit-flash overlay (red vignette)
    const flashEl = document.getElementById('hit-flash-overlay');
    if (flashEl) {
      flashEl.classList.add('active');
      setTimeout(() => flashEl.classList.remove('active'), 200);
    }

    // 4. Float text
    this.showFloatText('OUCH!', this.player.x, this.player.y - 30, '#e74c3c', true);
    this.scoreManager.takeDamage();
  }

  private showFloatText(text: string, x: number, y: number, color = '#2ecc71', isHit = false) {
    const fontSize = isHit ? '28px' : '24px';
    const strokeColor = isHit ? '#4a0000' : '#1a0d06';
    const strokeThick = isHit ? 5 : 4;

    const txt = this.add.text(x, y, text, {
      fontFamily: 'Kavoon, sans-serif',
      fontSize: fontSize,
      color: color,
      stroke: strokeColor,
      strokeThickness: strokeThick,
      shadow: { blur: 8, color: '#000000', fill: true }
    }).setOrigin(0.5).setDepth(80).setScale(0.3).setAlpha(0);

    // Pop-in: scale 0.3 -> 1.3 -> 1.0, then float up and fade
    this.tweens.add({
      targets: txt,
      scaleX: 1.35,
      scaleY: 1.35,
      alpha: 1,
      duration: 120,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: txt,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 80,
          ease: 'Quad.easeIn',
          onComplete: () => {
            this.tweens.add({
              targets: txt,
              y: y - 60,
              alpha: 0,
              duration: 500,
              ease: 'Cubic.easeOut',
              onComplete: () => txt.destroy()
            });
          }
        });
      }
    });
  }

  private showLevelUpBanner(level: number) {
    const W = GAME_CONFIG.width;
    const H = GAME_CONFIG.height;

    const banner = this.add.text(W / 2, H * 0.38, `LEVEL ${level}`, {
      fontFamily: 'Kavoon, sans-serif',
      fontSize: '42px',
      color: '#f5c542',
      stroke: '#4a2a14',
      strokeThickness: 6,
      shadow: { blur: 12, color: '#000000', fill: true }
    }).setOrigin(0.5).setDepth(90).setScale(0).setAlpha(0);

    // Pop in
    this.tweens.add({
      targets: banner,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold then fade up
        this.tweens.add({
          targets: banner,
          scaleX: 0.9,
          scaleY: 0.9,
          y: H * 0.32,
          alpha: 0,
          delay: 600,
          duration: 400,
          ease: 'Cubic.easeIn',
          onComplete: () => banner.destroy()
        });
      }
    });

    // Light camera flash on level up
    this.cameras.main.flash(200, 245, 197, 66);
  }

  private startDiscoEffect() {
    // Fade in disco background with MULTIPLY blend
    this.tweens.add({
      targets: this.bgDisco,
      alpha: 0.85,
      duration: 300,
      ease: 'Quad.easeOut'
    });

    // Color cycling overlay (ADD blend for psychedelic glow)
    const discoColors = [0xff00ff, 0x00ffff, 0xffcc00, 0x66ff66, 0xff6600, 0x6666ff];
    let colorIndex = 0;

    // Initial pulse in
    this.tweens.add({
      targets: this.discoOverlay,
      fillAlpha: 0.12,
      duration: 200
    });

    this.discoColorTimer = this.time.addEvent({
      delay: 280,
      loop: true,
      callback: () => {
        colorIndex = (colorIndex + 1) % discoColors.length;
        this.discoOverlay.setFillStyle(discoColors[colorIndex], 0.12);

        // Pulse effect
        this.tweens.add({
          targets: this.discoOverlay,
          fillAlpha: 0.18,
          duration: 140,
          yoyo: true,
          ease: 'Sine.easeInOut'
        });
      }
    });
  }

  private stopDiscoEffect() {
    // Stop color cycling
    if (this.discoColorTimer) {
      this.discoColorTimer.destroy();
      this.discoColorTimer = undefined;
    }

    // Fade out disco background
    this.tweens.add({
      targets: this.bgDisco,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeIn'
    });

    // Fade out overlay
    this.tweens.add({
      targets: this.discoOverlay,
      fillAlpha: 0,
      duration: 400
    });
  }

  private handleGameOver() {
    this.isGameOver = true;
    audioManager.playGameOver();
    this.inputManager.setEnabled(false);

    // Dramatic red flash + strong shake
    this.cameras.main.shake(500, 0.045);
    this.cameras.main.flash(350, 200, 30, 30);

    // DOM red vignette
    const flashEl = document.getElementById('hit-flash-overlay');
    if (flashEl) {
      flashEl.classList.add('active');
      setTimeout(() => flashEl.classList.remove('active'), 400);
    }

    // Spill player cup
    this.player.spill(() => {
      const currentHigh = parseInt(localStorage.getItem('coffeecrawl_high_score') || '0', 10);
      if (this.scoreManager.score > currentHigh) {
        localStorage.setItem('coffeecrawl_high_score', this.scoreManager.score.toString());
      }

      // Show Native DOM Game Over Modal
      this.gameOverModalUI.show(
        this.scoreManager.score,
        this.scoreManager.allocation,
        () => {
          this.cleanAndRestart();
        },
        () => {
          this.goToLobby();
        }
      );
    });
  }

  private goToLobby() {
    audioManager.stopMusic();
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) soundBtn.style.display = 'none';
    this.hud.setVisible(false);
    this.coinPanelUI.hide();
    this.gameOverModalUI.hide();
    this.endScreenModalUI.hide();
    this.scene.start('MenuScene');
  }

  private cleanAndRestart() {
    this.collectibles.forEach(c => c.destroy());
    this.obstacles.forEach(o => o.destroy());
    this.collectibles = [];
    this.obstacles = [];

    this.gameOverModalUI.hide();
    this.endScreenModalUI.hide();

    this.isGameOver = false;
    this.isPlaying = true;
    this.inputManager.setEnabled(true);
    this.player.reset(1);
    this.scoreManager.reset();
    this.spawnManager.reset();
    this.hud.setVisible(true);
    this.scene.restart();
  }

  public shutdown() {
    audioManager.stopMusic();
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) soundBtn.style.display = 'none';
    this.inputManager.destroy();
    this.hud.setVisible(false);
    this.coinPanelUI.hide();
  }
}
