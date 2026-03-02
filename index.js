const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// BrightSign XT1145: roHtmlWidget requests the URL before Node/Express is fully ready.
// During startup, serve a loader that auto-refreshes so the real app loads on retry.
const STARTUP_DELAY_MS = parseInt(process.env.BRIGHTSIGN_STARTUP_DELAY_MS || "2000", 10);
const serverStartTime = Date.now();
const LOADER_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta http-equiv="refresh" content="2;url=/"/><title>Loading</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#111;color:#fff;">Loading...</body></html>`;

// MIME type mapping similar to the HTTP server
const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpg",
  ".svg": "image/svg+xml",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".wav": "audio/wav",
  ".woff2": "application/font-woff2",
  ".ttf": "application/x-font-ttf",
  ".woff": "application/font-woff",
  ".otf": "application/font-otf"
};

// Custom static file serving middleware
app.use((req, res, next) => {
  const fullUrl = new URL("http://" + (req.headers.host || "127.0.0.1") + req.url);
  const isDocumentRequest = fullUrl.pathname === "/" || fullUrl.pathname === "/index.html";

  // BrightSign: serve loader during startup window so Chromium retries after server is ready
  if (STARTUP_DELAY_MS > 0 && isDocumentRequest && Date.now() - serverStartTime < STARTUP_DELAY_MS) {
    res.set("Content-Type", "text/html");
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.send(LOADER_HTML);
  }

  let filePath = path.join(
    __dirname,
    "build",
    ["/"].includes(fullUrl.pathname)
      ? "index.html"
      : fullUrl.pathname.slice(1) // Remove leading slash
  );
  filePath = filePath.replace(/%20/gi, " ");
  
  let extname = path.extname(filePath).toLowerCase();
  let contentType = mimeTypes[extname] || "text/html";
  
  if (typeof contentType === "function") {
    contentType = contentType(filePath);
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        // If the file is not found, try serving index.html from build folder
        fs.readFile(path.join(__dirname, "build", "index.html"), (err, content) => {
          if (err) {
            res.status(404).send("404 Not Found");
          } else {
            res.set("Content-Type", "text/html");
            res.set("Cache-Control", "no-cache, no-store, must-revalidate");
            res.send(content);
          }
        });
      } else {
        res.status(500).send("Error: " + err.code);
      }
    } else {
      res.set("Content-Type", contentType);
      // Prevent HTML from being cached so first load always gets fresh content
      if (contentType === "text/html") {
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      }
      res.send(content);
    }
  });
});

// POST endpoint similar to the HTTP server
app.post('/nodetest', (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", () => {
    res.set("Content-Type", "text/plain");
    res.send("Successfully worked!");
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
