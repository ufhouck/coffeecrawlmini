import Phaser from 'phaser';

export class InputManager {
  private scene: Phaser.Scene;
  private onMoveLeft: () => void;
  private onMoveRight: () => void;
  private isEnabled = true;

  constructor(scene: Phaser.Scene, onMoveLeft: () => void, onMoveRight: () => void) {
    this.scene = scene;
    this.onMoveLeft = onMoveLeft;
    this.onMoveRight = onMoveRight;

    this.setupTouchControls();
    this.setupKeyboardControls();
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  private setupTouchControls() {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isEnabled) return;

      const screenMidX = this.scene.scale.width / 2;
      if (pointer.x < screenMidX) {
        this.onMoveLeft();
      } else {
        this.onMoveRight();
      }
    });
  }

  private setupKeyboardControls() {
    if (!this.scene.input.keyboard) return;

    this.scene.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      if (!this.isEnabled) return;

      if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft') {
        this.onMoveLeft();
      } else if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight') {
        this.onMoveRight();
      }
    });
  }

  public destroy() {
    this.scene.input.off('pointerdown');
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.off('keydown');
    }
  }
}
