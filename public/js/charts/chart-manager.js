import { ChartRenderers } from "./chart-renderers.js";

export class ChartManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.charts = { bar: null, pie: null };
    this.renderers = new ChartRenderers(dataManager, this);
    this.currentFilter = "all";
  }

  renderAll() {
    const filter = this.currentFilter || "all";
    this.renderers.renderBarChart(filter);
    this.renderers.renderPieChart(filter);
  }

  destroyAll() {
    Object.values(this.charts).forEach((chart) => {
      if (chart) chart.destroy();
    });
    this.charts = { bar: null, pie: null };
  }
}
