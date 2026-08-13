export class AppAuth {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.app = null;
  }

  setApp(app) {
    this.app = app;
  }

  checkSession() {
    const sessionData = localStorage.getItem("gameStats_session");
    if (!sessionData) return;

    try {
      const session = JSON.parse(sessionData);
      const { login, role, timestamp } = session;

      const daysSinceLogin = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
      if (daysSinceLogin > 7) {
        localStorage.removeItem("gameStats_session");
        console.log("⏰ Сессия истекла (7 дней)");
        return;
      }

      const users = this.dataManager.getUsers();
      const userExists = users.some((u) => u.login === login);

      if (userExists) {
        this.app.isLoggedIn = true;
        this.app.currentUser = login;
        this.app.userRole = role;
        this.app.updateAuthUI();
        console.log(`🔐 Автоматический вход: ${login} (${role})`);
      } else {
        localStorage.removeItem("gameStats_session");
        console.log("🗑️ Сессия очищена (пользователь не найден)");
      }
    } catch (e) {
      console.warn("Ошибка проверки сессии:", e);
      localStorage.removeItem("gameStats_session");
    }
  }

  setup() {
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
      this.app.modals.open("loginModal");
    };

    const login = this.handleLogin.bind(this);

    loginBtn?.addEventListener("click", () => {
      if (this.app.isLoggedIn) {
        this.handleLogout();
      } else {
        showLogin();
      }
    });

    loginSettingsBtn?.addEventListener("click", showLogin);
    logoutSettingsBtn?.addEventListener("click", this.handleLogout.bind(this));
    saveLoginBtn?.addEventListener("click", login);
    closeLoginModal?.addEventListener("click", () =>
      this.app.modals.close("loginModal")
    );
    cancelLoginModal?.addEventListener("click", () =>
      this.app.modals.close("loginModal")
    );

    addUserBtn?.addEventListener("click", () => {
      if (!this.app.isLoggedIn || this.app.userRole !== "admin") {
        alert("⚠️ Только администратор может добавлять пользователей");
        return;
      }
      this.app.modals.open("addUserModal");
    });

    saveUserBtn?.addEventListener("click", this.handleAddUser.bind(this));

    document
      .getElementById("createFirstAdminBtn")
      ?.addEventListener("click", this.handleFirstAdmin.bind(this));

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

    this.app.updateAuthUI();
  }

  handleLogin() {
    const loginInput = document.getElementById("loginInput").value.trim();
    const passwordInput = document.getElementById("passwordInput").value.trim();

    const result = this.dataManager.checkLogin(loginInput, passwordInput);

    if (result.success) {
      this.app.isLoggedIn = true;
      this.app.currentUser = result.login;
      this.app.userRole = result.role;

      // ← ДОБАВИТЬ ЭТУ СТРОКУ
      this.app.storageManager.currentUser = result.login;

      localStorage.setItem(
        "gameStats_session",
        JSON.stringify({
          login: result.login,
          role: result.role,
          timestamp: Date.now(),
        })
      );

      this.app.updateAuthUI();
      this.app.modals.close("loginModal");
      alert(`✅ Добро пожаловать, ${result.login}! (${result.role})`);
    } else {
      alert("❌ Неверный логин или пароль");
    }
  }

  handleLogout() {
    if (confirm("Вы уверены, что хотите выйти?")) {
      this.app.isLoggedIn = false;
      this.app.currentUser = null;
      this.app.userRole = null;
      localStorage.removeItem("gameStats_session");
      this.app.updateAuthUI();
      alert("👋 Вы вышли из системы");
    }
  }

  async handleAddUser() {
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
      this.app.modals.close("addUserModal");
      document.getElementById("newUserLogin").value = "";
      document.getElementById("newUserPassword").value = "";
      this.app.renderUsersList();
    } else {
      alert("❌ Пользователь с таким логином уже существует");
    }
  }

  async handleFirstAdmin() {
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
      this.app.modals.close("firstAdminModal");

      const loginResult = this.dataManager.checkLogin(login, password);
      if (loginResult.success) {
        this.app.isLoggedIn = true;
        this.app.currentUser = loginResult.login;
        this.app.userRole = loginResult.role;

        localStorage.setItem(
          "gameStats_session",
          JSON.stringify({
            login: loginResult.login,
            role: loginResult.role,
            timestamp: Date.now(),
          })
        );

        this.app.updateAuthUI();
        this.app.renderAll();
        alert(`✅ Добро пожаловать, ${login}!`);
      }
    } else {
      alert("❌ Ошибка создания администратора");
    }
  }

  async deleteUser(login) {
    if (!this.app.isLoggedIn || this.app.userRole !== "admin") {
      alert("⚠️ Только администратор может удалять пользователей");
      return;
    }
    if (!confirm(`Удалить пользователя "${login}"?`)) return;

    const result = await this.dataManager.deleteUser(login);
    if (result) {
      alert("✅ Пользователь удалён");
      this.app.renderUsersList();
    }
  }
}
