// ============================================
// ChartManager - Управление графиками с фильтром
// ============================================

export class ChartManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.charts = { bar: null, pie: null, line: null };
  }

  renderAll() {
    const filter = this.statsRenderer?.currentFilter || "all";
    this.renderBarChart(filter);
    this.renderPieChart(filter);
  }

  renderBarChart(filter = "all") {
    const players = this.dataManager.getAllStats(filter);
    const ctx = document.getElementById("barChart").getContext("2d");

    if (this.charts.bar) {
      this.charts.bar.destroy();
    }

    if (!players || players.length === 0) {
      this.charts.bar = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Нет данных"],
          datasets: [
            { label: "Победы", data: [0], backgroundColor: "#95a5a6" },
          ],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      });
      return;
    }

    const labels = players.map((p) => p.name);
    const wins = players.map((p) => p.wins);
    const losses = players.map((p) => p.losses);

    this.charts.bar = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Победы",
            data: wins,
            backgroundColor: "#27ae60",
            borderRadius: 4,
          },
          {
            label: "Поражения",
            data: losses,
            backgroundColor: "#e74c3c",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top", labels: { boxWidth: 12, padding: 15 } },
          title: {
            display: true,
            text:
              filter === "all"
                ? "Статистика по всем играм"
                : `Статистика по игре "${filter}"`,
          },
        },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
  }

  renderPieChart(filter = "all") {
    const players = this.dataManager.getAllStats(filter);
    const ctx = document.getElementById("pieChart").getContext("2d");

    if (this.charts.pie) {
      this.charts.pie.destroy();
    }

    if (!players || players.length === 0) {
      this.charts.pie = new Chart(ctx, {
        type: "pie",
        data: {
          labels: ["Нет данных"],
          datasets: [{ data: [1], backgroundColor: ["#95a5a6"] }],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      });
      return;
    }

    const data = players.map((p) => p.wins);
    const colors = [
      "#4a90e2",
      "#27ae60",
      "#f39c12",
      "#e74c3c",
      "#9b59b6",
      "#1abc9c",
      "#e67e22",
    ];

    this.charts.pie = new Chart(ctx, {
      type: "pie",
      data: {
        labels: players.map((p) => p.name),
        datasets: [
          {
            data,
            backgroundColor: colors.slice(0, players.length),
            borderWidth: 2,
            borderColor: "white",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, padding: 12 } },
          title: {
            display: true,
            text:
              filter === "all"
                ? "Распределение побед (все игры)"
                : `Распределение побед в "${filter}"`,
          },
        },
      },
    });
  }

  destroyAll() {
    Object.values(this.charts).forEach((chart) => {
      if (chart) chart.destroy();
    });
    this.charts = { bar: null, pie: null, line: null };
  }
}
