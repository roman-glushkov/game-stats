export class StorageArcade {
  constructor(storageManager) {
    this.storageManager = storageManager;
  }

  getArcadeData() {
    if (!this.storageManager.data.arcade) {
      this.storageManager.data.arcade = {};
    }
    return this.storageManager.data.arcade;
  }

  getArcadeLeaderboard(gameId) {
    const arcade = this.getArcadeData();
    if (!arcade[gameId]) {
      arcade[gameId] = { records: [], gamesPlayed: 0 };
    }
    return arcade[gameId].records || [];
  }

  async saveArcadeScore(gameId, score, player = null) {
    // Если player не передан, используем displayName
    if (!player) {
      const userData = this.storageManager.getUserData(
        this.storageManager.currentUser
      );
      player =
        userData?.displayName || this.storageManager.currentUser || "Гость";
    }

    console.log(
      `💾 saveArcadeScore: gameId=${gameId}, score=${score}, player=${player}`
    );

    // Сначала загружаем свежие данные
    await this.storageManager.refreshArcadeData();

    const arcade = this.getArcadeData();
    if (!arcade[gameId]) {
      arcade[gameId] = { records: [], gamesPlayed: 0 };
    }

    // Находим запись игрока по displayName
    const existingIndex = arcade[gameId].records.findIndex(
      (r) => r.player === player
    );

    if (existingIndex !== -1) {
      const record = arcade[gameId].records[existingIndex];
      record.totalScore = (record.totalScore || 0) + score;
      record.gamesPlayed = (record.gamesPlayed || 0) + 1;
      record.bestScore = Math.max(record.bestScore || 0, score);
      record.lastScore = score;
      record.date = new Date().toISOString().slice(0, 10);
      record.winRate =
        Math.round((record.totalScore / record.gamesPlayed) * 10) / 10;
      arcade[gameId].records[existingIndex] = record;
      console.log(
        `📝 Обновлена запись: ${player} → totalScore=${record.totalScore}`
      );
    } else {
      arcade[gameId].records.push({
        player: player,
        totalScore: score,
        bestScore: score,
        lastScore: score,
        gamesPlayed: 1,
        winRate: score,
        date: new Date().toISOString().slice(0, 10),
      });
      console.log(`📝 Создана новая запись: ${player} → totalScore=${score}`);
    }

    arcade[gameId].records.sort((a, b) => b.totalScore - a.totalScore);
    arcade[gameId].records = arcade[gameId].records.slice(0, 20);
    arcade[gameId].gamesPlayed = (arcade[gameId].gamesPlayed || 0) + 1;

    this.storageManager.data.arcade = arcade;
    await this.storageManager.saveArcadeOnly();
    return true;
  }
}
