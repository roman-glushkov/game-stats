const DEFAULT_LOGINS = { admins: {}, users: {} };

export class StorageAuth {
  constructor() {
    this.logins = { admins: {}, users: {} };
  }

  async loadLogins() {
    try {
      const response = await fetch("/api/logins");
      if (response.ok) {
        this.logins = await response.json();
        // Миграция старых данных
        this.migrateLogins();
        console.log("✅ Логины загружены:", this.logins);
      } else {
        this.logins = JSON.parse(JSON.stringify(DEFAULT_LOGINS));
        await this.saveLogins();
      }
    } catch (e) {
      console.warn("⚠️ Ошибка загрузки логинов:", e.message);
      this.logins = JSON.parse(JSON.stringify(DEFAULT_LOGINS));
      await this.saveLogins();
    }
  }

  // ===== МИГРАЦИЯ СТАРЫХ ДАННЫХ =====
  migrateLogins() {
    let migrated = false;

    // Миграция админов
    for (const login in this.logins.admins) {
      const data = this.logins.admins[login];
      if (typeof data === "string") {
        this.logins.admins[login] = {
          password: data,
          displayName: login,
          createdAt: new Date().toISOString(),
        };
        migrated = true;
      }
    }

    // Миграция пользователей
    for (const login in this.logins.users) {
      const data = this.logins.users[login];
      if (typeof data === "string") {
        this.logins.users[login] = {
          password: data,
          displayName: login,
          createdAt: new Date().toISOString(),
        };
        migrated = true;
      }
    }

    if (migrated) {
      console.log("🔄 Логины мигрированы в новый формат");
      this.saveLogins();
    }
  }

  async saveLogins() {
    try {
      const response = await fetch("/api/logins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.logins),
      });
      if (!response.ok) throw new Error("Ошибка сохранения логинов");
      console.log("💾 Логины сохранены");
      return true;
    } catch (error) {
      console.error("Ошибка сохранения логинов:", error);
      return false;
    }
  }

  checkLogin(login, password) {
    // Проверяем админов
    if (this.logins.admins?.[login]?.password === password) {
      return {
        success: true,
        role: "admin",
        login,
        displayName: this.logins.admins[login].displayName || login,
      };
    }
    // Проверяем пользователей
    if (this.logins.users?.[login]?.password === password) {
      return {
        success: true,
        role: "user",
        login,
        displayName: this.logins.users[login].displayName || login,
      };
    }
    return { success: false };
  }

  async addUser(login, password, displayName = "", role = "user") {
    login = login.trim();
    if (!login || !password || password.length < 3) return false;

    if (this.logins.admins[login] || this.logins.users[login]) {
      return false;
    }

    const userData = {
      password: password,
      displayName: displayName || login,
      createdAt: new Date().toISOString(),
    };

    if (role === "admin") {
      this.logins.admins[login] = userData;
    } else {
      this.logins.users[login] = userData;
    }

    await this.saveLogins();
    return true;
  }

  async updateUser(login, newData) {
    if (!login) return false;

    // Проверяем в админах
    if (this.logins.admins[login]) {
      if (newData.displayName)
        this.logins.admins[login].displayName = newData.displayName;
      if (newData.password)
        this.logins.admins[login].password = newData.password;
      await this.saveLogins();
      return true;
    }
    // Проверяем в пользователях
    if (this.logins.users[login]) {
      if (newData.displayName)
        this.logins.users[login].displayName = newData.displayName;
      if (newData.password)
        this.logins.users[login].password = newData.password;
      await this.saveLogins();
      return true;
    }
    return false;
  }

  async deleteUser(login) {
    if (login === "admin") {
      alert("❌ Нельзя удалить главного администратора");
      return false;
    }

    if (this.logins.admins[login]) {
      delete this.logins.admins[login];
    } else if (this.logins.users[login]) {
      delete this.logins.users[login];
    } else {
      return false;
    }

    await this.saveLogins();
    return true;
  }

  getUserData(login) {
    if (this.logins.admins[login]) {
      return { ...this.logins.admins[login], role: "admin", login };
    }
    if (this.logins.users[login]) {
      return { ...this.logins.users[login], role: "user", login };
    }
    return null;
  }

  getUsers() {
    const users = [];
    Object.keys(this.logins.admins || {}).forEach((login) => {
      users.push({
        login,
        role: "admin",
        displayName: this.logins.admins[login].displayName || login,
      });
    });
    Object.keys(this.logins.users || {}).forEach((login) => {
      users.push({
        login,
        role: "user",
        displayName: this.logins.users[login].displayName || login,
      });
    });
    return users;
  }

  hasUsers() {
    return (
      Object.keys(this.logins.admins || {}).length +
        Object.keys(this.logins.users || {}).length >
      0
    );
  }
}
