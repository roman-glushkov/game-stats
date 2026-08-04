console.log("=== SERVER STARTED ===", new Date().toISOString());
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = "/app/data";
const statsPath = path.join(DATA_DIR, "stats.json");
const loginsPath = path.join(DATA_DIR, "logins.json");

// Создаём папку data, если её нет
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
  console.log("📁 Создана папка data/");
}

// Инициализация stats.json
if (!fs.existsSync(statsPath)) {
  const defaultStats = { players: {} };
  fs.writeFileSync(statsPath, JSON.stringify(defaultStats, null, 2));
  console.log("📄 Создан stats.json");
}

// Инициализация logins.json
if (!fs.existsSync(loginsPath)) {
  const defaultLogins = {
    admins: {},
    users: {},
  };
  fs.writeFileSync(loginsPath, JSON.stringify(defaultLogins, null, 2));
  console.log("📄 Создан пустой logins.json");
}

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
  let requestPath = req.url;
  if (requestPath === "/") {
    requestPath = "/index.html";
  }

  const filePath = path.join(PUBLIC_DIR, requestPath.replace(/^\/+/, ""));
  console.log(`📂 Запрос файла: ${filePath}`);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error(`❌ Файл не найден: ${filePath}`);
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("File not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
});

console.log("🔍 Проверка файлов:");
console.log(`📁 stats.json: ${fs.existsSync(statsPath) ? "✅" : "❌"}`);
console.log(`📁 logins.json: ${fs.existsSync(loginsPath) ? "✅" : "❌"}`);

if (fs.existsSync(statsPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(statsPath, "utf8"));
    const playersCount = data.players ? Object.keys(data.players).length : 0;
    console.log(`👥 Игроков: ${playersCount}`);
  } catch (e) {
    console.error(`❌ Ошибка чтения stats.json: ${e.message}`);
  }
}

if (fs.existsSync(loginsPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(loginsPath, "utf8"));
    const adminsCount = data.admins ? Object.keys(data.admins).length : 0;
    const usersCount = data.users ? Object.keys(data.users).length : 0;
    console.log(`👤 Админов: ${adminsCount}, Пользователей: ${usersCount}`);
  } catch (e) {
    console.error(`❌ Ошибка чтения logins.json: ${e.message}`);
  }
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📁 Public: ${PUBLIC_DIR}`);
  console.log(`📄 stats.json: ${statsPath}`);
  console.log(`📄 logins.json: ${loginsPath}`);
  console.log(`👤 admin / admin`);
});
