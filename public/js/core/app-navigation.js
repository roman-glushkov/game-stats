export class AppNavigation {
  constructor() {
    this.sections = {};
    this.titles = {};
    this.app = null;
  }

  setup(app) {
    this.app = app;

    const navItems = document.querySelectorAll(".nav-item");
    this.sections = {
      dashboard: document.getElementById("section-dashboard"),
      players: document.getElementById("section-players"),
      leaderboard: document.getElementById("section-leaderboard"),
      charts: document.getElementById("section-charts"),
      games: document.getElementById("section-games"),
      arcade: document.getElementById("section-arcade"),
      settings: document.getElementById("section-settings"),
    };
    this.titles = {
      dashboard: "Главная",
      players: "Игроки",
      leaderboard: "Таблица лидеров",
      charts: "Визуализация",
      games: "Игры",
      arcade: "Аркады",
      settings: "Настройки",
    };

    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const section = item.dataset.section;

        navItems.forEach((n) => n.classList.remove("active"));
        item.classList.add("active");

        Object.entries(this.sections).forEach(([key, el]) => {
          if (el) el.classList.toggle("active", key === section);
        });

        document.getElementById("pageTitle").textContent =
          this.titles[section] || "Главная";
        document.querySelector(".sidebar-nav")?.classList.remove("open");

        this.onSectionChange(section);
      });
    });

    const toggle = document.getElementById("mobileMenuToggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        document.querySelector(".sidebar-nav")?.classList.toggle("open");
      });
    }

    document.addEventListener("click", (e) => {
      const sidebar = document.querySelector(".sidebar-nav");
      const toggleBtn = document.getElementById("mobileMenuToggle");
      if (
        window.innerWidth <= 768 &&
        sidebar &&
        toggleBtn &&
        !sidebar.contains(e.target) &&
        !toggleBtn.contains(e.target)
      ) {
        sidebar.classList.remove("open");
      }
    });
  }

  onSectionChange(section) {
    if (!this.app) return;

    if (section === "charts") {
      setTimeout(() => {
        this.app.chartManager.destroyAll();
        this.app.chartManager.renderAll();
      }, 100);
    }

    if (section === "settings") {
      this.app.renderUsersList();
      this.app.renderGamesSettings();
    }

    if (section === "arcade") {
      this.app.arcadeManager.renderGames();
      this.app.arcadeManager.renderLeaderboard();
    }
  }
}
