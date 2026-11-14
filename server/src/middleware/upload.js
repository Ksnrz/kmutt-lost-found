import multer from 'multer';
import fs from 'fs';

const uploadDir = 'uploads/';

// extension comes from this whitelist, never from the client's file name (a .html "image" must not be served as HTML)
const IMAGE_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}` +
      IMAGE_EXT[file.mimetype];

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (IMAGE_EXT[file.mimetype]) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('อนุญาตให้อัปโหลดเฉพาะไฟล์รูปภาพ (jpg, png, webp, gif)'), { status: 400 }));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;