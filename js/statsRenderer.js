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
    this.renderTreeView();
    this.renderSummary();
    this.renderGamesStats();
    this.updateSelects();
    this.updateGameFilter();
  }

  renderStatsTable() {
    const players = this.dataManager.getAllStats(this.currentFilter);
    const tbody = document.getElementById("statsBody");
    const filter =
      this.currentFilter === "all" ? "Все игры" : this.currentFilter;

    console.log(`📊 Данные для таблицы (${filter}):`, players);

    if (!players || players.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Нет данных для "${filter}"</td></tr>`;
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

      html += `
        <tr>
          <td><span class="rank ${rankClass}">#${index + 1}</span></td>
          <td><strong>${p.name}</strong></td>
          <td>🏆 ${p.wins || 0}</td>
          <td>😵 ${p.losses || 0}</td>
          <td>${p.winRate || 0}%</td>
          <td>${p.total || 0}</td>
          <td>
            <button class="btn btn-sm btn-success" onclick="window.app.addWin('${
              p.name
            }', '${this.currentFilter}')">+1</button>
            <button class="btn btn-sm btn-danger" onclick="window.app.addLoss('${
              p.name
            }', '${this.currentFilter}')">-1</button>
            <button class="btn btn-sm btn-warning" onclick="window.app.resetPlayer('${
              p.name
            }')">↺</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }

  renderTreeView() {
    const container = document.getElementById("playerTree");
    const players = this.dataManager.getAllStats(this.currentFilter);

    if (!players || players.length === 0) {
      container.innerHTML = '<p class="empty-state">Нет игроков</p>';
      return;
    }

    let html = '<div class="tree-view">';
    players.forEach((player) => {
      const initial = player.name.charAt(0).toUpperCase();

      html += `
        <div class="tree-node">
          <div class="tree-item">
            <div class="player-avatar" style="background: ${this.getColor(
              player.name
            )}">${initial}</div>
            <div class="player-info">
              <div class="player-name">${player.name}</div>
              <div class="player-stats">🏆 ${player.wins} • 😵 ${
        player.losses
      }</div>
            </div>
            <span class="player-badge">${player.winRate}%</span>
          </div>
        </div>
      `;
    });
    html += "</div>";
    container.innerHTML = html;
  }

  renderSummary() {
    const players = this.dataManager.getAllStats(this.currentFilter);
    const totalWins = players.reduce((sum, p) => sum + p.wins, 0);
    const totalLosses = players.reduce((sum, p) => sum + p.losses, 0);
    const totalPlayers = players.length;

    document.getElementById("totalGames").textContent = totalWins + totalLosses;
    document.getElementById("totalPlayers").textContent = totalPlayers;
    document.getElementById("totalWins").textContent = totalWins;
  }

  renderGamesStats() {
    const container = document.getElementById("gamesStatsGrid");
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

      // Находим лидера
      const sorted = [...players].sort((a, b) => b.wins - a.wins);
      const leader = sorted[0]?.name || "—";
      const leaderWins = sorted[0]?.wins || 0;

      // Получаем эмодзи для игры
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

  updateSelects() {
    const players = this.dataManager.getPlayerNames();
    const winnerSelect = document.getElementById("winnerSelect");
    const loserSelect = document.getElementById("loserSelect");

    const currentWinner = winnerSelect.value;
    const currentLoser = loserSelect.value;

    winnerSelect.innerHTML = '<option value="">-- выберите --</option>';
    loserSelect.innerHTML = '<option value="">-- выберите --</option>';

    players.forEach((p) => {
      winnerSelect.innerHTML += `<option value="${p}">${p}</option>`;
      loserSelect.innerHTML += `<option value="${p}">${p}</option>`;
    });

    if (players.includes(currentWinner)) winnerSelect.value = currentWinner;
    if (players.includes(currentLoser)) loserSelect.value = currentLoser;
  }

  updateGameFilter() {
    const games = this.dataManager.getAvailableGames();
    const filterSelect = document.getElementById("gameFilter");

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

  getColor(name) {
    if (!name) return "#95a5a6";
    const colors = [
      "#4a90e2",
      "#27ae60",
      "#e74c3c",
      "#f39c12",
      "#9b59b6",
      "#1abc9c",
      "#e67e22",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
