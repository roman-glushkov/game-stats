import { ArcadeMemory } from "./arcade-memory.js";
import { ArcadeLeaderboard } from "./arcade-leaderboard.js";

export class ArcadeManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.leaderboard = new ArcadeLeaderboard(storageManager);
    this.arcadeGame = null;
    this.arcadeActive = false;
  }

  renderGames() {
    const container = document.getElementById("arcadeGrid");
    if (!container) return;

    const isLoggedIn = window.app?.isLoggedIn || false;

    const games = [
      {
        id: "memory",
        name: "🎴 Память",
        description: "Найди пары одинаковых карточек против бота",
        players: 1,
        icon: "🧠",
        requiresAuth: true,
      },
      {
        id: "coming_soon",
        name: "🚧 Скоро",
        description: "Новые игры в разработке",
        players: 0,
        icon: "🔜",
        requiresAuth: false,
      },
    ];

    container.innerHTML = games
      .map((game) => {
        const isAvailable = game.id !== "coming_soon";
        const canPlay = isAvailable && (!game.requiresAuth || isLoggedIn);

        let clickHandler = "";
        let buttonHtml = "";
        let style = "";

        if (game.id === "coming_soon") {
          style = "opacity: 0.6; cursor: not-allowed;";
          buttonHtml = `<span style="color: var(--text-muted); font-size: 12px;">Скоро</span>`;
        } else if (!isLoggedIn && game.requiresAuth) {
          style = "opacity: 0.7;";
          clickHandler = `onclick="alert('⚠️ Для игры в аркады необходимо войти в систему')"`;
          buttonHtml = `<button class="btn btn-primary btn-sm" style="opacity: 0.5;">🔒 Войти</button>`;
        } else {
          clickHandler = `onclick="window.app.arcadeManager.startGame('${game.id}')"`;
          buttonHtml = `<button class="btn btn-primary btn-sm">Играть</button>`;
        }

        return `
          <div class="arcade-card" ${clickHandler} style="${style}">
            <div class="arcade-icon">${game.icon}</div>
            <div class="arcade-info">
              <div class="arcade-name">${game.name}</div>
              <div class="arcade-desc">${game.description}</div>
              ${
                game.players > 0
                  ? `<div class="arcade-players">👤 ${game.players} игрок</div>`
                  : ""
              }
              ${
                game.requiresAuth && !isLoggedIn
                  ? `<div style="color: var(--text-muted); font-size: 11px; margin-top: 4px;">🔒 Требуется вход</div>`
                  : ""
              }
            </div>
            ${buttonHtml}
          </div>
        `;
      })
      .join("");
  }

  renderLeaderboard() {
    this.leaderboard.render();
  }

  startGame(gameId) {
    // Проверка авторизации перед запуском игры
    if (!window.app?.isLoggedIn) {
      alert("⚠️ Для игры в аркады необходимо войти в систему");
      return;
    }

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
    this.storageManager.saveArcadeScore(gameId, score, player);
    this.renderLeaderboard();
  }
}
