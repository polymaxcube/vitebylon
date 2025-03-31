import './style.css'
import { GameRender } from './core/GameRender.ts'

document.addEventListener("DOMContentLoaded", () => {
  const game = new GameRender("renderGame");
  game.render();
});

