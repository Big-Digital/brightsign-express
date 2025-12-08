// index.js

const express = require('express');
const path = require('path');
const app = express();

// Configuration
const PORT = process.env.PORT || 3001;
const STATIC_FOLDER = process.env.STATIC_FOLDER || 'public'; // Default to 'public' folder
const staticPath = path.isAbsolute(STATIC_FOLDER)
  ? STATIC_FOLDER
  : path.resolve(__dirname, STATIC_FOLDER);

// Middleware to serve static files
app.use(express.static(staticPath));

console.log(`Serving static files from: ${staticPath}`);

// Fallback route
app.use((req, res) => {
    res.status(404).send('404 - Not Found');
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
