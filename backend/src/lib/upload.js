import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = path.join(path.resolve(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueKey);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /image|video/;
  const isAllowed = allowedTypes.test(file.mimetype);
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter,
});
