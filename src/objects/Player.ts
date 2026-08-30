import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.ts';

export type PlayerState = 'running' | 'switching' | 'spilled';

export class Player extends Phaser.GameObjects.Container {
  public currentLane = 1; // 0: Left, 1: Middle, 2: Right
  public playerState: PlayerState = 'running';

  private cupSprite: Phaser.GameObjects.Sprite;
  private shadowSprite: Phaser.GameObjects.Sprite;
  private steamEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, initialLane = 1) {
    const initialX = GAME_CONFIG.targetLanesX[initialLane] ?? 207;
    const initialY = GAME_CONFIG.playerY;

    super(scene, initialX, initialY);
    this.currentLane = initialLane;

    // 1. Ground shadow (Positioned at base of cup Y: 28 for realistic 2.5D contact)
    this.shadowSprite = scene.add.sprite(0, 28, 'ground_shadow');
    this.shadowSprite.setAlpha(0.65);
    this.shadowSprite.setScale(0.85, 0.35);
    this.add(this.shadowSprite);

    // 2. Animated Cup sprite (Natural 1:1 symmetric scale 0.31)
    this.cupSprite = scene.add.sprite(0, 0, 'cup01');
    this.cupSprite.setScale(0.31, 0.31);
    this.cupSprite.play('cup_idle_anim');
    this.add(this.cupSprite);

    // 3. Steam particle emitter
    this.steamEmitter = scene.add.particles(0, -18, 'particle_steam', {
      speedY: { min: -18, max: -36 },
      speedX: { min: -6, max: 6 },
      scale: { start: 0.08, end: 0.18 },
      alpha: { start: 0.55, end: 0 },
      lifespan: 700,
      frequency: 110,
      quantity: 1,
      blendMode: 'SCREEN'
    });
    this.add(this.steamEmitter);

    scene.add.existing(this);
  }

  public switchLane(targetLane: number) {
    if (this.playerState === 'spilled' || targetLane === this.currentLane) return;
    if (targetLane < 0 || targetLane > 2) return;

    this.playerState = 'switching';
    const oldLane = this.currentLane;
    this.currentLane = targetLane;

    const targetX = GAME_CONFIG.targetLanesX[targetLane];
    const isMovingLeft = targetLane < oldLane;
    const jumpDuration = 180;

    // Steam burst on leap
    this.steamEmitter.setQuantity(2);

    // 1. Kill active tweens to prevent offset accumulation on rapid input
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.cupSprite);
    this.scene.tweens.killTweensOf(this.shadowSprite);

    // 2. Reset local offsets to pure zero
    this.cupSprite.y = 0;
    this.cupSprite.rotation = 0;
    this.shadowSprite.setScale(0.85, 0.35);
    this.shadowSprite.setAlpha(0.65);

    // 3. Horizontal movement with exact target locking
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: jumpDuration,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.x = targetX; // Hard lock to exact lane coordinate
        this.playerState = 'running';
        this.steamEmitter.setQuantity(1);
      }
    });

    // 4. Parabolic jump Y on cup sprite
    this.scene.tweens.add({
      targets: this.cupSprite,
      y: -14,
      duration: jumpDuration / 2,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.cupSprite.y = 0;
      }
    });

    // 5. Lean/tilt
    const tiltAngle = isMovingLeft ? -0.15 : 0.15;
    this.scene.tweens.add({
      targets: this.cupSprite,
      rotation: tiltAngle,
      duration: jumpDuration * 0.45,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.cupSprite.rotation = 0;
      }
    });

    // 6. Shadow shrink during mid-air
    this.scene.tweens.add({
      targets: this.shadowSprite,
      scaleX: 0.55,
      scaleY: 0.22,
      alpha: 0.3,
      duration: jumpDuration / 2,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.shadowSprite.setScale(0.85, 0.35);
        this.shadowSprite.setAlpha(0.65);
      }
    });
  }

  public spill(onComplete?: () => void) {
    this.playerState = 'spilled';
    this.cupSprite.stop();
    this.steamEmitter.stop();

    // Spilled flip and fall
    this.scene.tweens.add({
      targets: this.cupSprite,
      rotation: Math.PI * 0.75,
      y: 10,
      scaleX: 0.35,
      scaleY: 0.18,
      duration: 350,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        onComplete?.();
      }
    });

    this.scene.tweens.add({
      targets: this.shadowSprite,
      alpha: 0,
      duration: 300
    });
  }

  public reset(lane = 1) {
    this.playerState = 'running';
    this.currentLane = lane;
    this.x = GAME_CONFIG.targetLanesX[lane];
    this.y = GAME_CONFIG.playerY;
    
    this.cupSprite.setRotation(0);
    this.cupSprite.setPosition(0, 0);
    this.cupSprite.setScale(0.31, 0.31);
    this.cupSprite.clearTint();
    this.cupSprite.play('cup_idle_anim');
    
    this.shadowSprite.setAlpha(0.65);
    this.shadowSprite.setScale(0.85, 0.35);
    
    this.steamEmitter.start();
    this.steamEmitter.setQuantity(1);
  }
}
