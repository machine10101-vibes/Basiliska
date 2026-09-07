import * as THREE from 'three';
import { Game } from './core/Game';

// Treat every hex colour literally (no sRGB -> linear conversion). Our shaders
// write straight to the framebuffer, so "what you type is what you see".
THREE.ColorManagement.enabled = false;

const canvas = document.getElementById('game');
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('index.html must contain <canvas id="game">');
}

const game = new Game(canvas);
game.start();

// Expose for quick poking around in the devtools console during development.
if (import.meta.env.DEV) {
  (window as unknown as { game: Game }).game = game;
}
