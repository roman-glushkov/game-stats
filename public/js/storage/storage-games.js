export class StorageGames {
  constructor(storageManager) {
    this.storageManager = storageManager;
  }

  getGameSettings() {
    return this.storageManager.data.gameSettings || {};
  }

  getGameSetting(game) {
    const settings = this.getGameSettings();
    return settings[game] || "both";
  }

  async setGameSetting(game, type) {
    if (!this.storageManager.data.gameSettings) {
      this.storageManager.data.gameSettings = {};
    }
    this.storageManager.data.gameSettings[game] = type;
    await this.storageManager.saveData();
    return true;
  }
}
