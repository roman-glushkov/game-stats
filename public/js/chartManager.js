// ============================================
// ChartManager - Управление графиками с фильтром
// ============================================

export class ChartManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.charts = { bar: null, pie: null };
  }

  renderAll() {
    const filter = this.currentFilter || "all";
    this.renderBarChart(filter);
    this.renderPieChart(filter);
  }

  renderBarChart(filter = "all") {
    const players = this.dataManager.getAllStats(filter);
    const canvas = document.getElementById("barChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (this.charts.bar) {
      this.charts.bar.destroy();
    }

    if (!players || players.length === 0) {
      this.charts.bar = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Нет данных"],
          datasets: [
            { label: "Победы", data: [0], backgroundColor: "#4f8cff" },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
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
            backgroundColor: "#22c55e",
            borderRadius: 4,
          },
          {
            label: "Поражения",
            data: losses,
            backgroundColor: "#ef4444",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
            labels: { boxWidth: 12, padding: 15, color: "#94a3b8" },
          },
          title: {
            display: true,
            text:
              filter === "all"
                ? "Статистика по всем играм"
                : `Статистика по игре "${filter}"`,
            color: "#94a3b8",
          },
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, color: "#64748b" } },
          x: { ticks: { color: "#94a3b8" } },
        },
      },
    });
  }

  renderPieChart(filter = "all") {
    const players = this.dataManager.getAllStats(filter);
    const canvas = document.getElementById("pieChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (this.charts.pie) {
      this.charts.pie.destroy();
    }

    if (!players || players.length === 0) {
      this.charts.pie = new Chart(ctx, {
        type: "pie",
        data: {
          labels: ["Нет данных"],
          datasets: [{ data: [1], backgroundColor: ["#4f8cff"] }],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      });
      return;
    }

    const data = players.map((p) => p.wins);
    const colors = [
      "#4f8cff",
      "#22c55e",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
      "#ec4899",
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
            borderColor: "#0a0e1a",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 12, padding: 12, color: "#94a3b8" },
          },
          title: {
            display: true,
            text:
              filter === "all"
                ? "Распределение побед (все игры)"
                : `Распределение побед в "${filter}"`,
            color: "#94a3b8",
          },
        },
      },
    });
  }

  destroyAll() {
    Object.values(this.charts).forEach((chart) => {
      if (chart) chart.destroy();
    });
    this.charts = { bar: null, pie: null };
  }
}
