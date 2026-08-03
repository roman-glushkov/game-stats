// ============================================
// DataManager - Управление данными с поддержкой игр
// ============================================

const DEFAULT_DATA = {
  players: {},
};

export class DataManager {
  constructor() {
    this.data = { players: {} };
    this.currentGameFilter = "all";
  }

  async loadData() {
    try {
      const response = await fetch("/api/stats");

      if (!response.ok) {
        throw new Error("Не удалось загрузить stats.json");
      }

      const rawData = await response.json();

      // Преобразуем старый формат в новый
      this.data = this.migrateData(rawData);

      console.log("✅ Данные загружены:", this.data);
      return this.data;
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      return this.data;
    }
  }

  // Миграция данных из старого формата
  migrateData(data) {
    // Если данные в старом формате (массив players)
    if (Array.isArray(data.players)) {
      const newPlayers = {};
      data.players.forEach((p) => {
        newPlayers[p.name] = {
          games: {
            "Все игры": { wins: p.wins || 0, losses: p.losses || 0 },
          },
        };
      });
      return { players: newPlayers };
    }

    // Если уже в новом формате
    if (data.players && typeof data.players === "object") {
      return data;
    }

    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  async saveData() {
    try {
      const response = await fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.data),
      });

      if (!response.ok) throw new Error("Ошибка сохранения");
      console.log("💾 Данные сохранены");
      return true;
    } catch (error) {
      console.error("Ошибка сохранения:", error);
      return false;
    }
  }

  // ===== Получение игр =====
  getAvailableGames() {
    const games = new Set();
    Object.values(this.data.players).forEach((player) => {
      if (player.games) {
        Object.keys(player.games).forEach((game) => games.add(game));
      }
    });
    return ["all", ...Array.from(games)];
  }

  // ===== Получение статистики =====
  getAllStats(gameFilter = "all") {
    const stats = [];

    Object.entries(this.data.players).forEach(([name, playerData]) => {
      let totalWins = 0;
      let totalLosses = 0;

      if (gameFilter === "all") {
        // Суммируем по всем играм
        Object.values(playerData.games || {}).forEach((gameStats) => {
          totalWins += gameStats.wins || 0;
          totalLosses += gameStats.losses || 0;
        });
      } else {
        // Только конкретная игра
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
        total: total,
        winRate:
          total === 0 ? 0 : Number(((totalWins / total) * 100).toFixed(1)),
      });
    });

    return stats.filter((s) => s.total > 0 || gameFilter === "all");
  }

  getPlayerStats(name, gameFilter = "all") {
    const player = this.data.players[name];
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
        total: total,
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
        total: total,
        winRate:
          total === 0
            ? 0
            : Number((((gameStats.wins || 0) / total) * 100).toFixed(1)),
      };
    }
  }

  // ===== Добавление данных =====
  async addPlayer(name) {
    name = name.trim();
    if (!name || this.data.players[name]) return false;

    this.data.players[name] = { games: {} };
    await this.saveData();
    return true;
  }

  async addGameResult(game, winner, loser) {
    if (!game || !winner || !loser || winner === loser) return false;
    if (!this.data.players[winner] || !this.data.players[loser]) return false;

    // Инициализируем игру у победителя
    if (!this.data.players[winner].games[game]) {
      this.data.players[winner].games[game] = { wins: 0, losses: 0 };
    }
    // Инициализируем игру у проигравшего
    if (!this.data.players[loser].games[game]) {
      this.data.players[loser].games[game] = { wins: 0, losses: 0 };
    }

    // Добавляем результат
    this.data.players[winner].games[game].wins++;
    this.data.players[loser].games[game].losses++;

    await this.saveData();
    return true;
  }

  async addWin(name, game = "Все игры") {
    const player = this.data.players[name];
    if (!player) return false;

    if (!player.games[game]) {
      player.games[game] = { wins: 0, losses: 0 };
    }

    player.games[game].wins++;
    await this.saveData();
    return true;
  }

  async addLoss(name, game = "Все игры") {
    const player = this.data.players[name];
    if (!player) return false;

    if (!player.games[game]) {
      player.games[game] = { wins: 0, losses: 0 };
    }

    player.games[game].losses++;
    await this.saveData();
    return true;
  }

  async resetPlayerStats(name) {
    const player = this.data.players[name];
    if (!player) return false;

    player.games = {};
    await this.saveData();
    return true;
  }

  async clearAllStats() {
    Object.keys(this.data.players).forEach((name) => {
      this.data.players[name].games = {};
    });
    await this.saveData();
    return true;
  }

  getPlayerNames() {
    return Object.keys(this.data.players);
  }

  exportData() {
    return JSON.stringify(this.data, null, 2);
  }

  async importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.data = this.migrateData(data);
      await this.saveData();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
