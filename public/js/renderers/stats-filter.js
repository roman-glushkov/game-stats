export class StatsFilter {
  constructor(renderer) {
    this.renderer = renderer;
  }

  update() {
    const games = this.renderer.getGroupAvailableGames();
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
