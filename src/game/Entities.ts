import * as PIXI from 'pixi.js';
import { GameConfig } from './GameConfig';

class Entity {
  public sprite: PIXI.Sprite;
  public x: number = 0;
  public y: number = 0;
  public radius: number = 20;
  public rotation: number = 0;
  public isDead: boolean = false;

  constructor(texture: PIXI.Texture | PIXI.Texture[] | undefined, container: PIXI.Container) {
    if (texture) {
      if (Array.isArray(texture)) {
        this.sprite = new PIXI.AnimatedSprite(texture);
      } else {
        this.sprite = new PIXI.Sprite(texture);
      }
      this.sprite.anchor.set(0.5);
      container.addChild(this.sprite);
    } else {
      this.sprite = new PIXI.Sprite();
    }
  }

  public update(_deltaSeconds?: number) {
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.sprite.rotation = this.rotation - (Math.PI / 2);
  }

  public destroy() {
    this.sprite.destroy();
  }
}

export class Projectile extends Entity {
  public speed: number = GameConfig.projectileSpeed;
  public damage: number = GameConfig.playerDamage;
  public life: number = GameConfig.projectileLife;
  public lifeScale: number = this.life;
  public isPlayerOwned: boolean;
  
  constructor(texture: PIXI.Texture, container: PIXI.Container, x: number, y: number, rotation: number, isPlayerOwned: boolean) {
    super(texture, container);
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.isPlayerOwned = isPlayerOwned;
    this.radius = 5;
    
    this.sprite.scale.set(2);
  }

  public update(deltaSeconds: number) {
    this.x += Math.cos(this.rotation) * this.speed * deltaSeconds;
    this.y += Math.sin(this.rotation) * this.speed * deltaSeconds;
    
    this.life -= deltaSeconds;
    if (this.life <= 0) {
      this.isDead = true;
    }

    const pct = this.life / this.lifeScale;

    const tamanhoInicial = 1; 
    const tamanhoNoMeio = 2;  

    const A = (2 * tamanhoInicial) - (4 * tamanhoNoMeio);
    const B = (4 * tamanhoNoMeio) - tamanhoInicial;

    const novaEscala = A * (pct * pct) + B * pct;
    
    this.sprite.scale.set(Math.max(0, novaEscala)); 

    super.update(deltaSeconds);
  }
}

class Ship extends Entity {
  public health: number = 100;
  public maxHealth: number = 100;
  public speed: number = 0;
  public healthBar: PIXI.Graphics;

  constructor(texture: PIXI.Texture, container: PIXI.Container) {
    super(texture, container);
    this.healthBar = new PIXI.Graphics();
    container.addChild(this.healthBar);
    this.radius = 25; // Approximate radius for collision
  }

  public takeDamage(amount: number) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
    }
  }

  public update(deltaSeconds: number) {
    super.update(deltaSeconds);
    
    // Update health bar
    this.healthBar.clear();
    const hpWidth = 40;
    const hpHeight = 5;
    const hpPercent = Math.max(0, this.health / this.maxHealth);
    
    this.healthBar.beginFill(0xff0000);
    this.healthBar.drawRect(this.x - hpWidth/2, this.y - 40, hpWidth, hpHeight);
    this.healthBar.endFill();
    
    this.healthBar.beginFill(0x00ff00);
    this.healthBar.drawRect(this.x - hpWidth/2, this.y - 40, hpWidth * hpPercent, hpHeight);
    this.healthBar.endFill();
  }

  public destroy() {
    super.destroy();
    this.healthBar.destroy();
  }
}

export class Player extends Ship {
  public frontCooldown: number = 0;
  public sideCooldown: number = 0;

  constructor(texture: PIXI.Texture, container: PIXI.Container) {
    super(texture, container);
    this.health = this.maxHealth = GameConfig.playerHealth;
  }

  public updateCooldowns(deltaSeconds: number) {
    if (this.frontCooldown > 0) this.frontCooldown -= deltaSeconds;
    if (this.sideCooldown > 0) this.sideCooldown -= deltaSeconds;
  }
}

export class Enemy extends Ship {
  public enemyType: 'CHASER' | 'SHOOTER';
  
  constructor(texture: PIXI.Texture, container: PIXI.Container, type: 'CHASER' | 'SHOOTER') {
    super(texture, container);
    this.enemyType = type;
  }
}

export class Chaser extends Enemy {
  constructor(texture: PIXI.Texture, container: PIXI.Container) {
    super(texture, container, 'CHASER');
    this.health = this.maxHealth = GameConfig.chaserHealth;
    this.speed = GameConfig.chaserSpeed;
  }
}

export class Shooter extends Enemy {
  public cooldown: number = 0;

  constructor(texture: PIXI.Texture, container: PIXI.Container) {
    super(texture, container, 'SHOOTER');
    this.health = this.maxHealth = GameConfig.shooterHealth;
    this.speed = GameConfig.shooterSpeed;
  }

  public updateCooldowns(deltaSeconds: number) {
    if (this.cooldown > 0) this.cooldown -= deltaSeconds;
  }
}
