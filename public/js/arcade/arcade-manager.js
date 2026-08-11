import { ArcadeMemory } from "./arcade-memory.js";
import { ArcadeYahtzee } from "./arcade-yahtzee.js";
import { ArcadeLeaderboard } from "./arcade-leaderboard.js";

export class ArcadeManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.leaderboard = new ArcadeLeaderboard(storageManager);
    this.arcadeGame = null;
    this.arcadeActive = false;
    this.gameType = null;
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
        id: "yahtzee",
        name: "🎲 Ятзи",
        description: "Бросай кубики и собирай комбинации против бота",
        players: 1,
        icon: "🎲",
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
    if (!window.app?.isLoggedIn) {
      alert("⚠️ Для игры в аркады необходимо войти в систему");
      return;
    }

    if (this.arcadeActive) return;

    this.arcadeActive = true;
    this.gameType = gameId;
    const grid = document.getElementById("arcadeGrid");
    const container = document.getElementById("arcadeGameContainer");

    if (grid) grid.style.display = "none";
    if (container) {
      container.style.display = "block";
      container.innerHTML = "";

      if (gameId === "memory") {
        this.arcadeGame = new ArcadeMemory(container);
        this.arcadeGame.manager = this;
      } else if (gameId === "yahtzee") {
        this.arcadeGame = new ArcadeYahtzee(container);
        this.arcadeGame.manager = this;
      }
    }
  }

  closeGame() {
    this.arcadeActive = false;
    this.arcadeGame = null;
    this.gameType = null;

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

  // Методы для Ятзи
  yahtzeeRoll() {
    if (this.arcadeGame && typeof this.arcadeGame.rollDice === "function") {
      this.arcadeGame.rollDice();
    }
  }

  yahtzeeToggle(index) {
    if (this.arcadeGame && typeof this.arcadeGame.toggleHold === "function") {
      this.arcadeGame.toggleHold(index);
    }
  }

  yahtzeeChoose(category) {
    if (
      this.arcadeGame &&
      typeof this.arcadeGame.chooseCategory === "function"
    ) {
      this.arcadeGame.chooseCategory(category);
    }
  }

  yahtzeeFinish() {
    if (this.arcadeGame && typeof this.arcadeGame.finishTurn === "function") {
      this.arcadeGame.finishTurn();
    }
  }

  saveScore(gameId, score) {
    const player = window.app?.currentUser || "Гость";
    this.storageManager.saveArcadeScore(gameId, score, player);
    this.renderLeaderboard();
  }

  async deleteRecord(player) {
    if (!window.app?.isLoggedIn || window.app?.userRole !== "admin") {
      alert("⚠️ Только администратор может удалять рекорды");
      return;
    }

    if (!confirm(`Удалить все рекорды игрока "${player}"?`)) return;

    try {
      const arcade = this.storageManager.getArcadeData();
      const gameId = this.gameType || "memory";

      if (arcade[gameId]) {
        arcade[gameId].records = arcade[gameId].records.filter(
          (r) => r.player !== player
        );

        this.storageManager.data.arcade = arcade;
        await this.storageManager.saveData();

        alert(`✅ Рекорды игрока "${player}" удалены`);
        this.renderLeaderboard();
        this.renderGames();
      }
    } catch (error) {
      console.error("Ошибка удаления:", error);
      alert("❌ Ошибка при удалении рекордов");
    }
  }
}
