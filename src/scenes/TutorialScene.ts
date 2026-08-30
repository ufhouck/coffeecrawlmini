import Phaser from 'phaser';

export class TutorialScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TutorialScene' });
  }

  public create() {
    this.scene.start('MenuScene');
  }
}
