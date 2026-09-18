export const GameConfig = {
  // Player
  playerSpeed: 150, // pixels per second
  playerRotationSpeed: 2.5, // radians per second
  playerHealth: 100,
  playerFrontCooldown: 0.3, // seconds
  playerSideCooldown: 1.0, // seconds

  // Enemies
  chaserSpeed: 100,
  chaserHealth: 30,
  chaserDamage: 20, // damage on impact

  shooterSpeed: 70,
  shooterHealth: 30,
  shooterRange: 300,
  shooterCooldown: 1.5,
  shooterDamage: 10,

  // Projectiles
  projectileSpeed: 600,
  projectileLife: 1, // seconds
  playerDamage: 10,

  // Default Match Settings (Can be overridden by Options)
  matchDuration: 120, // seconds
  spawnInterval: 3.0, // seconds
};
