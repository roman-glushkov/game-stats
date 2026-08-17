export class StatsGames {
  constructor(renderer) {
    this.renderer = renderer;
  }

  render() {
    const container = document.getElementById("gamesStatsGrid");
    if (!container) return;

    const games = this.renderer
      .getGroupAvailableGames()
      .filter((g) => g !== "all" && g !== "Все игры");

    if (!games || games.length === 0) {
      container.innerHTML = '<p class="empty-state">Нет данных по играм</p>';
      return;
    }

    const groupData = this.renderer.getGroupData();
    const players = groupData?.players || {};

    let html = "";
    games.forEach((game) => {
      const gameSetting = this.renderer.getGroupGameSetting(game);

      let totalWins = 0,
        totalLosses = 0;

      for (const name in players) {
        const gameStats = players[name]?.games?.[game];
        if (gameStats) {
          totalWins += gameStats.wins || 0;
          totalLosses += gameStats.losses || 0;
        }
      }

      let totalGames = 0;
      if (gameSetting === "wins") totalGames = totalWins;
      else if (gameSetting === "losses") totalGames = totalLosses;
      else totalGames = Math.floor((totalWins + totalLosses) / 2);

      // Находим лидера по этой игре
      let leader = "—";
      let leaderWins = 0;
      for (const name in players) {
        const gameStats = players[name]?.games?.[game];
        if (gameStats && (gameStats.wins || 0) > leaderWins) {
          leaderWins = gameStats.wins || 0;
          leader = name;
        }
      }

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
