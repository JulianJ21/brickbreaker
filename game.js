(function () {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  // Logical resolution (canvas internal size). The CSS scales it responsively.
  const W = canvas.width;   // 480
  const H = canvas.height;  // 600

  // ---- UI elements ----
  const scoreEl = document.getElementById("score");
  const levelEl = document.getElementById("level");
  const livesEl = document.getElementById("lives");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayText = document.getElementById("overlay-text");
  const startBtn = document.getElementById("start-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const restartBtn = document.getElementById("restart-btn");

  // ---- Game configuration ----
  const PADDLE_W = 90;
  const PADDLE_H = 14;
  const PADDLE_Y = H - 40;
  const BALL_R = 8;
  const BASE_SPEED = 5;

  const BRICK_ROWS = 6;
  const BRICK_COLS = 9;
  const BRICK_GAP = 6;
  const BRICK_TOP = 60;
  const BRICK_SIDE = 16;
  const BRICK_H = 22;
  const BRICK_W = (W - BRICK_SIDE * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;

  const ROW_COLORS = [
    "#ff5b6e", "#ff8a5b", "#ffd166", "#06d6a0", "#4cc9f0", "#9b5de5",
  ];

  // ---- Game state ----
  const STATE = { MENU: "menu", PLAYING: "playing", PAUSED: "paused", READY: "ready", OVER: "over", WIN: "win" };

  let state = STATE.MENU;
  let score = 0;
  let lives = 3;
  let level = 1;
  let best = Number(localStorage.getItem("brickBreakerBest") || 0);
  bestEl.textContent = best;

  const paddle = { x: W / 2 - PADDLE_W / 2, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H };
  const ball = { x: W / 2, y: PADDLE_Y - BALL_R, dx: 0, dy: 0, r: BALL_R, stuck: true };
  let bricks = [];

  let pointerX = null;     // target paddle center from mouse/touch
  let snapPaddle = false;  // true while dragging by touch -> 1:1 tracking
  const keys = { left: false, right: false };

  // ---- Level / brick setup ----
  function buildBricks() {
    bricks = [];
    const rows = Math.min(BRICK_ROWS, 3 + level); // grows with level, capped
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        // Higher rows are tougher on later levels.
        let hp = 1;
        if (level >= 2 && r < 2) hp = 2;
        if (level >= 4 && r < 1) hp = 3;
        bricks.push({
          x: BRICK_SIDE + c * (BRICK_W + BRICK_GAP),
          y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
          w: BRICK_W,
          h: BRICK_H,
          hp: hp,
          maxHp: hp,
          color: ROW_COLORS[r % ROW_COLORS.length],
          alive: true,
        });
      }
    }
  }

  function currentSpeed() {
    return BASE_SPEED + (level - 1) * 0.6;
  }

  function resetBall() {
    ball.stuck = true;
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 1;
    ball.dx = 0;
    ball.dy = 0;
  }

  function launchBall() {
    if (!ball.stuck) return;
    const speed = currentSpeed();
    const angle = (-Math.PI / 2) + (Math.random() * 0.5 - 0.25); // mostly upward
    ball.dx = Math.cos(angle) * speed;
    ball.dy = Math.sin(angle) * speed;
    ball.stuck = false;
  }

  function startGame() {
    score = 0;
    lives = 3;
    level = 1;
    syncHud();
    startLevel();
  }

  function startLevel() {
    buildBricks();
    paddle.x = W / 2 - paddle.w / 2;
    resetBall();
    state = STATE.PLAYING;
    hideOverlay();
  }

  function nextLevel() {
    level++;
    syncHud();
    buildBricks();
    paddle.x = W / 2 - paddle.w / 2;
    resetBall();
    state = STATE.PLAYING;
  }

  // ---- HUD / overlay ----
  function syncHud() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    livesEl.textContent = lives;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      localStorage.setItem("brickBreakerBest", String(best));
    }
  }

  function showOverlay(title, text, btnLabel) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    startBtn.textContent = btnLabel;
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  // ---- Input ----
  function pointerToCanvasX(clientX) {
    const rect = canvas.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * W;
  }

  canvas.addEventListener("mousemove", (e) => {
    snapPaddle = false;
    pointerX = pointerToCanvasX(e.clientX);
  });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (e.touches.length) {
      snapPaddle = true;
      pointerX = pointerToCanvasX(e.touches[0].clientX);
    }
  }, { passive: false });

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (e.touches.length) {
      snapPaddle = true;
      pointerX = pointerToCanvasX(e.touches[0].clientX);
    }
    if (state === STATE.PLAYING) launchBall();
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener("mousedown", () => {
    if (state === STATE.PLAYING) launchBall();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
    if (e.code === "Space") {
      e.preventDefault();
      if (state === STATE.PLAYING) {
        if (ball.stuck) launchBall();
        else togglePause();
      } else if (state === STATE.PAUSED) {
        togglePause();
      } else if (state === STATE.MENU || state === STATE.OVER || state === STATE.WIN) {
        startGame();
      }
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
  });

  startBtn.addEventListener("click", () => {
    if (state === STATE.MENU || state === STATE.OVER || state === STATE.WIN) startGame();
  });

  pauseBtn.addEventListener("click", togglePause);
  restartBtn.addEventListener("click", () => {
    startGame();
  });

  function togglePause() {
    if (state === STATE.PLAYING) {
      state = STATE.PAUSED;
      showOverlay("Paused", "Take a breath. Press Space or Pause to resume.", "Resume");
    } else if (state === STATE.PAUSED) {
      state = STATE.PLAYING;
      hideOverlay();
    }
  }

  startBtn.addEventListener("click", () => {
    if (state === STATE.PAUSED) togglePause();
  });

  // ---- Update ----
  function update() {
    if (state !== STATE.PLAYING) return;

    // Paddle movement: keyboard
    const kbSpeed = 8;
    if (keys.left) paddle.x -= kbSpeed;
    if (keys.right) paddle.x += kbSpeed;

    // Paddle movement: pointer. Touch tracks 1:1 (snap); mouse eases smoothly.
    if (pointerX !== null) {
      const target = pointerX - paddle.w / 2;
      paddle.x += (target - paddle.x) * (snapPaddle ? 1 : 0.4);
    }

    // Clamp paddle
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));

    if (ball.stuck) {
      ball.x = paddle.x + paddle.w / 2;
      ball.y = paddle.y - ball.r - 1;
      return;
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collisions
    if (ball.x - ball.r < 0) { ball.x = ball.r; ball.dx = Math.abs(ball.dx); }
    if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.dx = -Math.abs(ball.dx); }
    if (ball.y - ball.r < 0) { ball.y = ball.r; ball.dy = Math.abs(ball.dy); }

    // Bottom — lose a life
    if (ball.y - ball.r > H) {
      lives--;
      syncHud();
      if (lives <= 0) {
        gameOver();
      } else {
        resetBall();
      }
      return;
    }

    // Paddle collision
    if (
      ball.dy > 0 &&
      ball.y + ball.r >= paddle.y &&
      ball.y - ball.r <= paddle.y + paddle.h &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.w
    ) {
      const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2); // -1..1
      const speed = Math.hypot(ball.dx, ball.dy) || currentSpeed();
      const bounce = hit * (Math.PI / 3); // max 60deg
      ball.dx = Math.sin(bounce) * speed;
      ball.dy = -Math.abs(Math.cos(bounce) * speed);
      ball.y = paddle.y - ball.r - 1;
    }

    // Brick collisions
    for (const b of bricks) {
      if (!b.alive) continue;
      if (
        ball.x + ball.r > b.x &&
        ball.x - ball.r < b.x + b.w &&
        ball.y + ball.r > b.y &&
        ball.y - ball.r < b.y + b.h
      ) {
        // Determine bounce side via overlap depth.
        const overlapLeft = ball.x + ball.r - b.x;
        const overlapRight = b.x + b.w - (ball.x - ball.r);
        const overlapTop = ball.y + ball.r - b.y;
        const overlapBottom = b.y + b.h - (ball.y - ball.r);
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapLeft || minOverlap === overlapRight) {
          ball.dx = -ball.dx;
        } else {
          ball.dy = -ball.dy;
        }

        b.hp--;
        if (b.hp <= 0) {
          b.alive = false;
          score += 10 * level;
        } else {
          score += 5;
        }
        syncHud();
        break; // one brick per frame keeps physics stable
      }
    }

    // Win check
    if (bricks.every((b) => !b.alive)) {
      if (level >= 6) {
        win();
      } else {
        levelCleared();
      }
    }
  }

  function levelCleared() {
    state = STATE.READY;
    showOverlay("Level " + level + " Clear!", "Nice. Ready for the next round?", "Next Level");
    const handler = () => {
      startBtn.removeEventListener("click", handler);
      hideOverlay();
      nextLevel();
    };
    startBtn.addEventListener("click", handler);
  }

  function gameOver() {
    state = STATE.OVER;
    syncHud();
    showOverlay("Game Over", "Final score: " + score + ". Try again?", "Play Again");
  }

  function win() {
    state = STATE.WIN;
    syncHud();
    showOverlay("You Win! 🎉", "You cleared all levels with " + score + " points!", "Play Again");
  }

  // ---- Render ----
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function shade(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amount;
    let g = ((n >> 8) & 0xff) + amount;
    let b = (n & 0xff) + amount;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // Bricks
    for (const b of bricks) {
      if (!b.alive) continue;
      const dim = b.maxHp > 1 ? (b.hp / b.maxHp) : 1;
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 0.55 + 0.45 * dim;
      roundRect(b.x, b.y, b.w, b.h, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      // top highlight
      ctx.fillStyle = shade(b.color, 40);
      roundRect(b.x, b.y, b.w, 4, 2);
      ctx.fill();
    }

    // Paddle
    const grad = ctx.createLinearGradient(0, paddle.y, 0, paddle.y + paddle.h);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.5, "#cfd6ff");
    grad.addColorStop(1, "#8b93c7");
    ctx.fillStyle = grad;
    roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 7);
    ctx.fill();

    // Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 1, ball.x, ball.y, ball.r);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(1, "#ff8a5b");
    ctx.fillStyle = bg;
    ctx.fill();

    // "Launch" prompt
    if (state === STATE.PLAYING && ball.stuck) {
      ctx.fillStyle = "rgba(232,236,255,0.8)";
      ctx.font = "14px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Tap / Space to launch", W / 2, paddle.y - 24);
    }
  }

  // ---- Main loop ----
  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  // Initial overlay
  showOverlay("Brick Breaker", "Clear every brick to advance. Don't let the ball fall!", "Start Game");
  resetBall();
  render();
  loop();
})();
