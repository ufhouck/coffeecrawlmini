// Device Pixel Ratio for Retina-sharp canvas rendering
export const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
export const LOGICAL_WIDTH = 414;
export const LOGICAL_HEIGHT = 736;

export const GAME_CONFIG = {
  // Logical Screen (game coordinate space stays at 414x736)
  width: LOGICAL_WIDTH,
  height: LOGICAL_HEIGHT,
  
  // 3-Lane Perspective Coordinates (fan-out matching user's red lines)
  targetLanesX: [90.0, 207.0, 324.0],
  spawnLanesX: [196.0, 207.0, 218.0],
  
  spawnY: 270.0,
  playerY: 550.0,
  exitY: 736.0,
  
  // Speed & Progression
  baseSpeed: 140.0,
  maxSpeed: 850.0,
  speedPerLevel: 3.8,
  
  // Modes duration
  discoModeDuration: 15.0,
  slowModeDuration: 10.0,
  
  // Lives
  maxLives: 3,
  
  // Collision thresholds
  collectHitRadius: 30,
  obstacleHitRadius: 26,
  
  // Target pickups per level
  targetPickups: (level: number): number => {
    if (level <= 5) return 5;
    if (level <= 20) return 6;
    if (level <= 50) return 8;
    if (level <= 200) return 12;
    if (level <= 500) return 18;
    return 25;
  }
};

export const ECONOMY_CONFIG = {
  pointsPerGamePoint: 1,
  maxGamePoints: 10000,
  minMsBetweenClaims: 500,
  maxClaimPoints: 1000,
  baseAllocationPerPoint: 0.0025,
  /** Level-scaled allocation rate — starts low, rewards progression */
  allocationPerPoint: (level: number): number => {
    if (level <= 3) return 0.0012;   // 0.5x — early levels earn less
    if (level <= 10) return 0.0025;  // 1.0x — baseline
    if (level <= 20) return 0.0033;  // 1.3x
    if (level <= 35) return 0.0040;  // 1.6x
    return 0.0050;                   // 2.0x — high levels rewarded
  },
  defaultRoundSeconds: 180,
  practiceSeconds: 30,
};

export const THEME = {
  fontFamily: 'Kavoon, sans-serif',
  bgDark: 0x0b0604,
  bgCoffee: 0x1f100a,
  counterWood: 0x3d2314,
  
  gold: 0xf1c40f,
  neonGreen: 0x2ecc71,
  cherryRed: 0xe74c3c,
  honeyAmber: 0xf39c12,
  coffeeBrown: 0x6f4e37,
  cream: 0xfef9e7,
  
  uiDark: '#0b0604',
  uiGold: '#ffbe76',
  uiGreen: '#2ecc71',
  uiRed: '#e74c3c',
  
  // Original warm coffee palette for modals
  modalBg: '#2a1a0e',
  modalBorder: '#c89245',
  warmGold: '#f5c542',
  warmOrange: '#ff6b35',
  warmBrown: '#4a2a14',
  warmCream: '#f6e8da',
};
