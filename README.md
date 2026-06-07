# Brick Breaker

A faithful recreation of the classic **Brick Breaker** (Breakout) arcade game,
built with plain HTML, CSS, and JavaScript — **no dependencies, no build step,
and fully playable offline.**

## ▶️ Play

Once GitHub Pages is enabled (see below), the game is available at:

```
https://julianj21.github.io/brickbreaker/
```

## 🎮 How to play

- **Move the paddle:** Mouse, touch/drag, or the `←` / `→` (or `A` / `D`) keys.
- **Launch the ball:** Click, tap, or press `Space`.
- **Pause / resume:** Press `Space` while playing, or use the Pause button.
- **Goal:** Destroy every brick to clear the level. There are 6 levels of
  increasing difficulty (faster ball, tougher multi-hit bricks). Don't let the
  ball fall past your paddle — you have 3 lives.

Your best score is saved locally in the browser.

## ✨ Features

- Responsive canvas that scales to phones, tablets, and desktops.
- Angle-based paddle physics (hit position controls the bounce).
- Multi-hit bricks and escalating difficulty across levels.
- Score, level, lives, and persistent high-score tracking.
- **Offline support** via a service worker — after the first load it runs with
  no network, and can be installed as a PWA.

## 🚀 Deployment (GitHub Pages)

Deployment is automated with GitHub Actions
(`.github/workflows/deploy.yml`). To enable it:

1. Push to the `main` branch.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.

Every push to `main` then publishes the site automatically.

## 🛠️ Run locally

It's just static files, so any static server works:

```bash
# Python
python3 -m http.server 8000
# then open http://localhost:8000
```

Or simply open `index.html` directly in a browser (note: the service worker
only registers over `http(s)`, not the `file://` protocol).

## 📁 Project structure

```
index.html              # Markup + HUD + overlay
style.css               # Styling and responsive layout
game.js                 # Game loop, physics, levels, input
sw.js                   # Service worker for offline caching
manifest.webmanifest    # PWA manifest
.github/workflows/      # GitHub Pages deploy workflow
```
