import { StatsTable } from "./stats-table.js";
import { StatsGames } from "./stats-games.js";
import { StatsFilter } from "./stats-filter.js";

export class StatsRenderer {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.currentFilter = "all";
    this.table = new StatsTable(this);
    this.games = new StatsGames(this);
    this.filter = new StatsFilter(this);
  }

  // ===== ПОЛУЧИТЬ ТЕКУЩУЮ ГРУППУ =====
  getGroupId() {
    const app = window.app;
    if (!app) return null;
    return app.groupManager?.getUserGroup(app.currentUser) || null;
  }

  getGroupData() {
    const groupId = this.getGroupId();
    if (!groupId) return null;
    return window.app?.groupManager?.getGroupData(groupId) || null;
  }

  getGroupStats() {
    const groupId = this.getGroupId();
    if (!groupId) return [];
    return window.app?.groupManager?.getGroupStats(groupId) || [];
  }

  getGroupGameSettings() {
    const groupId = this.getGroupId();
    if (!groupId) return {};
    return window.app?.groupManager?.getGroupGameSettings(groupId) || {};
  }

  getGroupGameSetting(game) {
    const settings = this.getGroupGameSettings();
    return settings[game] || "both";
  }

  getGroupAvailableGames() {
    const groupId = this.getGroupId();
    if (!groupId) return ["all"];
    return window.app?.groupManager?.getGroupAvailableGames(groupId) || ["all"];
  }

  getGroupPlayerStats(name) {
    const groupId = this.getGroupId();
    if (!groupId) return null;
    return window.app?.groupManager?.getGroupPlayerStats(groupId, name) || null;
  }

  getGroupPlayerNames() {
    const groupId = this.getGroupId();
    if (!groupId) return [];
    return window.app?.groupManager?.getGroupPlayerNames(groupId) || [];
  }

  // ===== РЕНДЕРИНГ =====
  renderAll() {
    this.table.render();
    this.games.render();
    this.filter.update();
  }

  setFilter(game) {
    this.currentFilter = game;
    this.renderAll();
  }
}
