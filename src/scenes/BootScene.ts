import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public preload() {
    // 1. Load Environments & Logos
    this.load.image('bg_cafe', './assets/images/background.jpg');
    this.load.image('bg_disco', './assets/images/background-disco.jpg');
    this.load.image('game_logo', './assets/images/logo.png');
    this.load.image('logo_cup', './assets/images/logo-cup.png');

    // 2. Load Cup Animation Frames (cup01 to cup10)
    for (let i = 1; i <= 10; i++) {
      const pad = i.toString().padStart(2, '0');
      this.load.image(`cup${pad}`, `./assets/images/cup${pad}.png`);
    }

    // 3. Load Collectibles
    this.load.image('collectible_normalBean', './assets/images/cekirdek-normal.png');
    this.load.image('collectible_goldBean', './assets/images/cekirdek-gold.png');
    this.load.image('collectible_honeyBean', './assets/images/honey-bean.png');
    this.load.image('collectible_cherry', './assets/images/cherry.png');
    this.load.image('collectible_croissant', './assets/images/kruvasan.png');
    this.load.image('collectible_sugar', './assets/images/sugar.png');
    this.load.image('collectible_milk', './assets/images/milk.png');
    this.load.image('collectible_matcha', './assets/images/matcha.png');
    this.load.image('collectible_heartCup', './assets/images/logo-cup.png');
    this.load.image('collectible_slowTimer', './assets/images/timer.png');
    this.load.image('collectible_fastTimer', './assets/images/timer.png');

    // 4. Load Obstacles
    this.load.image('obstacle_spilledCoffee', './assets/images/bozuk.png');
    this.load.image('obstacle_brokenCup', './assets/images/broke.png');
    this.load.image('obstacle_hotPot', './assets/images/bozuk.png');

    // 5. Particles & Extras
    this.load.image('particle_steam', './assets/images/duman.png');
    this.load.image('coin_icon', './assets/images/coin.png');
  }

  public create() {
    this.generateHelperTextures();

    // Create Cup Idle Animation
    const frames: Phaser.Types.Animations.AnimationFrame[] = [];
    for (let i = 1; i <= 10; i++) {
      const pad = i.toString().padStart(2, '0');
      frames.push({ key: `cup${pad}` });
    }
    this.anims.create({
      key: 'cup_idle_anim',
      frames: frames,
      frameRate: 12,
      repeat: -1
    });

    this.scene.start('MenuScene');
  }

  private generateHelperTextures() {
    let g = this.make.graphics({ x: 0, y: 0 });
    // Soft realistic 3-layer radial gradient shadow
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(30, 12, 60, 24);
    g.fillStyle(0x000000, 0.28);
    g.fillEllipse(30, 12, 44, 18);
    g.fillStyle(0x000000, 0.40);
    g.fillEllipse(30, 12, 28, 12);
    g.generateTexture('ground_shadow', 60, 24);
    g.destroy();

    g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffd700, 1);
    g.beginPath();
    g.moveTo(10, 0);
    g.lineTo(13, 7);
    g.lineTo(20, 10);
    g.lineTo(13, 13);
    g.lineTo(10, 20);
    g.lineTo(7, 13);
    g.lineTo(0, 10);
    g.lineTo(7, 7);
    g.closePath();
    g.fillPath();
    g.generateTexture('particle_sparkle', 20, 20);
    g.destroy();
  }
}
