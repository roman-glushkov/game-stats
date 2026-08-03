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

    this.init();
  }

  async init() {
    await this.dataManager.loadData();
    this.setupEventListeners();
    this.renderAll();

    window.app = this;
    console.log("🏆 GameStats Pro загружен!");
    console.log("📊 Данные:", this.dataManager.data);
  }

  renderAll() {
    this.statsRenderer.renderAll();
    this.chartManager.renderAll();
  }

  // ===== Методы для кнопок =====
  addWin(name, game = "Все игры") {
    console.log(`🟢 Добавляем победу для ${name} в ${game}`);
    if (this.dataManager.addWin(name, game)) {
      this.renderAll();
    } else {
      alert(`Ошибка: игрок "${name}" не найден`);
    }
  }

  addLoss(name, game = "Все игры") {
    console.log(`🔴 Добавляем поражение для ${name} в ${game}`);
    if (this.dataManager.addLoss(name, game)) {
      this.renderAll();
    } else {
      alert(`Ошибка: игрок "${name}" не найден`);
    }
  }

  resetPlayer(name) {
    console.log(`🔄 Сбрасываем статистику для ${name}`);
    if (confirm(`Сбросить статистику игрока "${name}"?`)) {
      if (this.dataManager.resetPlayerStats(name)) {
        this.renderAll();
      }
    }
  }

  // ===== Обработчики событий =====
  setupEventListeners() {
    // Фильтр по играм
    document.getElementById("gameFilter").addEventListener("change", (e) => {
      this.statsRenderer.setFilter(e.target.value);
      this.chartManager.renderAll();
    });

    // Модальные окна
    document
      .getElementById("showAddPlayerModal")
      .addEventListener("click", () => {
        this.openModal("addPlayerModal");
      });

    document
      .getElementById("showAddGameModal")
      .addEventListener("click", () => {
        this.openModal("addGameModal");
      });

    // Закрытие модалок
    document
      .getElementById("closePlayerModal")
      .addEventListener("click", () => {
        this.closeModal("addPlayerModal");
      });

    document
      .getElementById("cancelPlayerModal")
      .addEventListener("click", () => {
        this.closeModal("addPlayerModal");
      });

    document.getElementById("closeGameModal").addEventListener("click", () => {
      this.closeModal("addGameModal");
    });

    document.getElementById("cancelGameModal").addEventListener("click", () => {
      this.closeModal("addGameModal");
    });

    // Добавление игрока
    document.getElementById("savePlayerBtn").addEventListener("click", () => {
      const input = document.getElementById("playerNameInput");
      const name = input.value.trim();
      if (name) {
        if (this.dataManager.addPlayer(name)) {
          this.renderAll();
          this.closeModal("addPlayerModal");
          input.value = "";
        } else {
          alert("Игрок уже существует");
        }
      } else {
        alert("Введите имя игрока");
      }
    });

    // Добавление результата игры
    document.getElementById("saveGameBtn").addEventListener("click", () => {
      const game = document.getElementById("gameSelect").value;
      const winner = document.getElementById("winnerSelect").value;
      const loser = document.getElementById("loserSelect").value;

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
        document.getElementById("winnerSelect").value = "";
        document.getElementById("loserSelect").value = "";
      } else {
        alert("Ошибка добавления результата");
      }
    });

    // Очистка
    document.getElementById("clearHistoryBtn").addEventListener("click", () => {
      if (confirm("Вы уверены, что хотите сбросить ВСЮ статистику?")) {
        this.dataManager.clearAllStats();
        this.renderAll();
      }
    });

    // Обновление графиков
    document
      .getElementById("refreshChartsBtn")
      .addEventListener("click", () => {
        this.chartManager.destroyAll();
        this.chartManager.renderAll();
      });

    // Экспорт
    document.getElementById("exportDataBtn").addEventListener("click", () => {
      const data = this.dataManager.exportData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stats_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Импорт
    document.getElementById("importDataBtn").addEventListener("click", () => {
      document.getElementById("importFileInput").click();
    });

    document
      .getElementById("importFileInput")
      .addEventListener("change", (e) => {
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

    // Enter
    document
      .getElementById("playerNameInput")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          document.getElementById("savePlayerBtn").click();
        }
      });
  }

  openModal(id) {
    document.getElementById(id).classList.add("active");
  }

  closeModal(id) {
    document.getElementById(id).classList.remove("active");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
