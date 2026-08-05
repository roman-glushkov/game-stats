// ============================================
// App - Главный файл приложения
// ============================================

import { DataManager } from "./dataManager.js";
import { StatsRenderer } from "./statsRenderer.js";
import { ChartManager } from "./chartManager.js";

class App {
  constructor() {
    this.dataManager = new DataManager();
    this.statsRenderer = new StatsRenderer(this.dataManager);
    this.chartManager = new ChartManager(this.dataManager);
    this.isLoggedIn = false;
    this.currentUser = null;
    this.userRole = null;

    this.init();
  }

  async init() {
    await this.dataManager.loadData();
    this.setupTheme();
    this.setupEventListeners();
    this.setupNavigation();
    this.setupAuth();
    this.renderAll();

    if (!this.dataManager.hasUsers()) {
      setTimeout(() => {
        this.openModal("firstAdminModal");
      }, 500);
    }

    window.app = this;
    console.log("🏆 GameStats Pro загружен!");
  }

  // ===== ТЕМА =====
  setupTheme() {
    const savedTheme = localStorage.getItem("gameStats_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.updateThemeButton(savedTheme);

    document.getElementById("themeToggle")?.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("gameStats_theme", newTheme);
      this.updateThemeButton(newTheme);
    });
  }

  updateThemeButton(theme) {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;

    if (theme === "dark") {
      btn.innerHTML = "☀️ Светлая тема";
      btn.className = "btn btn-outline";
    } else {
      btn.innerHTML = "🌙 Тёмная тема";
      btn.className = "btn btn-outline";
    }
  }

  renderAll() {
    this.statsRenderer.renderAll();
    this.chartManager.renderAll();
    this.renderDashboard();
    this.renderTopLosers();
    this.renderPlayersList();
    this.renderUsersList();
    this.renderGamesSettings();
    this.updateNavBadge();
    this.updateGameSelects();
    this.updatePlayerGameSelect();
  }

  renderDashboard() {
    const players = this.dataManager.getAllStats("all");
    const totalWins = players.reduce((sum, p) => sum + p.wins, 0);
    const totalLosses = players.reduce((sum, p) => sum + p.losses, 0);
    const totalGames = totalWins + totalLosses;

    document.getElementById("totalGames").textContent = totalGames;
    document.getElementById("totalPlayers").textContent = players.length;
    document.getElementById("totalWins").textContent = totalWins;

    const avgWR =
      players.length > 0
        ? (
            players.reduce((sum, p) => sum + p.winRate, 0) / players.length
          ).toFixed(1)
        : 0;
    document.getElementById("avgWinRate").textContent = avgWR + "%";

    const sorted = [...players].sort((a, b) => b.wins - a.wins);
    if (sorted.length > 0) {
      const mvp = sorted[0];
      document.getElementById("mvpName").textContent = mvp.name;
      document.getElementById("mvpWins").textContent = mvp.wins;
      document.getElementById("mvpRate").textContent = mvp.winRate + "%";
    } else {
      document.getElementById("mvpName").textContent = "Нет данных";
      document.getElementById("mvpWins").textContent = "0";
      document.getElementById("mvpRate").textContent = "0%";
    }
  }

  renderTopLosers() {
    const players = this.dataManager.getAllStats("all");
    const sorted = [...players].sort((a, b) => b.losses - a.losses).slice(0, 3);
    const container = document.getElementById("topLosers");

    if (!container) {
      console.warn("⚠️ Элемент topLosers не найден");
      return;
    }

    if (!sorted || sorted.length === 0) {
      container.innerHTML = '<div class="empty-state">Нет данных</div>';
      return;
    }

    const medals = ["🥇", "🥈", "🥉"];
    const rankClasses = ["gold", "silver", "bronze"];

    container.innerHTML = sorted
      .map(
        (p, i) => `
      <div class="top-player-item loser-item">
        <div class="top-player-rank ${rankClasses[i] || ""}">${medals[i]}</div>
        <div class="top-player-avatar" style="background: ${this.getColor(
          p.name
        )}">
          ${p.name.charAt(0).toUpperCase()}
        </div>
        <div class="top-player-info">
          <div class="top-player-name">${p.name}</div>
          <div class="top-player-stats">😵 ${p.losses} поражений • ${
          p.winRate
        }% WR</div>
        </div>
      </div>
    `
      )
      .join("");
  }

  renderPlayersList() {
    const players = this.dataManager.getPlayerNames();
    const container = document.getElementById("playersList");
    document.getElementById("playersCount").textContent =
      players.length + " игроков";

    if (!players || players.length === 0) {
      container.innerHTML = '<div class="empty-state">Нет игроков</div>';
      return;
    }

    container.innerHTML = players
      .map((name) => {
        const stats = this.dataManager.getPlayerStats(name, "all");
        return `
        <div class="player-list-item">
          <div class="player-list-avatar" style="background: ${this.getColor(
            name
          )}">
            ${name.charAt(0).toUpperCase()}
          </div>
          <div class="player-list-info">
            <div class="player-list-name">${name}</div>
            <div class="player-list-stats">🏆 ${
              stats?.totalWins || 0
            } побед • ${stats?.winRate || 0}% WR</div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  renderUsersList() {
    const container = document.getElementById("usersList");
    if (!container) return;

    const users = this.dataManager.getUsers();
    if (users.length === 0) {
      container.innerHTML = '<div class="empty-state">Нет пользователей</div>';
      return;
    }

    container.innerHTML = users
      .map(
        (user) => `
      <div class="user-list-item">
        <div class="user-list-info">
          <div class="user-list-name">${user.login}</div>
          <div class="user-list-role ${user.role}">${
          user.role === "admin" ? "👑 Администратор" : "👤 Пользователь"
        }</div>
        </div>
        ${
          user.login !== "admin"
            ? `
          <div class="user-list-actions">
            <button class="btn btn-sm btn-danger" onclick="window.app.deleteUser('${user.login}')">🗑️</button>
          </div>
        `
            : `
          <span style="color: var(--text-muted); font-size: 12px;">Главный админ</span>
        `
        }
      </div>
    `
      )
      .join("");
  }

  renderGamesSettings() {
    const container = document.getElementById("gamesSettingsList");
    if (!container) return;

    // Проверяем, что пользователь авторизован и админ
    const isAdmin = this.isLoggedIn && this.userRole === "admin";

    const gamesSettingsBlock = document.getElementById("gamesSettings");
    if (gamesSettingsBlock) {
      gamesSettingsBlock.style.display = isAdmin ? "block" : "none";
    }

    if (!isAdmin) {
      container.innerHTML =
        '<div class="empty-state">Только для администратора</div>';
      return;
    }

    const games = this.dataManager
      .getAvailableGames()
      .filter((g) => g !== "all" && g !== "Все игры");

    if (!games || games.length === 0) {
      container.innerHTML =
        '<div class="empty-state">Нет игр для настройки</div>';
      return;
    }

    let html = "";
    games.forEach((game) => {
      const currentSetting = this.dataManager.getGameSetting(game);

      html += `
      <div class="game-setting-item">
        <span class="game-setting-name">${game}</span>
        <select class="game-setting-select" data-game="${game}">
          <option value="wins" ${
            currentSetting === "wins" ? "selected" : ""
          }>🏆 Только победы</option>
          <option value="losses" ${
            currentSetting === "losses" ? "selected" : ""
          }>😵 Только поражения</option>
          <option value="both" ${
            currentSetting === "both" ? "selected" : ""
          }>⚖️ Победы и поражения</option>
        </select>
      </div>
    `;
    });

    container.innerHTML = html;

    container.querySelectorAll(".game-setting-select").forEach((select) => {
      select.addEventListener("change", async (e) => {
        const game = e.target.dataset.game;
        const value = e.target.value;
        await this.dataManager.setGameSetting(game, value);
        this.renderAll();
      });
    });
  }

  updateNavBadge() {
    const count = this.dataManager.getPlayerNames().length;
    const badge = document.getElementById("navPlayersCount");
    if (badge) badge.textContent = count;
  }

  setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const sections = {
      dashboard: document.getElementById("section-dashboard"),
      players: document.getElementById("section-players"),
      leaderboard: document.getElementById("section-leaderboard"),
      charts: document.getElementById("section-charts"),
      games: document.getElementById("section-games"),
      settings: document.getElementById("section-settings"),
    };
    const titles = {
      dashboard: "Главная",
      players: "Игроки",
      leaderboard: "Таблица лидеров",
      charts: "Визуализация",
      games: "Игры",
      settings: "Настройки",
    };

    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const section = item.dataset.section;

        navItems.forEach((n) => n.classList.remove("active"));
        item.classList.add("active");

        Object.entries(sections).forEach(([key, el]) => {
          if (el) el.classList.toggle("active", key === section);
        });

        document.getElementById("pageTitle").textContent =
          titles[section] || "Главная";

        document.querySelector(".sidebar-nav")?.classList.remove("open");

        if (section === "charts") {
          setTimeout(() => {
            this.chartManager.destroyAll();
            this.chartManager.renderAll();
          }, 100);
        }

        if (section === "settings") {
          this.renderUsersList();
          this.renderGamesSettings();
        }
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

  // ===== АВТОРИЗАЦИЯ =====
  setupAuth() {
    const loginBtn = document.getElementById("loginBtn");
    const loginSettingsBtn = document.getElementById("loginSettingsBtn");
    const logoutSettingsBtn = document.getElementById("logoutSettingsBtn");
    const saveLoginBtn = document.getElementById("saveLoginBtn");
    const closeLoginModal = document.getElementById("closeLoginModal");
    const cancelLoginModal = document.getElementById("cancelLoginModal");
    const addUserBtn = document.getElementById("addUserBtn");
    const saveUserBtn = document.getElementById("saveUserBtn");

    const showLogin = () => {
      document.getElementById("loginInput").value = "";
      document.getElementById("passwordInput").value = "";
      this.openModal("loginModal");
    };

    const login = () => {
      const loginInput = document.getElementById("loginInput").value.trim();
      const passwordInput = document
        .getElementById("passwordInput")
        .value.trim();

      const result = this.dataManager.checkLogin(loginInput, passwordInput);

      if (result.success) {
        this.isLoggedIn = true;
        this.currentUser = result.login;
        this.userRole = result.role;
        this.updateAuthUI();
        this.closeModal("loginModal");
        alert(`✅ Добро пожаловать, ${result.login}! (${result.role})`);
      } else {
        alert("❌ Неверный логин или пароль");
      }
    };

    const logout = () => {
      if (confirm("Вы уверены, что хотите выйти?")) {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.userRole = null;
        this.updateAuthUI();
        alert("👋 Вы вышли из системы");
      }
    };

    loginBtn?.addEventListener("click", () => {
      if (this.isLoggedIn) {
        logout();
      } else {
        showLogin();
      }
    });

    loginSettingsBtn?.addEventListener("click", showLogin);
    logoutSettingsBtn?.addEventListener("click", logout);
    saveLoginBtn?.addEventListener("click", login);
    closeLoginModal?.addEventListener("click", () =>
      this.closeModal("loginModal")
    );
    cancelLoginModal?.addEventListener("click", () =>
      this.closeModal("loginModal")
    );

    // Добавление пользователя
    addUserBtn?.addEventListener("click", () => {
      if (!this.isLoggedIn || this.userRole !== "admin") {
        alert("⚠️ Только администратор может добавлять пользователей");
        return;
      }
      this.openModal("addUserModal");
    });

    saveUserBtn?.addEventListener("click", async () => {
      const login = document.getElementById("newUserLogin")?.value.trim();
      const password = document.getElementById("newUserPassword")?.value.trim();
      const role = document.getElementById("newUserRole")?.value || "user";

      if (!login || !password || password.length < 3) {
        alert("Заполните все поля (пароль не менее 3 символов)");
        return;
      }

      const result = await this.dataManager.addUser(login, password, role);
      if (result) {
        alert("✅ Пользователь добавлен!");
        this.closeModal("addUserModal");
        document.getElementById("newUserLogin").value = "";
        document.getElementById("newUserPassword").value = "";
        this.renderUsersList();
      } else {
        alert("❌ Пользователь с таким логином уже существует");
      }
    });

    // Enter
    document.getElementById("loginInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("passwordInput")?.focus();
    });
    document
      .getElementById("passwordInput")
      ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") login();
      });

    this.updateAuthUI();
  }

  async deleteUser(login) {
    if (!this.isLoggedIn || this.userRole !== "admin") {
      alert("⚠️ Только администратор может удалять пользователей");
      return;
    }

    if (!confirm(`Удалить пользователя "${login}"?`)) return;

    const result = await this.dataManager.deleteUser(login);
    if (result) {
      alert("✅ Пользователь удалён");
      this.renderUsersList();
    }
  }

  updateAuthUI() {
    const status = document.getElementById("userStatus");
    const settingsStatus = document.getElementById("settingsUserStatus");
    const loginBtn = document.getElementById("loginBtn");
    const loginSettingsBtn = document.getElementById("loginSettingsBtn");
    const logoutSettingsBtn = document.getElementById("logoutSettingsBtn");
    const userManagement = document.getElementById("userManagement");
    const addUserBtn = document.getElementById("addUserBtn");
    const gamesSettings = document.getElementById("gamesSettings");

    if (this.isLoggedIn) {
      const roleText = this.userRole === "admin" ? "Админ" : "Пользователь";
      if (status) status.textContent = `👤 ${this.currentUser} (${roleText})`;
      if (settingsStatus)
        settingsStatus.textContent = `👤 Текущий статус: ${this.currentUser} (${roleText})`;
      if (loginBtn) loginBtn.textContent = "🚪 Выйти";
      if (loginSettingsBtn) loginSettingsBtn.style.display = "none";
      if (logoutSettingsBtn) logoutSettingsBtn.style.display = "inline-flex";

      if (userManagement) {
        userManagement.style.display =
          this.userRole === "admin" ? "block" : "none";
      }
      if (addUserBtn) {
        addUserBtn.style.display =
          this.userRole === "admin" ? "inline-flex" : "none";
      }
      if (gamesSettings) {
        gamesSettings.style.display =
          this.userRole === "admin" ? "block" : "none";
      }
    } else {
      if (status) status.textContent = "👤 Гость";
      if (settingsStatus)
        settingsStatus.textContent = "👤 Текущий статус: Гость";
      if (loginBtn) loginBtn.textContent = "🔑 Войти";
      if (loginSettingsBtn) loginSettingsBtn.style.display = "inline-flex";
      if (logoutSettingsBtn) logoutSettingsBtn.style.display = "none";
      if (userManagement) userManagement.style.display = "none";
      if (gamesSettings) gamesSettings.style.display = "none";
    }
    this.renderGamesSettings();
  }

  // ===== Методы для кнопок =====
  addWin(name, game = "Все игры") {
    if (!this.isLoggedIn) {
      alert("⚠️ Для редактирования необходимо войти");
      return;
    }
    if (this.dataManager.addWin(name, game)) {
      this.renderAll();
    } else {
      alert(`Ошибка: игрок "${name}" не найден`);
    }
  }

  addLoss(name, game = "Все игры") {
    if (!this.isLoggedIn) {
      alert("⚠️ Для редактирования необходимо войти");
      return;
    }
    if (this.dataManager.addLoss(name, game)) {
      this.renderAll();
    } else {
      alert(`Ошибка: игрок "${name}" не найден`);
    }
  }

  // ===== Обработчики событий =====
  setupEventListeners() {
    const filter = document.getElementById("gameFilter");
    if (filter) {
      filter.addEventListener("change", (e) => {
        this.statsRenderer.setFilter(e.target.value);
        this.chartManager.renderAll();
        document
          .querySelector('.nav-item[data-section="leaderboard"]')
          ?.click();
      });
    }

    document
      .getElementById("showAddPlayerModal")
      ?.addEventListener("click", () => {
        if (!this.isLoggedIn) {
          alert("⚠️ Для добавления игрока необходимо войти");
          return;
        }
        this.openModal("addPlayerModal");
        this.updatePlayerGameSelect();
      });

    document
      .getElementById("showAddGameModal")
      ?.addEventListener("click", () => {
        if (!this.isLoggedIn) {
          alert("⚠️ Для добавления игры необходимо войти");
          return;
        }
        this.openModal("addGameModal");
        this.updateGameSelects();
      });

    document
      .getElementById("closePlayerModal")
      ?.addEventListener("click", () => {
        this.closeModal("addPlayerModal");
      });
    document
      .getElementById("cancelPlayerModal")
      ?.addEventListener("click", () => {
        this.closeModal("addPlayerModal");
      });
    document.getElementById("closeGameModal")?.addEventListener("click", () => {
      this.closeModal("addGameModal");
    });
    document
      .getElementById("cancelGameModal")
      ?.addEventListener("click", () => {
        this.closeModal("addGameModal");
      });

    document.getElementById("savePlayerBtn")?.addEventListener("click", () => {
      if (!this.isLoggedIn) {
        alert("⚠️ Для редактирования необходимо войти");
        return;
      }

      const input = document.getElementById("playerNameInput");
      const name = input?.value.trim();
      if (!name) {
        alert("Введите имя игрока");
        return;
      }

      if (this.dataManager.data.players[name]) {
        alert("Игрок уже существует");
        return;
      }

      const game = document.getElementById("playerGameSelect")?.value || "";
      const wins =
        parseInt(document.getElementById("playerWinsInput")?.value) || 0;
      const losses =
        parseInt(document.getElementById("playerLossesInput")?.value) || 0;

      if (this.dataManager.addPlayer(name, game, wins, losses)) {
        this.renderAll();
        this.closeModal("addPlayerModal");
        if (input) input.value = "";
        const winsInput = document.getElementById("playerWinsInput");
        const lossesInput = document.getElementById("playerLossesInput");
        if (winsInput) winsInput.value = "0";
        if (lossesInput) lossesInput.value = "0";
      }
    });

    document.getElementById("saveGameBtn")?.addEventListener("click", () => {
      if (!this.isLoggedIn) {
        alert("⚠️ Для редактирования необходимо войти");
        return;
      }

      let game = document.getElementById("gameSelect")?.value || "";
      const newGame = document.getElementById("newGameInput")?.value.trim();
      if (newGame) game = newGame;

      const winner = document.getElementById("winnerSelect")?.value || "";
      const loser = document.getElementById("loserSelect")?.value || "";

      if (!game || !winner || !loser) {
        alert("Заполните все поля");
        return;
      }
      if (winner === loser) {
        alert("Победитель и проигравший должны быть разными");
        return;
      }

      if (this.dataManager.addGameResult(game, winner, loser)) {
        this.renderAll();
        this.closeModal("addGameModal");
        const winnerSelect = document.getElementById("winnerSelect");
        const loserSelect = document.getElementById("loserSelect");
        const newGameInput = document.getElementById("newGameInput");
        if (winnerSelect) winnerSelect.value = "";
        if (loserSelect) loserSelect.value = "";
        if (newGameInput) newGameInput.value = "";
      } else {
        alert("Ошибка добавления результата");
      }
    });

    document
      .getElementById("refreshChartsBtn")
      ?.addEventListener("click", () => {
        this.chartManager.destroyAll();
        this.chartManager.renderAll();
      });

    document.getElementById("exportDataBtn")?.addEventListener("click", () => {
      const data = this.dataManager.exportData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stats_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById("importDataBtn")?.addEventListener("click", () => {
      if (!this.isLoggedIn) {
        alert("⚠️ Для импорта данных необходимо войти");
        return;
      }
      document.getElementById("importFileInput")?.click();
    });

    document
      .getElementById("importFileInput")
      ?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          if (this.dataManager.importData(content)) {
            this.renderAll();
            alert("✅ Данные успешно импортированы");
          } else {
            alert("❌ Ошибка импорта данных");
          }
        };
        reader.readAsText(file);
        e.target.value = "";
      });

    document
      .getElementById("playerNameInput")
      ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          document.getElementById("savePlayerBtn")?.click();
        }
      });

    // Закрытие модалки добавления пользователя
    document.getElementById("closeUserModal")?.addEventListener("click", () => {
      this.closeModal("addUserModal");
    });
    document
      .getElementById("cancelUserModal")
      ?.addEventListener("click", () => {
        this.closeModal("addUserModal");
      });

    // Закрытие модалки логина по клику вне
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("active");
        }
      });
    });

    // Создание первого администратора
    document
      .getElementById("createFirstAdminBtn")
      ?.addEventListener("click", async () => {
        const login = document.getElementById("firstAdminLogin")?.value.trim();
        const password = document
          .getElementById("firstAdminPassword")
          ?.value.trim();
        const confirm = document
          .getElementById("firstAdminPasswordConfirm")
          ?.value.trim();

        if (!login || login.length < 3) {
          alert("❌ Логин должен быть не менее 3 символов");
          return;
        }

        if (!password || password.length < 3) {
          alert("❌ Пароль должен быть не менее 3 символов");
          return;
        }

        if (password !== confirm) {
          alert("❌ Пароли не совпадают");
          return;
        }

        const users = this.dataManager.getUsers();
        if (users.some((u) => u.login === login)) {
          alert("❌ Такой логин уже существует");
          return;
        }

        const result = await this.dataManager.addUser(login, password, "admin");
        if (result) {
          alert("✅ Администратор создан! Теперь вы можете войти.");
          this.closeModal("firstAdminModal");

          const loginResult = this.dataManager.checkLogin(login, password);
          if (loginResult.success) {
            this.isLoggedIn = true;
            this.currentUser = loginResult.login;
            this.userRole = loginResult.role;
            this.updateAuthUI();
            this.renderAll();
            alert(`✅ Добро пожаловать, ${login}!`);
          }
        } else {
          alert("❌ Ошибка создания администратора");
        }
      });

    // Enter в полях создания первого админа
    document
      .getElementById("firstAdminLogin")
      ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter")
          document.getElementById("firstAdminPassword")?.focus();
      });
    document
      .getElementById("firstAdminPassword")
      ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter")
          document.getElementById("firstAdminPasswordConfirm")?.focus();
      });
    document
      .getElementById("firstAdminPasswordConfirm")
      ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter")
          document.getElementById("createFirstAdminBtn")?.click();
      });
  }

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add("active");
  }

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove("active");
  }

  updateGameSelects() {
    const players = this.dataManager.getPlayerNames();
    const winnerSelect = document.getElementById("winnerSelect");
    const loserSelect = document.getElementById("loserSelect");

    if (!winnerSelect || !loserSelect) return;

    const currentWinner = winnerSelect.value;
    const currentLoser = loserSelect.value;

    winnerSelect.innerHTML = '<option value="">-- выберите --</option>';
    loserSelect.innerHTML = '<option value="">-- выберите --</option>';

    players.forEach((p) => {
      winnerSelect.innerHTML += `<option value="${p}">${p}</option>`;
      loserSelect.innerHTML += `<option value="${p}">${p}</option>`;
    });

    if (players.includes(currentWinner)) winnerSelect.value = currentWinner;
    if (players.includes(currentLoser)) loserSelect.value = currentLoser;
  }

  updatePlayerGameSelect() {
    const select = document.getElementById("playerGameSelect");
    if (!select) return;

    const games = this.dataManager
      .getAvailableGames()
      .filter((g) => g !== "all");

    select.innerHTML = '<option value="">-- без статистики --</option>';
    games.forEach((game) => {
      select.innerHTML += `<option value="${game}">${game}</option>`;
    });
  }

  getColor(name) {
    if (!name) return "#4f8cff";
    const colors = [
      "#4f8cff",
      "#22c55e",
      "#ef4444",
      "#f59e0b",
      "#8b5cf6",
      "#06b6d4",
      "#ec4899",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
