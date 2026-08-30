import Phaser from 'phaser';

export class EndScreen extends Phaser.Scene {
  constructor() {
    super({ key: 'EndScreen' });
  }

  public create() {
    this.scene.start('MenuScene');
  }
}
