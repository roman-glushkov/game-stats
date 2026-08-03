const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
// Используем __dirname для корректного пути
const statsPath = path.join(__dirname, "data", "stats.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = http.createServer((req, res) => {
  console.log(`📨 ${req.method} ${req.url}`);

  // API для статистики
  if (req.url === "/api/stats") {
    if (req.method === "GET") {
      console.log(`📖 Читаем файл: ${statsPath}`);

      fs.readFile(statsPath, "utf8", (err, data) => {
        if (err) {
          console.error(`❌ Ошибка чтения: ${err.message}`);
          console.error(`📁 Путь: ${statsPath}`);

          res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(
            JSON.stringify({
              error: "Не удалось прочитать stats.json",
              path: statsPath,
            })
          );
          return;
        }

        console.log(`✅ Файл прочитан, размер: ${data.length} байт`);
        console.log(`📄 Содержимое: ${data.substring(0, 100)}...`);

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
        console.log(`💾 Сохраняем данные, размер: ${body.length} байт`);

        // Проверяем валидность JSON
        try {
          JSON.parse(body);
        } catch (e) {
          console.error(`❌ Невалидный JSON: ${e.message}`);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Невалидный JSON" }));
          return;
        }

        fs.writeFile(statsPath, body, "utf8", (err) => {
          if (err) {
            console.error(`❌ Ошибка сохранения: ${err.message}`);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
          }

          console.log(`✅ Данные сохранены в ${statsPath}`);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        });
      });
      return;
    }
  }

  // Статические файлы
  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = path.join(__dirname, filePath);

  console.log(`📂 Запрос файла: ${filePath}`);

  // Проверяем, что файл существует
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Файл не найден: ${filePath}`);
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("File not found");
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error(`❌ Ошибка чтения файла: ${err.message}`);
      res.writeHead(500);
      res.end("Server error");
      return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || "text/plain";

    console.log(`✅ Отдаём файл: ${path.basename(filePath)} (${contentType})`);

    res.writeHead(200, {
      "Content-Type": contentType,
    });
    res.end(content);
  });
});

// Проверяем существование stats.json при старте
console.log(`🔍 Проверка stats.json:`);
console.log(`📁 Путь: ${statsPath}`);
console.log(`📄 Существует: ${fs.existsSync(statsPath) ? "✅ ДА" : "❌ НЕТ"}`);

if (fs.existsSync(statsPath)) {
  try {
    const stats = fs.readFileSync(statsPath, "utf8");
    const data = JSON.parse(stats);
    console.log(`👥 Игроков: ${data.players?.length || 0}`);
    console.log(`📊 Данные: ${JSON.stringify(data, null, 2)}`);
  } catch (e) {
    console.error(`❌ Ошибка чтения stats.json: ${e.message}`);
  }
}

server.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен: http://localhost:${PORT}`);
  console.log(`📁 Корневая папка: ${__dirname}`);
  console.log(`📄 stats.json: ${statsPath}`);
});
