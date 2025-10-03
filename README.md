# BrightSign Express Server

A Node.js Express server designed to serve React applications on BrightSign devices. This server handles static file serving with proper MIME types and includes fallback routing for single-page applications.

## Prerequisites

- Node.js installed
- React application built with Vite (recommended) or Create React App
- BrightSign Cloud account access

## Setup Instructions

### 1. Build Your React Application

**For Vite Projects (Recommended):**
```bash
npm run build
```

**For Create React App:**
```bash
npm run build
```

### 2. Configure File Paths

Depending on your React build tool, you may need to adjust the file path in `index.js`:

- **Vite**: Uses `dist` folder (default configuration)
- **Create React App**: Uses `build` folder

The server is currently configured to serve from the `dist` folder first, with a fallback to the `build` folder.

### 3. Bundle with Webpack

Run the webpack production build to create the final bundle:

```bash
npx webpack --mode production
```

This will create a `/build` folder containing your bundled application.


## Deployment to BrightSign

### 1. Access BrightSign Cloud

1. Log into the BrightSign Cloud version
2. Confirm you are connected to the correct network
3. Navigate to **Content** → **New Component** → **Upload HTML Site / Node.js App**

### 2. Upload Your Application

1. **Site Name**: Enter your application name (e.g., `Manulife_Map`, `YourApp_Name`)
2. **Browse for Site Index**: 
   - Click **Browse** to select the site index file
   - **On Mac**: Click **Show Options** and select **JavaScript**
   - Select the `index.js` file from the root folder of your webpack build
   - This will include everything in the folder (similar to the legacy upload method)
3. **Final Step**: Click **Replace as necessary**

## Project Structure

```
brightsign-express/
├── index.js              # Express server
├── package.json          # Dependencies
├── webpack.config.js     # Webpack configuration
├── dist/                 # Vite build output (if using Vite)
├── build/                # Final webpack bundle for BrightSign
└── node_modules/         # Dependencies
```

## Server Features

- **Static File Serving**: Handles HTML, CSS, JavaScript, images, fonts, and media files
- **MIME Type Support**: Proper content-type headers for all file types
- **SPA Routing**: Fallback to `index.html` for client-side routing
- **POST Endpoint**: Includes `/nodetest` endpoint for testing
- **Error Handling**: 404 and 500 error responses

## Development

To run the server locally for testing:

```bash
npm install
node index.js
```

The server will run on port 3000 (or the PORT environment variable).

## Troubleshooting

- **MIME Type Issues**: Check that file extensions are properly mapped in the `mimeTypes` object
- **BrightSign Upload**: Make sure to select the `index.js` file, not the HTML file, when uploading

## Dependencies

- **express**: Web server framework
- **webpack**: Module bundler
- **webpack-cli**: Webpack command line interface
- **html-webpack-plugin**: HTML file generation
- **copy-webpack-plugin**: File copying during build
- **zip-webpack-plugin**: Archive creation
