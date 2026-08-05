// ============================================
// StatsRenderer - Рендеринг статистики с фильтром по играм
// ============================================

export class StatsRenderer {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.currentFilter = "all";
  }

  renderAll() {
    this.renderStatsTable();
    this.renderGamesStats();
    this.updateGameFilter();
  }

  renderStatsTable() {
    const players = this.dataManager.getAllStats(this.currentFilter);
    const tbody = document.getElementById("statsBody");
    if (!tbody) return;

    const filter =
      this.currentFilter === "all" ? "Все игры" : this.currentFilter;

    if (!players || players.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Нет данных для "${filter}"</td></tr>`;
      return;
    }

    const sorted = [...players].sort((a, b) => b.wins - a.wins);

    // Для "Все игры" вообще не показываем колонку действий
    const isAllGames = this.currentFilter === "all";

    let html = "";
    sorted.forEach((p, index) => {
      const rankClass =
        index === 0
          ? "rank-1"
          : index === 1
          ? "rank-2"
          : index === 2
          ? "rank-3"
          : "";
      const gameFilter =
        this.currentFilter === "all" ? "Все игры" : this.currentFilter;

      // Определяем, показывать ли Win Rate
      let showWinRate = true;
      if (!isAllGames) {
        const gameSetting = this.dataManager.getGameSetting(this.currentFilter);
        if (gameSetting === "wins" || gameSetting === "losses") {
          showWinRate = false;
        }
      }

      // Кнопки действий — только для конкретных игр
      let buttons = "";
      if (!isAllGames) {
        const gameSetting = this.dataManager.getGameSetting(this.currentFilter);
        if (gameSetting === "wins") {
          buttons = `
            <button class="btn btn-sm btn-success" onclick="window.app.addWin('${p.name}', '${gameFilter}')">+1</button>
          `;
        } else if (gameSetting === "losses") {
          buttons = `
            <button class="btn btn-sm btn-danger" onclick="window.app.addLoss('${p.name}', '${gameFilter}')">-1</button>
          `;
        } else {
          buttons = `
            <button class="btn btn-sm btn-success" onclick="window.app.addWin('${p.name}', '${gameFilter}')">+1</button>
            <button class="btn btn-sm btn-danger" onclick="window.app.addLoss('${p.name}', '${gameFilter}')">-1</button>
          `;
        }
      }

      // Формируем строку таблицы
      let rowHtml = `
        <tr>
          <td><span class="rank ${rankClass}">#${index + 1}</span></td>
          <td><strong>${p.name}</strong></td>
          <td>🏆 ${p.wins || 0}</td>
          <td>😵 ${p.losses || 0}</td>
      `;

      // Win Rate — только если нужно
      if (showWinRate) {
        rowHtml += `<td>${p.winRate || 0}%</td>`;
      } else {
        rowHtml += `<td style="color: var(--text-muted); font-size: 12px;">—</td>`;
      }

      // Действия — только для конкретных игр
      if (!isAllGames) {
        rowHtml += `<td>${buttons}</td>`;
      } else {
        rowHtml += `<td style="color: var(--text-muted); font-size: 12px; text-align: center;">—</td>`;
      }

      rowHtml += `</tr>`;
      html += rowHtml;
    });
    tbody.innerHTML = html;
  }

  renderGamesStats() {
    const container = document.getElementById("gamesStatsGrid");
    if (!container) return;

    const games = this.dataManager
      .getAvailableGames()
      .filter((g) => g !== "all" && g !== "Все игры");

    if (!games || games.length === 0) {
      container.innerHTML = '<p class="empty-state">Нет данных по играм</p>';
      return;
    }

    let html = "";
    games.forEach((game) => {
      const players = this.dataManager.getAllStats(game);
      const gameSetting = this.dataManager.getGameSetting(game);

      let totalWins = 0;
      let totalLosses = 0;

      players.forEach((p) => {
        totalWins += p.wins;
        totalLosses += p.losses;
      });

      let totalGames = 0;
      if (gameSetting === "wins") {
        totalGames = totalWins;
      } else if (gameSetting === "losses") {
        totalGames = totalLosses;
      } else {
        totalGames = Math.floor((totalWins + totalLosses) / 2);
      }

      const sorted = [...players].sort((a, b) => b.wins - a.wins);
      const leader = sorted[0]?.name || "—";
      const leaderWins = sorted[0]?.wins || 0;

      const gameEmoji = this.getGameEmoji(game);

      let typeIcon = "📊";
      let typeLabel = "";
      if (gameSetting === "wins") {
        typeIcon = "🏆";
        typeLabel = "только победы";
      } else if (gameSetting === "losses") {
        typeIcon = "😵";
        typeLabel = "только поражения";
      } else {
        typeIcon = "⚖️";
        typeLabel = "победы/поражения";
      }

      html += `
        <div class="game-stat-card">
          <div class="game-stat-icon">${gameEmoji}</div>
          <div class="game-stat-info">
            <div class="game-stat-name">${game}</div>
            <div class="game-stat-details">
              <span>${typeIcon} ${totalGames} игр</span>
              <span>🏆 ${totalWins} побед</span>
              <span>😵 ${totalLosses} поражений</span>
              <span>👑 ${leader} (${leaderWins})</span>
              <span style="font-size: 11px; color: var(--text-muted);">${typeLabel}</span>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  getGameEmoji(game) {
    const emojis = {
      21: "🎮",
      Покер: "🃏",
      Дурак: "🃏",
      Уно: "🎴",
      Шахматы: "♟️",
      Домино: "🀄",
      Мафия: "🕵️",
      Имаджинариум: "🎨",
      "Настольный теннис": "🏓",
      Ядзи: "🎯",
      Другое: "🎲",
    };
    return emojis[game] || "🎮";
  }

  updateGameFilter() {
    const games = this.dataManager.getAvailableGames();
    const filterSelect = document.getElementById("gameFilter");
    if (!filterSelect) return;

    filterSelect.innerHTML = "";
    games.forEach((game) => {
      const label = game === "all" ? "🎮 Все игры" : game;
      filterSelect.innerHTML += `<option value="${game}">${label}</option>`;
    });

    filterSelect.value = this.currentFilter;
  }

  setFilter(game) {
    this.currentFilter = game;
    this.renderAll();
  }
}
