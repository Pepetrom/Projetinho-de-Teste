import * as PIXI from 'pixi.js';
import { socket } from '../services/socket';

export class PixiApp {
  constructor(canvasElement) {
    this.app = new PIXI.Application({
      view: canvasElement,
      width: 800,
      height: 600,
      backgroundColor: 0x222233,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.playerSprites = {};
    this.coinSprites = {};
    this.keys = { up: false, down: false, left: false, right: false };

    // Setup input
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));

    // Setup socket listeners
    socket.on('init_state', this.onGameState.bind(this));
    socket.on('game_state', this.onGameState.bind(this));

    // Start ticker (game loop)
    this.app.ticker.add(this.update.bind(this));
  }

  onKeyDown(e) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = true;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
  }

  onKeyUp(e) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
  }

  update() {
    // Send movement to server
    if (socket.connected) {
      if (this.keys.up || this.keys.down || this.keys.left || this.keys.right) {
        socket.emit('move', this.keys);
      }
    }
  }

  onGameState(state) {
    // Basic state reconciliation (Server is authoritative)
    
    // 1. Update/Create Players
    const incomingPlayerIds = Object.keys(state.players);
    incomingPlayerIds.forEach(id => {
      const pState = state.players[id];
      if (!this.playerSprites[id]) {
        this.createPlayerSprite(pState);
      } else {
        // Interpolation could be added here for smoothness
        this.playerSprites[id].x = pState.x;
        this.playerSprites[id].y = pState.y;
        
        // Update name text position
        this.playerSprites[id].nameText.x = pState.x;
        this.playerSprites[id].nameText.y = pState.y - 30;
      }
    });

    // Remove disconnected players
    Object.keys(this.playerSprites).forEach(id => {
      if (!incomingPlayerIds.includes(id)) {
        this.app.stage.removeChild(this.playerSprites[id]);
        this.app.stage.removeChild(this.playerSprites[id].nameText);
        delete this.playerSprites[id];
      }
    });

    // 2. Update/Create Coins
    const incomingCoinIds = state.coins.map(c => c.id.toString());
    state.coins.forEach(cState => {
      if (!this.coinSprites[cState.id]) {
        this.createCoinSprite(cState);
      }
    });

    // Remove collected coins
    Object.keys(this.coinSprites).forEach(id => {
      if (!incomingCoinIds.includes(id)) {
        this.app.stage.removeChild(this.coinSprites[id]);
        delete this.coinSprites[id];
      }
    });
  }

  createPlayerSprite(pState) {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(parseInt(pState.color, 16));
    graphics.drawCircle(0, 0, 20); // 20px radius
    graphics.endFill();
    graphics.x = pState.x;
    graphics.y = pState.y;

    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    const nameText = new PIXI.Text(pState.username, style);
    nameText.anchor.set(0.5);
    nameText.x = pState.x;
    nameText.y = pState.y - 30;

    this.app.stage.addChild(graphics);
    this.app.stage.addChild(nameText);
    
    // Store reference
    graphics.nameText = nameText;
    this.playerSprites[pState.id] = graphics;
  }

  createCoinSprite(cState) {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xffd700); // Gold
    graphics.drawCircle(0, 0, 15);
    graphics.endFill();
    
    // Make it shine a bit
    graphics.lineStyle(2, 0xffffff, 0.5);
    graphics.drawCircle(0, 0, 10);

    graphics.x = cState.x;
    graphics.y = cState.y;

    this.app.stage.addChild(graphics);
    this.coinSprites[cState.id] = graphics;
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('keyup', this.onKeyUp.bind(this));
    socket.off('init_state', this.onGameState);
    socket.off('game_state', this.onGameState);
    this.app.destroy(true, { children: true });
  }
}
