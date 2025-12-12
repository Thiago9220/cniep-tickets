import fs from "fs";
import path from "path";
import { Request } from "express";
import multer from "multer";
import { UPLOADS_DIR } from "./paths";

export const DOCUMENT_UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024,
  allowedMimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/zip",
    "application/x-zip-compressed",
  ],
  allowedExtensions: [
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".txt", ".csv",
    ".jpg", ".jpeg", ".png", ".gif", ".webp",
    ".zip"
  ]
};

export function documentFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const ext = "." + file.originalname.split(".").pop()?.toLowerCase();

  if (!DOCUMENT_UPLOAD_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Use PDF, Word, Excel, PowerPoint, imagens ou ZIP.`));
    return;
  }

  if (!DOCUMENT_UPLOAD_CONFIG.allowedExtensions.includes(ext)) {
    cb(new Error(`Extensão de arquivo não permitida: ${ext}. Use: ${DOCUMENT_UPLOAD_CONFIG.allowedExtensions.join(", ")}`));
    return;
  }

  cb(null, true);
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UPLOADS_DIR)
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

export const uploadDocs = multer({
  storage: storage,
  limits: { fileSize: DOCUMENT_UPLOAD_CONFIG.maxSize },
  fileFilter: documentFileFilter,
});

const avatarStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const avatarsDir = path.join(UPLOADS_DIR, "avatars");
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    cb(null, avatarsDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/pjpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP."));
    }
  },
});

export const uploadMemory = multer({ storage: multer.memoryStorage() });
