const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const port = Number(process.env.PORT || 3001);
const publicDir = path.join(__dirname, "public");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const cleanPath = decoded.replace(/^[/\\]+/, "") || "index.html";
  const normalized = path.normalize(cleanPath).replace(/^(\.\.[/\\])+/, "");
  const target = path.resolve(publicDir, normalized);
  return target.startsWith(publicDir) ? target : path.join(publicDir, "index.html");
}

const server = http.createServer(async (req, res) => {
  try {
    const filePath = safePath(req.url || "/");
    const ext = path.extname(filePath);
    const content = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      const fallback = await fs.readFile(path.join(publicDir, "index.html"));
      res.writeHead(200, { "Content-Type": mimeTypes[".html"] });
      res.end(fallback);
      return;
    }

    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Server error");
  }
});

server.listen(port, () => {
  console.log(`Study RPG running at http://localhost:${port}`);
});
