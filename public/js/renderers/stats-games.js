export class StatsGames {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }

  render() {
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

      let totalWins = 0,
        totalLosses = 0;
      players.forEach((p) => {
        totalWins += p.wins;
        totalLosses += p.losses;
      });

      let totalGames = 0;
      if (gameSetting === "wins") totalGames = totalWins;
      else if (gameSetting === "losses") totalGames = totalLosses;
      else totalGames = Math.floor((totalWins + totalLosses) / 2);

      const sorted = [...players].sort((a, b) => b.wins - a.wins);
      const leader = sorted[0]?.name || "—";
      const leaderWins = sorted[0]?.wins || 0;

      const gameEmoji = this.getGameEmoji(game);

      let typeIcon = "📊",
        typeLabel = "";
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
}
