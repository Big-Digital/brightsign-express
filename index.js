import express from 'express'
import path from 'path'
import fs from 'fs'

// Use script location (works when bundled as build/bundle.js) so we serve from build/dist
const __dirname = path.dirname(
  path.isAbsolute(process.argv[1]) ? process.argv[1] : path.resolve(process.cwd(), process.argv[1])
)

const PORT = process.env.PORT || 3001
const defaultStatic = fs.existsSync(path.join(__dirname, 'dist')) ? 'dist' : 'public'
const STATIC_FOLDER = process.env.STATIC_FOLDER || defaultStatic
const staticPath = path.isAbsolute(STATIC_FOLDER)
  ? STATIC_FOLDER
  : path.resolve(__dirname, STATIC_FOLDER)

const app = express()
app.use(express.static(staticPath))

// SPA fallback: serve index.html for non-file routes
app.use((req, res) => {
  const indexPath = path.join(staticPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send('404 - Not Found')
  }
})

app.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`)
  console.log(`Serving from: ${staticPath}`)
})
