const { Router } = require('express');
const fs = require('fs');
const path = require('path');

const router = Router();
const WALLPAPER_DIR = path.join(__dirname, '..', 'data', 'wallpapers');

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

function ensureWallpaperDir() {
  if (!fs.existsSync(WALLPAPER_DIR)) {
    fs.mkdirSync(WALLPAPER_DIR, { recursive: true });
  }
}

function safeBaseName(filename) {
  return path
    .basename(filename || 'wallpaper')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'wallpaper';
}

router.post('/upload', (req, res) => {
  const { filename, mimeType, dataUrl } = req.body;
  const ext = EXT_BY_MIME[mimeType];

  if (!ext || typeof dataUrl !== 'string') {
    return res.status(400).json({ error: 'Valid image file required' });
  }

  const prefix = `data:${mimeType};base64,`;
  if (!dataUrl.startsWith(prefix)) {
    return res.status(400).json({ error: 'Invalid image payload' });
  }

  ensureWallpaperDir();
  const outputName = `${Date.now()}-${safeBaseName(filename)}${ext}`;
  const outputPath = path.join(WALLPAPER_DIR, outputName);
  const base64 = dataUrl.slice(prefix.length);

  fs.writeFileSync(outputPath, Buffer.from(base64, 'base64'));
  res.status(201).json({ url: `/api/wallpaper/files/${outputName}` });
});

router.get('/files/:filename', (req, res) => {
  ensureWallpaperDir();
  const filename = path.basename(req.params.filename);
  const filePath = path.join(WALLPAPER_DIR, filename);

  if (!filePath.startsWith(WALLPAPER_DIR) || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Wallpaper not found' });
  }

  res.sendFile(filePath);
});

module.exports = router;
