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
        requiresAuth: false, // ← ГОСТЬ МОЖЕТ ИГРАТЬ
      },
      {
        id: "yahtzee",
        name: "🎲 Ятзи",
        description: "Бросай кубики и собирай комбинации против бота",
        players: 1,
        icon: "🎲",
        requiresAuth: false, // ← ГОСТЬ МОЖЕТ ИГРАТЬ
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

        // ===== ДЛЯ ГОСТЯ ПОКАЗЫВАЕМ "Играть без сохранения" =====
        if (!isLoggedIn && isAvailable && !game.requiresAuth) {
          buttonHtml = `<button class="btn btn-primary btn-sm">🎮 Играть</button>`;
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
                !isLoggedIn && isAvailable
                  ? `<div style="color: #f59e0b; font-size: 11px; margin-top: 4px;">🎮 Демо-режим (без сохранения)</div>`
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
    // ===== ГОСТЬ МОЖЕТ ИГРАТЬ =====
    // Проверка авторизации убрана

    // Если игра уже активна - закрываем её и запускаем новую
    if (this.arcadeActive) {
      this.arcadeActive = false;
      this.arcadeGame = null;
      this.gameType = null;

      const container = document.getElementById("arcadeGameContainer");
      if (container) {
        container.innerHTML = "";
        container.style.display = "none";
      }

      const grid = document.getElementById("arcadeGrid");
      if (grid) grid.style.display = "grid";
    }

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

  yahtzeeClick(category) {
    if (
      this.arcadeGame &&
      typeof this.arcadeGame.clickPlayerCell === "function"
    ) {
      this.arcadeGame.clickPlayerCell(category);
    }
  }

  yahtzeePlay() {
    if (this.arcadeGame && typeof this.arcadeGame.confirmPlay === "function") {
      this.arcadeGame.confirmPlay();
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

  async saveScore(gameId, score) {
    // ===== ГОСТЬ — НЕ СОХРАНЯЕМ =====
    if (!window.app?.isLoggedIn) {
      console.log("👤 Гость — очки не сохраняются");
      this.renderLeaderboard();
      return;
    }

    // Получаем displayName пользователя
    const userData = this.storageManager.getUserData(window.app?.currentUser);
    const player = userData?.displayName || window.app?.currentUser || "Гость";

    // Сначала загружаем свежие данные
    await this.storageManager.refreshArcadeData();

    // Сохраняем очки
    await this.storageManager.saveArcadeScore(gameId, score, player);

    // Обновляем только аркадные данные на сервере
    await this.storageManager.saveArcadeOnly();

    // Обновляем отображение
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

  leaderboardSwitch(gameId) {
    this.leaderboard.switchGame(gameId);
  }
}
