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

      html += `
        <tr>
          <td><span class="rank ${rankClass}">#${index + 1}</span></td>
          <td><strong>${p.name}</strong></td>
          <td>🏆 ${p.wins || 0}</td>
          <td>😵 ${p.losses || 0}</td>
          <td>${p.winRate || 0}%</td>
          <td>
            <button class="btn btn-sm btn-success" onclick="window.app.addWin('${
              p.name
            }', '${gameFilter}')">+1</button>
            <button class="btn btn-sm btn-danger" onclick="window.app.addLoss('${
              p.name
            }', '${gameFilter}')">-1</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }

  renderGamesStats() {
    const container = document.getElementById("gamesStatsGrid");
    if (!container) return;

    const games = this.dataManager
      .getAvailableGames()
      .filter((g) => g !== "all");

    if (!games || games.length === 0) {
      container.innerHTML = '<p class="empty-state">Нет данных по играм</p>';
      return;
    }

    let html = "";
    games.forEach((game) => {
      const players = this.dataManager.getAllStats(game);
      const totalGames = players.reduce((sum, p) => sum + p.wins + p.losses, 0);
      const totalWins = players.reduce((sum, p) => sum + p.wins, 0);

      const sorted = [...players].sort((a, b) => b.wins - a.wins);
      const leader = sorted[0]?.name || "—";
      const leaderWins = sorted[0]?.wins || 0;

      const gameEmoji = this.getGameEmoji(game);

      html += `
        <div class="game-stat-card">
          <div class="game-stat-icon">${gameEmoji}</div>
          <div class="game-stat-info">
            <div class="game-stat-name">${game}</div>
            <div class="game-stat-details">
              <span>📊 ${totalGames} игр</span>
              <span>🏆 ${totalWins} побед</span>
              <span>👑 ${leader} (${leaderWins})</span>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  getGameEmoji(game) {
    const emojis = {
      Покер: "🃏",
      Дурак: "🃏",
      Уно: "🎴",
      Шахматы: "♟️",
      Домино: "🀄",
      Мафия: "🕵️",
      Имаджинариум: "🎨",
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
