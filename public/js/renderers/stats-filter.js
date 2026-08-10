export class StatsFilter {
  constructor(dataManager, renderer) {
    this.dataManager = dataManager;
    this.renderer = renderer;
  }

  update() {
    const games = this.dataManager.getAvailableGames();
    const filterSelect = document.getElementById("gameFilter");
    if (!filterSelect) return;

    filterSelect.innerHTML = "";
    games.forEach((game) => {
      const label = game === "all" ? "🎮 Все игры" : game;
      filterSelect.innerHTML += `<option value="${game}">${label}</option>`;
    });

    filterSelect.value = this.renderer.currentFilter;
  }
}
