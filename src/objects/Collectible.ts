import Phaser from 'phaser';
import type { CollectibleType } from '../game/types.ts';
import { calcLaneX, calcScale, calcAlpha } from '../utils/math.ts';

export class Collectible extends Phaser.GameObjects.Container {
  public collectibleType: CollectibleType;
  public laneIndex: number;
  public isCollected = false;

  private sprite: Phaser.GameObjects.Sprite;
  private shadow: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, laneIndex: number, type: CollectibleType, startY: number) {
    const startX = calcLaneX(laneIndex, startY);
    super(scene, startX, startY);

    this.laneIndex = laneIndex;
    this.collectibleType = type;

    // Ground Shadow (Positioned at base Y: 16 for realistic 2.5D contact)
    this.shadow = scene.add.sprite(0, 16, 'ground_shadow');
    this.shadow.setAlpha(0.50);
    this.shadow.setScale(0.55, 0.24);
    this.add(this.shadow);

    // High resolution Sprite
    this.sprite = scene.add.sprite(0, 0, `collectible_${type}`);
    this.sprite.setScale(0.18);

    if (type === 'fastTimer') {
      this.sprite.setTint(0xf39c12); // Warm amber hue for fast timer
    } else if (type === 'heartCup') {
      this.sprite.setScale(0.20);
    }

    this.add(this.sprite);

    // Initial small scale & alpha at depth
    const initialScale = calcScale(startY);
    const initialAlpha = calcAlpha(startY);
    this.setScale(initialScale);
    this.setAlpha(initialAlpha);

    scene.add.existing(this);

    // Dynamic animations
    if (type === 'goldBean' || type === 'honeyBean') {
      scene.tweens.add({
        targets: this.sprite,
        scaleX: 0.20,
        scaleY: 0.16,
        duration: 350,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else if (type === 'heartCup') {
      scene.tweens.add({
        targets: this.sprite,
        scaleX: 0.22,
        scaleY: 0.18,
        duration: 450,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else if (type === 'slowTimer') {
      scene.tweens.add({
        targets: this.sprite,
        rotation: Phaser.Math.PI2,
        duration: 2500,
        repeat: -1
      });
    } else if (type === 'fastTimer') {
      scene.tweens.add({
        targets: this.sprite,
        rotation: -Phaser.Math.PI2,
        duration: 650, // Fast spinning clock
        repeat: -1
      });
    }
  }

  public updatePerspective(newY: number) {
    if (this.isCollected) return;

    this.y = newY;
    this.x = calcLaneX(this.laneIndex, newY);
    const s = calcScale(newY);
    this.setScale(s);
    this.setAlpha(calcAlpha(newY));
  }

  public collect(onComplete?: () => void) {
    if (this.isCollected) return;
    this.isCollected = true;

    // Sparkle burst
    const emitter = this.scene.add.particles(this.x, this.y, 'particle_sparkle', {
      speed: { min: 40, max: 100 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 8,
      blendMode: 'ADD'
    });
    this.scene.time.delayedCall(450, () => emitter.destroy());

    // Scale up and float upwards rapidly
    this.scene.tweens.add({
      targets: this,
      y: this.y - 45,
      scaleX: this.scaleX * 1.35,
      scaleY: this.scaleY * 1.35,
      alpha: 0,
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.destroy();
        onComplete?.();
      }
    });
  }

  public getScoreValue(): number {
    switch (this.collectibleType) {
      case 'normalBean': return 10;
      case 'sugar': return 20;
      case 'goldBean': return 50;
      case 'cherry': return 100;
      case 'croissant': return 200;
      case 'honeyBean': return 500;
      case 'milk': return 15;
      case 'matcha': return 25;
      case 'heartCup':
      case 'slowTimer':
      case 'fastTimer':
      default:
        return 0;
    }
  }
}
