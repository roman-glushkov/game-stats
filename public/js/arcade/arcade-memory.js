export class ArcadeMemory {
  constructor(container) {
    this.container = container;
    this.manager = null;
    this.colors = [
      "#FF0000",
      "#00FF00",
      "#0000FF",
      "#FFFF00",
      "#FF00FF",
      "#00FFFF",
      "#FFA500",
      "#FF1493",
    ];

    this.cards = [];
    this.firstIndex = null;
    this.secondIndex = null;
    this.isLocked = false;
    this.matchedPairs = 0;
    this.totalPairs = 8;
    this.moves = 0;
    this.timer = 0;
    this.isRunning = false;
    this.timerInterval = null;
    this.playerScore = 0;
    this.botScore = 0;
    this.isPlayerTurn = true;

    this.init();
  }

  init() {
    const deck = [];
    this.colors.forEach((color, i) => {
      deck.push({ id: i, color, matched: false, flipped: false });
      deck.push({ id: i, color, matched: false, flipped: false });
    });

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    this.cards = deck;
    this.matchedPairs = 0;
    this.moves = 0;
    this.timer = 0;
    this.isRunning = true;
    this.firstIndex = null;
    this.secondIndex = null;
    this.isLocked = false;
    this.playerScore = 0;
    this.botScore = 0;
    this.isPlayerTurn = Math.random() < 0.5;

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timer++;
      const timerEl = document.getElementById("arcade-timer");
      if (timerEl) timerEl.textContent = this.timer + "с";
    }, 1000);

    this.render();

    if (!this.isPlayerTurn) {
      setTimeout(() => this.botMove(), 800);
    }
  }

  render() {
    if (!this.container) return;

    const turnText = this.isPlayerTurn ? "👤 Ваш ход" : "🤖 Ход бота...";
    const turnColor = this.isPlayerTurn ? "#4f8cff" : "#f59e0b";

    this.container.innerHTML = `
      <div class="arcade-game-header">
        <div class="arcade-game-stats">
          <span>🎯 Пар: ${this.matchedPairs}/${this.totalPairs}</span>
          <span>🔄 Ходов: ${this.moves}</span>
          <span id="arcade-timer">${this.timer}с</span>
        </div>
        <div class="arcade-game-players">
          <span class="player-score ${this.isPlayerTurn ? "active" : ""}">
            👤 Вы: ${this.playerScore}
          </span>
          <span class="player-score ${!this.isPlayerTurn ? "active" : ""}">
            🤖 Бот: ${this.botScore}
          </span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.app.arcadeManager.closeGame()">✕ Закрыть</button>
      </div>
      <div style="text-align: center; padding: 10px; margin: 10px 0; font-size: 18px; font-weight: 600; border-radius: 10px; background: var(--bg-card); border: 2px solid ${turnColor};">
        <span style="color: ${turnColor};">${turnText}</span>
      </div>
      <div class="arcade-game-board">
        ${this.cards
          .map(
            (card, index) => `
          <div class="arcade-card ${card.matched ? "matched" : ""}" 
               onclick="${
                 !card.matched &&
                 !card.flipped &&
                 this.isPlayerTurn &&
                 !this.isLocked
                   ? `window.app.arcadeManager.click(${index})`
                   : ""
               }"
               style="${
                 card.matched ? "opacity: 0.3; pointer-events: none;" : ""
               }
                      background: ${card.flipped ? card.color : "#1a1a2e"};
                      border-color: ${card.flipped ? card.color : "#4a4a6a"};
                      ${
                        card.flipped ? "box-shadow: 0 0 20px " + card.color : ""
                      };
                      ${
                        (!this.isPlayerTurn || this.isLocked) &&
                        !card.matched &&
                        !card.flipped
                          ? "cursor: not-allowed; opacity: 0.5;"
                          : ""
                      }">
            ${card.flipped ? "✦" : "❓"}
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  click(index) {
    if (!this.isRunning) return;
    if (!this.isPlayerTurn) return;
    if (this.isLocked) return;

    const card = this.cards[index];
    if (card.matched || card.flipped) return;
    if (this.firstIndex === index) return;

    card.flipped = true;
    this.moves++;
    this.render();

    if (this.firstIndex === null) {
      this.firstIndex = index;
    } else {
      this.secondIndex = index;
      this.isLocked = true;
      setTimeout(() => this.checkPlayerMatch(), 600);
    }
  }

  checkPlayerMatch() {
    const card1 = this.cards[this.firstIndex];
    const card2 = this.cards[this.secondIndex];

    if (card1.id === card2.id) {
      card1.matched = true;
      card2.matched = true;
      this.matchedPairs++;
      this.playerScore++;

      this.firstIndex = null;
      this.secondIndex = null;
      this.isLocked = false;

      this.render();

      if (this.matchedPairs === this.totalPairs) {
        this.gameOver();
        return;
      }
    } else {
      setTimeout(() => {
        card1.flipped = false;
        card2.flipped = false;
        this.firstIndex = null;
        this.secondIndex = null;
        this.isLocked = false;
        this.isPlayerTurn = false;
        this.render();
        setTimeout(() => this.botMove(), 500);
      }, 300);
    }
  }

  botMove() {
    if (!this.isRunning) return;
    if (this.isPlayerTurn) return;
    if (this.matchedPairs === this.totalPairs) return;

    const available = [];
    this.cards.forEach((card, index) => {
      if (!card.matched && !card.flipped) available.push(index);
    });

    if (available.length < 2) {
      this.isPlayerTurn = true;
      this.render();
      return;
    }

    const idx1 = available[Math.floor(Math.random() * available.length)];
    let idx2;

    const color = this.cards[idx1].color;
    const pair = available.find(
      (idx) => idx !== idx1 && this.cards[idx].color === color
    );

    if (pair !== undefined && Math.random() < 0.4) {
      idx2 = pair;
    } else {
      const remaining = available.filter((idx) => idx !== idx1);
      idx2 = remaining[Math.floor(Math.random() * remaining.length)];
    }

    if (idx2 === undefined) {
      this.isPlayerTurn = true;
      this.render();
      return;
    }

    this.isLocked = true;
    this.cards[idx1].flipped = true;
    this.moves++;
    this.render();

    setTimeout(() => {
      this.cards[idx2].flipped = true;
      this.moves++;
      this.render();

      setTimeout(() => {
        const card1 = this.cards[idx1];
        const card2 = this.cards[idx2];

        if (card1.id === card2.id) {
          card1.matched = true;
          card2.matched = true;
          this.matchedPairs++;
          this.botScore++;
          this.isLocked = false;
          this.render();

          if (this.matchedPairs === this.totalPairs) {
            this.gameOver();
            return;
          }
          setTimeout(() => this.botMove(), 500);
        } else {
          setTimeout(() => {
            card1.flipped = false;
            card2.flipped = false;
            this.isLocked = false;
            this.isPlayerTurn = true;
            this.render();
          }, 300);
        }
      }, 400);
    }, 400);
  }

  gameOver() {
    this.isRunning = false;
    clearInterval(this.timerInterval);

    let message = "",
      emoji = "";
    if (this.playerScore > this.botScore) {
      message = "Вы победили! 🎉🏆";
      emoji = "🎉";
    } else if (this.botScore > this.playerScore) {
      message = "Бот победил! 😢🤖";
      emoji = "😢";
    } else {
      message = "Ничья! 🤝";
      emoji = "🤝";
    }

    const playerScore = this.playerScore;

    this.container.innerHTML = `
    <div class="arcade-game-over">
      <div class="arcade-game-over-content">
        <h2>${emoji} ${message}</h2>
        <div class="arcade-game-over-stats">
          <div class="stat"><span class="label">👤 Вы</span><span class="value">${this.playerScore}</span></div>
          <div class="stat"><span class="label">🤖 Бот</span><span class="value">${this.botScore}</span></div>
          <div class="stat"><span class="label">🔄 Ходов</span><span class="value">${this.moves}</span></div>
          <div class="stat"><span class="label">⏱️ Время</span><span class="value">${this.timer}с</span></div>
          <div class="stat highlight" style="grid-column: span 2;">
            <span class="label">⭐ Заработано очков</span>
            <span class="value">${playerScore}</span>
          </div>
        </div>
        <div class="arcade-game-over-actions">
          <button class="btn btn-primary" onclick="window.app.arcadeManager.startGame('memory')">🔄 Сыграть ещё</button>
          <button class="btn btn-secondary" onclick="window.app.arcadeManager.closeGame()">🏠 В меню</button>
        </div>
      </div>
    </div>
  `;

    setTimeout(() => {
      if (this.manager) {
        // ГОСТЬ — не сохраняем
        if (window.app?.isLoggedIn) {
          this.manager.saveScore("memory", playerScore);
        } else {
          console.log("👤 Гость — очки не сохраняются");
          this.manager.renderLeaderboard();
        }
      }
    }, 500);
  }
}
