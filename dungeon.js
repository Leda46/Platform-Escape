// Canvas Setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
console.log(canvas.width)
console.log(canvas.height)

// Game Variables
const gravity = 0.5;
let playerSpeed = 5;
let jumpPower = -16.5; // Default jump power
let keys = {};
let platforms = [];
let obstacles = [];
let collectibles = [];
let collectedItems = 0;
let totalCollectibles = 0;
let gameOver = false;
let goal; // Declare goal globally


// Player Object
const player = {
  x: 50,
  y: canvas.height - 100,
  width: 50,
  height: 50,
  color: "orange",
  dy: 0,
  onGround: false,
};

// Platform Class
class Platform {
  constructor(x, y, width, height, gapSide) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = "#8b4513";

    // Booster is placed below the gap
    const boosterWidth = 30;
    this.booster = {
      x: gapSide === "left" ? this.x + this.width + 20 : this.x, // Align with the gap
      y: this.y + this.height + 70, // Place just below the platform
      width: boosterWidth,
      height: 10,
    };
  }

  draw() {
    // Draw the platform
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw the booster
    ctx.fillStyle = "orange";
    ctx.fillRect(this.booster.x, this.booster.y, this.booster.width, this.booster.height);
  }
}

// Goal Class
class Goal {
  constructor(x, y, width, height, color = "green") {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }
  draw() {
    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  
}




// Obstacle Class
class Obstacle {
  constructor(x, y, width, height, color = "red", speed = 0, direction = "horizontal", type = "spike") {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.speed = speed;
    this.direction = direction;
    this.type = type; // 'spike' or 'fireball'
    this.radius = 15; // Default for fireballs (red circles)
  }

  draw() {
    ctx.fillStyle = this.color;

    if (this.type === "spike") {
      // Draw spike (triangle shape)
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height); // Left bottom
      ctx.lineTo(this.x + this.width / 2, this.y); // Top
      ctx.lineTo(this.x + this.width, this.y + this.height); // Right bottom
      ctx.closePath();
      ctx.fill();
    } else if (this.type === "fireball") {
      // Draw fireball (red circle)
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  update() {
    if (this.type === "fireball" && this.speed > 0) {
      // Fireball movement logic
      if (this.direction === "horizontal") {
        this.x += this.speed;

        // Check if the fireball has moved off the screen (left or right)
        if (this.x + this.radius < 0) {
          // Fireball has gone off the left side, reset to the right side
          this.x = canvas.width + this.radius; // Place it at the right side
        } else if (this.x - this.radius > canvas.width) {
          // Fireball has gone off the right side, reset to the left side
          this.x = -this.radius; // Place it at the left side
        }
      }
    }
  }
}


  





// Collectible Class
class Collectible {
  constructor(x, y, width, height, color = "gold", speed = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.speed = speed; // Set to 0 so they don't move
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}


// Create Platforms, Obstacles, and Collectibles
function createGameObjects() {
  const platformHeight = 20;
  const levelSpacing = 150;
  const platformGap = 200;

  for (let i = 0; i < 6; i++) {
    const y = canvas.height - (i + 1) * levelSpacing;
    const gapSide = i % 2 === 0 ? "left" : "right";
    let platformX, platformWidth;

    if (gapSide === "left") {
      platformX = 0;
      platformWidth = canvas.width - platformGap;
    } else {
      platformX = platformGap;
      platformWidth = canvas.width - platformGap;
    }

    const platform = new Platform(platformX, y, platformWidth, platformHeight, gapSide);
    platforms.push(platform);

    for (let j = 0; j < 3; j++) {
      const spikeX = platformX + Math.random() * (platformWidth - 50);
      obstacles.push(new Obstacle(spikeX, y - 15, 50, 20, "red", 0, "horizontal", "spike"));
    }

    if (i % 2 === 1) {
      obstacles.push(new Obstacle(platformX + 200, y - 40, 40, 40, "orange", 3, "horizontal", "fireball"));
    }

    collectibles.push(new Collectible(platformX + platformWidth / 2 - 10, y - 50, 20, 20, "gold"));
    totalCollectibles++;
  }

  const topPlatform = platforms[platforms.length - 1];
  const goalX = canvas.width / 2 + 580;
  const goalY = topPlatform.y + 200;
  goal = new Goal(goalX, goalY, 50, 50);
}




// Draw Player
function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Player Movement
function movePlayer() {
  if (keys.ArrowLeft) player.x -= playerSpeed;
  if (keys.ArrowRight) player.x += playerSpeed;

  // Prevent player from going off screen
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  player.dy += gravity;
  player.y += player.dy;

  // Stop at bottom
  if (player.y + player.height >= canvas.height) {
    player.y = canvas.height - player.height;
    player.dy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // Check collisions with platforms
  platforms.forEach((platform) => {
    if (
      player.y + player.height >= platform.y &&
      player.y + player.height <= platform.y + platform.height &&
      player.x + player.width > platform.x &&
      player.x < platform.x + platform.width
    ) {
      player.y = platform.y - player.height;
      player.dy = 0;
      player.onGround = true;
    }

    // Prevent passing through platforms from below
    if (
      player.y <= platform.y + platform.height &&
      player.y + player.height > platform.y &&
      player.x + player.width > platform.x &&
      player.x < platform.x + platform.width
    ) {
      player.dy = Math.max(player.dy, 0);
    }

    // Booster collision
    const booster = platform.booster;
    if (
      player.x + player.width > booster.x &&
      player.x < booster.x + booster.width &&
      player.y + player.height <= booster.y &&
      player.y + player.height + player.dy >= booster.y
    ) {
      player.dy = jumpPower - 5; // Boost the player upward
    }
  });

  // Obstacle collision
  obstacles.forEach((obs) => {
    // Fireball collision detection
    if (obs.type === "fireball") {
      const dx = player.x + player.width / 2 - obs.x; // Horizontal distance
      const dy = player.y + player.height / 2 - obs.y; // Vertical distance
      const distance = Math.sqrt(dx * dx + dy * dy);
    
      if (distance < obs.radius + player.width / 2) {
        endGame();
      }
    }
    // Spike collision detection (for spikes)
    if (obs.type === "spike") {
      if (
        player.x + player.width > obs.x + 5 &&
        player.x < obs.x + obs.width - 5 &&
        player.y + player.height > obs.y + 5 &&
        player.y < obs.height + obs.y - 5
      ) {
        endGame(); // Game ends if player hits a spike
      }
    }
  });

  // Check goal collision
  if (
    player.x < goal.x + goal.width &&
    player.x + player.width > goal.x &&
    player.y < goal.y + goal.height &&
    player.y + player.height > goal.y
  ) {
    alert("You win!");
    gameOver = true;
  }

  // Collectibles collision
  collectibles.forEach((item, index) => {
    if (
      player.x < item.x + item.width &&
      player.x + player.width > item.x &&
      player.y < item.y + item.height &&
      player.y + player.height > item.y
    ) {
      collectibles.splice(index, 1);
      collectedItems++;
      if (collectedItems === totalCollectibles) {
        jumpPower = -25;
        alert("All collectibles collected! Jump power increased!");
      }
    }
  });
}

// End Game
function endGame() {
  gameOver = true;
  alert("Game Over! You hit an obstacle.");
  window.location.reload();
}

// Key Listeners
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === "ArrowUp" && player.onGround) {
    player.dy = jumpPower;
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Game Loop
function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPlayer();
  
  platforms.forEach((platform) => platform.draw());
  // Update and draw obstacles (fireballs, spikes, etc.)
  obstacles.forEach((obs) => {
    obs.update(); // Update the fireball movement (or any other obstacle)
    obs.draw(); // Draw the obstacle
  });
 

  collectibles.forEach((item) => item.draw());
  console.log(goal)
  goal.draw();
  movePlayer();

  requestAnimationFrame(gameLoop)
}

//Initialize game
createGameObjects(); // This must run before logging `goal`
console.log('Goal Coordinates:', goal.x, goal.y);
gameLoop();




