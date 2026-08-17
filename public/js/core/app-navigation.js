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

    this.updateNavVisibility();

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

  updateNavVisibility() {
    const app = this.app;
    if (!app) return;

    const isInGroup =
      app.isLoggedIn && app.groupManager?.isUserInGroup(app.currentUser);
    const isLoggedIn = app.isLoggedIn;

    const groupOnlyItems = ["players", "leaderboard", "charts", "games"];

    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      const section = item.dataset.section;

      if (groupOnlyItems.includes(section)) {
        item.style.display = isLoggedIn && isInGroup ? "" : "none";
      }

      // dashboard показываем ВСЕГДА если залогинен
      if (section === "dashboard") {
        item.style.display = isLoggedIn ? "" : "none";
      }

      if (section === "arcade" || section === "settings") {
        item.style.display = isLoggedIn ? "" : "none";
      }
    });
  }

  onSectionChange(section) {
    if (!this.app) return;

    const isInGroup =
      this.app.isLoggedIn &&
      this.app.groupManager?.isUserInGroup(this.app.currentUser);
    const isLoggedIn = this.app.isLoggedIn;

    // ===== ДЛЯ НЕ В ГРУППЕ =====
    if (isLoggedIn && !isInGroup) {
      // Если перешли на аркады — показываем только аркады
      if (section === "arcade") {
        const sections = document.querySelectorAll(".section");
        sections.forEach((s) => s.classList.remove("active"));
        if (this.sections.arcade) {
          this.sections.arcade.classList.add("active");
        }
        document.getElementById("pageTitle").textContent = "🕹️ Аркады";
        this.app.arcadeManager.renderGames();
        this.app.arcadeManager.renderLeaderboard();
        return;
      }

      // Если перешли на настройки — показываем настройки
      if (section === "settings") {
        const sections = document.querySelectorAll(".section");
        sections.forEach((s) => s.classList.remove("active"));
        if (this.sections.settings) {
          this.sections.settings.classList.add("active");
        }
        document.getElementById("pageTitle").textContent = "⚙️ Настройки";
        this.app.renderUsersList();
        this.app.renderGamesSettings();
        return;
      }

      // Главная — показываем welcome
      if (section === "dashboard") {
        this.app.showWelcomeScreen();
        return;
      }

      // Для всех остальных разделов — показываем welcome
      this.app.showWelcomeScreen();
      return;
    }

    // ===== ДЛЯ ГОСТЕЙ =====
    if (!isLoggedIn) {
      if (section === "arcade") {
        this.app.arcadeManager.renderGames();
        this.app.arcadeManager.renderLeaderboard();
        return;
      }
      if (section === "settings") {
        this.app.renderUsersList();
        this.app.renderGamesSettings();
        return;
      }
      // Гости видят только аркады и настройки
      if (this.sections.arcade) {
        this.sections.arcade.classList.add("active");
        this.sections.dashboard?.classList.remove("active");
        this.sections.players?.classList.remove("active");
        this.sections.leaderboard?.classList.remove("active");
        this.sections.charts?.classList.remove("active");
        this.sections.games?.classList.remove("active");
        this.sections.settings?.classList.remove("active");
        document.getElementById("pageTitle").textContent = "🕹️ Аркады";
        this.app.arcadeManager.renderGames();
        this.app.arcadeManager.renderLeaderboard();
      }
      return;
    }

    // ===== ДЛЯ ПОЛЬЗОВАТЕЛЕЙ В ГРУППЕ =====
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
