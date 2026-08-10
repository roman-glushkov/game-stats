import { StatsTable } from "./stats-table.js";
import { StatsGames } from "./stats-games.js";
import { StatsFilter } from "./stats-filter.js";

export class StatsRenderer {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.currentFilter = "all";
    this.table = new StatsTable(storageManager, this);
    this.games = new StatsGames(storageManager);
    this.filter = new StatsFilter(storageManager, this);
  }

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
