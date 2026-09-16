class GameRoom {
  constructor() {
    this.players = {};
    this.coins = [];
    this.arenaWidth = 800;
    this.arenaHeight = 600;
    this.coinIdCounter = 0;
    
    // Generate some initial coins
    for (let i = 0; i < 5; i++) {
      this.spawnCoin();
    }
  }

  addPlayer(id, username) {
    this.players[id] = {
      id,
      username,
      x: Math.random() * (this.arenaWidth - 50) + 25,
      y: Math.random() * (this.arenaHeight - 50) + 25,
      score: 0,
      color: Math.floor(Math.random()*16777215).toString(16) // Random hex color
    };
  }

  removePlayer(id) {
    delete this.players[id];
  }

  movePlayer(id, direction) {
    const player = this.players[id];
    if (!player) return;

    const speed = 10;
    if (direction.up) player.y -= speed;
    if (direction.down) player.y += speed;
    if (direction.left) player.x -= speed;
    if (direction.right) player.x += speed;

    // Constrain to arena
    player.x = Math.max(0, Math.min(this.arenaWidth, player.x));
    player.y = Math.max(0, Math.min(this.arenaHeight, player.y));

    this.checkCollisions(player);
  }

  spawnCoin() {
    this.coins.push({
      id: this.coinIdCounter++,
      x: Math.random() * (this.arenaWidth - 30) + 15,
      y: Math.random() * (this.arenaHeight - 30) + 15
    });
  }

  checkCollisions(player) {
    const playerRadius = 20;
    const coinRadius = 15;

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      const dx = player.x - coin.x;
      const dy = player.y - coin.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < playerRadius + coinRadius) {
        // Collision detected
        player.score += 10;
        this.coins.splice(i, 1);
        this.spawnCoin(); // Spawn a new one
      }
    }
  }

  getState() {
    return {
      players: this.players,
      coins: this.coins
    };
  }
}

module.exports = GameRoom;
