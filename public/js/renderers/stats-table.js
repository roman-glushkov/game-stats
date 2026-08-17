export class StatsTable {
  constructor(renderer) {
    this.renderer = renderer;
  }

  render() {
    const players = this.renderer.getGroupStats();
    const tbody = document.getElementById("statsBody");
    if (!tbody) return;

    const filter =
      this.renderer.currentFilter === "all"
        ? "Все игры"
        : this.renderer.currentFilter;

    if (!players || players.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Нет данных для "${filter}"</td></tr>`;
      return;
    }

    // Если фильтр не "all", фильтруем по конкретной игре
    let filteredPlayers = players;
    if (this.renderer.currentFilter !== "all") {
      const groupId = this.renderer.getGroupId();
      const groupData = this.renderer.getGroupData();
      if (groupId && groupData) {
        filteredPlayers = [];
        const gameFilter = this.renderer.currentFilter;
        for (const name in groupData.players) {
          const playerData = groupData.players[name];
          const gameStats = playerData.games?.[gameFilter];
          if (gameStats) {
            const wins = gameStats.wins || 0;
            const losses = gameStats.losses || 0;
            const total = wins + losses;
            filteredPlayers.push({
              name: name,
              wins: wins,
              losses: losses,
              total: total,
              winRate:
                total === 0 ? 0 : Number(((wins / total) * 100).toFixed(1)),
            });
          }
        }
      }
    }

    const sorted = (filteredPlayers || players).sort((a, b) => b.wins - a.wins);
    const isAllGames = this.renderer.currentFilter === "all";

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
        this.renderer.currentFilter === "all"
          ? "Все игры"
          : this.renderer.currentFilter;

      let showWinRate = true;
      if (!isAllGames) {
        const gameSetting = this.renderer.getGroupGameSetting(
          this.renderer.currentFilter
        );
        if (gameSetting === "wins" || gameSetting === "losses")
          showWinRate = false;
      }

      let buttons = "";
      if (!isAllGames) {
        const gameSetting = this.renderer.getGroupGameSetting(
          this.renderer.currentFilter
        );
        if (gameSetting === "wins") {
          buttons = `<button class="btn btn-sm btn-success" onclick="window.app.addWin('${p.name}', '${gameFilter}')">+1</button>`;
        } else if (gameSetting === "losses") {
          buttons = `<button class="btn btn-sm btn-danger" onclick="window.app.addLoss('${p.name}', '${gameFilter}')">-1</button>`;
        } else {
          buttons = `
            <button class="btn btn-sm btn-success" onclick="window.app.addWin('${p.name}', '${gameFilter}')">+1</button>
            <button class="btn btn-sm btn-danger" onclick="window.app.addLoss('${p.name}', '${gameFilter}')">-1</button>
          `;
        }
      }

      let rowHtml = `
        <tr>
          <td><span class="rank ${rankClass}">#${index + 1}</span></td>
          <td><strong>${p.name}</strong></td>
          <td>🏆 ${p.wins || 0}</td>
          <td>😵 ${p.losses || 0}</td>
      `;

      if (showWinRate) {
        rowHtml += `<td>${p.winRate || 0}%</td>`;
      } else {
        rowHtml += `<td style="color: var(--text-muted); font-size: 12px;">—</td>`;
      }

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
}
