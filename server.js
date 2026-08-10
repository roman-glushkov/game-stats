console.log("=== SERVER STARTED ===", new Date().toISOString());
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

// ===== ОПРЕДЕЛЯЕМ КОРНЕВУЮ ПАПКУ =====
const ROOT_DIR = __dirname;
console.log(`📁 Корневая папка: ${ROOT_DIR}`);

// ===== ОПРЕДЕЛЯЕМ ПАПКУ ДЛЯ ДАННЫХ =====
const isRailway =
  process.env.RAILWAY_ENVIRONMENT === "production" ||
  process.env.RAILWAY_SERVICE_ID;
const DATA_DIR = isRailway ? "/app/data" : path.join(ROOT_DIR, "data");

console.log(`📁 Папка данных: ${DATA_DIR}`);

// Создаём папку, если её нет
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`📁 Создана папка: ${DATA_DIR}`);
}

const statsPath = path.join(DATA_DIR, "stats.json");
const loginsPath = path.join(DATA_DIR, "logins.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`📁 Создана папка бекапов: ${BACKUP_DIR}`);
}

// ===== ИНИЦИАЛИЗАЦИЯ ФАЙЛОВ =====
function initStatsFile() {
  if (!fs.existsSync(statsPath)) {
    const defaultStats = { players: {} };
    fs.writeFileSync(statsPath, JSON.stringify(defaultStats, null, 2));
    console.log("📄 Создан stats.json");
  }
}

function initLoginsFile() {
  if (!fs.existsSync(loginsPath)) {
    const defaultLogins = { admins: {}, users: {} };
    fs.writeFileSync(loginsPath, JSON.stringify(defaultLogins, null, 2));
    console.log("📄 Создан logins.json");
  }
}

initStatsFile();
initLoginsFile();

// ===== ФУНКЦИЯ СОЗДАНИЯ БЕКАПА =====
function createBackup(filePath, fileType) {
  try {
    if (!fs.existsSync(filePath)) return;

    const data = fs.readFileSync(filePath, "utf8");
    const date = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const backupName = `${fileType}_${date}.json`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    fs.writeFileSync(backupPath, data);
    console.log(`💾 Бекап создан: ${backupName}`);

    cleanOldBackups(fileType, 10);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка создания бекапа: ${error.message}`);
    return false;
  }
}

function cleanOldBackups(fileType, keepCount = 10) {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith(fileType) && f.endsWith(".json"))
      .map((f) => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime,
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > keepCount) {
      const toDelete = files.slice(keepCount);
      toDelete.forEach((f) => {
        fs.unlinkSync(f.path);
        console.log(`🗑️ Удалён старый бекап: ${f.name}`);
      });
    }
  } catch (error) {
    console.error(`❌ Ошибка очистки бекапов: ${error.message}`);
  }
}

function restoreFromBackup(fileType, targetPath) {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith(fileType) && f.endsWith(".json"))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log(`❌ Нет бекапов для ${fileType}`);
      return false;
    }

    const latestBackup = path.join(BACKUP_DIR, files[0]);
    const data = fs.readFileSync(latestBackup, "utf8");
    fs.writeFileSync(targetPath, data);
    console.log(`✅ Восстановлено из бекапа: ${files[0]}`);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка восстановления: ${error.message}`);
    return false;
  }
}

function checkAndRestoreIfEmpty() {
  try {
    const statsData = JSON.parse(fs.readFileSync(statsPath, "utf8"));
    const playersCount = statsData.players
      ? Object.keys(statsData.players).length
      : 0;
    if (playersCount === 0) {
      console.log("⚠️ stats.json пуст, пробуем восстановить из бекапа...");
      restoreFromBackup("stats", statsPath);
    }
  } catch (e) {
    console.log("⚠️ stats.json повреждён, пробуем восстановить из бекапа...");
    restoreFromBackup("stats", statsPath);
  }

  try {
    const loginsData = JSON.parse(fs.readFileSync(loginsPath, "utf8"));
    const adminsCount = loginsData.admins
      ? Object.keys(loginsData.admins).length
      : 0;
    const usersCount = loginsData.users
      ? Object.keys(loginsData.users).length
      : 0;
    if (adminsCount === 0 && usersCount === 0) {
      console.log("⚠️ logins.json пуст, пробуем восстановить из бекапа...");
      restoreFromBackup("logins", loginsPath);
    }
  } catch (e) {
    console.log("⚠️ logins.json повреждён, пробуем восстановить из бекапа...");
    restoreFromBackup("logins", loginsPath);
  }
}

checkAndRestoreIfEmpty();

// ===== ПУБЛИЧНАЯ ПАПКА =====
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
console.log(`📁 Public папка: ${PUBLIC_DIR}`);

// Проверяем существование public папки
if (!fs.existsSync(PUBLIC_DIR)) {
  console.error(`❌ Папка public не найдена: ${PUBLIC_DIR}`);
  process.exit(1);
}

// ===== MIME TYPES =====
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/json",
};

const server = http.createServer((req, res) => {
  console.log(`📨 ${req.method} ${req.url}`);

  // ===== API: /api/stats =====
  if (req.url === "/api/stats") {
    if (req.method === "GET") {
      fs.readFile(statsPath, "utf8", (err, data) => {
        if (err) {
          console.error(`❌ Ошибка чтения stats.json: ${err.message}`);
          res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(
            JSON.stringify({
              success: false,
              error: "Не удалось прочитать stats.json",
            })
          );
          return;
        }
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(data);
      });
      return;
    }

    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          JSON.parse(body);
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Невалидный JSON" }));
          return;
        }

        fs.writeFile(statsPath, body, "utf8", (err) => {
          if (err) {
            console.error(err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
          }
          console.log("✅ Статистика сохранена");
          createBackup(statsPath, "stats");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        });
      });
      return;
    }

    res.writeHead(405);
    res.end();
    return;
  }

  // ===== API: /api/logins =====
  if (req.url === "/api/logins") {
    if (req.method === "GET") {
      fs.readFile(loginsPath, "utf8", (err, data) => {
        if (err) {
          console.error(`❌ Ошибка чтения logins.json: ${err.message}`);
          res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(
            JSON.stringify({
              success: false,
              error: "Не удалось прочитать logins.json",
            })
          );
          return;
        }
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(data);
      });
      return;
    }

    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          JSON.parse(body);
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Невалидный JSON" }));
          return;
        }

        fs.writeFile(loginsPath, body, "utf8", (err) => {
          if (err) {
            console.error(err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
          }
          console.log("✅ Логины сохранены");
          createBackup(loginsPath, "logins");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        });
      });
      return;
    }

    res.writeHead(405);
    res.end();
    return;
  }

  // ===== STATIC FILES =====
  // Обрабатываем только GET запросы для статики
  if (req.method !== "GET") {
    res.writeHead(405);
    res.end();
    return;
  }

  let requestPath = req.url;
  if (requestPath === "/") {
    requestPath = "/index.html";
  }

  // Убираем параметры запроса
  const cleanPath = requestPath.split("?")[0];

  // Формируем путь к файлу в папке public
  const relativePath = cleanPath.replace(/^\/+/, "");
  let filePath = path.join(PUBLIC_DIR, relativePath);

  // Проверяем, существует ли файл
  fs.stat(filePath, (statErr) => {
    if (statErr) {
      // Если файл не найден, пробуем найти с .html расширением
      if (!path.extname(filePath) && !filePath.endsWith("/")) {
        const htmlPath = filePath + ".html";
        fs.stat(htmlPath, (htmlErr) => {
          if (!htmlErr) {
            filePath = htmlPath;
            serveFile(filePath, res);
          } else {
            console.error(`❌ Файл не найден: ${filePath}`);
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("File not found");
          }
        });
      } else {
        console.error(`❌ Файл не найден: ${filePath}`);
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("File not found");
      }
      return;
    }

    serveFile(filePath, res);
  });
});

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error(`❌ Ошибка чтения файла: ${filePath}`);
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("File not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    console.log(`✅ Отдаём файл: ${filePath} (${contentType})`);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

// ===== ЗАПУСК =====
console.log("🔍 Проверка файлов:");
console.log(`📁 stats.json: ${fs.existsSync(statsPath) ? "✅" : "❌"}`);
console.log(`📁 logins.json: ${fs.existsSync(loginsPath) ? "✅" : "❌"}`);

// Проверяем структуру public
console.log("🔍 Проверка структуры public:");
const checkFile = (filePath) => {
  const exists = fs.existsSync(filePath);
  console.log(`📁 ${filePath}: ${exists ? "✅" : "❌"}`);
  return exists;
};

checkFile(path.join(PUBLIC_DIR, "index.html"));
checkFile(path.join(PUBLIC_DIR, "js", "app.js"));
checkFile(path.join(PUBLIC_DIR, "js", "storage", "storage-manager.js"));
checkFile(path.join(PUBLIC_DIR, "js", "storage", "storage-auth.js"));
checkFile(path.join(PUBLIC_DIR, "js", "storage", "storage-stats.js"));
checkFile(path.join(PUBLIC_DIR, "js", "storage", "storage-games.js"));
checkFile(path.join(PUBLIC_DIR, "js", "storage", "storage-arcade.js"));
checkFile(path.join(PUBLIC_DIR, "css", "style.css"));

// Выводим информацию о игроках и админах
try {
  const statsData = JSON.parse(fs.readFileSync(statsPath, "utf8"));
  const playersCount = statsData.players
    ? Object.keys(statsData.players).length
    : 0;
  console.log(`👥 Игроков: ${playersCount}`);
} catch (e) {
  console.log("👥 Игроков: ошибка чтения");
}

try {
  const loginsData = JSON.parse(fs.readFileSync(loginsPath, "utf8"));
  const adminsCount = loginsData.admins
    ? Object.keys(loginsData.admins).length
    : 0;
  const usersCount = loginsData.users
    ? Object.keys(loginsData.users).length
    : 0;
  console.log(`👤 Админов: ${adminsCount}, Пользователей: ${usersCount}`);
} catch (e) {
  console.log("👤 Админов: ошибка чтения");
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📁 Public: ${PUBLIC_DIR}`);
  console.log(`📄 stats.json: ${statsPath}`);
  console.log(`📄 logins.json: ${loginsPath}`);
  console.log(`💾 Бекапы: ${BACKUP_DIR}`);
});
