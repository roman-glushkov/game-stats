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
    if (this.logins.admins?.[login] === password) {
      return { success: true, role: "admin", login };
    }
    if (this.logins.users?.[login] === password) {
      return { success: true, role: "user", login };
    }
    return { success: false };
  }

  async addUser(login, password, role = "user") {
    login = login.trim();
    if (!login || !password) return false;
    if (this.logins.admins[login] || this.logins.users[login]) return false;

    if (role === "admin") {
      this.logins.admins[login] = password;
    } else {
      this.logins.users[login] = password;
    }
    await this.saveLogins();
    return true;
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

  getUsers() {
    const users = [];
    Object.keys(this.logins.admins || {}).forEach((login) => {
      users.push({ login, role: "admin" });
    });
    Object.keys(this.logins.users || {}).forEach((login) => {
      users.push({ login, role: "user" });
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
