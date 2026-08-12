export class ArcadeYahtzee {
  constructor(container) {
    this.container = container;
    this.manager = null;

    this.dice = [0, 0, 0, 0, 0];
    this.held = [false, false, false, false, false];
    this.rollsLeft = 3;
    this.turn = 0;
    this.isPlayerTurn = true;
    this.isRolling = false;
    this.gameOver = false;
    this.turnFinished = false;
    this.isBotRolling = false;
    this.pendingCategory = null;
    this.pendingScore = null;

    this.player = { points: 0, categories: {}, used: [], bonus: 0 };
    this.bot = { points: 0, categories: {}, used: [], bonus: 0 };

    this.init();
  }

  init() {
    this.render();
  }

  // ===== SVG КУБИКИ =====
  getDiceSVG(value) {
    if (value === 0) return "❓";

    const dotPositions = {
      1: [[1, 1]],
      2: [
        [0, 0],
        [2, 2],
      ],
      3: [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      4: [
        [0, 0],
        [0, 2],
        [2, 0],
        [2, 2],
      ],
      5: [
        [0, 0],
        [0, 2],
        [1, 1],
        [2, 0],
        [2, 2],
      ],
      6: [
        [0, 0],
        [0, 2],
        [1, 0],
        [1, 2],
        [2, 0],
        [2, 2],
      ],
    };

    const dots = dotPositions[value] || [];
    const size = 60;
    const dotSize = 7;
    const padding = 12;
    const step = (size - padding * 2) / 2;

    return `
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display: block;">
        <rect x="2" y="4" width="${size - 4}" height="${
      size - 4
    }" rx="8" fill="rgba(0,0,0,0.15)"/>
        <rect x="0" y="0" width="${size}" height="${size}" rx="10" fill="white" stroke="#d0d0d0" stroke-width="1.5"/>
        <rect x="0" y="0" width="${size}" height="${size}" rx="10" fill="url(#diceGrad)" stroke="#d0d0d0" stroke-width="1.5"/>
        ${dots
          .map(
            ([row, col]) => `
          <circle cx="${padding + col * step}" cy="${
              padding + row * step
            }" r="${dotSize}" fill="#1a1a2e"/>
          <circle cx="${padding + col * step + 1}" cy="${
              padding + row * step + 1
            }" r="${dotSize - 2}" fill="#2a2a4a"/>
        `
          )
          .join("")}
        <defs>
          <radialGradient id="diceGrad" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
            <stop offset="60%" stop-color="#f5f5f5" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="#e0e0e0" stop-opacity="0.2"/>
          </radialGradient>
        </defs>
      </svg>
    `;
  }

  get UPPER_CATEGORIES() {
    return [
      { id: "ones", icon: "1" },
      { id: "twos", icon: "2" },
      { id: "threes", icon: "3" },
      { id: "fours", icon: "4" },
      { id: "fives", icon: "5" },
      { id: "sixes", icon: "6" },
    ];
  }

  get LOWER_CATEGORIES() {
    return [
      { id: "threeOfKind", icon: "3x" },
      { id: "fourOfKind", icon: "4x" },
      { id: "fullHouse", icon: "🏠" },
      { id: "smallStraight", icon: "📏" },
      { id: "largeStraight", icon: "📐" },
      { id: "yahtzee", icon: "⭐" },
      { id: "chance", icon: "❓" },
    ];
  }
  getSmallDiceSVG(value) {
    if (value === 0 || value > 6) return "?";

    const dotPositions = {
      1: [[1, 1]],
      2: [
        [0, 0],
        [2, 2],
      ],
      3: [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      4: [
        [0, 0],
        [0, 2],
        [2, 0],
        [2, 2],
      ],
      5: [
        [0, 0],
        [0, 2],
        [1, 1],
        [2, 0],
        [2, 2],
      ],
      6: [
        [0, 0],
        [0, 2],
        [1, 0],
        [1, 2],
        [2, 0],
        [2, 2],
      ],
    };

    const dots = dotPositions[value] || [];
    const size = 30;
    const dotSize = 4;
    const padding = 5;
    const step = (size - padding * 2) / 2;

    return `
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display: block;">
      <rect x="0" y="0" width="${size}" height="${size}" rx="5" fill="white" stroke="#d0d0d0" stroke-width="1"/>
      <rect x="0" y="0" width="${size}" height="${size}" rx="5" fill="url(#smallDiceGrad)" stroke="#d0d0d0" stroke-width="1"/>
      ${dots
        .map(
          ([row, col]) => `
        <circle cx="${padding + col * step}" cy="${
            padding + row * step
          }" r="${dotSize}" fill="#1a1a2e"/>
      `
        )
        .join("")}
      <defs>
        <radialGradient id="smallDiceGrad" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
          <stop offset="60%" stop-color="#f5f5f5" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#e0e0e0" stop-opacity="0.2"/>
        </radialGradient>
      </defs>
    </svg>
  `;
  }
  get ALL_CATEGORIES() {
    return [...this.UPPER_CATEGORIES, ...this.LOWER_CATEGORIES];
  }

  rollDice() {
    if (this.gameOver || this.isRolling) return;
    if (!this.isPlayerTurn) return;
    if (this.rollsLeft <= 0) return;
    if (this.turnFinished) {
      this.showMessage("⚠️ Ход завершён!");
      return;
    }

    this.pendingCategory = null;
    this.pendingScore = null;

    this.isRolling = true;
    this.rollsLeft--;

    for (let i = 0; i < 5; i++) {
      if (!this.held[i]) {
        this.dice[i] = Math.floor(Math.random() * 6) + 1;
      }
    }

    this.render();

    if (this.rollsLeft === 0) {
      this.showMessage("🎯 Кликните по полю чтобы посмотреть очки");
    } else {
      this.showMessage(`🎲 Осталось: ${this.rollsLeft} | 🔒 Кликните кубик`);
    }

    this.isRolling = false;
  }

  toggleHold(index) {
    if (this.gameOver || this.isRolling) return;
    if (!this.isPlayerTurn) return;
    if (this.rollsLeft === 3) {
      this.showMessage("⚠️ Сначала бросьте!");
      return;
    }
    if (this.dice[index] === 0) return;
    if (this.turnFinished) {
      this.showMessage("⚠️ Ход завершён!");
      return;
    }

    this.held[index] = !this.held[index];
    this.render();
  }

  getDiceCounts(dice) {
    const counts = [0, 0, 0, 0, 0, 0];
    dice.forEach((d) => {
      if (d > 0) counts[d - 1]++;
    });
    return counts;
  }

  calculateScore(category, dice) {
    const counts = this.getDiceCounts(dice);
    const sum = dice.reduce((a, b) => a + b, 0);
    const sorted = [...dice].filter((d) => d > 0).sort((a, b) => a - b);

    switch (category) {
      case "ones":
        return counts[0] * 1;
      case "twos":
        return counts[1] * 2;
      case "threes":
        return counts[2] * 3;
      case "fours":
        return counts[3] * 4;
      case "fives":
        return counts[4] * 5;
      case "sixes":
        return counts[5] * 6;
      case "threeOfKind":
        for (let i = 0; i < 6; i++) {
          if (counts[i] >= 3) return sum;
        }
        return 0;
      case "fourOfKind":
        for (let i = 0; i < 6; i++) {
          if (counts[i] >= 4) return sum;
        }
        return 0;
      case "fullHouse":
        let hasTwo = false,
          hasThree = false;
        for (let i = 0; i < 6; i++) {
          if (counts[i] === 2) hasTwo = true;
          if (counts[i] === 3) hasThree = true;
        }
        if (counts.some((c) => c === 5)) return 25;
        return hasTwo && hasThree ? 25 : 0;
      case "smallStraight":
        const smallStraights = [
          [1, 2, 3, 4],
          [2, 3, 4, 5],
          [3, 4, 5, 6],
        ];
        for (const straight of smallStraights) {
          if (straight.every((v) => sorted.includes(v))) return 30;
        }
        return 0;
      case "largeStraight":
        const largeStraights = [
          [1, 2, 3, 4, 5],
          [2, 3, 4, 5, 6],
        ];
        for (const straight of largeStraights) {
          if (straight.every((v) => sorted.includes(v))) return 40;
        }
        return 0;
      case "yahtzee":
        for (let i = 0; i < 6; i++) {
          if (counts[i] === 5) return 50;
        }
        return 0;
      case "chance":
        return sum;
      default:
        return 0;
    }
  }

  getAvailableCategories(player) {
    const used = this[player].used || [];
    return this.ALL_CATEGORIES.filter((c) => !used.includes(c.id));
  }

  getUpperSum(player) {
    const used = this[player].used || [];
    const upperIds = this.UPPER_CATEGORIES.map((c) => c.id);
    let sum = 0;
    upperIds.forEach((id) => {
      if (used.includes(id)) {
        sum += this[player].categories[id] || 0;
      }
    });
    return sum;
  }

  clickPlayerCell(categoryId) {
    if (this.gameOver || this.isRolling) return;
    if (!this.isPlayerTurn) return;
    if (this.player.used.includes(categoryId)) return;
    if (this.rollsLeft === 3) {
      this.showMessage("⚠️ Сначала бросьте!");
      return;
    }
    if (this.turnFinished) {
      this.showMessage("⚠️ Ход завершён!");
      return;
    }

    const points = this.calculateScore(categoryId, this.dice);

    if (this.pendingCategory === categoryId) {
      this.pendingCategory = null;
      this.pendingScore = null;
      this.showMessage("👆 Выбор отменён");
      this.render();
      return;
    }

    this.pendingCategory = categoryId;
    this.pendingScore = points;
    this.showMessage(`📊 ${points} очков. Нажмите "✅ Играть"`);
    this.render();
  }

  confirmPlay() {
    if (!this.pendingCategory || this.pendingScore === null) {
      this.showMessage("⚠️ Сначала выберите категорию");
      return;
    }
    if (this.gameOver || this.isRolling) return;
    if (!this.isPlayerTurn) return;
    if (this.turnFinished) return;

    const categoryId = this.pendingCategory;
    const points = this.pendingScore;

    this.pendingCategory = null;
    this.pendingScore = null;
    this.applyCategory("player", categoryId, points);
  }

  applyCategory(player, categoryId, points) {
    if (this[player].used.includes(categoryId)) return;

    this[player].categories[categoryId] = points;
    this[player].used.push(categoryId);
    this[player].points += points;

    const upperSum = this.getUpperSum(player);
    if (upperSum >= 63 && this[player].bonus === 0) {
      const upperIds = this.UPPER_CATEGORIES.map((c) => c.id);
      const allUpperUsed = upperIds.every((id) =>
        this[player].used.includes(id)
      );
      if (allUpperUsed) {
        this[player].points += 35;
        this[player].bonus = 35;
      }
    }

    if (player === "player") {
      this.turnFinished = true;
      this.showMessage(`✅ ${points} очков!`);

      setTimeout(() => {
        this.isPlayerTurn = false;
        this.rollsLeft = 3;
        this.held = [false, false, false, false, false];
        this.turn++;
        this.turnFinished = false;
        this.dice = [0, 0, 0, 0, 0];
        this.render();
        setTimeout(() => this.botTurn(), 500);
      }, 600);
    } else {
      this.isPlayerTurn = true;
      this.rollsLeft = 3;
      this.held = [false, false, false, false, false];
      this.dice = [0, 0, 0, 0, 0];
      this.turn++;
      this.turnFinished = false;
      this.pendingCategory = null;
      this.pendingScore = null;
      this.showMessage("👤 Ваш ход!");
      this.render();
      this.checkGameOver();
    }

    this.render();
  }

  botTurn() {
    if (this.gameOver) return;

    this.isPlayerTurn = false;
    this.isBotRolling = true;
    this.showMessage("🤖 Бот думает...");

    let botDice = [0, 0, 0, 0, 0];
    let botHeld = [false, false, false, false, false];

    const botRollStep = (rollIndex) => {
      if (rollIndex >= 3) {
        this.finishBotTurn(botDice);
        return;
      }

      for (let i = 0; i < 5; i++) {
        if (!botHeld[i]) {
          botDice[i] = Math.floor(Math.random() * 6) + 1;
        }
      }

      const counts = this.getDiceCounts(botDice);
      for (let i = 0; i < 5; i++) {
        botHeld[i] = counts[botDice[i] - 1] >= 2;
      }

      this.dice = [...botDice];
      this.isBotRolling = true;
      this.render();
      this.showMessage(`🤖 Бросает... (${rollIndex + 1}/3)`);

      setTimeout(() => {
        botRollStep(rollIndex + 1);
      }, 500);
    };

    const finishBotTurn = (botDice) => {
      this.isBotRolling = false;
      this.dice = [...botDice];
      this.render();

      const available = this.getAvailableCategories("bot");
      if (available.length === 0) {
        this.checkGameOver();
        return;
      }

      let bestCategory = available[0];
      let bestScore = -1;

      available.forEach((cat) => {
        const score = this.calculateScore(cat.id, botDice);
        if (score > bestScore) {
          bestScore = score;
          bestCategory = cat.id;
        }
      });

      if (bestScore === -1) {
        bestCategory = available[0].id;
        bestScore = 0;
      }

      this.showMessage(`🤖 +${bestScore} очков`);

      setTimeout(() => {
        this.applyCategory("bot", bestCategory, bestScore);
      }, 400);
    };

    this.finishBotTurn = finishBotTurn;
    setTimeout(() => botRollStep(0), 400);
  }

  checkGameOver() {
    if (this.player.used.length === 13 && this.bot.used.length === 13) {
      this.gameOver = true;
      this.showMessage("🏁 Игра окончена!");
      this.render();
      this.saveScore();
      return true;
    }
    return false;
  }

  saveScore() {
    const playerScore = this.player.points;
    setTimeout(() => {
      if (this.manager) {
        this.manager.saveScore("yahtzee", playerScore);
      }
    }, 500);
  }

  showMessage(text) {
    const msgEl = document.getElementById("yahtzee-message");
    if (msgEl) msgEl.textContent = text;
  }

  // ===== РЕНДЕРИНГ =====
  render() {
    if (!this.container) return;

    const playerTotal = this.player.points;
    const botTotal = this.bot.points;
    const upperSum = this.getUpperSum("player");

    let turnText = "";
    let turnColor = "#4f8cff";
    if (this.gameOver) {
      turnText = "🏁 Игра окончена!";
      turnColor = "#f59e0b";
    } else if (this.isBotRolling) {
      turnText = "🤖 Ход бота...";
      turnColor = "#f59e0b";
    } else if (this.isPlayerTurn) {
      const used = this.player.used.length;
      turnText = `👤 Ваш ход (${used + 1}/13)`;
      turnColor = "#4f8cff";
    } else {
      turnText = "🤖 Ход бота...";
      turnColor = "#f59e0b";
    }

    // ===== КУБИКИ С SVG =====
    const diceHtml = this.dice
      .map((value, i) => {
        const isHeld = this.held[i];
        const canClick =
          this.isPlayerTurn &&
          !this.gameOver &&
          this.rollsLeft < 3 &&
          this.rollsLeft > 0 &&
          value > 0 &&
          !this.turnFinished &&
          !this.isBotRolling;

        return `
        <div class="ydice ${isHeld ? "held" : ""} ${
          this.isBotRolling ? "bot-dice" : ""
        }"
             onclick="${
               canClick ? `window.app.arcadeManager.yahtzeeToggle(${i})` : ""
             }"
             style="cursor: ${canClick ? "pointer" : "default"};">
          ${
            value > 0
              ? this.getDiceSVG(value)
              : '<span style="font-size: 28px;">❓</span>'
          }
          ${isHeld ? "" : ""}
        </div>
      `;
      })
      .join("");

    // ===== КАТЕГОРИИ =====
    const availableIds = this.getAvailableCategories("player").map((c) => c.id);
    const isPlayerTurnAndReady =
      this.isPlayerTurn &&
      !this.gameOver &&
      !this.turnFinished &&
      !this.isBotRolling;

    const renderRow = (cat) => {
      const catId = cat.id;
      const isUsed = this.player.used.includes(catId);
      const isAvailable = availableIds.includes(catId);
      const isUpper = this.UPPER_CATEGORIES.some((c) => c.id === catId);

      const playerScore = this.player.categories[catId];
      const botScore = this.bot.categories[catId];

      const playerScoreDisplay = playerScore !== undefined ? playerScore : "";
      const botScoreDisplay = botScore !== undefined ? botScore : "";

      const isPending = this.pendingCategory === catId;

      // ===== ДЛЯ ВЕРХНЕЙ СЕКЦИИ ИСПОЛЬЗУЕМ МАЛЕНЬКИЙ КУБИК =====
      let iconHtml = cat.icon;
      if (isUpper) {
        // Превращаем '1' в число 1 и получаем SVG
        const numValue = parseInt(cat.icon);
        if (!isNaN(numValue) && numValue >= 1 && numValue <= 6) {
          iconHtml = this.getSmallDiceSVG(numValue);
        }
      }

      let playerContent = playerScoreDisplay || "";
      let playerClass = "ycell-player";

      if (isUsed) {
        playerClass += " used";
      } else if (
        isAvailable &&
        isPlayerTurnAndReady &&
        this.rollsLeft < 3 &&
        this.rollsLeft >= 0
      ) {
        playerClass += " available";
        if (isPending) {
          playerClass += " pending";
          playerContent = this.pendingScore !== null ? this.pendingScore : "?";
        } else {
          playerContent = "";
        }
      } else {
        playerClass += " empty";
        playerContent = "";
      }

      let botContent = botScoreDisplay || "";
      let botClass = "ycell-bot";
      if (botScore !== undefined) {
        botClass += " filled";
      } else {
        botClass += " empty";
        botContent = "";
      }

      const canClick =
        !isUsed &&
        isAvailable &&
        isPlayerTurnAndReady &&
        this.rollsLeft < 3 &&
        this.rollsLeft >= 0 &&
        !this.isBotRolling;
      const onclick = canClick
        ? `onclick="window.app.arcadeManager.yahtzeeClick('${catId}')"`
        : "";

      return `
    <div class="yrow" ${onclick} style="${
        canClick ? "cursor: pointer;" : "cursor: default;"
      }">
      <div class="ycell-icon">${iconHtml}</div>
      <div class="${botClass}">${botContent}</div>
      <div class="${playerClass}">${playerContent}</div>
    </div>
  `;
    };

    let upperRows = "";
    this.UPPER_CATEGORIES.forEach((cat) => {
      upperRows += renderRow(cat);
    });

    let lowerRows = "";
    this.LOWER_CATEGORIES.forEach((cat) => {
      lowerRows += renderRow(cat);
    });

    // Кнопки
    let rollBtnHtml = "";
    let playBtnHtml = "";
    let closeBtnHtml = "";

    const hasPending =
      this.pendingCategory !== null && this.pendingScore !== null;

    if (this.gameOver) {
      rollBtnHtml = `<button class="ybtn ybtn-success" onclick="window.app.arcadeManager.startGame('yahtzee')">🔄 Сыграть ещё</button>`;
      closeBtnHtml = `<button class="ybtn ybtn-secondary" onclick="window.app.arcadeManager.closeGame()">🏠 В меню</button>`;
    } else if (this.isBotRolling || !this.isPlayerTurn) {
      rollBtnHtml = `<button class="ybtn ybtn-secondary" disabled>${
        this.isBotRolling ? "🤖 Бросает..." : "🤖 Ход бота..."
      }</button>`;
    } else if (this.turnFinished) {
      rollBtnHtml = `<button class="ybtn ybtn-secondary" disabled>⏳ Ожидание...</button>`;
    } else if (this.rollsLeft === 0) {
      rollBtnHtml = `<button class="ybtn ybtn-secondary" disabled>🎯 Выберите категорию</button>`;
      if (hasPending) {
        playBtnHtml = `<button class="ybtn ybtn-success" onclick="window.app.arcadeManager.yahtzeePlay()">✅ Играть (${this.pendingScore})</button>`;
      }
    } else if (this.rollsLeft === 3) {
      rollBtnHtml = `<button class="ybtn ybtn-primary" onclick="window.app.arcadeManager.yahtzeeRoll()">🎲 Бросить (3)</button>`;
    } else {
      rollBtnHtml = `<button class="ybtn ybtn-primary" onclick="window.app.arcadeManager.yahtzeeRoll()">🎲 Бросить (${this.rollsLeft})</button>`;
      if (hasPending) {
        playBtnHtml = `<button class="ybtn ybtn-success" onclick="window.app.arcadeManager.yahtzeePlay()">✅ Играть (${this.pendingScore})</button>`;
      }
    }

    this.container.innerHTML = `
      <div class="yahtzee-wrap">
        <style>
          .yahtzee-wrap {
            max-width: 550px;
            margin: 0 auto;
            padding: 8px;
            font-family: 'Segoe UI', sans-serif;
          }

          .yahtzee-wrap .yclose {
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 22px;
            cursor: pointer;
            float: right;
            padding: 0 6px;
          }
          .yahtzee-wrap .yclose:hover { color: #ef4444; }

          .yahtzee-wrap .yscore {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            padding: 8px 12px;
            background: #1a1a2e;
            border-radius: 12px;
            margin-bottom: 6px;
            clear: both;
            border: 1px solid #2a2a4a;
          }
          .yahtzee-wrap .yscore .yscore-block {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .yahtzee-wrap .yscore .yscore-block .yscore-label {
            font-size: 10px;
            color: #94a3b8;
          }
          .yahtzee-wrap .yscore .yscore-block .yscore-value {
            font-size: 32px;
            font-weight: 700;
            line-height: 1.1;
          }
          .yahtzee-wrap .yscore .yscore-player .yscore-value { color: #4f8cff; }
          .yahtzee-wrap .yscore .yscore-bot .yscore-value { color: #f59e0b; }
          .yahtzee-wrap .yscore .yscore-vs {
            font-size: 16px;
            color: #4a4a6a;
            font-weight: bold;
          }

          .yahtzee-wrap .ybonus {
            text-align: center;
            padding: 2px 8px;
            background: #1a1a2e;
            border-radius: 6px;
            margin-bottom: 4px;
            font-size: 11px;
            color: #94a3b8;
            border: 1px solid #2a2a4a;
          }
          .yahtzee-wrap .ybonus .ybonus-sum { color: #e2e8f0; font-weight: bold; }
          .yahtzee-wrap .ybonus .ybonus-sum.achieved { color: #22c55e; }
          .yahtzee-wrap .ybonus .ybonus-status.achieved { color: #22c55e; }

          .yahtzee-wrap .yturn {
            text-align: center;
            padding: 4px;
            margin-bottom: 6px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 8px;
            background: #1a1a2e;
            border: 2px solid #4f8cff;
          }
          .yahtzee-wrap .yturn.yturn-bot { border-color: #f59e0b; }

          .yahtzee-wrap .ytable-wrapper {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin: 4px 0;
          }

          .yahtzee-wrap .ytable-col {
            background: #1a1a2e;
            border-radius: 8px;
            padding: 4px;
            border: 1px solid #2a2a4a;
          }

          .yahtzee-wrap .yheader {
            display: grid;
            grid-template-columns: 36px 1fr 1fr;
            gap: 3px;
            padding: 2px 4px;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
            border-bottom: 1px solid #2a2a4a;
            margin-bottom: 2px;
          }
          .yahtzee-wrap .yheader .yh-icon { text-align: left; padding-left: 6px; }
          .yahtzee-wrap .yheader .yh-bot { color: #f59e0b; }
          .yahtzee-wrap .yheader .yh-player { color: #4f8cff; }

          .yahtzee-wrap .yrow {
            display: grid;
            grid-template-columns: 36px 1fr 1fr;
            gap: 3px;
            padding: 2px 4px;
            align-items: center;
            border-radius: 4px;
            min-height: 30px;
          }
          .yahtzee-wrap .yrow:hover {
            background: #22223a;
          }

          .yahtzee-wrap .ycell-icon {
            font-size: 16px;
            font-weight: 600;
            text-align: center;
            color: #e2e8f0;
            padding: 2px 0;
            min-height: 30px;
            min-width: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* SVG внутри иконки */
          .yahtzee-wrap .ycell-icon svg {
            width: 28px;
            height: 28px;
            display: block;
          }

          .yahtzee-wrap .ycell-bot {
            background: #1a1a2e;
            border: 2px solid #2a2a4a;
            border-radius: 6px;
            text-align: center;
            font-size: 15px;
            font-weight: 600;
            color: #f59e0b;
            padding: 3px 2px;
            min-height: 30px;
            min-width: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }
          .yahtzee-wrap .ycell-bot.filled {
            background: rgba(245, 158, 11, 0.08);
            border-color: #f59e0b;
          }
          .yahtzee-wrap .ycell-bot.empty {
            color: #3a3a5a;
            border-color: #2a2a4a;
          }

          .yahtzee-wrap .ycell-player {
            background: #1a1a2e;
            border: 2px solid #2a2a4a;
            border-radius: 6px;
            text-align: center;
            font-size: 15px;
            font-weight: 600;
            color: #4f8cff;
            padding: 3px 2px;
            min-height: 30px;
            min-width: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }
          .yahtzee-wrap .ycell-player.used {
            background: rgba(79, 140, 255, 0.08);
            border-color: #4f8cff;
          }
          .yahtzee-wrap .ycell-player.available {
            border-color: #2a4a6a;
            cursor: pointer;
          }
          .yahtzee-wrap .ycell-player.available:hover {
            border-color: #4f8cff;
            background: rgba(79, 140, 255, 0.05);
          }
          .yahtzee-wrap .ycell-player.pending {
            border-color: #22c55e;
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
          }
          .yahtzee-wrap .ycell-player.empty {
            color: #3a3a5a;
            border-color: #2a2a4a;
          }

          /* ===== КУБИКИ ===== */
          .yahtzee-wrap .ydice-container {
            display: flex;
            justify-content: center;
            gap: 12px;
            padding: 12px;
            background: #1a1a2e;
            border-radius: 10px;
            margin: 6px 0;
            border: 1px solid #2a2a4a;
          }
          .yahtzee-wrap .ydice {
            width: 68px;
            height: 68px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border-radius: 10px;
            cursor: default;
            transition: all 0.3s ease;
            user-select: none;
            position: relative;
          }
          .yahtzee-wrap .ydice svg {
            width: 100%;
            height: 100%;
            max-width: 60px;
            max-height: 60px;
          }
          .yahtzee-wrap .ydice:hover svg {
            transform: scale(1.04);
          }
          .yahtzee-wrap .ydice.held svg {
            filter: drop-shadow(0 0 15px rgba(79, 140, 255, 0.4));
          }
          .yahtzee-wrap .ydice.held {
            border: 3px solid #22c55e;
            border-radius: 12px;
            background: rgba(34, 197, 94, 0.08);
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
          }
          .yahtzee-wrap .ydice.bot-dice { opacity: 0.5; cursor: default; }
          .yahtzee-wrap .ydice.bot-dice:hover { transform: none; }
          .yahtzee-wrap .ydice .ydice-lock {
            position: absolute;
            bottom: 2px;
            right: 4px;
            font-size: 12px;
            color: #4f8cff;
          }

          .yahtzee-wrap .ycontrols {
            text-align: center;
            margin: 6px 0;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 6px;
          }
          .yahtzee-wrap .ybtn {
            padding: 8px 20px;
            font-size: 13px;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .yahtzee-wrap .ybtn-primary { background: #4f8cff; color: white; }
          .yahtzee-wrap .ybtn-primary:hover { background: #3a7aee; transform: translateY(-2px); }
          .yahtzee-wrap .ybtn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
          .yahtzee-wrap .ybtn-success { background: #22c55e; color: white; }
          .yahtzee-wrap .ybtn-success:hover { background: #16a34a; }
          .yahtzee-wrap .ybtn-secondary { background: #3a3a5a; color: #e2e8f0; }
          .yahtzee-wrap .ybtn-secondary:hover { background: #4a4a6a; }

          .yahtzee-wrap .yhint {
            color: #94a3b8;
            font-size: 10px;
            display: flex;
            align-items: center;
          }

          .yahtzee-wrap .ymsg {
            text-align: center;
            padding: 4px;
            color: #94a3b8;
            font-size: 12px;
            min-height: 20px;
          }

          .yahtzee-wrap .yover {
            text-align: center;
            padding: 14px;
            background: #1a1a2e;
            border-radius: 10px;
            margin: 6px 0;
            border: 2px solid #f59e0b;
          }
          .yahtzee-wrap .yover h2 { font-size: 22px; margin-bottom: 8px; }
          .yahtzee-wrap .yover .yover-scores {
            display: flex;
            justify-content: center;
            gap: 24px;
            margin: 8px 0;
          }
          .yahtzee-wrap .yover .yover-scores div { text-align: center; }
          .yahtzee-wrap .yover .yover-scores .label { color: #94a3b8; font-size: 11px; }
          .yahtzee-wrap .yover .yover-scores .value { font-size: 24px; font-weight: bold; }
          .yahtzee-wrap .yover .yover-actions {
            display: flex;
            gap: 8px;
            justify-content: center;
            margin-top: 10px;
          }

          @media (max-width: 600px) {
            .yahtzee-wrap { padding: 4px; }
            .yahtzee-wrap .ytable-wrapper { grid-template-columns: 1fr 1fr; gap: 4px; }
            .yahtzee-wrap .ydice { width: 58px; height: 58px; }
            .yahtzee-wrap .ydice svg { max-width: 50px; max-height: 50px; }
            .yahtzee-wrap .ydice-container { gap: 8px; padding: 10px; }
            .yahtzee-wrap .yscore .yscore-block .yscore-value { font-size: 26px; }
            .yahtzee-wrap .yscore { gap: 14px; padding: 6px 10px; }
            .yahtzee-wrap .yrow { grid-template-columns: 30px 1fr 1fr; min-height: 26px; gap: 2px; padding: 1px 3px; }
            .yahtzee-wrap .ycell-icon { font-size: 14px; min-height: 26px; }
            .yahtzee-wrap .ycell-bot { font-size: 13px; min-height: 26px; min-width: 26px; padding: 2px; }
            .yahtzee-wrap .ycell-player { font-size: 13px; min-height: 26px; min-width: 26px; padding: 2px; }
            .yahtzee-wrap .yheader { grid-template-columns: 30px 1fr 1fr; font-size: 9px; }
            .yahtzee-wrap .ybtn { padding: 6px 14px; font-size: 12px; }
            .yahtzee-wrap .yturn { font-size: 12px; padding: 3px; }
            .yahtzee-wrap .ybonus { font-size: 10px; }
          }

          @media (max-width: 400px) {
            .yahtzee-wrap .ytable-wrapper { grid-template-columns: 1fr 1fr; gap: 3px; }
            .yahtzee-wrap .ydice { width: 48px; height: 48px; }
            .yahtzee-wrap .ydice svg { max-width: 42px; max-height: 42px; }
            .yahtzee-wrap .ydice-container { gap: 5px; padding: 8px; }
            .yahtzee-wrap .yscore .yscore-block .yscore-value { font-size: 20px; }
            .yahtzee-wrap .yscore { gap: 10px; padding: 4px 8px; }
            .yahtzee-wrap .yrow { grid-template-columns: 24px 1fr 1fr; min-height: 22px; }
            .yahtzee-wrap .ycell-icon { font-size: 12px; min-height: 22px; }
            .yahtzee-wrap .ycell-bot { font-size: 11px; min-height: 22px; min-width: 22px; }
            .yahtzee-wrap .ycell-player { font-size: 11px; min-height: 22px; min-width: 22px; }
            .yahtzee-wrap .yheader { grid-template-columns: 24px 1fr 1fr; font-size: 8px; }
            .yahtzee-wrap .ybtn { padding: 4px 10px; font-size: 11px; }
          }
        </style>

        <button class="yclose" onclick="window.app.arcadeManager.closeGame()">✕</button>

        <div class="yscore">
          <div class="yscore-block yscore-player">
            <div class="yscore-label">👤 Игрок</div>
            <div class="yscore-value">${playerTotal}</div>
          </div>
          <div class="yscore-vs">⚔️</div>
          <div class="yscore-block yscore-bot">
            <div class="yscore-label">🤖 Бот</div>
            <div class="yscore-value">${botTotal}</div>
          </div>
        </div>

        <div class="ybonus">
          <span>📊 Верхняя: </span>
          <span class="ybonus-sum ${
            upperSum >= 63 ? "achieved" : ""
          }">${upperSum}</span>
          <span>/ 63</span>
          <span>|</span>
          <span class="ybonus-status ${
            this.player.bonus > 0 || upperSum >= 63 ? "achieved" : ""
          }">
            ${
              this.player.bonus > 0
                ? "🎉 +35!"
                : upperSum >= 63
                ? "✅ Бонус!"
                : `❌ ${63 - upperSum}`
            }
          </span>
        </div>

        <div class="yturn ${
          this.isBotRolling || !this.isPlayerTurn ? "yturn-bot" : ""
        }" style="border-color: ${turnColor};">
          ${turnText}
        </div>

        <div class="ytable-wrapper">
          <div class="ytable-col">
            <div class="yheader">
              <span class="yh-icon">🎯</span>
              <span class="yh-bot">🤖</span>
              <span class="yh-player">👤</span>
            </div>
            ${upperRows}
          </div>
          <div class="ytable-col">
            <div class="yheader">
              <span class="yh-icon">🎯</span>
              <span class="yh-bot">🤖</span>
              <span class="yh-player">👤</span>
            </div>
            ${lowerRows}
          </div>
        </div>

        <div class="ydice-container">
          ${diceHtml}
        </div>

        <div class="ycontrols">
          ${rollBtnHtml}
          ${playBtnHtml}
          ${closeBtnHtml}
    
        </div>

        <div id="yahtzee-message" class="ymsg">
          ${
            this.gameOver
              ? "🏁 Игра окончена!"
              : this.isPlayerTurn
              ? '🎯 Нажмите "Бросить"'
              : "🤖 Ход бота..."
          }
        </div>

        ${
          this.gameOver
            ? `
          <div class="yover">
            <h2>${
              playerTotal > botTotal
                ? "🎉 Вы победили!"
                : playerTotal < botTotal
                ? "😢 Бот победил"
                : "🤝 Ничья"
            }</h2>
            <div class="yover-scores">
              <div><div class="label">👤 Вы</div><div class="value" style="color: #4f8cff;">${playerTotal}</div></div>
              <div><div class="label">🤖 Бот</div><div class="value" style="color: #f59e0b;">${botTotal}</div></div>
            </div>
            <div class="yover-actions">
              ${rollBtnHtml}
              ${closeBtnHtml}
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }
}
