const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const BUILD_DIR = path.join(__dirname, "dist");
const API_TARGET = "https://eventsapi.nrf.com/api/v2";
const API_KEY = "T8YF@6aDVmX83uMYfhDX";
const NORMALIZED_API_TARGET = API_TARGET.replace(/\/$/, "");

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

/**
 * Streams a file to the client and handles HTTP Range requests so that
 * large media assets (e.g. video) can begin playback immediately.
 */
function streamFile(req, res, filePath, stats) {
  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || "application/octet-stream";
  const rangeHeader = req.headers.range;

  const sendStream = (options = {}) => {
    const stream = fs.createReadStream(filePath, options);
    stream.on("error", (err) => {
      res.status(500).send("Error: " + err.code);
    });
    stream.pipe(res);
  };

  if (rangeHeader) {
    const matches = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if (!matches) {
      res.status(416).set("Content-Range", `bytes */${stats.size}`).end();
      return;
    }

    let start = matches[1] ? parseInt(matches[1], 10) : 0;
    let end = matches[2] ? parseInt(matches[2], 10) : stats.size - 1;

    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start > end ||
      end >= stats.size
    ) {
      res.status(416).set("Content-Range", `bytes */${stats.size}`).end();
      return;
    }

    const chunkSize = end - start + 1;
    res.status(206);
    res.set({
      "Content-Range": `bytes ${start}-${end}/${stats.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": contentType,
    });
    sendStream({ start, end });
    return;
  }

  res.status(200);
  res.set({
    "Content-Type": contentType,
    "Content-Length": stats.size,
    "Accept-Ranges": "bytes",
  });
  sendStream();
}

function serveIndex(req, res) {
  const indexPath = path.join(BUILD_DIR, "index.html");
  fs.stat(indexPath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.status(404).send("404 Not Found");
      return;
    }
    streamFile(req, res, indexPath, stats);
  });
}

/**
 * Minimal proxy for forwarding /sessions requests to the NRF API target.
 */
app.use("/sessions", (req, res) => {
  let upstreamUrl;
  try {
    upstreamUrl = new URL(
      `${NORMALIZED_API_TARGET}${req.originalUrl.replace(/^\/sessions/, "/sessions")}`
    );
  } catch (err) {
    console.error("Invalid NRF API target URL:", err.message);
    res.status(500).send("Invalid API configuration");
    return;
  }

  const client = upstreamUrl.protocol === "https:" ? https : http;
  const headers = {
    ...req.headers,
    host: upstreamUrl.host,
  };

  if (API_KEY) {
    headers["api-key"] = API_KEY;
  }

  const proxyReq = client.request(
    {
      protocol: upstreamUrl.protocol,
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.port || (upstreamUrl.protocol === "https:" ? 443 : 80),
      method: req.method,
      path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
      headers,
    },
    (proxyRes) => {
      res.status(proxyRes.statusCode || 500);
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (typeof value !== "undefined") {
          res.setHeader(key, value);
        }
      }
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (err) => {
    console.error("NRF proxy error:", err.message);
    if (!res.headersSent) {
      res.status(502).send("Bad Gateway");
    } else {
      res.end();
    }
  });

  req.pipe(proxyReq);
});

// Custom static file serving middleware
app.use((req, res, next) => {
  const fullUrl = new URL("http://" + (req.headers.host || "127.0.0.1") + req.url);
  const decodedPath = (() => {
    try {
      return decodeURIComponent(fullUrl.pathname);
    } catch {
      return fullUrl.pathname;
    }
  })();

  const requestedPath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const filePath = path.resolve(BUILD_DIR, requestedPath);

  // Prevent path traversal outside of the build directory
  if (!filePath.startsWith(BUILD_DIR)) {
    serveIndex(req, res);
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      serveIndex(req, res);
      return;
    }
    streamFile(req, res, filePath, stats);
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