// ============================================
// DataManager - Управление данными с поддержкой игр и логинов
// ============================================

const DEFAULT_DATA = {
  players: {},
};

const DEFAULT_LOGINS = {
  admins: {},
  users: {},
};

export class DataManager {
  constructor() {
    this.data = { players: {} };
    this.logins = { admins: {}, users: {} };
    this.currentGameFilter = "all";
  }

  async loadData() {
    try {
      // Загружаем stats
      const statsResponse = await fetch("/api/stats");
      if (!statsResponse.ok) {
        throw new Error("Не удалось загрузить stats.json");
      }
      const rawData = await statsResponse.json();
      this.data = this.migrateData(rawData);
      console.log("✅ Данные загружены:", this.data);

      // Загружаем логины
      try {
        const loginResponse = await fetch("/api/logins");
        if (loginResponse.ok) {
          this.logins = await loginResponse.json();
          console.log("✅ Логины загружены:", this.logins);
        } else {
          this.logins = JSON.parse(JSON.stringify(DEFAULT_LOGINS));
        }
      } catch (e) {
        console.warn("⚠️ Не удалось загрузить логины");
        this.logins = JSON.parse(JSON.stringify(DEFAULT_LOGINS));
        // Не создаём автоматически, просто используем пустые
      }

      return this.data;
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      this.logins = JSON.parse(JSON.stringify(DEFAULT_LOGINS));
      return this.data;
    }
  }

  // Миграция данных из старого формата
  migrateData(data) {
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

  async saveLogins() {
    try {
      const response = await fetch("/api/logins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.logins),
      });

      if (!response.ok) throw new Error("Ошибка сохранения логинов");
      console.log("💾 Логины сохранены");
      return true;
    } catch (error) {
      console.error("Ошибка сохранения логинов:", error);
      return false;
    }
  }

  // ===== АВТОРИЗАЦИЯ =====
  checkLogin(login, password) {
    // Проверяем админов
    if (this.logins.admins && this.logins.admins[login] === password) {
      return { success: true, role: "admin", login };
    }
    // Проверяем пользователей
    if (this.logins.users && this.logins.users[login] === password) {
      return { success: true, role: "user", login };
    }
    return { success: false };
  }

  async addUser(login, password, role = "user") {
    login = login.trim();
    if (!login || !password) return false;

    // Проверяем, не существует ли уже такой логин
    if (this.logins.admins[login] || this.logins.users[login]) {
      return false;
    }

    if (role === "admin") {
      this.logins.admins[login] = password;
    } else {
      this.logins.users[login] = password;
    }

    await this.saveLogins();
    return true;
  }

  async deleteUser(login) {
    if (login === "admin") {
      alert("❌ Нельзя удалить главного администратора");
      return false;
    }

    if (this.logins.admins[login]) {
      delete this.logins.admins[login];
    } else if (this.logins.users[login]) {
      delete this.logins.users[login];
    } else {
      return false;
    }

    await this.saveLogins();
    return true;
  }

  async changePassword(login, newPassword) {
    if (!login || !newPassword || newPassword.length < 3) return false;

    if (this.logins.admins[login]) {
      this.logins.admins[login] = newPassword;
    } else if (this.logins.users[login]) {
      this.logins.users[login] = newPassword;
    } else {
      return false;
    }

    await this.saveLogins();
    return true;
  }

  getUsers() {
    const users = [];
    Object.keys(this.logins.admins || {}).forEach((login) => {
      users.push({ login, role: "admin" });
    });
    Object.keys(this.logins.users || {}).forEach((login) => {
      users.push({ login, role: "user" });
    });
    return users;
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
  async addPlayer(name, game = null, wins = 0, losses = 0) {
    name = name.trim();
    if (!name || this.data.players[name]) return false;

    this.data.players[name] = { games: {} };

    if (game && (wins > 0 || losses > 0)) {
      this.data.players[name].games[game] = { wins, losses };
    }

    await this.saveData();
    return true;
  }

  async addGameResult(game, winner, loser) {
    if (!game || !winner || !loser || winner === loser) return false;
    if (!this.data.players[winner] || !this.data.players[loser]) return false;

    if (!this.data.players[winner].games[game]) {
      this.data.players[winner].games[game] = { wins: 0, losses: 0 };
    }
    if (!this.data.players[loser].games[game]) {
      this.data.players[loser].games[game] = { wins: 0, losses: 0 };
    }

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
