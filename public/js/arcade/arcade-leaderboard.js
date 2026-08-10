export class ArcadeLeaderboard {
  constructor(storageManager) {
    this.storageManager = storageManager;
  }

  render() {
    const container = document.getElementById("arcadeLeaderboardContent");
    if (!container) {
      console.warn("⚠️ arcadeLeaderboardContent не найден!");
      return;
    }

    const arcade = this.storageManager.getArcadeData();
    const gameId = "memory";
    const records = this.storageManager.getArcadeLeaderboard(gameId);
    const gamesPlayed = arcade[gameId]?.gamesPlayed || 0;

    // Фильтруем записи гостя, если пользователь не авторизован
    const isLoggedIn = window.app?.isLoggedIn || false;
    const filteredRecords = isLoggedIn
      ? records
      : records.filter((r) => r.player !== "Гость");

    const bestScore =
      filteredRecords.length > 0
        ? Math.max(...filteredRecords.map((r) => r.bestScore || 0))
        : 0;
    const totalPlayers = filteredRecords.length;

    let html = `
      <div class="arcade-leaderboard-stats">
        <div class="stat-card-mini"><div class="stat-label">🎮 Сыграно игр</div><div class="stat-value">${gamesPlayed}</div></div>
        <div class="stat-card-mini"><div class="stat-label">🏆 Лучший результат</div><div class="stat-value">${bestScore}</div></div>
        <div class="stat-card-mini"><div class="stat-label">👥 Игроков</div><div class="stat-value">${totalPlayers}</div></div>
      </div>
      <div class="arcade-records-list">
        ${
          !isLoggedIn
            ? `
          <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
            🔒 <a href="#" onclick="document.getElementById('loginBtn').click(); return false;" style="color: var(--primary); text-decoration: underline;">Войдите</a>, чтобы видеть рейтинг
          </div>
        `
            : ""
        }
        ${
          filteredRecords.length === 0 && isLoggedIn
            ? '<div class="empty-state">Нет рекордов</div>'
            : ""
        }
        ${filteredRecords
          .map((record, i) => {
            const rankClass =
              i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : "";
            const medal =
              i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
            const avgScore =
              record.winRate || record.totalScore / record.gamesPlayed;
            return `
              <div class="arcade-record-item">
                <span class="arcade-record-rank ${rankClass}">${medal}</span>
                <span class="arcade-record-player">${record.player}</span>
                <span class="arcade-record-score">⭐ ${
                  record.totalScore || 0
                }</span>
                <span class="arcade-record-games">🎯 ${
                  record.gamesPlayed || 0
                } игр</span>
                <span class="arcade-record-games">📈 ${
                  typeof avgScore === "number" ? avgScore.toFixed(1) : "0.0"
                }</span>
                <span class="arcade-record-date">${record.date}</span>
              </div>
            `;
          })
          .join("")}
      </div>
    `;

    container.innerHTML = html;
  }
}
