export class StorageStats {
  constructor(storageManager) {
    this.storageManager = storageManager;
  }

  getAvailableGames() {
    const games = new Set();
    const data = this.storageManager.data;
    Object.values(data.players).forEach((player) => {
      if (player.games) {
        Object.keys(player.games).forEach((game) => games.add(game));
      }
    });
    return ["all", ...Array.from(games)];
  }

  getAllStats(gameFilter = "all") {
    const stats = [];
    const data = this.storageManager.data;

    Object.entries(data.players).forEach(([name, playerData]) => {
      let totalWins = 0,
        totalLosses = 0;

      if (gameFilter === "all") {
        Object.values(playerData.games || {}).forEach((gameStats) => {
          totalWins += gameStats.wins || 0;
          totalLosses += gameStats.losses || 0;
        });
      } else {
        const gameStats = playerData.games?.[gameFilter];
        if (gameStats) {
          totalWins = gameStats.wins || 0;
          totalLosses = gameStats.losses || 0;
        }
      }

      const total = totalWins + totalLosses;
      stats.push({
        name,
        wins: totalWins,
        losses: totalLosses,
        total,
        winRate:
          total === 0 ? 0 : Number(((totalWins / total) * 100).toFixed(1)),
      });
    });

    return stats.filter((s) => s.total > 0 || gameFilter === "all");
  }

  getPlayerStats(name, gameFilter = "all") {
    const player = this.storageManager.data.players[name];
    if (!player) return null;

    if (gameFilter === "all") {
      let totalWins = 0,
        totalLosses = 0;
      const games = {};
      Object.entries(player.games || {}).forEach(([game, stats]) => {
        games[game] = { ...stats };
        totalWins += stats.wins || 0;
        totalLosses += stats.losses || 0;
      });
      const total = totalWins + totalLosses;
      return {
        name,
        games,
        totalWins,
        totalLosses,
        total,
        winRate:
          total === 0 ? 0 : Number(((totalWins / total) * 100).toFixed(1)),
      };
    } else {
      const gameStats = player.games?.[gameFilter];
      if (!gameStats) {
        return {
          name,
          games: {},
          totalWins: 0,
          totalLosses: 0,
          total: 0,
          winRate: 0,
        };
      }
      const total = (gameStats.wins || 0) + (gameStats.losses || 0);
      return {
        name,
        games: { [gameFilter]: { ...gameStats } },
        totalWins: gameStats.wins || 0,
        totalLosses: gameStats.losses || 0,
        total,
        winRate:
          total === 0
            ? 0
            : Number((((gameStats.wins || 0) / total) * 100).toFixed(1)),
      };
    }
  }

  getPlayerNames() {
    return Object.keys(this.storageManager.data.players);
  }

  async addPlayer(name, game = null, wins = 0, losses = 0) {
    name = name.trim();
    if (!name || this.storageManager.data.players[name]) return false;

    this.storageManager.data.players[name] = { games: {} };
    if (game && (wins > 0 || losses > 0)) {
      this.storageManager.data.players[name].games[game] = { wins, losses };
    }
    await this.storageManager.saveData();
    return true;
  }

  async addGameResult(game, winner, loser) {
    if (!game || !winner || !loser || winner === loser) return false;
    const data = this.storageManager.data;
    if (!data.players[winner] || !data.players[loser]) return false;

    if (!data.players[winner].games[game]) {
      data.players[winner].games[game] = { wins: 0, losses: 0 };
    }
    if (!data.players[loser].games[game]) {
      data.players[loser].games[game] = { wins: 0, losses: 0 };
    }

    data.players[winner].games[game].wins++;
    data.players[loser].games[game].losses++;
    await this.storageManager.saveData();
    return true;
  }

  async addWin(name, game = "Все игры") {
    const player = this.storageManager.data.players[name];
    if (!player) return false;
    if (!player.games[game]) player.games[game] = { wins: 0, losses: 0 };
    player.games[game].wins++;
    await this.storageManager.saveData();
    return true;
  }

  async addLoss(name, game = "Все игры") {
    const player = this.storageManager.data.players[name];
    if (!player) return false;
    if (!player.games[game]) player.games[game] = { wins: 0, losses: 0 };
    player.games[game].losses++;
    await this.storageManager.saveData();
    return true;
  }
}
