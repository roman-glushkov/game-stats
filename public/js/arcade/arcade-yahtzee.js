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

    this.player = { points: 0, categories: {}, used: [], bonus: 0 };
    this.bot = { points: 0, categories: {}, used: [], bonus: 0 };

    this.init();
  }

  init() {
    this.render();
  }

  // ===== КОНСТАНТЫ =====
  get DICE_EMOJIS() {
    return ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  }

  get UPPER_CATEGORIES() {
    return [
      { id: "ones", label: "1️⃣ Единицы" },
      { id: "twos", label: "2️⃣ Двойки" },
      { id: "threes", label: "3️⃣ Тройки" },
      { id: "fours", label: "4️⃣ Четвёрки" },
      { id: "fives", label: "5️⃣ Пятёрки" },
      { id: "sixes", label: "6️⃣ Шестёрки" },
    ];
  }

  get LOWER_CATEGORIES() {
    return [
      { id: "threeOfKind", label: "🔱 Три одинаковых" },
      { id: "fourOfKind", label: "💎 Четыре одинаковых" },
      { id: "fullHouse", label: "🏠 Фулл хаус" },
      { id: "smallStraight", label: "📏 Малый стрит" },
      { id: "largeStraight", label: "📐 Большой стрит" },
      { id: "yahtzee", label: "🎯 ЯТЗИ!" },
      { id: "chance", label: "🎲 Шанс" },
    ];
  }

  get ALL_CATEGORIES() {
    return [...this.UPPER_CATEGORIES, ...this.LOWER_CATEGORIES];
  }

  // ===== КУБИКИ =====
  rollDice() {
    if (this.gameOver || this.isRolling) return;
    if (!this.isPlayerTurn) return;
    if (this.rollsLeft <= 0) return;
    if (this.turnFinished) {
      this.showMessage("⚠️ Вы уже завершили ход!");
      return;
    }

    this.isRolling = true;
    this.rollsLeft--;

    for (let i = 0; i < 5; i++) {
      if (!this.held[i]) {
        this.dice[i] = Math.floor(Math.random() * 6) + 1;
      }
    }

    this.render();

    if (this.rollsLeft === 0) {
      this.showMessage('🎯 Выберите категорию или нажмите "Закончить ход"');
    } else {
      const usedCount = this.player.used.length;
      this.showMessage(
        `🎲 Осталось бросков: ${
          this.rollsLeft
        }. Выберите кубики для фиксации (${usedCount + 1}/13)`
      );
    }

    this.isRolling = false;
    this.updateControls();
  }

  toggleHold(index) {
    if (this.gameOver || this.isRolling) return;
    if (!this.isPlayerTurn) return;
    if (this.rollsLeft === 3) {
      this.showMessage("⚠️ Сначала бросьте кубики!");
      return;
    }
    if (this.dice[index] === 0) return;
    if (this.turnFinished) {
      this.showMessage("⚠️ Вы уже завершили ход!");
      return;
    }

    this.held[index] = !this.held[index];
    this.render();
  }

  // ===== ПОДСЧЁТ ОЧКОВ =====
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

  // ===== ВЫБОР КАТЕГОРИИ =====
  chooseCategory(categoryId) {
    if (this.gameOver || this.isRolling) return;
    if (!this.isPlayerTurn) return;
    if (this.player.used.includes(categoryId)) return;
    if (this.rollsLeft === 3) {
      this.showMessage("⚠️ Сначала бросьте кубики!");
      return;
    }
    if (this.turnFinished) {
      this.showMessage("⚠️ Вы уже завершили ход!");
      return;
    }

    const points = this.calculateScore(categoryId, this.dice);
    this.applyCategory("player", categoryId, points);
  }

  applyCategory(player, categoryId, points) {
    if (this[player].used.includes(categoryId)) return;

    this[player].categories[categoryId] = points;
    this[player].used.push(categoryId);
    this[player].points += points;

    // Проверяем бонус
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
      this.showMessage(`✅ Записано ${points} очков!`);

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
      this.showMessage("👤 Ваш ход! Бросайте кубики!");
      this.render();
      this.checkGameOver();
    }

    this.render();
  }

  // ===== ЗАВЕРШИТЬ ХОД (АВТО) =====
  finishTurn() {
    if (this.gameOver || this.isRolling) return;
    if (!this.isPlayerTurn) return;
    if (this.turnFinished) return;
    if (this.rollsLeft === 3) {
      this.showMessage("⚠️ Сначала бросьте кубики!");
      return;
    }

    const available = this.getAvailableCategories("player");
    if (available.length === 0) {
      this.showMessage("❌ Нет доступных категорий!");
      return;
    }

    let bestCategory = available[0];
    let bestScore = -1;

    available.forEach((cat) => {
      const score = this.calculateScore(cat.id, this.dice);
      if (score > bestScore) {
        bestScore = score;
        bestCategory = cat.id;
      }
    });

    if (bestScore === -1) {
      bestCategory = available[0].id;
      bestScore = 0;
    }

    this.applyCategory("player", bestCategory, bestScore);
  }

  // ===== ХОД БОТА =====
  botTurn() {
    if (this.gameOver) return;

    this.isPlayerTurn = false;
    this.isBotRolling = true;
    this.showMessage("🤖 Бот бросает кубики...");

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

      this.showMessage(`🤖 Бот бросает... (${rollIndex + 1}/3)`);

      setTimeout(() => {
        botRollStep(rollIndex + 1);
      }, 600);
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

      this.showMessage(`🤖 Бот выбрал "${bestCategory}" за ${bestScore} очков`);

      setTimeout(() => {
        this.applyCategory("bot", bestCategory, bestScore);
      }, 400);
    };

    this.finishBotTurn = finishBotTurn;
    setTimeout(() => botRollStep(0), 400);
  }

  // ===== ПРОВЕРКА ОКОНЧАНИЯ =====
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

  // ===== СОХРАНЕНИЕ РЕЗУЛЬТАТА =====
  saveScore() {
    const playerScore = this.player.points;
    const botScore = this.bot.points;

    let result = 0;
    if (playerScore > botScore) {
      result = 1; // Победа
    } else if (botScore > playerScore) {
      result = -1; // Поражение
    } else {
      result = 0; // Ничья
    }

    // Очки = количество очков игрока (для рейтинга)
    const points = playerScore;

    setTimeout(() => {
      if (this.manager) {
        this.manager.saveScore("yahtzee", points);
      }
    }, 500);
  }

  // ===== СООБЩЕНИЯ =====
  showMessage(text) {
    const msgEl = document.getElementById("yahtzee-message");
    if (msgEl) msgEl.textContent = text;
  }

  // ===== УПРАВЛЕНИЕ КНОПКАМИ =====
  updateControls() {
    // Рендеринг обновляет кнопки
  }

  // ===== РЕНДЕРИНГ =====
  render() {
    if (!this.container) return;

    const diceEmojis = this.DICE_EMOJIS;

    // Счёт
    const playerTotal = this.player.points;
    const botTotal = this.bot.points;

    // Индикатор хода
    let turnText = "";
    let turnColor = "#4f8cff";
    if (this.gameOver) {
      turnText = "🏁 Игра окончена!";
      turnColor = "#f59e0b";
    } else if (this.isBotRolling) {
      turnText = "🤖 Бот бросает...";
      turnColor = "#f59e0b";
    } else if (this.isPlayerTurn) {
      const used = this.player.used.length;
      turnText = `👤 Ваш ход (${used + 1}/13)`;
      turnColor = "#4f8cff";
    } else {
      turnText = "🤖 Ход бота...";
      turnColor = "#f59e0b";
    }

    // Бонус трекер
    const upperSum = this.getUpperSum("player");
    const bonusText =
      this.player.bonus > 0
        ? "🎉 Бонус +35!"
        : upperSum >= 63
        ? "✅ Цель достигнута!"
        : `❌ Нужно ещё ${63 - upperSum}`;

    // Кубики
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
        <div class="dice ${isHeld ? "held" : ""} ${
          this.isBotRolling ? "bot-dice" : ""
        }"
             onclick="${
               canClick ? `window.app.arcadeManager.yahtzeeToggle(${i})` : ""
             }"
             style="cursor: ${canClick ? "pointer" : "default"};
                    ${this.isBotRolling ? "opacity: 0.7;" : ""}">
          <span class="dice-value">${
            value > 0 ? diceEmojis[value - 1] : "❓"
          }</span>
          ${isHeld ? '<span class="lock-icon">🔒</span>' : ""}
        </div>
      `;
      })
      .join("");

    // Категории
    const availableIds = this.getAvailableCategories("player").map((c) => c.id);
    const isPlayerTurnAndReady =
      this.isPlayerTurn &&
      !this.gameOver &&
      !this.turnFinished &&
      !this.isBotRolling;

    const renderCategoryRow = (cat) => {
      const catId = cat.id;
      const isUsed = this.player.used.includes(catId);
      const isAvailable = availableIds.includes(catId);

      const playerScore = this.player.categories[catId];
      const botScore = this.bot.categories[catId];

      const playerScoreDisplay = playerScore !== undefined ? playerScore : "";
      const botScoreDisplay = botScore !== undefined ? botScore : "";

      let currentScore = "";
      let statusClass = "empty";
      let statusText = "";

      const hasDice = this.dice.some((d) => d > 0);

      if (isUsed) {
        statusClass = "used";
        statusText = "✅";
      } else if (
        isAvailable &&
        isPlayerTurnAndReady &&
        hasDice &&
        !this.turnFinished
      ) {
        currentScore = this.calculateScore(catId, this.dice);
        statusClass = "available";
        statusText = `${currentScore}`;

        const allScores = availableIds.map((id) => ({
          id: id,
          score: this.calculateScore(id, this.dice),
        }));
        const maxScore = Math.max(...allScores.map((s) => s.score));
        if (currentScore === maxScore && currentScore > 0) {
          statusClass = "best";
        }
      } else if (isAvailable) {
        statusClass = "available";
        statusText = "⬜";
      } else {
        statusClass = "used";
        statusText = "🔒";
      }

      const isBest = statusClass === "best";
      const isHighlight =
        isAvailable &&
        isPlayerTurnAndReady &&
        hasDice &&
        !this.turnFinished &&
        !isUsed;

      const rowClass = `category-row ${isUsed ? "used-cat" : ""} ${
        isBest ? "best-choice" : ""
      } ${isHighlight ? "highlight" : ""} ${
        isAvailable && !isUsed ? "available" : ""
      }`;

      const canClick =
        isAvailable &&
        !isUsed &&
        isPlayerTurnAndReady &&
        hasDice &&
        !this.turnFinished &&
        this.rollsLeft < 3 &&
        this.rollsLeft >= 0;

      const onclick = canClick
        ? `onclick="window.app.arcadeManager.yahtzeeChoose('${catId}')"`
        : "";

      const playerClass = playerScore !== undefined ? "" : "empty";
      const botClass = botScore !== undefined ? "" : "empty";

      return `
        <div class="${rowClass}" ${onclick} style="${
        canClick ? "cursor: pointer;" : "cursor: default;"
      }">
          <span class="name">${cat.label}</span>
          <span class="bot-score ${botClass}">${
        botScoreDisplay !== "" ? botScoreDisplay : "—"
      }</span>
          <span class="player-score ${playerClass}">${
        playerScoreDisplay !== "" ? playerScoreDisplay : "—"
      }</span>
          <span class="status ${statusClass}">${statusText}</span>
        </div>
      `;
    };

    const upperHtml = this.UPPER_CATEGORIES.map((c) =>
      renderCategoryRow(c)
    ).join("");
    const lowerHtml = this.LOWER_CATEGORIES.map((c) =>
      renderCategoryRow(c)
    ).join("");

    // Кнопки
    let rollBtnHtml = "";
    let finishBtnHtml = "";

    if (this.gameOver) {
      rollBtnHtml = `<button class="btn btn-success" onclick="window.app.arcadeManager.startGame('yahtzee')">🔄 Новая игра</button>`;
      finishBtnHtml = "";
    } else if (this.isBotRolling || !this.isPlayerTurn) {
      rollBtnHtml = `<button class="btn btn-secondary" disabled>${
        this.isBotRolling ? "🤖 Бот бросает..." : "🤖 Ход бота..."
      }</button>`;
      finishBtnHtml = "";
    } else if (this.turnFinished) {
      rollBtnHtml = `<button class="btn btn-secondary" disabled>⏳ Ожидание...</button>`;
      finishBtnHtml = "";
    } else if (this.rollsLeft === 0) {
      rollBtnHtml = `<button class="btn btn-secondary" disabled>🎯 Выберите категорию</button>`;
      finishBtnHtml = `<button class="btn btn-warning" onclick="window.app.arcadeManager.yahtzeeFinish()">✅ Закончить ход (авто)</button>`;
    } else if (this.rollsLeft === 3) {
      rollBtnHtml = `<button class="btn btn-primary" onclick="window.app.arcadeManager.yahtzeeRoll()">🎲 Бросить (3)</button>`;
      finishBtnHtml = "";
    } else {
      rollBtnHtml = `<button class="btn btn-primary" onclick="window.app.arcadeManager.yahtzeeRoll()">🎲 Бросить (${this.rollsLeft})</button>`;
      finishBtnHtml = `<button class="btn btn-warning" onclick="window.app.arcadeManager.yahtzeeFinish()">✅ Закончить ход (авто)</button>`;
    }

    this.container.innerHTML = `
      <div class="yahtzee-game">
        <style>
          .yahtzee-game .score-header {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 40px;
            padding: 12px 20px;
            background: #22223a;
            border-radius: 12px;
            margin-bottom: 10px;
          }
          .yahtzee-game .score-header .score-block {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .yahtzee-game .score-header .score-block .label {
            font-size: 12px;
            color: #94a3b8;
          }
          .yahtzee-game .score-header .score-block .value {
            font-size: 28px;
            font-weight: bold;
            line-height: 1.2;
          }
          .yahtzee-game .score-header .player-block .value { color: #4f8cff; }
          .yahtzee-game .score-header .bot-block .value { color: #f59e0b; }
          .yahtzee-game .score-header .vs {
            font-size: 18px;
            color: #4a4a6a;
            font-weight: bold;
          }

          .yahtzee-game .bonus-tracker {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            padding: 4px 12px;
            background: #1a1a2e;
            border-radius: 6px;
            margin-bottom: 8px;
            font-size: 12px;
            color: #94a3b8;
            border: 1px solid #2a2a4a;
          }
          .yahtzee-game .bonus-tracker .sum { color: #e2e8f0; font-weight: bold; }
          .yahtzee-game .bonus-tracker .sum.achieved { color: #22c55e; }
          .yahtzee-game .bonus-tracker .bonus-status.achieved { color: #22c55e; }
          .yahtzee-game .bonus-tracker .bonus-status.not-achieved { color: #4a4a6a; }

          .yahtzee-game .turn-indicator {
            text-align: center;
            padding: 6px;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 6px;
            background: #1a1a2e;
            border: 2px solid #4f8cff;
          }
          .yahtzee-game .turn-indicator.bot-turn { border-color: #f59e0b; }

          .yahtzee-game .table-wrapper {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin: 6px 0;
          }
          .yahtzee-game .table-column {
            background: #1a1a2e;
            border-radius: 8px;
            padding: 4px;
          }
          .yahtzee-game .table-column .col-title {
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            padding: 3px;
            border-bottom: 1px solid #2a2a4a;
            margin-bottom: 3px;
          }
          .yahtzee-game .category-row {
            display: grid;
            grid-template-columns: 1.6fr 0.7fr 0.7fr 0.6fr;
            gap: 2px;
            padding: 3px 6px;
            background: #22223a;
            border-radius: 4px;
            align-items: center;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 11px;
            margin-bottom: 2px;
          }
          .yahtzee-game .category-row:hover { background: #2a2a4a; }
          .yahtzee-game .category-row .name { color: #e2e8f0; font-weight: 500; font-size: 11px; }
          .yahtzee-game .category-row .bot-score { text-align: center; color: #f59e0b; font-weight: 600; font-size: 12px; }
          .yahtzee-game .category-row .bot-score.empty { color: #3a3a5a; }
          .yahtzee-game .category-row .player-score { text-align: center; color: #4f8cff; font-weight: 600; font-size: 12px; }
          .yahtzee-game .category-row .player-score.empty { color: #3a3a5a; }
          .yahtzee-game .category-row .status { text-align: center; font-size: 10px; font-weight: 600; }
          .yahtzee-game .category-row .status.available { color: #22c55e; }
          .yahtzee-game .category-row .status.used { color: #3a3a5a; }
          .yahtzee-game .category-row .status.best { color: #f59e0b; animation: pulse 1s infinite; }
          .yahtzee-game .category-row.available:hover {
            background: #2a3a5a;
            border: 1px solid #4f8cff;
            margin: -1px;
            margin-bottom: 1px;
          }
          .yahtzee-game .category-row.used-cat { opacity: 0.4; cursor: default; }
          .yahtzee-game .category-row.used-cat:hover { transform: none; background: #22223a; }
          .yahtzee-game .category-row.best-choice {
            border: 2px solid #f59e0b;
            margin: -1px;
            margin-bottom: 1px;
            background: rgba(245, 158, 11, 0.1);
          }
          .yahtzee-game .category-row.highlight {
            border: 2px solid #4f8cff;
            margin: -1px;
            margin-bottom: 1px;
            background: rgba(79, 140, 255, 0.08);
          }

          .yahtzee-game .dice-container {
            display: flex;
            justify-content: center;
            gap: 12px;
            padding: 12px;
            background: #1a1a2e;
            border-radius: 10px;
            margin: 6px 0;
          }
          .yahtzee-game .dice {
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            background: #2a2a4a;
            border: 3px solid #3a3a5a;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            user-select: none;
            position: relative;
          }
          .yahtzee-game .dice:hover { transform: scale(1.05); border-color: #4f8cff; }
          .yahtzee-game .dice.held {
            border-color: #4f8cff;
            background: rgba(79, 140, 255, 0.15);
            box-shadow: 0 0 20px rgba(79, 140, 255, 0.2);
          }
          .yahtzee-game .dice.bot-dice { opacity: 0.6; cursor: default; }
          .yahtzee-game .dice.bot-dice:hover { transform: none; }
          .yahtzee-game .dice .lock-icon {
            position: absolute;
            bottom: 2px;
            right: 4px;
            font-size: 10px;
          }

          .yahtzee-game .controls {
            text-align: center;
            margin: 6px 0;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
          }
          .yahtzee-game .controls .btn {
            padding: 8px 20px;
            font-size: 13px;
            font-weight: 600;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .yahtzee-game .controls .btn-primary { background: #4f8cff; color: white; }
          .yahtzee-game .controls .btn-primary:hover { background: #3a7aee; transform: translateY(-2px); }
          .yahtzee-game .controls .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
          .yahtzee-game .controls .btn-success { background: #22c55e; color: white; }
          .yahtzee-game .controls .btn-success:hover { background: #16a34a; }
          .yahtzee-game .controls .btn-secondary { background: #3a3a5a; color: #e2e8f0; }
          .yahtzee-game .controls .btn-secondary:hover { background: #4a4a6a; }
          .yahtzee-game .controls .btn-warning { background: #f59e0b; color: #0a0e1a; }
          .yahtzee-game .controls .btn-warning:hover { background: #d97706; }
          .yahtzee-game .controls .hint {
            color: #94a3b8;
            font-size: 11px;
            display: flex;
            align-items: center;
          }

          .yahtzee-game .message {
            text-align: center;
            padding: 4px;
            color: #94a3b8;
            font-size: 12px;
            min-height: 20px;
          }

          .yahtzee-game .game-over {
            text-align: center;
            padding: 15px;
            background: #1a1a2e;
            border-radius: 10px;
            margin: 8px 0;
            border: 2px solid #f59e0b;
          }
          .yahtzee-game .game-over h2 { font-size: 24px; margin-bottom: 10px; }
          .yahtzee-game .game-over .final-scores {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 10px 0;
          }
          .yahtzee-game .game-over .final-scores div { text-align: center; }
          .yahtzee-game .game-over .final-scores .label { color: #94a3b8; font-size: 12px; }
          .yahtzee-game .game-over .final-scores .value { font-size: 26px; font-weight: bold; }
          .yahtzee-game .game-over .actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 12px;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }

          @media (max-width: 650px) {
            .yahtzee-game .table-wrapper { grid-template-columns: 1fr; gap: 4px; }
            .yahtzee-game .dice { width: 48px; height: 48px; font-size: 24px; }
            .yahtzee-game .dice-container { gap: 8px; padding: 10px; }
            .yahtzee-game .category-row { font-size: 10px; padding: 2px 4px; grid-template-columns: 1.4fr 0.6fr 0.6fr 0.6fr; }
            .yahtzee-game .score-header { gap: 20px; padding: 8px 12px; }
            .yahtzee-game .score-header .score-block .value { font-size: 22px; }
            .yahtzee-game .controls .btn { padding: 6px 14px; font-size: 12px; }
          }
          @media (max-width: 400px) {
            .yahtzee-game .dice { width: 38px; height: 38px; font-size: 18px; }
            .yahtzee-game .dice-container { gap: 5px; padding: 8px; }
            .yahtzee-game .category-row { font-size: 9px; grid-template-columns: 1.2fr 0.5fr 0.5fr 0.5fr; }
          }

          .yahtzee-game .close-btn {
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 20px;
            cursor: pointer;
            padding: 4px 8px;
          }
          .yahtzee-game .close-btn:hover { color: #ef4444; }
        </style>

        <!-- Закрыть -->
        <div style="display: flex; justify-content: flex-end;">
          <button class="close-btn" onclick="window.app.arcadeManager.closeGame()">✕</button>
        </div>

        <!-- Счёт -->
        <div class="score-header">
          <div class="score-block player-block">
            <div class="label">👤 Игрок</div>
            <div class="value">${playerTotal}</div>
          </div>
          <div class="vs">⚔️</div>
          <div class="score-block bot-block">
            <div class="label">🤖 Бот</div>
            <div class="value">${botTotal}</div>
          </div>
        </div>

        <!-- Бонус трекер -->
        <div class="bonus-tracker">
          <span>📊 Верхняя секция:</span>
          <span class="sum ${
            upperSum >= 63 ? "achieved" : ""
          }">${upperSum}</span>
          <span>/ 63</span>
          <span>|</span>
          <span class="bonus-status ${
            this.player.bonus > 0 || upperSum >= 63
              ? "achieved"
              : "not-achieved"
          }">
            ${
              this.player.bonus > 0
                ? "🎉 Бонус +35!"
                : upperSum >= 63
                ? "✅ Цель достигнута!"
                : `❌ Нужно ещё ${63 - upperSum}`
            }
          </span>
        </div>

        <!-- Индикатор хода -->
        <div class="turn-indicator ${
          this.isBotRolling || !this.isPlayerTurn ? "bot-turn" : ""
        }" style="border-color: ${turnColor};">
          ${turnText}
        </div>

        <!-- Таблица -->
        <div class="table-wrapper">
          <div class="table-column">
            <div class="col-title">📊 Верхняя секция</div>
            ${upperHtml}
          </div>
          <div class="table-column">
            <div class="col-title">🎯 Нижняя секция</div>
            ${lowerHtml}
          </div>
        </div>

        <!-- Кубики -->
        <div class="dice-container">
          ${diceHtml}
        </div>

        <!-- Управление -->
        <div class="controls">
          ${rollBtnHtml}
          ${finishBtnHtml}
          <span class="hint">💡 Кликните на кубик чтобы зафиксировать</span>
        </div>

        <div id="yahtzee-message" class="message">
          ${
            this.gameOver
              ? "🏁 Игра окончена!"
              : this.isPlayerTurn
              ? '🎯 Нажмите "Бросить" чтобы начать'
              : "🤖 Ход бота..."
          }
        </div>

        ${
          this.gameOver
            ? `
          <div class="game-over">
            <h2>${
              playerTotal > botTotal
                ? "🎉 Вы победили!"
                : playerTotal < botTotal
                ? "😢 Бот победил"
                : "🤝 Ничья"
            }</h2>
            <div class="final-scores">
              <div><div class="label">👤 Вы</div><div class="value" style="color: #4f8cff;">${playerTotal}</div></div>
              <div><div class="label">🤖 Бот</div><div class="value" style="color: #f59e0b;">${botTotal}</div></div>
            </div>
            <div class="actions">
              <button class="btn btn-primary" onclick="window.app.arcadeManager.startGame('yahtzee')">🔄 Сыграть ещё</button>
              <button class="btn btn-secondary" onclick="window.app.arcadeManager.closeGame()">🏠 В меню</button>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }
}
