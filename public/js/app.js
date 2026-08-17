import { StorageManager } from "./storage/storage-manager.js";
import { GroupManager } from "./storage/group-manager.js";
import { StatsRenderer } from "./renderers/stats-renderer.js";
import { ChartManager } from "./charts/chart-manager.js";
import { ArcadeManager } from "./arcade/arcade-manager.js";
import { AppAuth } from "./core/app-auth.js";
import { AppNavigation } from "./core/app-navigation.js";
import { AppTheme } from "./core/app-theme.js";
import { AppModals } from "./core/app-modals.js";
import { ColorUtils } from "./utils/color-utils.js";

class App {
  constructor() {
    this.storageManager = new StorageManager();
    this.groupManager = new GroupManager(this.storageManager);
    this.statsRenderer = new StatsRenderer(this.storageManager);
    this.chartManager = new ChartManager(this.storageManager);
    this.arcadeManager = new ArcadeManager(this.storageManager);
    this.theme = new AppTheme();
    this.navigation = new AppNavigation();
    this.auth = new AppAuth(this.storageManager);
    this.modals = new AppModals();
    this.colorUtils = new ColorUtils();

    this.isLoggedIn = false;
    this.currentUser = null;
    this.userRole = null;
    this.arcadeActive = false;

    this.init();
  }

  async init() {
    await this.storageManager.loadData();
    await this.groupManager.loadGroups();

    this.auth.setApp(this);
    this.auth.checkSession();

    this.theme.setup();
    this.setupEventListeners();
    this.navigation.setup(this);
    this.auth.setup();

    // ===== ПРОВЕРКА ГРУППЫ =====
    if (this.isLoggedIn) {
      const isInGroup = this.groupManager.isUserInGroup(this.currentUser);
      if (!isInGroup) {
        this.showWelcomeScreen();
      } else {
        this.renderAll();
      }
    } else {
      this.renderAll();
    }

    if (!this.storageManager.hasUsers()) {
      setTimeout(() => this.modals.open("firstAdminModal"), 500);
    }

    window.app = this;
    console.log("🏆 GameStats Pro загружен!");

    setTimeout(() => this.arcadeManager.renderLeaderboard(), 1000);
  }

  showWelcomeScreen() {
    // Скрываем все секции
    const sections = document.querySelectorAll(".section");
    sections.forEach((s) => {
      if (s.id !== "section-welcome") {
        s.classList.remove("active");
      }
    });

    // Создаём welcome если его нет
    let welcome = document.getElementById("section-welcome");
    if (!welcome) {
      welcome = document.createElement("section");
      welcome.id = "section-welcome";
      welcome.className = "section active";
      welcome.innerHTML = `
      <div class="welcome-container" style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <!-- Приветствие -->
        <div style="text-align: center; padding: 30px 20px; background: #1a1a2e; border-radius: 16px; border: 1px solid #2a2a4a; margin-bottom: 24px;">
          <h1 style="font-size: 32px; margin-bottom: 12px;">🎮 Добро пожаловать в GameStats Pro!</h1>
          <p style="color: var(--text-secondary); font-size: 18px; margin-bottom: 20px;">
            Вы ещё не состоите ни в одной группе. Создайте группу или вступите в существующую.
          </p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary btn-lg" id="createGroupBtn" style="font-size: 16px; padding: 12px 28px;">
              ➕ Создать группу
            </button>
            <button class="btn btn-outline btn-lg" id="joinGroupBtn" style="font-size: 16px; padding: 12px 28px;">
              🔑 Вступить в группу
            </button>
          </div>
        </div>

        <div style="background: #1a1a2e; border-radius: 16px; padding: 20px; border: 1px solid #2a2a4a; margin-bottom: 24px;">
          <h3 style="color: var(--text-secondary); margin-bottom: 16px; font-size: 18px;">📋 Доступные группы</h3>
          <div id="availableGroups"></div>
        </div>

        <div style="background: #1a1a2e; border-radius: 16px; padding: 20px; border: 1px solid #2a2a4a;">
          <h3 style="color: var(--text-secondary); margin-bottom: 16px; font-size: 18px;">🕹️ Рейтинг аркад</h3>
          <div id="welcomeArcadeContent"></div>
        </div>
      </div>
    `;
      document.querySelector(".sections-wrapper").appendChild(welcome);

      document
        .getElementById("createGroupBtn")
        ?.addEventListener("click", () => {
          this.openCreateGroupModal();
        });

      document.getElementById("joinGroupBtn")?.addEventListener("click", () => {
        this.openJoinGroupModal();
      });

      this.renderWelcomeArcadeLeaderboard();
    }

    welcome.classList.add("active");
    document.getElementById("pageTitle").textContent = "🏠 Добро пожаловать";
    this.renderAvailableGroups();
  }

  renderWelcomeArcadeLeaderboard() {
    const container = document.getElementById("welcomeArcadeContent");
    if (!container) return;

    const arcade = this.storageManager.getArcadeData();
    const games = [
      { id: "memory", label: "🎴 Память", icon: "🧠" },
      { id: "yahtzee", label: "🎲 Ятзи", icon: "🎲" },
    ];

    let html = "";
    games.forEach((game) => {
      const records = this.storageManager.getArcadeLeaderboard(game.id);
      const gamesPlayed = arcade[game.id]?.gamesPlayed || 0;
      const bestScore =
        records.length > 0
          ? Math.max(...records.map((r) => r.bestScore || 0))
          : 0;

      // Строим таблицу рекордов
      let recordsHtml = "";
      if (records.length > 0) {
        recordsHtml = `
        <div style="margin-top: 8px;">
          ${records
            .slice(0, 5)
            .map((r, i) => {
              const medal =
                i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
              const rankClass =
                i === 0
                  ? "rank-1"
                  : i === 1
                  ? "rank-2"
                  : i === 2
                  ? "rank-3"
                  : "";
              return `
              <div style="display: flex; align-items: center; gap: 8px; padding: 4px 8px; background: #22223a; border-radius: 6px; margin-bottom: 2px;">
                <span style="font-size: 14px; min-width: 30px; text-align: center;">${medal}</span>
                <span style="font-weight: 500; flex: 1;">${r.player}</span>
                <span style="color: #f59e0b; font-weight: 600;">⭐ ${r.totalScore}</span>
                <span style="color: #94a3b8; font-size: 12px;">🎯 ${r.gamesPlayed}</span>
              </div>
            `;
            })
            .join("")}
        </div>
      `;
      } else {
        recordsHtml =
          '<div style="color: #94a3b8; text-align: center; padding: 16px;">Нет рекордов</div>';
      }

      html += `
      <div style="background: #22223a; border-radius: 10px; padding: 12px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600; font-size: 16px;">${game.icon} ${game.label}</span>
          <span style="font-size: 12px; color: #94a3b8;">🎮 ${gamesPlayed} игр | 🏆 ${bestScore}</span>
        </div>
        ${recordsHtml}
      </div>
    `;
    });

    container.innerHTML =
      html ||
      '<div style="text-align: center; padding: 20px; color: #94a3b8;">Нет данных по аркадам</div>';
  }

  renderAvailableGroups() {
    const container = document.getElementById("availableGroups");
    if (!container) return;

    const groups = this.groupManager.groups;
    const currentUser = this.currentUser;

    let html = "";
    for (const id in groups) {
      const group = groups[id];
      const isMember = group.members && group.members.includes(currentUser);

      html += `
      <div style="background: #22223a; border: 1px solid #2a2a4a; border-radius: 10px; padding: 12px 16px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600; font-size: 16px; color: #e2e8f0;">${
            group.name
          }</div>
          <div style="color: #94a3b8; font-size: 12px;">👥 ${
            group.members ? group.members.length : 0
          } участников</div>
          <div style="color: #64748b; font-size: 11px;">Создана: ${
            group.createdBy
          }</div>
        </div>
        ${
          isMember
            ? '<span style="color: #22c55e; font-weight: 600;">✅ Вы в группе</span>'
            : ""
        }
      </div>
    `;
    }

    if (!html) {
      html =
        '<div style="color: #94a3b8; text-align: center; padding: 20px;">Нет доступных групп</div>';
    }
    container.innerHTML = html;
  }

  // ===== МОДАЛКИ ГРУПП =====
  openCreateGroupModal() {
    document.getElementById("groupNameInput").value = "";
    document.getElementById("groupPasswordInput").value = "";
    this.modals.open("createGroupModal");
  }

  openJoinGroupModal() {
    document.getElementById("joinGroupNameInput").value = "";
    document.getElementById("joinGroupPasswordInput").value = "";
    this.modals.open("joinGroupModal");
  }

  async createGroup() {
    const name = document.getElementById("groupNameInput").value.trim();
    const password = document.getElementById("groupPasswordInput").value.trim();

    if (!name) {
      alert("⚠️ Введите название группы");
      return;
    }
    if (!password || password.length < 3) {
      alert("⚠️ Пароль должен быть не менее 3 символов");
      return;
    }

    const result = await this.groupManager.createGroup(
      name,
      password,
      this.currentUser
    );
    if (result) {
      alert("✅ Группа создана!");
      this.modals.close("createGroupModal");
      location.reload();
    } else {
      alert("❌ Ошибка создания группы");
    }
  }

  async joinGroup() {
    const name = document.getElementById("joinGroupNameInput").value.trim();
    const password = document
      .getElementById("joinGroupPasswordInput")
      .value.trim();

    if (!name) {
      alert("⚠️ Введите название группы");
      return;
    }
    if (!password) {
      alert("⚠️ Введите пароль");
      return;
    }

    let groupId = null;
    for (const id in this.groupManager.groups) {
      if (this.groupManager.groups[id].name === name) {
        groupId = id;
        break;
      }
    }

    if (!groupId) {
      alert("❌ Группа не найдена");
      return;
    }

    const result = await this.groupManager.joinGroup(
      groupId,
      password,
      this.currentUser
    );
    if (result.success) {
      alert("✅ Вы вступили в группу!");
      this.modals.close("joinGroupModal");
      location.reload();
    } else {
      alert(`❌ ${result.error || "Ошибка вступления"}`);
    }
  }

  renderAll() {
    // Проверяем, в группе ли пользователь
    const isInGroup =
      this.isLoggedIn && this.groupManager?.isUserInGroup(this.currentUser);

    if (!isInGroup) {
      // Если не в группе, показываем welcome с аркадами
      this.showWelcomeScreen();
      // Рендерим только аркады
      this.arcadeManager.renderGames();
      this.arcadeManager.renderLeaderboard();
      return;
    }

    // Полный рендеринг для тех, кто в группе
    this.statsRenderer.renderAll();
    this.chartManager.renderAll();
    this.renderDashboard();
    this.renderTopLosers();
    this.renderPlayersList();
    this.renderUsersList();
    this.renderGamesSettings();
    this.arcadeManager.renderGames();
    this.arcadeManager.renderLeaderboard();
    this.updateNavBadge();
    this.updateGameSelects();
    this.updatePlayerGameSelect();
  }

  renderDashboard() {
    const groupId = this.groupManager.getUserGroup(this.currentUser);
    if (!groupId) {
      // Если нет группы, показываем пустой дашборд
      this.showWelcomeScreen();
      return;
    }

    const players = this.groupManager.getGroupStats(groupId);
    const totalWins = players.reduce((sum, p) => sum + p.wins, 0);

    let totalGames = 0;
    const games = this.groupManager
      .getGroupAvailableGames(groupId)
      .filter((g) => g !== "all" && g !== "Все игры");

    games.forEach((game) => {
      const gameSetting = this.groupManager.getGroupGameSetting(groupId, game);
      let wins = 0,
        losses = 0;
      const groupData = this.groupManager.getGroupData(groupId);
      const groupPlayers = groupData?.players || {};

      for (const name in groupPlayers) {
        const gameStats = groupPlayers[name]?.games?.[game];
        if (gameStats) {
          wins += gameStats.wins || 0;
          losses += gameStats.losses || 0;
        }
      }

      let gameTotal = 0;
      if (gameSetting === "wins") gameTotal = wins;
      else if (gameSetting === "losses") gameTotal = losses;
      else gameTotal = Math.floor((wins + losses) / 2);
      totalGames += gameTotal;
    });

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
    const groupId = this.groupManager.getUserGroup(this.currentUser);
    if (!groupId) return;

    const players = this.groupManager.getGroupStats(groupId);
    const sorted = [...players].sort((a, b) => b.losses - a.losses).slice(0, 3);
    const container = document.getElementById("topLosers");
    if (!container) return;

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
      <div class="top-player-avatar" style="background: ${this.colorUtils.get(
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
    const groupId = this.groupManager.getUserGroup(this.currentUser);
    if (!groupId) return;

    const groupData = this.groupManager.getGroupData(groupId);
    const players = Object.keys(groupData?.players || {});
    const container = document.getElementById("playersList");
    document.getElementById("playersCount").textContent =
      players.length + " игроков";

    if (!players || players.length === 0) {
      container.innerHTML = '<div class="empty-state">Нет игроков</div>';
      return;
    }

    container.innerHTML = players
      .map((name) => {
        const stats = this.groupManager.getGroupPlayerStats(groupId, name);
        return `
      <div class="player-list-item">
        <div class="player-list-avatar" style="background: ${this.colorUtils.get(
          name
        )}">
          ${name.charAt(0).toUpperCase()}
        </div>
        <div class="player-list-info">
          <div class="player-list-name">${name}</div>
          <div class="player-list-stats">🏆 ${stats?.totalWins || 0} побед • ${
          stats?.winRate || 0
        }% WR</div>
        </div>
      </div>
    `;
      })
      .join("");
  }

  renderUsersList() {
    const container = document.getElementById("usersList");
    if (!container) return;

    const users = this.storageManager.getUsers();
    if (users.length === 0) {
      container.innerHTML = '<div class="empty-state">Нет пользователей</div>';
      return;
    }

    container.innerHTML = users
      .map(
        (user) => `
      <div class="user-list-item">
        <div class="user-list-info">
          <div class="user-list-name">${user.displayName || user.login}</div>
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
            : `<span style="color: var(--text-muted); font-size: 12px;">Главный админ</span>`
        }
      </div>
    `
      )
      .join("");
  }

  renderGamesSettings() {
    const container = document.getElementById("gamesSettingsList");
    if (!container) return;

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

    const groupId = this.groupManager.getUserGroup(this.currentUser);
    if (!groupId) {
      container.innerHTML = '<div class="empty-state">Нет группы</div>';
      return;
    }

    const games = this.groupManager
      .getGroupAvailableGames(groupId)
      .filter((g) => g !== "all" && g !== "Все игры");

    if (!games || games.length === 0) {
      container.innerHTML =
        '<div class="empty-state">Нет игр для настройки</div>';
      return;
    }

    const groupData = this.groupManager.getGroupData(groupId);
    let html = "";
    games.forEach((game) => {
      const currentSetting = this.groupManager.getGroupGameSetting(
        groupId,
        game
      );
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
        const groupData = this.groupManager.getGroupData(groupId);
        if (!groupData.gameSettings) groupData.gameSettings = {};
        groupData.gameSettings[game] = value;
        await this.groupManager.updateGroup(groupId, groupData);
        this.renderAll();
      });
    });
  }

  updateNavBadge() {
    const groupId = this.groupManager.getUserGroup(this.currentUser);
    if (!groupId) return;

    const count = this.groupManager.getGroupPlayerNames(groupId).length;
    const badge = document.getElementById("navPlayersCount");
    if (badge) badge.textContent = count;
  }

  updateGameSelects() {
    const groupId = this.groupManager.getUserGroup(this.currentUser);
    if (!groupId) return;

    const players = this.groupManager.getGroupPlayerNames(groupId);
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
    const groupId = this.groupManager.getUserGroup(this.currentUser);
    if (!groupId) return;

    const select = document.getElementById("playerGameSelect");
    if (!select) return;

    const games = this.groupManager
      .getGroupAvailableGames(groupId)
      .filter((g) => g !== "all");
    select.innerHTML = '<option value="">-- без статистики --</option>';
    games.forEach((game) => {
      select.innerHTML += `<option value="${game}">${game}</option>`;
    });
  }

  updateAuthUI() {
    const status = document.getElementById("userStatus");
    const settingsStatus = document.getElementById("settingsUserStatus");
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");
    const loginSettingsBtn = document.getElementById("loginSettingsBtn");
    const logoutSettingsBtn = document.getElementById("logoutSettingsBtn");
    const userManagement = document.getElementById("userManagement");
    const addUserBtn = document.getElementById("addUserBtn");
    const gamesSettings = document.getElementById("gamesSettings");

    if (this.isLoggedIn) {
      this.storageManager.currentUser = this.currentUser;
    } else {
      this.storageManager.currentUser = null;
    }

    if (this.isLoggedIn) {
      const userData = this.storageManager.getUserData(this.currentUser);
      const displayName = userData?.displayName || this.currentUser;
      const roleText = this.userRole === "admin" ? "Админ" : "Пользователь";

      if (status) status.textContent = `👤 ${displayName} (${roleText})`;
      if (settingsStatus)
        settingsStatus.textContent = `👤 Текущий статус: ${displayName} (${roleText})`;
      if (loginBtn) loginBtn.textContent = "👤 Профиль";
      if (registerBtn) registerBtn.style.display = "none";
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
      if (status) status.textContent = "👤 Гость (кликните для входа)";
      if (settingsStatus)
        settingsStatus.textContent = "👤 Текущий статус: Гость";
      if (loginBtn) loginBtn.textContent = "🔑 Войти";
      if (registerBtn) registerBtn.style.display = "inline-flex";
      if (loginSettingsBtn) loginSettingsBtn.style.display = "inline-flex";
      if (logoutSettingsBtn) logoutSettingsBtn.style.display = "none";
      if (userManagement) userManagement.style.display = "none";
      if (gamesSettings) gamesSettings.style.display = "none";
    }
    this.renderGamesSettings();
    this.navigation.updateNavVisibility();
  }

  // ===== ПРОФИЛЬ =====
  openProfile() {
    if (!this.isLoggedIn) {
      this.modals.open("loginModal");
      return;
    }

    const userData = this.storageManager.getUserData(this.currentUser);
    if (userData) {
      document.getElementById("profileDisplayName").textContent =
        userData.displayName || this.currentUser;
      document.getElementById("profileLogin").textContent = this.currentUser;
      document.getElementById("profileRole").textContent =
        userData.role === "admin" ? "👑 Администратор" : "👤 Пользователь";
      document.getElementById("profileAvatar").textContent =
        userData.role === "admin" ? "👑" : "👤";
      document.getElementById("profileNameInput").value =
        userData.displayName || "";
      document.getElementById("profileLoginInput").value = this.currentUser;
      document.getElementById("profilePasswordInput").value = "";
      document.getElementById("profilePasswordConfirm").value = "";
      this.modals.open("profileModal");
    }
  }

  async saveProfile() {
    const name = document.getElementById("profileNameInput").value.trim();
    const password = document.getElementById("profilePasswordInput").value;
    const confirm = document.getElementById("profilePasswordConfirm").value;

    if (!name) {
      alert("⚠️ Введите имя");
      return;
    }

    if (password && password.length < 3) {
      alert("⚠️ Пароль должен быть не менее 3 символов");
      return;
    }

    if (password && password !== confirm) {
      alert("⚠️ Пароли не совпадают");
      return;
    }

    const newData = { displayName: name };
    if (password) newData.password = password;

    const result = await this.storageManager.updateUser(
      this.currentUser,
      newData
    );
    if (result) {
      alert("✅ Профиль обновлён!");
      this.modals.close("profileModal");
      this.updateAuthUI();
    } else {
      alert("❌ Ошибка обновления профиля");
    }
  }

  // ===== РЕГИСТРАЦИЯ =====
  openRegister() {
    document.getElementById("registerName").value = "";
    document.getElementById("registerLogin").value = "";
    document.getElementById("registerPassword").value = "";
    document.getElementById("registerPasswordConfirm").value = "";
    this.modals.open("registerModal");
  }

  async registerUser() {
    const name = document.getElementById("registerName").value.trim();
    const login = document.getElementById("registerLogin").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirm = document.getElementById("registerPasswordConfirm").value;

    if (!name) {
      alert("⚠️ Введите ваше имя");
      return;
    }
    if (!login || login.length < 3) {
      alert("⚠️ Логин должен быть не менее 3 символов");
      return;
    }
    if (!password || password.length < 3) {
      alert("⚠️ Пароль должен быть не менее 3 символов");
      return;
    }
    if (password !== confirm) {
      alert("⚠️ Пароли не совпадают");
      return;
    }

    const result = await this.storageManager.registerUser(
      login,
      password,
      name
    );
    if (result) {
      alert("✅ Аккаунт создан! Теперь вы можете войти.");
      this.modals.close("registerModal");

      const loginResult = this.storageManager.checkLogin(login, password);
      if (loginResult.success) {
        this.isLoggedIn = true;
        this.currentUser = loginResult.login;
        this.userRole = loginResult.role;
        this.storageManager.currentUser = loginResult.login;

        localStorage.setItem(
          "gameStats_session",
          JSON.stringify({
            login: loginResult.login,
            role: loginResult.role,
            timestamp: Date.now(),
          })
        );

        this.updateAuthUI();
        this.renderAll();
        alert(`👋 Добро пожаловать, ${loginResult.login}!`);
      }
    } else {
      alert("❌ Пользователь с таким логином уже существует");
    }
  }

  // Методы для кнопок
  async addWin(name, game = "Все игры") {
    if (!this.isLoggedIn) {
      alert("⚠️ Для редактирования необходимо войти");
      return;
    }

    const groupId = this.groupManager.getUserGroup(this.currentUser);
    if (!groupId) {
      alert("⚠️ Вы не состоите в группе");
      return;
    }

    const groupData = this.groupManager.getGroupData(groupId);
    if (!groupData) return;

    if (!groupData.players[name]) {
      alert(`Ошибка: игрок "${name}" не найден`);
      return;
    }

    if (!groupData.players[name].games) {
      groupData.players[name].games = {};
    }
    if (!groupData.players[name].games[game]) {
      groupData.players[name].games[game] = { wins: 0, losses: 0 };
    }

    groupData.players[name].games[game].wins++;

    await this.groupManager.updateGroup(groupId, groupData);
    this.renderAll();
  }

  async addLoss(name, game = "Все игры") {
    if (!this.isLoggedIn) {
      alert("⚠️ Для редактирования необходимо войти");
      return;
    }

    const groupId = this.groupManager.getUserGroup(this.currentUser);
    if (!groupId) {
      alert("⚠️ Вы не состоите в группе");
      return;
    }

    const groupData = this.groupManager.getGroupData(groupId);
    if (!groupData) return;

    if (!groupData.players[name]) {
      alert(`Ошибка: игрок "${name}" не найден`);
      return;
    }

    if (!groupData.players[name].games) {
      groupData.players[name].games = {};
    }
    if (!groupData.players[name].games[game]) {
      groupData.players[name].games[game] = { wins: 0, losses: 0 };
    }

    groupData.players[name].games[game].losses++;

    await this.groupManager.updateGroup(groupId, groupData);
    this.renderAll();
  }

  deleteUser(login) {
    this.auth.deleteUser(login);
  }

  setupEventListeners() {
    // Фильтр
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

    // Кнопки модалок
    document
      .getElementById("showAddPlayerModal")
      ?.addEventListener("click", () => {
        if (!this.isLoggedIn) {
          alert("⚠️ Для добавления игрока необходимо войти");
          return;
        }
        this.modals.open("addPlayerModal");
        this.updatePlayerGameSelect();
      });

    document
      .getElementById("showAddGameModal")
      ?.addEventListener("click", () => {
        if (!this.isLoggedIn) {
          alert("⚠️ Для добавления игры необходимо войти");
          return;
        }
        this.modals.open("addGameModal");
        this.updateGameSelects();
      });

    // Сохранение игрока
    // Сохранение игрока
    document
      .getElementById("savePlayerBtn")
      ?.addEventListener("click", async () => {
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

        const groupId = this.groupManager.getUserGroup(this.currentUser);
        if (!groupId) {
          alert("⚠️ Вы не состоите в группе");
          return;
        }

        const groupData = this.groupManager.getGroupData(groupId);

        // Проверяем, есть ли уже такой игрок в группе
        if (groupData.players && groupData.players[name]) {
          alert("Игрок уже существует в группе");
          return;
        }

        const game = document.getElementById("playerGameSelect")?.value || "";
        const wins =
          parseInt(document.getElementById("playerWinsInput")?.value) || 0;
        const losses =
          parseInt(document.getElementById("playerLossesInput")?.value) || 0;

        // Добавляем игрока в группу
        if (!groupData.players) groupData.players = {};
        groupData.players[name] = { games: {} };

        if (game && (wins > 0 || losses > 0)) {
          groupData.players[name].games[game] = { wins, losses };
        }

        await this.groupManager.updateGroup(groupId, groupData);
        this.renderAll();
        this.modals.close("addPlayerModal");
        if (input) input.value = "";
        const winsInput = document.getElementById("playerWinsInput");
        const lossesInput = document.getElementById("playerLossesInput");
        if (winsInput) winsInput.value = "0";
        if (lossesInput) lossesInput.value = "0";
      });

    // Сохранение игры
    // Сохранение игры
    document
      .getElementById("saveGameBtn")
      ?.addEventListener("click", async () => {
        if (!this.isLoggedIn) {
          alert("⚠️ Для редактирования необходимо войти");
          return;
        }

        const groupId = this.groupManager.getUserGroup(this.currentUser);
        if (!groupId) {
          alert("⚠️ Вы не состоите в группе");
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

        const groupData = this.groupManager.getGroupData(groupId);

        // Проверяем, что игроки существуют в группе
        if (
          !groupData.players ||
          !groupData.players[winner] ||
          !groupData.players[loser]
        ) {
          alert("Один из игроков не найден в группе");
          return;
        }

        // Добавляем победу победителю
        if (!groupData.players[winner].games)
          groupData.players[winner].games = {};
        if (!groupData.players[winner].games[game]) {
          groupData.players[winner].games[game] = { wins: 0, losses: 0 };
        }
        groupData.players[winner].games[game].wins++;

        // Добавляем поражение проигравшему
        if (!groupData.players[loser].games)
          groupData.players[loser].games = {};
        if (!groupData.players[loser].games[game]) {
          groupData.players[loser].games[game] = { wins: 0, losses: 0 };
        }
        groupData.players[loser].games[game].losses++;

        await this.groupManager.updateGroup(groupId, groupData);
        this.renderAll();
        this.modals.close("addGameModal");

        const winnerSelect = document.getElementById("winnerSelect");
        const loserSelect = document.getElementById("loserSelect");
        const newGameInput = document.getElementById("newGameInput");
        if (winnerSelect) winnerSelect.value = "";
        if (loserSelect) loserSelect.value = "";
        if (newGameInput) newGameInput.value = "";
      });

    // Обновление графиков
    document
      .getElementById("refreshChartsBtn")
      ?.addEventListener("click", () => {
        this.chartManager.destroyAll();
        this.chartManager.renderAll();
      });

    // Экспорт/Импорт
    document.getElementById("exportDataBtn")?.addEventListener("click", () => {
      const data = this.storageManager.exportData();
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
          if (this.storageManager.importData(content)) {
            this.renderAll();
            alert("✅ Данные успешно импортированы");
          } else {
            alert("❌ Ошибка импорта данных");
          }
        };
        reader.readAsText(file);
        e.target.value = "";
      });

    // Enter
    document
      .getElementById("playerNameInput")
      ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter")
          document.getElementById("savePlayerBtn")?.click();
      });
    document.getElementById("loginInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("passwordInput")?.focus();
    });
    document
      .getElementById("passwordInput")
      ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.auth.handleLogin();
      });

    // ===== РЕГИСТРАЦИЯ =====
    document.getElementById("registerBtn")?.addEventListener("click", () => {
      this.openRegister();
    });

    document
      .getElementById("saveRegisterBtn")
      ?.addEventListener("click", () => {
        this.registerUser();
      });

    document
      .getElementById("cancelRegisterModal")
      ?.addEventListener("click", () => {
        this.modals.close("registerModal");
      });

    document
      .getElementById("closeRegisterModal")
      ?.addEventListener("click", () => {
        this.modals.close("registerModal");
      });

    // Enter в регистрации
    document
      .getElementById("registerName")
      ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter")
          document.getElementById("registerLogin")?.focus();
      });
    document
      .getElementById("registerLogin")
      ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter")
          document.getElementById("registerPassword")?.focus();
      });
    document
      .getElementById("registerPassword")
      ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter")
          document.getElementById("registerPasswordConfirm")?.focus();
      });
    document
      .getElementById("registerPasswordConfirm")
      ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter")
          document.getElementById("saveRegisterBtn")?.click();
      });

    // ===== ПРОФИЛЬ =====
    document.getElementById("saveProfileBtn")?.addEventListener("click", () => {
      this.saveProfile();
    });

    document
      .getElementById("cancelProfileModal")
      ?.addEventListener("click", () => {
        this.modals.close("profileModal");
      });

    document
      .getElementById("closeProfileModal")
      ?.addEventListener("click", () => {
        this.modals.close("profileModal");
      });

    document
      .getElementById("profileLogoutBtn")
      ?.addEventListener("click", () => {
        this.modals.close("profileModal");
        this.auth.handleLogout();
      });

    // Клик по статусу пользователя для открытия профиля
    document.getElementById("userStatus")?.addEventListener("click", () => {
      this.openProfile();
    });

    // Закрытие модалок
    this.modals.setupClosers();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
