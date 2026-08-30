import Phaser from 'phaser';
import type { ObstacleType } from '../game/types.ts';
import { calcLaneX, calcScale, calcAlpha } from '../utils/math.ts';

export class Obstacle extends Phaser.GameObjects.Container {
  public obstacleType: ObstacleType;
  public laneIndex: number;
  public hasHit = false;

  private sprite: Phaser.GameObjects.Sprite;
  private shadow: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, laneIndex: number, type: ObstacleType, startY: number) {
    const startX = calcLaneX(laneIndex, startY);
    super(scene, startX, startY);

    this.laneIndex = laneIndex;
    this.obstacleType = type;

    // Shadow
    this.shadow = scene.add.sprite(0, 10, 'ground_shadow');
    this.shadow.setAlpha(0.35);
    this.shadow.setScale(0.5, 0.25);
    this.add(this.shadow);

    // Sprite
    this.sprite = scene.add.sprite(0, 0, `obstacle_${type}`);
    this.sprite.setScale(0.20);

    if (type === 'hotPot') {
      this.sprite.setTint(0x27ae60);
    } else if (type === 'brokenCup') {
      this.sprite.setScale(0.22);
      this.sprite.setTint(0xff6b6b);
    }

    this.add(this.sprite);

    // Initial scale & fog
    this.setScale(calcScale(startY));
    this.setAlpha(calcAlpha(startY));

    scene.add.existing(this);
  }

  public updatePerspective(newY: number) {
    this.y = newY;
    this.x = calcLaneX(this.laneIndex, newY);
    this.setScale(calcScale(newY));
    this.setAlpha(calcAlpha(newY));
  }

  public onHit() {
    this.hasHit = true;
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.3,
      scaleY: this.sprite.scaleY * 0.7,
      alpha: 0.5,
      duration: 200,
      ease: 'Bounce.easeOut'
    });
  }
}
