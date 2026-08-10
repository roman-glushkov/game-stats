import { ArcadeMemory } from "./arcade-memory.js";
import { ArcadeLeaderboard } from "./arcade-leaderboard.js";

export class ArcadeManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.leaderboard = new ArcadeLeaderboard(dataManager);
    this.arcadeGame = null;
    this.arcadeActive = false;
  }

  renderGames() {
    const container = document.getElementById("arcadeGrid");
    if (!container) return;

    const games = [
      {
        id: "memory",
        name: "🎴 Память",
        description: "Найди пары одинаковых карточек против бота",
        players: 1,
        icon: "🧠",
      },
      {
        id: "coming_soon",
        name: "🚧 Скоро",
        description: "Новые игры в разработке",
        players: 0,
        icon: "🔜",
      },
    ];

    container.innerHTML = games
      .map(
        (game) => `
      <div class="arcade-card" onclick="${
        game.id !== "coming_soon"
          ? `window.app.arcadeManager.startGame('${game.id}')`
          : ""
      }" 
           style="${
             game.id === "coming_soon"
               ? "opacity: 0.6; cursor: not-allowed;"
               : ""
           }">
        <div class="arcade-icon">${game.icon}</div>
        <div class="arcade-info">
          <div class="arcade-name">${game.name}</div>
          <div class="arcade-desc">${game.description}</div>
          ${
            game.players > 0
              ? `<div class="arcade-players">👤 ${game.players} игрок</div>`
              : ""
          }
        </div>
        ${
          game.id !== "coming_soon"
            ? `<button class="btn btn-primary btn-sm">Играть</button>`
            : `<span style="color: var(--text-muted); font-size: 12px;">Скоро</span>`
        }
      </div>
    `
      )
      .join("");
  }

  renderLeaderboard() {
    this.leaderboard.render();
  }

  startGame(gameId) {
    if (this.arcadeActive) return;

    this.arcadeActive = true;
    const grid = document.getElementById("arcadeGrid");
    const container = document.getElementById("arcadeGameContainer");

    if (grid) grid.style.display = "none";
    if (container) {
      container.style.display = "block";
      container.innerHTML = "";

      if (gameId === "memory") {
        this.arcadeGame = new ArcadeMemory(container);
        this.arcadeGame.manager = this;
      }
    }
  }

  closeGame() {
    this.arcadeActive = false;
    this.arcadeGame = null;

    const grid = document.getElementById("arcadeGrid");
    const container = document.getElementById("arcadeGameContainer");

    if (grid) grid.style.display = "grid";
    if (container) {
      container.style.display = "none";
      container.innerHTML = "";
    }

    this.renderLeaderboard();
  }

  click(index) {
    if (this.arcadeGame && typeof this.arcadeGame.click === "function") {
      this.arcadeGame.click(index);
    }
  }

  saveScore(gameId, score) {
    const player = window.app?.currentUser || "Гость";
    this.dataManager.saveArcadeScore(gameId, score, player);
    this.renderLeaderboard();
  }
}
