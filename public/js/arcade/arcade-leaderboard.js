export class ArcadeLeaderboard {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.currentGame = "memory"; // 'memory' или 'yahtzee'
  }

  render() {
    const container = document.getElementById("arcadeLeaderboardContent");
    if (!container) {
      console.warn("⚠️ arcadeLeaderboardContent не найден!");
      return;
    }

    const arcade = this.storageManager.getArcadeData();
    const isLoggedIn = window.app?.isLoggedIn || false;
    const isAdmin = window.app?.userRole === "admin" || false;

    const games = [
      { id: "memory", label: "🎴 Память", icon: "🧠" },
      { id: "yahtzee", label: "🎲 Ятзи", icon: "🎲" },
    ];

    // Переключатель
    let tabsHtml = `
      <div class="arcade-tabs" style="display: flex; gap: 4px; background: #1a1a2e; border-radius: 10px; padding: 4px; margin-bottom: 12px; border: 1px solid #2a2a4a;">
    `;
    games.forEach((game) => {
      const active = this.currentGame === game.id ? "active" : "";
      tabsHtml += `
        <button class="arcade-tab ${active}" 
                onclick="window.app.arcadeManager.leaderboardSwitch('${
                  game.id
                }')"
                style="flex: 1; padding: 8px 12px; border: none; border-radius: 8px; cursor: pointer; 
                       font-size: 14px; font-weight: 600; transition: all 0.3s ease;
                       background: ${active ? "#4f8cff" : "transparent"};
                       color: ${active ? "white" : "#94a3b8"};
                       ${
                         active
                           ? "box-shadow: 0 2px 10px rgba(79, 140, 255, 0.3);"
                           : ""
                       }">
          ${game.icon} ${game.label}
        </button>
      `;
    });
    tabsHtml += `</div>`;
    let html = tabsHtml;

    // Текущая игра
    const game = games.find((g) => g.id === this.currentGame) || games[0];
    const records = this.storageManager.getArcadeLeaderboard(game.id);
    const gamesPlayed = arcade[game.id]?.gamesPlayed || 0;

    const filteredRecords = records;

    const bestScore =
      filteredRecords.length > 0
        ? Math.max(...filteredRecords.map((r) => r.bestScore || 0))
        : 0;
    const totalPlayers = filteredRecords.length;

    html += `
      <div style="background: #1a1a2e; border-radius: 10px; padding: 12px; border: 1px solid #2a2a4a;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="font-size: 16px; color: #e2e8f0;">${game.icon} ${
      game.label
    }</h4>
          <span style="font-size: 12px; color: #94a3b8;">🎮 ${gamesPlayed} игр</span>
        </div>
        <div class="arcade-leaderboard-stats" style="display: flex; gap: 12px; margin-bottom: 8px;">
          <div class="stat-card-mini" style="background: #22223a; padding: 4px 12px; border-radius: 6px;">
            <div class="stat-label" style="font-size: 10px; color: #94a3b8;">🏆 Лучший</div>
            <div class="stat-value" style="font-size: 18px; font-weight: bold; color: #f59e0b;">${
              isLoggedIn
                ? bestScore
                : `<span class="blur-data">${bestScore}</span>`
            }</div>
          </div>
          <div class="stat-card-mini" style="background: #22223a; padding: 4px 12px; border-radius: 6px;">
            <div class="stat-label" style="font-size: 10px; color: #94a3b8;">👥 Игроков</div>
            <div class="stat-value" style="font-size: 18px; font-weight: bold; color: #4f8cff;">
            ${
              isLoggedIn
                ? totalPlayers
                : `<span class="blur-data">${totalPlayers}</span>`
            }
          </div>
          </div>
        </div>
        <div class="arcade-records-list">
          
          ${
            filteredRecords.length === 0
              ? '<div style="padding: 16px; text-align: center; color: #94a3b8; font-size: 14px;">Нет рекордов</div>'
              : ""
          }
          ${filteredRecords
            .map((record, i) => {
              const rankClass =
                i === 0
                  ? "rank-1"
                  : i === 1
                  ? "rank-2"
                  : i === 2
                  ? "rank-3"
                  : "";
              const medal =
                i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
              const avgScore =
                record.winRate || record.totalScore / record.gamesPlayed;

              const deleteBtn = isAdmin
                ? `
                <button class="btn btn-sm btn-danger" onclick="window.app.arcadeManager.deleteRecord('${record.player}')" style="padding: 1px 6px; font-size: 10px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                  🗑️
                </button>
              `
                : "";

              const playerDisplay = isLoggedIn
                ? record.player
                : `<span class="blur-data">${record.player}</span>`;

              const scoreDisplay = isLoggedIn
                ? `⭐ ${record.totalScore || 0}`
                : `<span class="blur-data">⭐ ${record.totalScore || 0}</span>`;

              const gamesDisplay = isLoggedIn
                ? `🎯 ${record.gamesPlayed || 0}`
                : `<span class="blur-data">🎯 ${
                    record.gamesPlayed || 0
                  }</span>`;

              const avgDisplay = isLoggedIn
                ? `📈 ${
                    typeof avgScore === "number" ? avgScore.toFixed(1) : "0.0"
                  }`
                : `<span class="blur-data">📈 ${
                    typeof avgScore === "number" ? avgScore.toFixed(1) : "0.0"
                  }</span>`;

              const dateDisplay = isLoggedIn
                ? record.date || "-"
                : `<span class="blur-data">${record.date || "-"}</span>`;

              return `
                <div class="arcade-record-item" style="...">
                  <span class="arcade-record-rank ${rankClass}" style="text-align: center;">${medal}</span>
                  <span class="arcade-record-player" style="font-weight: 500;">${playerDisplay}</span>
                  <span class="arcade-record-score" style="text-align: center; color: #f59e0b;">${scoreDisplay}</span>
                  <span class="arcade-record-games" style="text-align: center; color: #94a3b8;">${gamesDisplay}</span>
                  <span class="arcade-record-games" style="text-align: center; color: #4f8cff;">${avgDisplay}</span>
                  <span class="arcade-record-date" style="text-align: center; color: #64748b; font-size: 10px;">${dateDisplay}</span>
                  ${deleteBtn ? `<span>${deleteBtn}</span>` : ""}
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  switchGame(gameId) {
    this.currentGame = gameId;
    this.render();
  }
}
