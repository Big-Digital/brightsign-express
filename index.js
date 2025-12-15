// index.js

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Configuration
const PORT = process.env.PORT || 3001;
const defaultStatic =
  process.env.STATIC_FOLDER ||
  (fs.existsSync(path.join(__dirname, 'dist')) ? 'dist' : 'public'); // Prefer built assets if present
const STATIC_FOLDER = defaultStatic;
const staticPath = path.isAbsolute(STATIC_FOLDER)
  ? STATIC_FOLDER
  : path.resolve(__dirname, STATIC_FOLDER);

// Middleware to serve static files
app.use(express.static(staticPath));

console.log(`Serving static files from: ${staticPath}`);

// Fallback route for SPA (serves index.html if present)
app.use((req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('404 - Not Found');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`);
});

// Open the game
// import('open')
//     .then(mod => {
//         new Promise(async (resolve) => {
//             console.log(`Opening game at http://127.0.0.1:${PORT}`);
//             await mod.default(`http://127.0.0.1:${PORT}`);
//             resolve();
//         });
//     });
