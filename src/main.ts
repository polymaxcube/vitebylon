import './style.css'
import { GameRender } from './core/GameRender.ts'

document.addEventListener("DOMContentLoaded", async () => {
  const game = new GameRender("renderGame");
  await game.start();

});

