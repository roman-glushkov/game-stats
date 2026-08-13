import { StorageAuth } from "./storage-auth.js";
import { StorageGames } from "./storage-games.js";
import { StorageStats } from "./storage-stats.js";
import { StorageArcade } from "./storage-arcade.js";

const DEFAULT_DATA = { players: {}, gameSettings: {}, arcade: {} };

export class StorageManager {
  constructor() {
    this.data = { players: {}, gameSettings: {}, arcade: {} };
    this.auth = new StorageAuth();
    this.games = new StorageGames(this);
    this.stats = new StorageStats(this);
    this.arcade = new StorageArcade(this);
    this.currentGameFilter = "all";
  }

  async loadData() {
    try {
      const statsResponse = await fetch("/api/stats");
      if (!statsResponse.ok) throw new Error("Не удалось загрузить stats.json");
      const rawData = await statsResponse.json();
      this.data = this.migrateData(rawData);
      console.log("✅ Данные загружены:", this.data);

      await this.auth.loadLogins();
      return this.data;
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      return this.data;
    }
  }

  migrateData(data) {
    if (Array.isArray(data.players)) {
      const newPlayers = {};
      data.players.forEach((p) => {
        newPlayers[p.name] = {
          games: { "Все игры": { wins: p.wins || 0, losses: p.losses || 0 } },
        };
      });
      return {
        players: newPlayers,
        gameSettings: data.gameSettings || {},
        arcade: data.arcade || {},
      };
    }
    if (data.players && typeof data.players === "object") {
      return {
        players: data.players,
        gameSettings: data.gameSettings || {},
        arcade: data.arcade || {},
      };
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  async saveArcadeOnly() {
    try {
      // Загружаем текущие данные с сервера
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("Не удалось загрузить stats.json");
      const serverData = await response.json();

      // Объединяем: берём аркадные данные с сервера, но сохраняем только свои записи
      const serverArcade = serverData.arcade || {};
      const localArcade = this.data.arcade || {};

      // Для каждой игры в локальных данных
      for (const gameId in localArcade) {
        if (!serverArcade[gameId]) {
          serverArcade[gameId] = { records: [], gamesPlayed: 0 };
        }

        // Берём записи с сервера
        const serverRecords = serverArcade[gameId].records || [];
        const localRecords = localArcade[gameId].records || [];

        // Обновляем только записи текущего пользователя
        const currentUser = this.currentUser || "Гость";

        // Находим запись пользователя в локальных данных
        const localUserRecord = localRecords.find(
          (r) => r.player === currentUser
        );

        if (localUserRecord) {
          // Удаляем старую запись пользователя с сервера
          const filteredServerRecords = serverRecords.filter(
            (r) => r.player !== currentUser
          );
          // Добавляем новую запись пользователя
          filteredServerRecords.push(localUserRecord);
          // Сортируем
          filteredServerRecords.sort((a, b) => b.totalScore - a.totalScore);
          serverArcade[gameId].records = filteredServerRecords;

          // Обновляем gamesPlayed
          serverArcade[gameId].gamesPlayed =
            (serverArcade[gameId].gamesPlayed || 0) + 1;
        }
      }

      // Обновляем данные
      serverData.arcade = serverArcade;
      this.data.arcade = serverArcade;

      // Сохраняем на сервер
      const saveResponse = await fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serverData),
      });

      if (!saveResponse.ok) throw new Error("Ошибка сохранения");
      console.log("💾 Аркадные данные обновлены");
      return true;
    } catch (error) {
      console.error("Ошибка обновления аркадных данных:", error);
      return false;
    }
  }

  // ===== ЗАГРУЗКА СВЕЖИХ ДАННЫХ =====
  async refreshArcadeData() {
    try {
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("Не удалось загрузить stats.json");
      const serverData = await response.json();

      // Обновляем только аркадные данные
      if (serverData.arcade) {
        this.data.arcade = serverData.arcade;
      }

      console.log("🔄 Аркадные данные обновлены");
      return true;
    } catch (error) {
      console.error("Ошибка обновления:", error);
      return false;
    }
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

  getUsers() {
    return this.auth.getUsers();
  }
  hasUsers() {
    return this.auth.hasUsers();
  }
  checkLogin(login, password) {
    return this.auth.checkLogin(login, password);
  }
  async addUser(login, password, role) {
    return this.auth.addUser(login, password, role);
  }
  async deleteUser(login) {
    return this.auth.deleteUser(login);
  }

  getGameSettings() {
    return this.games.getGameSettings();
  }
  getGameSetting(game) {
    return this.games.getGameSetting(game);
  }
  async setGameSetting(game, type) {
    return this.games.setGameSetting(game, type);
  }

  getAvailableGames() {
    return this.stats.getAvailableGames();
  }
  getAllStats(filter) {
    return this.stats.getAllStats(filter);
  }
  getPlayerStats(name, filter) {
    return this.stats.getPlayerStats(name, filter);
  }
  getPlayerNames() {
    return this.stats.getPlayerNames();
  }
  async addPlayer(name, game, wins, losses) {
    return this.stats.addPlayer(name, game, wins, losses);
  }
  async addGameResult(game, winner, loser) {
    return this.stats.addGameResult(game, winner, loser);
  }
  async addWin(name, game) {
    return this.stats.addWin(name, game);
  }
  async addLoss(name, game) {
    return this.stats.addLoss(name, game);
  }

  getArcadeData() {
    return this.arcade.getArcadeData();
  }
  getArcadeLeaderboard(gameId) {
    return this.arcade.getArcadeLeaderboard(gameId);
  }
  async saveArcadeScore(gameId, score, player) {
    return this.arcade.saveArcadeScore(gameId, score, player);
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
