import { Game } from './core/game.js';
import { StartScreen } from './ui/StartScreen.js';

const root = document.body;
let game = null;

new StartScreen({
  root,
  onStart: (settings) => {
    game = new Game({ root, settings });
    game.start();
    window.oblindGame = game;
  },
});
