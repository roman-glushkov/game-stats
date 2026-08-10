export class AppTheme {
  setup() {
    const savedTheme = localStorage.getItem("gameStats_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.updateButton(savedTheme);

    document.getElementById("themeToggle")?.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("gameStats_theme", newTheme);
      this.updateButton(newTheme);
    });
  }

  updateButton(theme) {
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
}
