# Gesture Recognition Rock Paper Scissors

Web-based Rock Paper Scissors duel driven by real-time hand tracking with MediaPipe Hands.

## Features
- Real-time webcam capture with 21-point hand landmark overlay
- Automatic detection of finger states and mapping to Rock/Paper/Scissors
- Countdown-driven game loop with Normal and Evil AI personalities
- Dual-screen layout: player control view + audience-friendly scoreboard view
- Placeholder audio and animation hooks for fast iteration

## Quick Start
1. Clone the repo:
   ```powershell
   git clone https://github.com/Diluksha-Upeka/gesture-rps-game.git
   ```
2. Open `index.html` in Chrome (or any MediaPipe-compatible browser).
3. Allow webcam access when prompted and show your hand to begin.

## Project Structure
```
index.html         # Main page wiring video, UI, and script
style.css          # Layout, dual-screen styling, placeholder animations
script.js          # MediaPipe setup, gesture classification, game loop
assets/            # Replace placeholder icons and SFX with final assets
libs/              # Store offline MediaPipe bundles or helper libraries
```

## Development Notes
- The project uses CDN links for MediaPipe Hands. For offline/production usage, copy the library files into `libs/` and update the paths.
- `script.js` exports helpers (`registerCustomAiMode`, `setGestureIcon`, `enableDebugPanel`) so teammates can extend AI personalities or tweak UI behaviour.
- Placeholder assets under `assets/` must be replaced with real PNG/MP3 files before shipping.

## Roadmap Ideas
- Add particle and lighting animations when announcing winners.
- Implement additional AI archetypes (mirror, adaptive difficulty, tournament bracket).
- Track match history, streaks, or achievements in local storage.
- Provide accessibility options (colorblind-friendly palette, narrated countdown).

## Credits
Built using MediaPipe Hands and vanilla JavaScript.
