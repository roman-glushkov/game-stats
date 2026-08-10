import { StatsTable } from "./stats-table.js";
import { StatsGames } from "./stats-games.js";
import { StatsFilter } from "./stats-filter.js";

export class StatsRenderer {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.currentFilter = "all";
    this.table = new StatsTable(dataManager, this);
    this.games = new StatsGames(dataManager);
    this.filter = new StatsFilter(dataManager, this);
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
