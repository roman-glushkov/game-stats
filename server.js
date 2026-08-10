const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

// ===== ПАПКИ =====
const isRailway =
  process.env.RAILWAY_ENVIRONMENT === "production" ||
  process.env.RAILWAY_SERVICE_ID;
const DATA_DIR = isRailway ? "/app/data" : path.join(__dirname, "data");
const PUBLIC_DIR = path.join(__dirname, "public");

// ===== MIME TYPES =====
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const statsPath = path.join(DATA_DIR, "stats.json");
const loginsPath = path.join(DATA_DIR, "logins.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

function initFile(path, defaultData) {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify(defaultData, null, 2));
  }
}
initFile(statsPath, { players: {} });
initFile(loginsPath, { admins: {}, users: {} });

// ===== БЕКАПЫ =====
function createBackup(filePath, fileType) {
  if (!fs.existsSync(filePath)) return;
  const data = fs.readFileSync(filePath, "utf8");
  const date = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupPath = path.join(BACKUP_DIR, `${fileType}_${date}.json`);
  fs.writeFileSync(backupPath, data);
}

// ===== СЕРВЕР =====
const server = http.createServer((req, res) => {
  console.log(`📨 ${req.method} ${req.url}`);

  // API: /api/stats
  if (req.url === "/api/stats") {
    if (req.method === "GET") {
      fs.readFile(statsPath, "utf8", (err, data) => {
        if (err) {
          res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(JSON.stringify({ success: false, error: err.message }));
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
      req.on("data", (chunk) => (body += chunk));
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
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
          }
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

  // API: /api/logins
  if (req.url === "/api/logins") {
    if (req.method === "GET") {
      fs.readFile(loginsPath, "utf8", (err, data) => {
        if (err) {
          res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(JSON.stringify({ success: false, error: err.message }));
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
      req.on("data", (chunk) => (body += chunk));
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
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
          }
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
  let requestPath = req.url === "/" ? "/index.html" : req.url;
  const cleanPath = requestPath.split("?")[0];

  // Определяем путь к файлу
  let filePath;
  if (
    cleanPath.startsWith("/js/") ||
    cleanPath.startsWith("/css/") ||
    cleanPath.startsWith("/icons/")
  ) {
    filePath = path.join(PUBLIC_DIR, cleanPath);
  } else if (cleanPath.startsWith("/manifest.json")) {
    filePath = path.join(PUBLIC_DIR, "manifest.json");
  } else {
    filePath = path.join(PUBLIC_DIR, cleanPath);
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("File not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📁 Public: ${PUBLIC_DIR}`);
  console.log(`📄 stats.json: ${statsPath}`);
  console.log(`📄 logins.json: ${loginsPath}`);
});
