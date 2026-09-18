import * as PIXI from 'pixi.js';
import { GameConfig } from './GameConfig';
import { InputManager } from './InputManager';
import { Player, Chaser, Shooter, Projectile, Enemy } from './Entities';
import { circleIntersect, distance, angleBetween } from './Utils';

export class GameApp {
  public app: PIXI.Application;
  private input: InputManager;
  private player!: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  
  private textures: Record<string, PIXI.Texture> = {};
  
  private matchTime: number = GameConfig.matchDuration;
  private score: number = 0;
  private spawnTimer: number = 0;
  private isGameOver: boolean = false;

  private gameContainer: PIXI.Container;
  private islandSprite!: PIXI.Sprite;
  private waterBackground!: PIXI.Sprite;

  constructor(
    parent: HTMLElement, 
    private onEndGame: (reason: string, score: number, time: number) => void,
    private onUpdateHUD: (score: number, time: number) => void
  ) {
    this.app = new PIXI.Application({
      resizeTo: parent,
      backgroundColor: 0x0a66c2, // Water color
    });
    
    parent.appendChild(this.app.view as HTMLCanvasElement);
    
    this.gameContainer = new PIXI.Container();
    this.app.stage.addChild(this.gameContainer);

    this.input = new InputManager();

    this.init();
  }

  private async init() {
    // Load assets
    PIXI.Assets.add('player', '/assets/png/default/ships/ship_1.png');
    PIXI.Assets.add('chaser', '/assets/png/default/ships/ship_2.png');
    PIXI.Assets.add('shooter', '/assets/png/default/ships/ship_3.png');
    PIXI.Assets.add('projectile', '/assets/png/default/ship_parts/cannon_ball.png');
    PIXI.Assets.add('water', '/assets/png/default/tiles/tile_73.png');
    PIXI.Assets.add('island', '/assets/png/default/tiles/tile_69.png');

    const textures = await PIXI.Assets.load(['player', 'chaser', 'shooter', 'projectile', 'island','water']);
    this.textures = textures;

    // Criar o Fundo do Mar com TilingSprite
    this.waterBackground = new PIXI.Sprite(textures.water);
    this.waterBackground.anchor.set(0.5);
    this.waterBackground.scale.set(25);
    this.waterBackground.x = this.app.screen.width / 2;
    this.waterBackground.y = this.app.screen.height / 2;
    this.gameContainer.addChild(this.waterBackground);

    // Create Island 
    this.islandSprite = new PIXI.Sprite(textures.island);
    this.islandSprite.anchor.set(0.5);
    this.islandSprite.scale.set(1);
    this.islandSprite.x = this.app.screen.width / 2;
    this.islandSprite.y = this.app.screen.height / 2;
    this.gameContainer.addChild(this.islandSprite);

    // Create Player
    this.player = new Player(textures.player, this.gameContainer);
    this.player.x = 200;
    this.player.y = 200;

    this.app.ticker.add(this.update.bind(this));
  }

  private update(delta: number) {
    if (this.isGameOver) return;
    
    const deltaSeconds = delta / 60; 

    this.matchTime -= deltaSeconds;
    if (this.matchTime <= 0) {
      this.endGame('Time Over');
      return;
    }

    this.updatePlayer(deltaSeconds);
    this.updateEnemies(deltaSeconds);
    this.updateProjectiles(deltaSeconds);
    this.checkCollisions();

    if (this.player.isDead) {
      this.endGame('Destroyed');
    }

    // Keep player in bounds
    this.player.x = Math.max(0, Math.min(this.player.x, this.app.screen.width));
    this.player.y = Math.max(0, Math.min(this.player.y, this.app.screen.height));

    this.onUpdateHUD(this.score, Math.ceil(this.matchTime));
  }

  private updatePlayer(deltaSeconds: number) {
    this.player.updateCooldowns(deltaSeconds);

    // Rotation
    if (this.input.isKeyDown('ArrowLeft') || this.input.isKeyDown('KeyA')) {
      this.player.rotation -= GameConfig.playerRotationSpeed * deltaSeconds;
    }
    if (this.input.isKeyDown('ArrowRight') || this.input.isKeyDown('KeyD')) {
      this.player.rotation += GameConfig.playerRotationSpeed * deltaSeconds;
    }

    // Movement
    if (this.input.isKeyDown('ArrowUp') || this.input.isKeyDown('KeyW')) {
      this.player.x += Math.cos(this.player.rotation) * GameConfig.playerSpeed * deltaSeconds;
      this.player.y += Math.sin(this.player.rotation) * GameConfig.playerSpeed * deltaSeconds;
    }
    if (this.input.isKeyDown('ArrowDown') || this.input.isKeyDown('KeyS')) {
      this.player.x -= Math.cos(this.player.rotation) * GameConfig.playerSpeed * deltaSeconds;
      this.player.y -= Math.sin(this.player.rotation) * GameConfig.playerSpeed * deltaSeconds;
    }

    // Island Collision (Player)
    if (distance(this.player.x, this.player.y, this.islandSprite.x, this.islandSprite.y) < 100) {
      const angle = angleBetween(this.islandSprite.x, this.islandSprite.y, this.player.x, this.player.y);
      this.player.x = this.islandSprite.x + Math.cos(angle) * 100;
      this.player.y = this.islandSprite.y + Math.sin(angle) * 100;
    }

    // Shooting
    if (this.input.isKeyDown('Space') && this.player.frontCooldown <= 0) {
      this.shootProjectile(this.player.x, this.player.y, this.player.rotation, true);
      this.player.frontCooldown = GameConfig.playerFrontCooldown;
    }
    
    // Side shooting (e.g. Q and E)
    if (this.input.isKeyDown('KeyQ') && this.player.sideCooldown <= 0) {
      this.shootSide(-Math.PI / 2);
      this.player.sideCooldown = GameConfig.playerSideCooldown;
    }
    if (this.input.isKeyDown('KeyE') && this.player.sideCooldown <= 0) {
      this.shootSide(Math.PI / 2);
      this.player.sideCooldown = GameConfig.playerSideCooldown;
    }

    this.player.update(deltaSeconds);
  }

  private shootSide(angleOffset: number) {
    const angle = this.player.rotation + angleOffset;
    for (let i = -1; i <= 1; i++) {
      const offsetAmt = i * 20;
      // offset the starting position of the 3 parallel projectiles
      const px = this.player.x + Math.cos(this.player.rotation) * offsetAmt;
      const py = this.player.y + Math.sin(this.player.rotation) * offsetAmt;
      this.shootProjectile(px, py, angle, true);
    }
  }

  private updateEnemies(deltaSeconds: number) {
    this.spawnTimer += deltaSeconds;
    if (this.spawnTimer >= GameConfig.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.isDead) {
        enemy.destroy();
        this.enemies.splice(i, 1);
        continue;
      }

      const distToPlayer = distance(enemy.x, enemy.y, this.player.x, this.player.y);
      const angleToPlayer = angleBetween(enemy.x, enemy.y, this.player.x, this.player.y);
      
      // Rotate towards player smoothly
      const targetRotation = angleToPlayer;
      let diff = targetRotation - enemy.rotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      enemy.rotation += Math.sign(diff) * Math.min(Math.abs(diff), GameConfig.playerRotationSpeed * deltaSeconds);

      if (enemy instanceof Chaser) {
        enemy.x += Math.cos(enemy.rotation) * enemy.speed * deltaSeconds;
        enemy.y += Math.sin(enemy.rotation) * enemy.speed * deltaSeconds;
      } else if (enemy instanceof Shooter) {
        enemy.updateCooldowns(deltaSeconds);
        if (distToPlayer > GameConfig.shooterRange) {
          enemy.x += Math.cos(enemy.rotation) * enemy.speed * deltaSeconds;
          enemy.y += Math.sin(enemy.rotation) * enemy.speed * deltaSeconds;
        } else if (enemy.cooldown <= 0) {
          this.shootProjectile(enemy.x, enemy.y, enemy.rotation, false);
          enemy.cooldown = GameConfig.shooterCooldown;
        }
      }

      // Island Collision
      if (distance(enemy.x, enemy.y, this.islandSprite.x, this.islandSprite.y) < 100) {
        const angle = angleBetween(this.islandSprite.x, this.islandSprite.y, enemy.x, enemy.y);
        enemy.x = this.islandSprite.x + Math.cos(angle) * 100;
        enemy.y = this.islandSprite.y + Math.sin(angle) * 100;
      }

      enemy.update(deltaSeconds);
    }
  }

  private spawnEnemy() {
    const isChaser = Math.random() > 0.5;
    const enemy = isChaser ? new Chaser(this.textures.chaser, this.gameContainer) : new Shooter(this.textures.shooter, this.gameContainer);
    
    let sx, sy;
    do {
      sx = Math.random() * this.app.screen.width;
      sy = Math.random() * this.app.screen.height;
    } while (distance(sx, sy, this.player.x, this.player.y) < 300);

    enemy.x = sx;
    enemy.y = sy;
    this.enemies.push(enemy);
  }

  private updateProjectiles(deltaSeconds: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (proj.isDead ||
          proj.x < 0 || proj.x > this.app.screen.width ||
          proj.y < 0 || proj.y > this.app.screen.height ||
          distance(proj.x, proj.y, this.islandSprite.x, this.islandSprite.y) < 80)
      {
        proj.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }
      proj.update(deltaSeconds);
    }
  }

  private shootProjectile(x: number, y: number, rotation: number, isPlayerOwned: boolean) {
    const proj = new Projectile(this.textures.projectile, this.gameContainer, x, y, rotation, isPlayerOwned);
    if (!isPlayerOwned) proj.sprite.tint = 0xff0000;
    this.projectiles.push(proj);
  }

  private checkCollisions() {
    // Projectile vs Ships
    for (const proj of this.projectiles) {
      if (proj.isDead) continue;

      if (proj.isPlayerOwned) {
        for (const enemy of this.enemies) {
          if (!enemy.isDead && circleIntersect(proj.x, proj.y, proj.radius, enemy.x, enemy.y, enemy.radius)) {
            proj.isDead = true;
            enemy.takeDamage(proj.damage);
            if (enemy.isDead) this.score++;
            break;
          }
        }
      } else {
        if (circleIntersect(proj.x, proj.y, proj.radius, this.player.x, this.player.y, this.player.radius)) {
          proj.isDead = true;
          this.player.takeDamage(GameConfig.shooterDamage); // Assuming uniform damage or fetch from shooter
        }
      }
    }

    for (const enemy of this.enemies) {
      if (!enemy.isDead && enemy instanceof Chaser) {
        if (circleIntersect(enemy.x, enemy.y, enemy.radius, this.player.x, this.player.y, this.player.radius)) {
          this.player.takeDamage(GameConfig.chaserDamage);
          enemy.isDead = true;
        }
      }
    }
  }

  private endGame(reason: string) {
    this.isGameOver = true;
    const timePlayed = GameConfig.matchDuration - this.matchTime;
    this.onEndGame(reason, this.score, Math.floor(timePlayed));
  }

  public destroy() {
    this.input.destroy();
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
  }


}
